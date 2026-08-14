import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { requirePlatformAdminFromCookies } from "@/lib/server-admin-auth";
import { discoverGooglePlacesInContext } from "@/lib/google-places-discovery";

function getRouteErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Listing data capture failed";
}

/** Admin Salon Listing Generation → Data Capture (separate from agent Lead Mgmt discovery). */
export async function POST(req: Request) {
  try {
    const adminAuth = await requirePlatformAdminFromCookies();
    if ("error" in adminAuth) {
      return NextResponse.json({ error: adminAuth.error }, { status: 401 });
    }

    const apiKey = process.env.GOOGLE_API;
    if (!apiKey) {
      return NextResponse.json({ error: "Google API key is not configured" }, { status: 500 });
    }

    const { province, district, city, category, limit } = await req.json();
    const supabase = createSupabaseAdminClient();

    const result = await discoverGooglePlacesInContext(
      supabase,
      apiKey,
      { province, district, city, category },
      {
        limit: limit ? Number(limit) : 15,
        assignTerritoryAgent: false,
        enrichProfiles: true,
        listingPipeline: true,
      }
    );

    return NextResponse.json({
      success: true,
      count: result.count,
      message: result.message,
      warning: result.warning,
      pipeline: "listing_generation",
    });
  } catch (error: unknown) {
    console.error("[listing-generation/capture]", error);
    return NextResponse.json({ error: getRouteErrorMessage(error) }, { status: 500 });
  }
}
