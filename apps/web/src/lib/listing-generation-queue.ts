import type { SupabaseClient } from "@supabase/supabase-js";
import { LISTING_ONBOARDING_STATUS, readListingCapturedAt } from "@/lib/salon-listing-pipeline";
import { postSupabaseRpc } from "@/lib/supabase-rpc";
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

const QUEUE_SELECT =
  "id,name,slug,category,province,district,city,address,place_id,rating,review_count,onboarding_status,public_visibility,source_type,created_at,business_info_extended";

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

function asCount(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string" && raw.trim() && Number.isFinite(Number(raw))) return Number(raw);
  if (raw && typeof raw === "object") {
    const record = raw as Record<string, unknown>;
    if ("published_listing_count" in record) return asCount(record.published_listing_count);
    if ("pending_listing_count" in record) return asCount(record.pending_listing_count);
  }
  return null;
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

async function loadRowsViaRest(): Promise<ListingQueueRow[]> {
  const collected: Array<Record<string, unknown>> = [];
  const seen = new Set<string>();
  let afterId: string | null = null;

  for (let i = 0; i < 200; i++) {
    const qs = [
      `select=${encodeURIComponent(QUEUE_SELECT)}`,
      "onboarding_status=in.(LISTING_CAPTURED,LISTING_PUBLISHED)",
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

  return sortQueueRowsNewestFirst(mapQueueRows(collected));
}

function parsePayloadRpc(raw: unknown): ListingQueuePayload | null {
  let payload: Record<string, unknown> | null = null;
  if (typeof raw === "string") {
    try {
      payload = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return null;
    }
  } else if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    payload = raw as Record<string, unknown>;
    if (payload.listing_generation_queue_payload) {
      return parsePayloadRpc(payload.listing_generation_queue_payload);
    }
  }
  if (!payload) return null;
  const list = asRecordArray(payload.rows);
  const pendingCount = asCount(payload.pendingCount);
  const listedCount = asCount(payload.listedCount);
  if (pendingCount == null || listedCount == null) return null;
  return {
    rows: sortQueueRowsNewestFirst(mapQueueRows(list)),
    pendingCount,
    listedCount,
  };
}

async function tryRpc<T>(run: () => Promise<T>): Promise<T | null> {
  try {
    return await run();
  } catch {
    return null;
  }
}

export async function loadListingGenerationQueue(
  _supabase?: SupabaseClient
): Promise<ListingQueuePayload> {
  const fromPayload = await tryRpc(async () => {
    const parsed = parsePayloadRpc(await postSupabaseRpc("listing_generation_queue_payload"));
    if (!parsed) throw new Error("payload parse failed");
    return parsed;
  });
  if (fromPayload) return fromPayload;

  const [listedCount, pendingCount, rows] = await Promise.all([
    tryRpc(async () => asCount(await postSupabaseRpc("published_listing_count"))).then(async (count) => {
      if (count != null) return count;
      return restCount(LISTING_ONBOARDING_STATUS.PUBLISHED);
    }),
    tryRpc(async () => asCount(await postSupabaseRpc("pending_listing_count"))).then(async (count) => {
      if (count != null) return count;
      return restCount(LISTING_ONBOARDING_STATUS.CAPTURED);
    }),
    tryRpc(() => loadRowsViaRest()).then((value) => value ?? []),
  ]);

  return {
    rows,
    pendingCount:
      pendingCount ??
      rows.filter((row) => row.onboarding_status === LISTING_ONBOARDING_STATUS.CAPTURED).length,
    listedCount:
      listedCount ??
      rows.filter((row) => row.onboarding_status === LISTING_ONBOARDING_STATUS.PUBLISHED).length,
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
