import type { SupabaseClient } from "@supabase/supabase-js";
import { LISTING_ONBOARDING_STATUS, readListingCapturedAt } from "@/lib/salon-listing-pipeline";
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
  is_featured: boolean;
  created_at: string;
  captured_at: string | null;
};

export type ListingQueuePayload = {
  rows: ListingQueueRow[];
  pendingCount: number;
  listedCount: number;
};

const QUEUE_SELECT =
  "id,name,slug,category,province,district,city,address,place_id,rating,review_count,onboarding_status,public_visibility,source_type,is_featured,created_at,business_info_extended";

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
    is_featured: row.is_featured === true,
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

function asRecordArray(raw: unknown): Array<Record<string, unknown>> {
  if (typeof raw === "string") {
    try {
      return asRecordArray(JSON.parse(raw));
    } catch {
      return [];
    }
  }
  if (Array.isArray(raw)) {
    return raw.filter((row): row is Record<string, unknown> => Boolean(row) && typeof row === "object");
  }
  return [];
}

async function restGet(path: string): Promise<unknown> {
  const { url, serviceRoleKey } = getSupabaseServerEnv();
  const response = await fetch(`${url}/rest/v1/${path}`, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`REST ${response.status}: ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : [];
}

async function restCount(status: string): Promise<number | null> {
  const { url, serviceRoleKey } = getSupabaseServerEnv();
  const response = await fetch(
    `${url}/rest/v1/salons?select=id&onboarding_status=eq.${encodeURIComponent(status)}`,
    {
      method: "HEAD",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        Prefer: "count=exact",
      },
      cache: "no-store",
    }
  );
  const range = response.headers.get("content-range") || "";
  const total = range.split("/")[1];
  if (!total || total === "*") return null;
  const count = Number(total);
  return Number.isFinite(count) ? count : null;
}

async function loadRowsByStatus(status: string): Promise<ListingQueueRow[]> {
  const collected: Array<Record<string, unknown>> = [];
  const seen = new Set<string>();
  let afterId: string | null = null;

  for (let i = 0; i < 500; i++) {
    const qs = [
      `select=${encodeURIComponent(QUEUE_SELECT)}`,
      `onboarding_status=eq.${encodeURIComponent(status)}`,
      "order=id.asc",
      "limit=100",
    ];
    if (afterId) qs.push(`id=gt.${afterId}`);
    const page = asRecordArray(await restGet(`salons?${qs.join("&")}`));
    if (page.length === 0) break;

    let added = 0;
    for (const row of page) {
      const id = String(row.id || "");
      if (!id || seen.has(id)) continue;
      seen.add(id);
      collected.push(row);
      added += 1;
    }
    if (added === 0 || page.length < 100) break;
    afterId = String(page[page.length - 1]?.id || "");
    if (!afterId) break;
  }

  return mapQueueRows(collected);
}

export async function loadListingGenerationQueue(
  _supabase?: SupabaseClient
): Promise<ListingQueuePayload> {
  const [pendingRows, listedRows, pendingCount, listedCount] = await Promise.all([
    loadRowsByStatus(LISTING_ONBOARDING_STATUS.CAPTURED),
    loadRowsByStatus(LISTING_ONBOARDING_STATUS.PUBLISHED),
    restCount(LISTING_ONBOARDING_STATUS.CAPTURED),
    restCount(LISTING_ONBOARDING_STATUS.PUBLISHED),
  ]);

  return {
    rows: sortQueueRowsNewestFirst([...pendingRows, ...listedRows]),
    pendingCount: pendingCount ?? pendingRows.length,
    listedCount: listedCount ?? listedRows.length,
  };
}

export async function countListingGenerationQueue(
  supabase?: SupabaseClient
): Promise<{ pendingCount: number; listedCount: number }> {
  const payload = await loadListingGenerationQueue(supabase);
  return { pendingCount: payload.pendingCount, listedCount: payload.listedCount };
}

export async function loadListingGenerationQueueRows(
  supabase?: SupabaseClient
): Promise<ListingQueueRow[]> {
  const payload = await loadListingGenerationQueue(supabase);
  return payload.rows;
}
