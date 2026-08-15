import type { SupabaseClient } from "@supabase/supabase-js";
import { readListingCapturedAt } from "@/lib/salon-listing-pipeline";
import { postSupabaseRpc } from "@/lib/supabase-rpc";

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

function asCount(raw: unknown): number {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string" && raw.trim() && Number.isFinite(Number(raw))) return Number(raw);
  if (raw && typeof raw === "object" && "published_listing_count" in raw) {
    return asCount((raw as { published_listing_count: unknown }).published_listing_count);
  }
  if (raw && typeof raw === "object" && "pending_listing_count" in raw) {
    return asCount((raw as { pending_listing_count: unknown }).pending_listing_count);
  }
  return Number.NaN;
}

async function postRpc(name: string, args: Record<string, unknown> = {}): Promise<unknown> {
  return postSupabaseRpc(name, args);
}

async function loadQueueRowsByPage(): Promise<ListingQueueRow[]> {
  const collected: Array<Record<string, unknown>> = [];
  let afterId: string | null = null;

  for (let i = 0; i < 200; i++) {
    const args: Record<string, unknown> = { p_limit: 100 };
    if (afterId) args.p_after_id = afterId;
    const page = asRecordArray(await postRpc("listing_generation_queue_page", args));
    if (page.length === 0) break;
    collected.push(...page);
    afterId = String(page[page.length - 1]?.id || "");
    if (!afterId || page.length < 100) break;
  }

  return sortQueueRowsNewestFirst(mapQueueRows(collected));
}

export async function loadListingGenerationQueue(
  _supabase?: SupabaseClient
): Promise<ListingQueuePayload> {
  const [listedRaw, pendingRaw, rows] = await Promise.all([
    postRpc("published_listing_count"),
    postRpc("pending_listing_count"),
    loadQueueRowsByPage(),
  ]);

  const listedCount = asCount(listedRaw);
  const pendingCount = asCount(pendingRaw);
  if (!Number.isFinite(listedCount) || !Number.isFinite(pendingCount)) {
    throw new Error("Listing count RPC did not return numbers. Re-run packages/db/LISTING_QUEUE_PAGE.sql");
  }

  return { rows, pendingCount, listedCount };
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