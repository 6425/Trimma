import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { requirePlatformAdminFromCookies } from "@/lib/server-admin-auth";
import { discoverGooglePlacesInContext } from "@/lib/google-places-discovery";
import {
  applyListingCategoryMappingForPlaceIds,
  buildListingCaptureGoogleQuery,
  loadListingCaptureCatalog,
} from "@/lib/listing-generation-categories";

function getRouteErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error && "message" in error) {
    return String((error as { message: unknown }).message);
  }
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

    const { province, district, city, category, categoryId, limit } = await req.json();
    const supabase = createSupabaseAdminClient();
    const catalog = await loadListingCaptureCatalog(supabase);
    const selectedCategory =
      catalog.categories.find((item) => item.id === categoryId) ||
      catalog.categories.find((item) => item.name === category) ||
      null;
    const categoryName = selectedCategory?.name || String(category || "").trim();

    if (!categoryName) {
      return NextResponse.json({ error: "Select a Trimma category." }, { status: 400 });
    }

    const globalServices = selectedCategory
      ? catalog.servicesByCategoryId[selectedCategory.id] || []
      : [];
    const searchQuery = buildListingCaptureGoogleQuery({
      categoryName,
      city: String(city || ""),
      district: String(district || ""),
      province: String(province || ""),
      globalServices,
    });

    const result = await discoverGooglePlacesInContext(
      supabase,
      apiKey,
      { province, district, city, category: categoryName, searchQuery },
      {
        limit: limit == null || limit === "" ? 0 : Number(limit),
        assignTerritoryAgent: false,
        enrichProfiles: true,
        listingPipeline: true,
        syncImages: false,
      }
    );

    if (result.placeIds?.length) {
      await applyListingCategoryMappingForPlaceIds(
        supabase,
        result.placeIds,
        categoryName,
        catalog.categories
      );
    }

    return NextResponse.json({
      success: true,
      count: result.count,
      message: result.message,
      warning: result.warning,
      stats: result.stats,
      pipeline: "listing_generation",
      searchQuery,
    });
  } catch (error: unknown) {
    console.error("[listing-generation/capture]", error);
    return NextResponse.json({ error: getRouteErrorMessage(error) }, { status: 500 });
  }
}
