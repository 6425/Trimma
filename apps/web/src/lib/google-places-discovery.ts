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
import {
  dedupeGooglePlacesByPlaceId,
  loadSalonDuplicateCandidates,
  indexSalonsForDiscoveryDedup,
  resolveExistingSalonByPlaceId,
  resolveExistingSalonMatch,
  removeDuplicateSalonRows,
  type DiscoveryDedupStats,
  type SalonDuplicateRow,
} from "@/lib/salon-discovery-dedup";
import { resolveOnboardingAgentForSalon } from "@/lib/salon-onboarding-paths";
import {
  applyListingPipelineCaptureFields,
  finalizeListingPipelineCapture,
  isBookingPipelineLockedStatus,
  LISTING_CAPTURE_SALON_DEFAULTS,
} from "@/lib/salon-listing-pipeline";
import {
  syncGoogleImagesForPlaceIds,
  type GoogleImageSyncStats,
} from "@/lib/google-place-images";
import {
  formatGooglePlacesError,
  searchGooglePlacesTextPage,
  type GoogleTextSearchResult,
} from "@/lib/google-places-client";

export type { GoogleTextSearchResult };

export type { DiscoveryDedupStats };
export type { GoogleImageSyncStats };

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

export async function searchGooglePlacesText(
  query: string,
  apiKey: string,
  pageToken?: string | null
): Promise<{ places: GoogleTextSearchResult[]; nextPageToken: string | null; status: string; errorMessage?: string }> {
  return searchGooglePlacesTextPage(query, apiKey, pageToken);
}

export function buildBeautyDiscoveryQuery(context: GoogleDiscoverySearchContext): string {
  if (context.searchQuery?.trim()) {
    return context.searchQuery.trim();
  }
  const category = context.category || "beauty salon";
  const location = [context.city, context.district, context.province, "Sri Lanka"]
    .filter(Boolean)
    .join(", ");
  return `${category} in ${location}`.replace(/\s+/g, " ").trim();
}

export async function upsertDiscoveredGooglePlaces(
  supabase: SupabaseClient,
  enrichedPlaces: Array<{ place: GoogleTextSearchResult; profile: Awaited<ReturnType<typeof fetchGooglePlaceProfile>> }>,
  context: GoogleDiscoverySearchContext,
  options?: { assignTerritoryAgent?: boolean; listingPipeline?: boolean }
): Promise<{ count: number; queued?: number; warning?: string; placeIds: string[]; stats: DiscoveryDedupStats }> {
  const dedupedPlaces = dedupeGooglePlacesByPlaceId(enrichedPlaces);
  const stats: DiscoveryDedupStats = {
    created: 0,
    updated: 0,
    merged: 0,
    removed: 0,
    skipped: enrichedPlaces.length - dedupedPlaces.length,
  };

  const placeIds = dedupedPlaces
    .map((entry) => entry.place.place_id)
    .filter((id): id is string => Boolean(id));

  const candidateRows = await loadSalonDuplicateCandidates(supabase, context, placeIds);
  const indexes = indexSalonsForDiscoveryDedup(candidateRows);

  let assignTo: string | null = null;
  if (options?.assignTerritoryAgent !== false && !options?.listingPipeline) {
    assignTo = await resolveOnboardingAgentForSalon(supabase, {
      district: context.district,
      city: context.city,
      address: null,
    });
  }

  const rowsToInsert: Record<string, unknown>[] = [];
  const rowsToUpdate: Record<string, unknown>[] = [];
  const writtenPlaceIds: string[] = [];

  for (const entry of dedupedPlaces.filter((item) => item.place.place_id)) {
    const placeId = entry.place.place_id!;
    const incoming = entry.profile
      ? mapGooglePlaceToSalonRecord(placeId, entry.profile, context)
      : mapGoogleTextSearchPlaceToSalonRecord(placeId, entry.place, context);

    if (options?.listingPipeline) {
      Object.assign(incoming, LISTING_CAPTURE_SALON_DEFAULTS);
      const listingRow = incoming as Record<string, unknown>;
      listingRow.owner_email = null;
      listingRow.owner_gmail = null;
      listingRow.subscription_plan_id = null;
    }

    const existing = options?.listingPipeline
      ? resolveExistingSalonByPlaceId(incoming as SalonDuplicateRow, indexes)
      : resolveExistingSalonMatch(incoming as SalonDuplicateRow, indexes);

    if (
      options?.listingPipeline &&
      existing &&
      isBookingPipelineLockedStatus(String(existing.onboarding_status || ""))
    ) {
      stats.skipped += 1;
      continue;
    }

    if (!options?.listingPipeline && assignTo && !existing?.assign_to) {
      (incoming as Record<string, unknown>).assign_to = assignTo;
    }

    let merged = mergeGoogleProfileIntoSalonRow(existing, incoming, {
      listingPipeline: options?.listingPipeline,
    });
    if (options?.listingPipeline) {
      applyListingPipelineCaptureFields(merged, existing);
    }
    merged = prepareSalonDiscoveryUpsertRow(merged);

    if (existing?.id) {
      rowsToUpdate.push({ ...merged, id: existing.id });
      stats.updated += 1;
      if (existing.place_id !== placeId) stats.merged += 1;
    } else {
      rowsToInsert.push(merged);
      stats.created += 1;
    }
    writtenPlaceIds.push(placeId);
  }

  if (!rowsToInsert.length && !rowsToUpdate.length) {
    return { count: 0, queued: 0, placeIds: [], stats };
  }

  let upsertWarning: string | undefined;

  if (rowsToUpdate.length) {
    let updateResult = await supabase.from("salons").upsert(rowsToUpdate, { onConflict: "id" });
    if (updateResult.error && isMissingDiscoveryColumnError(updateResult.error)) {
      upsertWarning =
        "Saved basic salon data only. Run DISCOVERY_SALON_COLUMNS_PATCH.sql for review_count and business_info_extended.";
      updateResult = await supabase.from("salons").upsert(
        rowsToUpdate.map(stripOptionalDiscoveryColumns),
        { onConflict: "id" }
      );
    }
    if (updateResult.error) throwSalonUpsertError(updateResult.error);
  }

  if (rowsToInsert.length) {
    const listingInserts = options?.listingPipeline
      ? rowsToInsert.map((row) => {
          const listingRow = { ...row } as Record<string, unknown>;
          listingRow.owner_email = null;
          listingRow.owner_gmail = null;
          listingRow.subscription_plan_id = null;
          return listingRow;
        })
      : rowsToInsert;
    let insertResult = await supabase.from("salons").upsert(listingInserts, { onConflict: "place_id" });
    if (insertResult.error && isMissingDiscoveryColumnError(insertResult.error)) {
      upsertWarning =
        upsertWarning ||
        "Saved basic salon data only. Run DISCOVERY_SALON_COLUMNS_PATCH.sql for review_count and business_info_extended.";
      insertResult = await supabase.from("salons").upsert(
        listingInserts.map(stripOptionalDiscoveryColumns),
        { onConflict: "place_id" }
      );
    }
    if (insertResult.error) throwSalonUpsertError(insertResult.error);
  }

  let queued = rowsToInsert.length + rowsToUpdate.length;
  if (options?.listingPipeline && writtenPlaceIds.length) {
    queued = await finalizeListingPipelineCapture(supabase, writtenPlaceIds);
  }

  if (!options?.listingPipeline) {
    const refreshedCandidates = await loadSalonDuplicateCandidates(supabase, context, placeIds);
    stats.removed = await removeDuplicateSalonRows(supabase, refreshedCandidates);
  }

  return {
    count: rowsToInsert.length + rowsToUpdate.length,
    queued,
    warning: upsertWarning,
    placeIds: writtenPlaceIds,
    stats,
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
    syncImages?: boolean;
    places?: GoogleTextSearchResult[];
  }
): Promise<{ count: number; queued?: number; warning?: string; message: string; stats?: DiscoveryDedupStats; imageStats?: GoogleImageSyncStats; placeIds?: string[] }> {
  const query = buildBeautyDiscoveryQuery(context);
  const targetLimit =
    !options?.limit || options.limit <= 0 ? Number.POSITIVE_INFINITY : Math.max(options.limit, 1);

  let collected: GoogleTextSearchResult[] = [];
  if (options?.places?.length) {
    collected = options.places.filter((place) => place.place_id);
  } else {
    const firstPage = await searchGooglePlacesText(query, apiKey);
    if (firstPage.status !== "OK" && firstPage.status !== "ZERO_RESULTS") {
      throw new Error(formatGooglePlacesError(firstPage));
    }

    collected = [...firstPage.places];
    let nextToken = firstPage.nextPageToken;

    while (collected.length < targetLimit && nextToken) {
      await new Promise((resolve) => setTimeout(resolve, 2100));
      const nextPage = await searchGooglePlacesText(query, apiKey, nextToken);
      if (nextPage.status !== "OK") break;
      collected = collected.concat(nextPage.places);
      nextToken = nextPage.nextPageToken;
    }
  }

  const topPlaces =
    Number.isFinite(targetLimit) ? collected.slice(0, targetLimit) : collected;
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

  const shouldSyncImages = options?.syncImages !== false && !options?.listingPipeline;
  let imageStats: GoogleImageSyncStats | undefined;
  if (shouldSyncImages && result.placeIds.length > 0) {
    try {
      imageStats = await syncGoogleImagesForPlaceIds(supabase, result.placeIds, {
        apiKey,
        delayMs: 150,
      });
    } catch (imageError) {
      console.error("[discoverGooglePlacesInContext] image sync failed:", imageError);
    }
  }

  const label = [context.city, context.district, context.province].filter(Boolean).join(", ");
  const dedupSummary =
    result.stats.removed > 0 || result.stats.merged > 0 || result.stats.skipped > 0
      ? ` (${result.stats.created} new, ${result.stats.updated} updated, ${result.stats.merged} merged, ${result.stats.removed} duplicates removed${result.stats.skipped ? `, ${result.stats.skipped} skipped in batch` : ""})`
      : "";
  const imageSummary = imageStats
    ? ` Images synced for ${imageStats.synced} salon(s) (${imageStats.photos} Google photos${imageStats.skipped ? `, ${imageStats.skipped} without photos` : ""}${imageStats.failed ? `, ${imageStats.failed} failed` : ""}).`
    : "";
  const queued = result.queued ?? result.count;
  const skippedNote =
    options?.listingPipeline && result.stats.skipped > 0
      ? ` ${result.stats.skipped} already in booking onboarding were left unchanged.`
      : "";
  const actionLabel = options?.listingPipeline
    ? `Captured ${queued} listing(s) into the Pending queue`
    : `Discovered and published ${result.count} listing(s)`;
  const baseMessage = `${actionLabel} for ${label || "Sri Lanka"}.${dedupSummary}${skippedNote}${imageSummary}`;

  return {
    count: result.count,
    queued,
    warning: result.warning,
    message: result.warning ? `${baseMessage} ${result.warning}` : baseMessage,
    stats: result.stats,
    imageStats,
    placeIds: result.placeIds,
  };
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function throwSalonUpsertError(error: unknown): never {
  const message =
    typeof error === "object" && error && "message" in error
      ? String((error as { message: unknown }).message)
      : error instanceof Error
        ? error.message
        : "Failed to save salon data";
  throw new Error(message);
}
