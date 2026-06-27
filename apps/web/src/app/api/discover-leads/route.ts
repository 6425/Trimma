import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { requirePlatformAdminFromCookies } from "@/lib/server-admin-auth";
import {
  fetchGooglePlaceProfile,
  isMissingDiscoveryColumnError,
  mapGooglePlaceToSalonRecord,
  mapGoogleTextSearchPlaceToSalonRecord,
  mergeGoogleProfileIntoSalonRow,
  prepareSalonDiscoveryUpsertRow,
  stripOptionalDiscoveryColumns,
} from "@/lib/google-place-profile";
import { syncSalonImagesFromGooglePlace } from "@/lib/google-place-images";

function getRouteErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error && "message" in error) {
    const message = String((error as { message: unknown }).message);
    const details =
      "details" in error && (error as { details?: unknown }).details
        ? String((error as { details?: unknown }).details)
        : "";
    const hint =
      "hint" in error && (error as { hint?: unknown }).hint
        ? String((error as { hint?: unknown }).hint)
        : "";
    if (details && hint) return `${message} — ${details} (${hint})`;
    if (details) return `${message} — ${details}`;
    if (hint) return `${message} (${hint})`;
    return message;
  }
  return "Failed to process lead discovery";
}

function getRouteErrorDetails(error: unknown): string | undefined {
  if (typeof error === "object" && error && "details" in error) {
    const details = String((error as { details?: unknown }).details || "").trim();
    return details || undefined;
  }
  return undefined;
}

export async function POST(req: Request) {
  try {
    const adminAuth = await requirePlatformAdminFromCookies();
    if ("error" in adminAuth) {
      return NextResponse.json({ error: adminAuth.error }, { status: 401 });
    }

    const { province, district, city, category, limit, syncImages } = await req.json();
    const apiKey = process.env.GOOGLE_API;

    if (!apiKey) {
      return NextResponse.json({ error: "Google API key is not configured" }, { status: 500 });
    }

    const searchQuery = `${category || "hair salon"} in ${city || ""}, ${district || ""}, ${province || ""}, Sri Lanka`;
    console.log(`[Google Places Discovery] Searching: ${searchQuery}`);

    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${apiKey}`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    if (searchData.status !== "OK" && searchData.status !== "ZERO_RESULTS") {
      throw new Error(
        `Google Places API returned error status: ${searchData.status}. ${searchData.error_message || ""}`
      );
    }

    const rawPlaces = searchData.results || [];
    if (rawPlaces.length === 0) {
      return NextResponse.json({ success: true, count: 0, message: "No salons found in this destination." });
    }

    const targetLimit = limit ? Math.min(Number(limit), 60) : 15;
    const topPlaces = rawPlaces.slice(0, targetLimit);

    const enrichedPlaces = await Promise.all(
      topPlaces.map(async (place: { place_id?: string }) => {
        if (!place.place_id) return { place, profile: null };
        const profile = await fetchGooglePlaceProfile(place.place_id, apiKey);
        return { place, profile };
      })
    );

    const supabase = createSupabaseAdminClient();
    const placeIds = enrichedPlaces
      .map((entry) => entry.place.place_id)
      .filter((id): id is string => Boolean(id));

    const existingQuery = placeIds.length
      ? await supabase.from("salons").select("*").in("place_id", placeIds)
      : { data: [] as Record<string, unknown>[], error: null };

    if (existingQuery.error) {
      console.error("Failed to load existing salons for discovery merge:", existingQuery.error);
      throw existingQuery.error;
    }

    const existingRows = existingQuery.data;

    const existingByPlaceId = new Map(
      (existingRows || []).map((row) => [String(row.place_id), row as Record<string, unknown>])
    );

    const salonsToUpsert = enrichedPlaces
      .filter((entry) => entry.place.place_id)
      .map((entry) => {
        const placeId = entry.place.place_id!;
        const incoming = entry.profile
          ? mapGooglePlaceToSalonRecord(placeId, entry.profile, {
              province,
              district,
              city,
              category,
            })
          : mapGoogleTextSearchPlaceToSalonRecord(placeId, entry.place, {
              province,
              district,
              city,
              category,
            });
        const existing = existingByPlaceId.get(placeId) || null;
        return prepareSalonDiscoveryUpsertRow(mergeGoogleProfileIntoSalonRow(existing, incoming));
      });

    if (salonsToUpsert.length === 0) {
      return NextResponse.json({
        success: true,
        count: 0,
        message: "Google returned places but none could be saved. Check server logs and database columns.",
      });
    }

    let upsertWarning: string | undefined;
    let upsertResult = await supabase
      .from("salons")
      .upsert(salonsToUpsert, { onConflict: "place_id" });

    if (upsertResult.error && isMissingDiscoveryColumnError(upsertResult.error)) {
      console.warn(
        "[discover-leads] Retrying without optional columns (run packages/db/DISCOVERY_SALON_COLUMNS_PATCH.sql for full Google profile storage):",
        upsertResult.error
      );
      upsertWarning =
        "Saved basic salon data only. Run DISCOVERY_SALON_COLUMNS_PATCH.sql in Supabase for review_count and business_info_extended.";
      upsertResult = await supabase.from("salons").upsert(
        salonsToUpsert.map(stripOptionalDiscoveryColumns),
        { onConflict: "place_id" }
      );
    }

    if (upsertResult.error) {
      console.error("Supabase upsert execution failed:", upsertResult.error);
      throw upsertResult.error;
    }

    if (syncImages) {
      const { data: savedRows } = await supabase
        .from("salons")
        .select("id, name, address, city, district, place_id")
        .in("place_id", placeIds)
        .limit(5);

      for (const row of savedRows || []) {
        try {
          const images = await syncSalonImagesFromGooglePlace(supabase, row);
          await supabase
            .from("salons")
            .update({ cover_url: images.cover_url, hero_url: images.hero_url })
            .eq("id", row.id);
        } catch (imageErr) {
          console.warn("[discover-leads] image sync skipped:", imageErr);
        }
      }
    }

    const baseMessage = `Discovered and updated ${salonsToUpsert.length} salons with Google Business profile data in ${city} (${district}).`;

    return NextResponse.json({
      success: true,
      count: salonsToUpsert.length,
      message: upsertWarning ? `${baseMessage} ${upsertWarning}` : baseMessage,
    });
  } catch (error: unknown) {
    const message = getRouteErrorMessage(error);
    const details = getRouteErrorDetails(error);
    console.error("Discover API route failure:", error);
    return NextResponse.json({ error: message, details }, { status: 500 });
  }
}
