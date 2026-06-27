import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { requirePlatformAdminFromCookies } from "@/lib/server-admin-auth";
import {
  fetchGooglePlaceProfile,
  mapGooglePlaceToSalonRecord,
  mergeGoogleProfileIntoSalonRow,
} from "@/lib/google-place-profile";
import { syncSalonImagesFromGooglePlace } from "@/lib/google-place-images";

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

    const { data: existingRows } = placeIds.length
      ? await supabase.from("salons").select("*").in("place_id", placeIds)
      : { data: [] as Record<string, unknown>[] };

    const existingByPlaceId = new Map(
      (existingRows || []).map((row) => [String(row.place_id), row as Record<string, unknown>])
    );

    const salonsToUpsert = enrichedPlaces
      .filter((entry) => entry.place.place_id && entry.profile)
      .map((entry) => {
        const incoming = mapGooglePlaceToSalonRecord(entry.place.place_id!, entry.profile!, {
          province,
          district,
          city,
          category,
        });
        const existing = existingByPlaceId.get(entry.place.place_id!) || null;
        return mergeGoogleProfileIntoSalonRow(existing, incoming);
      });

    const { error } = await supabase.from("salons").upsert(salonsToUpsert, { onConflict: "place_id" });
    if (error) throw error;

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

    return NextResponse.json({
      success: true,
      count: salonsToUpsert.length,
      message: `Discovered and updated ${salonsToUpsert.length} salons with Google Business profile data in ${city} (${district}).`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to process lead discovery";
    console.error("Discover API route failure:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
