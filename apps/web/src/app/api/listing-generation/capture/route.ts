import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { requirePlatformAdminFromCookies } from "@/lib/server-admin-auth";
import { getGoogleMapsApiKey } from "@/lib/google-place-images";
import { discoverGooglePlacesInContext } from "@/lib/google-places-discovery";
import {
  applyListingCategoryMappingForPlaceIds,
  buildListingCaptureGoogleQuery,
  loadListingCaptureCatalog,
} from "@/lib/listing-generation-categories";
import { createManualListingSalonRecord } from "@/lib/listing-generation-mutations";

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

    const body = (await req.json()) as Record<string, unknown>;
    const {
      mode,
      province,
      district,
      city,
      category,
      categoryId,
      limit,
      places: rawPlaces,
    } = body;
    const supabase = createSupabaseAdminClient();
    const catalog = await loadListingCaptureCatalog(supabase);
    const selectedCategory =
      catalog.categories.find((item) => item.id === categoryId) ||
      catalog.categories.find((item) => item.name === category) ||
      null;
    const categoryName = selectedCategory?.name || String(category || "").trim();

    if (mode === "manual") {
      if (!selectedCategory?.name) {
        return NextResponse.json({ error: "Select a valid Trimma category." }, { status: 400 });
      }

      const result = await createManualListingSalonRecord(supabase, {
        name: String(body.name || ""),
        category: selectedCategory.name,
        province: String(province || ""),
        district: String(district || ""),
        city: String(city || ""),
        address: String(body.address || ""),
        phone: String(body.phone || ""),
        website: String(body.website || ""),
        mapUrl: String(body.mapUrl || ""),
        placeId: String(body.placeId || ""),
        latitude: body.latitude === "" || body.latitude == null ? null : Number(body.latitude),
        longitude: body.longitude === "" || body.longitude == null ? null : Number(body.longitude),
        description: String(body.description || ""),
        logoUrl: String(body.logoUrl || ""),
        heroUrl: String(body.heroUrl || ""),
      });

      revalidatePath("/admin/listing-generation/queue");
      return NextResponse.json({
        success: true,
        count: 1,
        queued: 1,
        salonId: result.salonId,
        message: `${result.name} was added to the Pending queue.`,
        pipeline: "listing_generation",
      });
    }

    const prefetchedPlaces = Array.isArray(rawPlaces)
      ? rawPlaces
          .slice(0, 200)
          .map((rawRow) => {
            const row =
              rawRow && typeof rawRow === "object"
                ? (rawRow as Record<string, unknown>)
                : {};
            const geometry =
              row.geometry && typeof row.geometry === "object"
                ? (row.geometry as Record<string, unknown>)
                : null;
            const location =
              geometry?.location && typeof geometry.location === "object"
                ? (geometry.location as Record<string, unknown>)
                : null;
            return {
              place_id: String(row.place_id || "").trim() || undefined,
              name: typeof row.name === "string" ? row.name : undefined,
              formatted_address: typeof row.formatted_address === "string" ? row.formatted_address : undefined,
              rating: typeof row.rating === "number" ? row.rating : undefined,
              user_ratings_total: typeof row.user_ratings_total === "number" ? row.user_ratings_total : undefined,
              types: Array.isArray(row.types)
                ? row.types.filter((type: unknown) => typeof type === "string")
                : undefined,
              geometry: location
                ? {
                    location: {
                      lat: Number(location.lat),
                      lng: Number(location.lng),
                    },
                  }
                : undefined,
            };
          })
          .filter((row) => row.place_id)
      : [];

    const apiKey = getGoogleMapsApiKey();
    if (!prefetchedPlaces.length && !apiKey) {
      return NextResponse.json({ error: "Google API key is not configured" }, { status: 500 });
    }

    if (!String(province || "").trim() || !String(district || "").trim()) {
      return NextResponse.json({ error: "Select province and district." }, { status: 400 });
    }

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
      apiKey || "",
      {
        province: String(province || ""),
        district: String(district || ""),
        city: String(city || ""),
        category: categoryName,
        searchQuery,
      },
      {
        limit: limit == null || limit === "" ? 0 : Number(limit),
        assignTerritoryAgent: false,
        enrichProfiles: Boolean(apiKey),
        listingPipeline: true,
        syncImages: false,
        places: prefetchedPlaces,
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

    revalidatePath("/admin/listing-generation/queue");

    return NextResponse.json({
      success: true,
      count: result.queued ?? result.count,
      queued: result.queued ?? result.count,
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
