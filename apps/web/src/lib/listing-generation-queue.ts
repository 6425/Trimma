import type { SupabaseClient } from "@supabase/supabase-js";
import {
  LISTING_ONBOARDING_STATUS,
  readListingCapturedAt,
} from "@/lib/salon-listing-pipeline";
import { isMissingDbSchemaError } from "@/lib/with-admin-db";
import { fetchAllQueryPages } from "@/lib/supabase-fetch-all";

export type ListingQueueRow = {
  id: string;
  name: string;
  slug: string;
  category: string | null;
  province: string | null;
  district: string | null;
  city: string | null;
  address: string | null;
  place_id: string | null;
  rating: number | null;
  review_count: number | null;
  onboarding_status: string | null;
  public_visibility: string | null;
  source_type: string | null;
  created_at: string;
  captured_at: string | null;
};

const QUEUE_SELECT_FULL =
  "id, name, slug, category, province, district, city, address, place_id, rating, review_count, onboarding_status, public_visibility, source_type, created_at, business_info_extended";

const QUEUE_SELECT_BASE =
  "id, name, slug, category, province, district, city, address, place_id, rating, review_count, onboarding_status, public_visibility, source_type, created_at";

function mapQueueRows(data: Array<Record<string, unknown>>): ListingQueueRow[] {
  return data.map((row) => ({
    id: String(row.id),
    name: String(row.name || ""),
    slug: String(row.slug || ""),
    category: (row.category as string | null) ?? null,
    province: (row.province as string | null) ?? null,
    district: (row.district as string | null) ?? null,
    city: (row.city as string | null) ?? null,
    address: (row.address as string | null) ?? null,
    place_id: (row.place_id as string | null) ?? null,
    rating: row.rating == null ? null : Number(row.rating),
    review_count: row.review_count == null ? null : Number(row.review_count),
    onboarding_status: (row.onboarding_status as string | null) ?? null,
    public_visibility: (row.public_visibility as string | null) ?? null,
    source_type: (row.source_type as string | null) ?? null,
    created_at: String(row.created_at || ""),
    captured_at: readListingCapturedAt({
      created_at: row.created_at as string | null,
      onboarding_status: row.onboarding_status as string | null,
      source_type: row.source_type as string | null,
      business_info_extended: row.business_info_extended,
    }),
  }));
}

async function queryQueueRows(
  supabase: SupabaseClient,
  select: string
): Promise<Array<Record<string, unknown>>> {
  const statuses = [
    LISTING_ONBOARDING_STATUS.CAPTURED,
    LISTING_ONBOARDING_STATUS.PUBLISHED,
  ];

  return fetchAllQueryPages(async (from, to) => {
    const { data, error } = await supabase
      .from("salons")
      .select(select)
      .in("onboarding_status", statuses)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw error;
    return (data ?? []) as unknown as Array<Record<string, unknown>>;
  });
}

export async function loadListingGenerationQueueRows(
  supabase: SupabaseClient
): Promise<ListingQueueRow[]> {
  try {
    const rows = await queryQueueRows(supabase, QUEUE_SELECT_FULL);
    return mapQueueRows(rows);
  } catch (primaryError) {
    const message =
      typeof primaryError === "object" && primaryError && "message" in primaryError
        ? String((primaryError as { message: unknown }).message)
        : String(primaryError);

    if (!isMissingDbSchemaError(message)) {
      throw new Error(message);
    }

    const rows = await queryQueueRows(supabase, QUEUE_SELECT_BASE);
    return mapQueueRows(rows);
  }
}
