import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { requirePlatformAdminFromCookies } from "@/lib/server-admin-auth";
import { discoverGooglePlacesInContext } from "@/lib/google-places-discovery";
import { syncSalonImagesFromGooglePlace } from "@/lib/google-place-images";

function getRouteErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "Failed to process lead discovery";
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

    const supabase = createSupabaseAdminClient();
    const result = await discoverGooglePlacesInContext(
      supabase,
      apiKey,
      { province, district, city, category },
      { limit: limit ? Number(limit) : 15, assignTerritoryAgent: true, enrichProfiles: true }
    );

    if (syncImages && result.count > 0) {
      const { data: savedRows } = await supabase
        .from("salons")
        .select("id, name, address, city, district, place_id")
        .eq("district", district || "")
        .eq("source_type", "GOOGLE_PLACES")
        .order("updated_at", { ascending: false })
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
      count: result.count,
      message: result.message,
      warning: result.warning,
      stats: result.stats,
    });
  } catch (error: unknown) {
    console.error("Discover API route failure:", error);
    return NextResponse.json({ error: getRouteErrorMessage(error) }, { status: 500 });
  }
}
