import type { SupabaseClient } from "@supabase/supabase-js";
import {
  LISTING_ONBOARDING_STATUS,
  readListingCapturedAt,
} from "@/lib/salon-listing-pipeline";
import { isMissingDbSchemaError } from "@/lib/with-admin-db";

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
  updated_at: string;
  captured_at: string | null;
};

const QUEUE_SELECT_WITH_EXT =
  "id, name, slug, category, province, district, city, address, place_id, rating, review_count, onboarding_status, public_visibility, source_type, created_at, updated_at, business_info_extended";

const QUEUE_SELECT_BASE =
  "id, name, slug, category, province, district, city, address, place_id, rating, review_count, onboarding_status, public_visibility, source_type, created_at, updated_at";

function mapQueueRows(
  data: Array<Record<string, unknown>>
): ListingQueueRow[] {
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
    updated_at: String(row.updated_at || ""),
    captured_at: readListingCapturedAt({
      created_at: row.created_at as string | null,
      updated_at: row.updated_at as string | null,
      business_info_extended: row.business_info_extended,
    }),
  }));
}

export async function loadListingGenerationQueueRows(
  supabase: SupabaseClient
): Promise<ListingQueueRow[]> {
  const statuses = [
    LISTING_ONBOARDING_STATUS.CAPTURED,
    LISTING_ONBOARDING_STATUS.PUBLISHED,
  ];

  let data: Array<Record<string, unknown>> | null = null;
  let error: { message: string } | null = null;

  const primary = await supabase
    .from("salons")
    .select(QUEUE_SELECT_WITH_EXT)
    .in("onboarding_status", statuses)
    .order("created_at", { ascending: false })
    .limit(500);

  if (
    primary.error &&
    isMissingDbSchemaError(primary.error.message) &&
    primary.error.message.toLowerCase().includes("business_info_extended")
  ) {
    const fallback = await supabase
      .from("salons")
      .select(QUEUE_SELECT_BASE)
      .in("onboarding_status", statuses)
      .order("created_at", { ascending: false })
      .limit(500);
    data = (fallback.data || []) as Array<Record<string, unknown>>;
    error = fallback.error;
  } else {
    data = (primary.data || []) as Array<Record<string, unknown>>;
    error = primary.error;
  }

  if (error) throw new Error(error.message);
  return mapQueueRows(data);
}
