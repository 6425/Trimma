import type { SupabaseClient } from "@supabase/supabase-js";
import {
  LISTING_ONBOARDING_STATUS,
  readListingCapturedAt,
} from "@/lib/salon-listing-pipeline";
import { isMissingDbSchemaError } from "@/lib/with-admin-db";
import { fetchAllByIdCursor } from "@/lib/supabase-fetch-all";
import { getSupabaseServerEnv } from "@/lib/supabase-server-env";

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

export type ListingQueuePayload = {
  rows: ListingQueueRow[];
  pendingCount: number;
  listedCount: number;
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

function sortQueueRowsNewestFirst(rows: ListingQueueRow[]): ListingQueueRow[] {
  return [...rows].sort((a, b) => {
    const byCaptured = String(b.captured_at || "").localeCompare(String(a.captured_at || ""));
    if (byCaptured) return byCaptured;
    return String(b.created_at || "").localeCompare(String(a.created_at || ""));
  });
}

function parseQueueRpcPayload(raw: unknown): ListingQueuePayload | null {
  const payload =
    typeof raw === "string"
      ? (JSON.parse(raw) as Record<string, unknown>)
      : raw && typeof raw === "object"
        ? (raw as Record<string, unknown>)
        : null;
  if (!payload) return null;

  const list = Array.isArray(payload.rows) ? payload.rows : [];
  const rows = sortQueueRowsNewestFirst(mapQueueRows(list as Array<Record<string, unknown>>));
  const pendingCount = Number(payload.pendingCount);
  const listedCount = Number(payload.listedCount);
  if (!Number.isFinite(pendingCount) || !Number.isFinite(listedCount)) return null;

  return { rows, pendingCount, listedCount };
}

async function restLoadQueueRows(select: string): Promise<Array<Record<string, unknown>>> {
  const { url, serviceRoleKey } = getSupabaseServerEnv();
  const rows: Array<Record<string, unknown>> = [];
  const seen = new Set<string>();
  let afterId: string | null = null;

  for (let i = 0; i < 5000; i++) {
    const qs = [
      `select=${encodeURIComponent(select)}`,
      "onboarding_status=in.(LISTING_CAPTURED,LISTING_PUBLISHED)",
      "order=id.asc",
      "limit=100",
    ];
    if (afterId) qs.push(`id=gt.${afterId}`);

    const response = await fetch(`${url}/rest/v1/salons?${qs.join("&")}`, {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error((await response.text()) || `Queue fetch failed (${response.status})`);
    }

    const page = (await response.json()) as Array<Record<string, unknown>>;
    if (!page.length) break;

    let added = 0;
    for (const row of page) {
      const id = String(row.id || "");
      if (!id || seen.has(id)) continue;
      seen.add(id);
      rows.push(row);
      added += 1;
    }

    if (added === 0 || page.length < 100) break;
    afterId = String(page[page.length - 1]?.id || "");
    if (!afterId) break;
  }

  return rows;
}

async function queryQueueRows(
  supabase: SupabaseClient,
  select: string
): Promise<Array<Record<string, unknown>>> {
  const statuses = [
    LISTING_ONBOARDING_STATUS.CAPTURED,
    LISTING_ONBOARDING_STATUS.PUBLISHED,
  ];

  return fetchAllByIdCursor(async (afterId, pageSize) => {
    let query = supabase.from("salons").select(select).in("onboarding_status", statuses);
    if (afterId) query = query.gt("id", afterId);
    const { data, error } = await query.order("id", { ascending: true }).limit(pageSize);
    if (error) throw error;
    return (data ?? []) as unknown as Array<Record<string, unknown>>;
  });
}

async function loadQueueRowsFallback(supabase: SupabaseClient): Promise<ListingQueueRow[]> {
  try {
    const rows = await restLoadQueueRows(QUEUE_SELECT_FULL);
    return sortQueueRowsNewestFirst(mapQueueRows(rows));
  } catch {
    try {
      const rows = await queryQueueRows(supabase, QUEUE_SELECT_FULL);
      return sortQueueRowsNewestFirst(mapQueueRows(rows));
    } catch (primaryError) {
      const message =
        typeof primaryError === "object" && primaryError && "message" in primaryError
          ? String((primaryError as { message: unknown }).message)
          : String(primaryError);

      if (!isMissingDbSchemaError(message)) {
        throw new Error(message);
      }

      const rows = await queryQueueRows(supabase, QUEUE_SELECT_BASE);
      return sortQueueRowsNewestFirst(mapQueueRows(rows));
    }
  }
}

export async function loadListingGenerationQueue(
  supabase: SupabaseClient
): Promise<ListingQueuePayload> {
  const rpc = await supabase.rpc("listing_generation_queue_payload");
  if (!rpc.error && rpc.data != null) {
    const parsed = parseQueueRpcPayload(rpc.data);
    if (parsed) return parsed;
  }

  const rows = await loadQueueRowsFallback(supabase);
  return {
    rows,
    pendingCount: rows.filter((row) => row.onboarding_status === LISTING_ONBOARDING_STATUS.CAPTURED)
      .length,
    listedCount: rows.filter((row) => row.onboarding_status === LISTING_ONBOARDING_STATUS.PUBLISHED)
      .length,
  };
}

export async function countListingGenerationQueue(
  supabase: SupabaseClient
): Promise<{ pendingCount: number; listedCount: number }> {
  const payload = await loadListingGenerationQueue(supabase);
  return { pendingCount: payload.pendingCount, listedCount: payload.listedCount };
}

export async function loadListingGenerationQueueRows(
  supabase: SupabaseClient
): Promise<ListingQueueRow[]> {
  const payload = await loadListingGenerationQueue(supabase);
  return payload.rows;
}
