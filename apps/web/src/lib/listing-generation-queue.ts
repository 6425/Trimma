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
  "id,name,slug,category,province,district,city,address,place_id,rating,review_count,onboarding_status,public_visibility,source_type,is_featured,created_at";

const QUEUE_PAGE_SIZE = 400;

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
    captured_at:
      typeof row.listing_captured_at === "string" && row.listing_captured_at.trim()
        ? String(row.listing_captured_at)
        : readListingCapturedAt({
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
      Prefer: "count=none",
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
  const qs = [
    `select=${encodeURIComponent(QUEUE_SELECT)}`,
    `onboarding_status=eq.${encodeURIComponent(status)}`,
    "order=created_at.desc",
    `limit=${QUEUE_PAGE_SIZE}`,
  ];
  return mapQueueRows(asRecordArray(await restGet(`salons?${qs.join("&")}`)));
}

async function loadListingGenerationDiscovered(): Promise<ListingQueueRow[]> {
  const qs = [
    `select=${encodeURIComponent(QUEUE_SELECT)}`,
    "source_type=eq.LISTING_GENERATION",
    "onboarding_status=eq.DISCOVERED",
    "order=created_at.desc",
    `limit=${QUEUE_PAGE_SIZE}`,
  ];
  return mapQueueRows(asRecordArray(await restGet(`salons?${qs.join("&")}`)));
}

export async function loadListingGenerationQueue(
  _supabase?: SupabaseClient
): Promise<ListingQueuePayload> {
  const [pendingCaptured, pendingDiscovered, listedRows, pendingCount, listedCount] = await Promise.all([
    loadRowsByStatus(LISTING_ONBOARDING_STATUS.CAPTURED),
    loadListingGenerationDiscovered(),
    loadRowsByStatus(LISTING_ONBOARDING_STATUS.PUBLISHED),
    restCount(LISTING_ONBOARDING_STATUS.CAPTURED),
    restCount(LISTING_ONBOARDING_STATUS.PUBLISHED),
  ]);

  const pendingById = new Map<string, ListingQueueRow>();
  for (const row of [...pendingCaptured, ...pendingDiscovered]) {
    pendingById.set(row.id, row);
  }
  const pendingRows = [...pendingById.values()];

  return {
    rows: sortQueueRowsNewestFirst([...pendingRows, ...listedRows]),
    pendingCount: Math.max(pendingCount ?? 0, pendingRows.length),
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
