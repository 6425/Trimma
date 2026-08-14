import type { SupabaseClient } from "@supabase/supabase-js";
import {
  fetchGooglePlaceProfile,
  isMissingDiscoveryColumnError,
  mapGooglePlaceToSalonRecord,
  mapGoogleTextSearchPlaceToSalonRecord,
  mergeGoogleProfileIntoSalonRow,
  prepareSalonDiscoveryUpsertRow,
  stripOptionalDiscoveryColumns,
  type GoogleSalonUpsertContext,
} from "@/lib/google-place-profile";
import { resolveOnboardingAgentForSalon } from "@/lib/salon-onboarding-paths";
import { LISTING_CAPTURE_SALON_DEFAULTS } from "@/lib/salon-listing-pipeline";

export const BEAUTY_DISCOVERY_CATEGORIES = [
  "hair salon",
  "beauty salon",
  "barber shop",
  "nail salon",
  "spa",
  "massage spa",
] as const;

export type GoogleDiscoverySearchContext = GoogleSalonUpsertContext & {
  province?: string | null;
  district?: string | null;
  city?: string | null;
  category?: string | null;
};

export type GoogleTextSearchResult = {
  place_id?: string;
  name?: string;
  formatted_address?: string;
  rating?: number;
  user_ratings_total?: number;
  types?: string[];
  geometry?: { location?: { lat?: number; lng?: number } };
};

export async function searchGooglePlacesText(
  query: string,
  apiKey: string,
  pageToken?: string | null
): Promise<{ places: GoogleTextSearchResult[]; nextPageToken: string | null; status: string }> {
  const params = new URLSearchParams({
    query,
    key: apiKey,
  });
  if (pageToken) params.set("pagetoken", pageToken);

  const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?${params.toString()}`;
  const searchRes = await fetch(searchUrl);
  const searchData = await searchRes.json();

  return {
    places: (searchData.results || []) as GoogleTextSearchResult[],
    nextPageToken: searchData.next_page_token || null,
    status: searchData.status || "UNKNOWN",
  };
}

export function buildBeautyDiscoveryQuery(context: GoogleDiscoverySearchContext): string {
  const category = context.category || "beauty salon";
  const city = context.city || "";
  const district = context.district || "";
  const province = context.province || "";
  return `${category} in ${city}, ${district}, ${province}, Sri Lanka`.replace(/\s+/g, " ").trim();
}

export async function upsertDiscoveredGooglePlaces(
  supabase: SupabaseClient,
  enrichedPlaces: Array<{ place: GoogleTextSearchResult; profile: Awaited<ReturnType<typeof fetchGooglePlaceProfile>> }>,
  context: GoogleDiscoverySearchContext,
  options?: { assignTerritoryAgent?: boolean; listingPipeline?: boolean }
): Promise<{ count: number; warning?: string; placeIds: string[] }> {
  const placeIds = enrichedPlaces
    .map((entry) => entry.place.place_id)
    .filter((id): id is string => Boolean(id));

  const existingQuery = placeIds.length
    ? await supabase.from("salons").select("*").in("place_id", placeIds)
    : { data: [] as Record<string, unknown>[], error: null };

  if (existingQuery.error) throw existingQuery.error;

  const existingByPlaceId = new Map(
    (existingQuery.data || []).map((row) => [String(row.place_id), row as Record<string, unknown>])
  );

  let assignTo: string | null = null;
  if (options?.assignTerritoryAgent !== false && !options?.listingPipeline) {
    assignTo = await resolveOnboardingAgentForSalon(supabase, {
      district: context.district,
      city: context.city,
      address: null,
    });
  }

  const salonsToUpsert = enrichedPlaces
    .filter((entry) => entry.place.place_id)
    .map((entry) => {
      const placeId = entry.place.place_id!;
      const incoming = entry.profile
        ? mapGooglePlaceToSalonRecord(placeId, entry.profile, context)
        : mapGoogleTextSearchPlaceToSalonRecord(placeId, entry.place, context);

      if (options?.listingPipeline) {
        Object.assign(incoming, LISTING_CAPTURE_SALON_DEFAULTS);
      } else if (assignTo && !existingByPlaceId.get(placeId)?.assign_to) {
        (incoming as Record<string, unknown>).assign_to = assignTo;
      }

      const existing = existingByPlaceId.get(placeId) || null;
      return prepareSalonDiscoveryUpsertRow(mergeGoogleProfileIntoSalonRow(existing, incoming));
    });

  if (!salonsToUpsert.length) {
    return { count: 0, placeIds: [] };
  }

  let upsertWarning: string | undefined;
  let upsertResult = await supabase.from("salons").upsert(salonsToUpsert, { onConflict: "place_id" });

  if (upsertResult.error && isMissingDiscoveryColumnError(upsertResult.error)) {
    upsertWarning =
      "Saved basic salon data only. Run DISCOVERY_SALON_COLUMNS_PATCH.sql for review_count and business_info_extended.";
    upsertResult = await supabase.from("salons").upsert(
      salonsToUpsert.map(stripOptionalDiscoveryColumns),
      { onConflict: "place_id" }
    );
  }

  if (upsertResult.error) throw upsertResult.error;

  return {
    count: salonsToUpsert.length,
    warning: upsertWarning,
    placeIds,
  };
}

export async function discoverGooglePlacesInContext(
  supabase: SupabaseClient,
  apiKey: string,
  context: GoogleDiscoverySearchContext,
  options?: {
    limit?: number;
    assignTerritoryAgent?: boolean;
    enrichProfiles?: boolean;
    listingPipeline?: boolean;
  }
): Promise<{ count: number; warning?: string; message: string }> {
  const query = buildBeautyDiscoveryQuery(context);
  const targetLimit = Math.min(Math.max(options?.limit ?? 15, 1), 60);

  const firstPage = await searchGooglePlacesText(query, apiKey);
  if (firstPage.status !== "OK" && firstPage.status !== "ZERO_RESULTS") {
    throw new Error(
      `Google Places API returned error status: ${firstPage.status}`
    );
  }

  let collected = [...firstPage.places];
  let nextToken = firstPage.nextPageToken;

  while (collected.length < targetLimit && nextToken) {
    await new Promise((resolve) => setTimeout(resolve, 2100));
    const nextPage = await searchGooglePlacesText(query, apiKey, nextToken);
    if (nextPage.status !== "OK") break;
    collected = collected.concat(nextPage.places);
    nextToken = nextPage.nextPageToken;
  }

  const topPlaces = collected.slice(0, targetLimit);
  if (!topPlaces.length) {
    return {
      count: 0,
      message: `No beauty businesses found for ${context.city || context.district || "this area"}.`,
    };
  }

  const enrichedPlaces = options?.enrichProfiles === false
    ? topPlaces.map((place) => ({ place, profile: null }))
    : await Promise.all(
        topPlaces.map(async (place) => {
          if (!place.place_id) return { place, profile: null };
          const profile = await fetchGooglePlaceProfile(place.place_id, apiKey);
          return { place, profile };
        })
      );

  const result = await upsertDiscoveredGooglePlaces(supabase, enrichedPlaces, context, {
    assignTerritoryAgent: options?.assignTerritoryAgent,
    listingPipeline: options?.listingPipeline,
  });

  const label = [context.city, context.district, context.province].filter(Boolean).join(", ");
  const baseMessage = `Discovered and published ${result.count} listing(s) for ${label || "Sri Lanka"}.`;

  return {
    count: result.count,
    warning: result.warning,
    message: result.warning ? `${baseMessage} ${result.warning}` : baseMessage,
  };
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
