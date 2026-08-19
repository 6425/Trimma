import type { SupabaseClient } from "@supabase/supabase-js";
import { parseFeaturedDate } from "@/lib/listing-featured";
import { LISTING_ONBOARDING_STATUS, readListingCapturedAt } from "@/lib/salon-listing-pipeline";
import { getDistrictFilterOptions } from "@/lib/sri-lanka-locations";
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
  featured_starts_at: string | null;
  featured_ends_at: string | null;
  description: string | null;
  summary: string | null;
  created_at: string;
  captured_at: string | null;
};

export type ListingQueuePayload = {
  rows: ListingQueueRow[];
  featuredRows: ListingQueueRow[];
  pendingCount: number;
  listedCount: number;
};

const QUEUE_SELECT_BASE =
  "id,name,slug,category,province,district,city,address,place_id,rating,review_count,onboarding_status,public_visibility,source_type,is_featured,description,summary,created_at";
const QUEUE_SELECT = `${QUEUE_SELECT_BASE.replace(",created_at", "")},featured_starts_at,featured_ends_at,created_at`;

const QUEUE_PAGE_SIZE = 400;
const QUEUE_SEARCH_LIMIT = 200;

function sanitizeIlikeTerm(value: string): string {
  return value.replace(/[%_,.()"'\\]/g, " ").replace(/\s+/g, " ").trim();
}

function districtSearchLabel(districtSlug: string): string {
  const match = getDistrictFilterOptions().find((district) => district.value === districtSlug);
  return match?.label || districtSlug.replace(/-/g, " ");
}

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
    featured_starts_at: parseFeaturedDate(row.featured_starts_at),
    featured_ends_at: parseFeaturedDate(row.featured_ends_at),
    description: typeof row.description === "string" && row.description.trim() ? String(row.description) : null,
    summary: typeof row.summary === "string" && row.summary.trim() ? String(row.summary) : null,
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

async function loadRowsByStatus(status: string, select = QUEUE_SELECT): Promise<ListingQueueRow[]> {
  const qs = [
    `select=${encodeURIComponent(select)}`,
    `onboarding_status=eq.${encodeURIComponent(status)}`,
    "order=created_at.desc",
    `limit=${QUEUE_PAGE_SIZE}`,
  ];
  try {
    return mapQueueRows(asRecordArray(await restGet(`salons?${qs.join("&")}`)));
  } catch (error) {
    if (select !== QUEUE_SELECT_BASE) {
      return loadRowsByStatus(status, QUEUE_SELECT_BASE);
    }
    throw error;
  }
}

async function loadListingGenerationDiscovered(select = QUEUE_SELECT): Promise<ListingQueueRow[]> {
  const qs = [
    `select=${encodeURIComponent(select)}`,
    "source_type=eq.LISTING_GENERATION",
    "onboarding_status=eq.DISCOVERED",
    "order=created_at.desc",
    `limit=${QUEUE_PAGE_SIZE}`,
  ];
  try {
    return mapQueueRows(asRecordArray(await restGet(`salons?${qs.join("&")}`)));
  } catch (error) {
    if (select !== QUEUE_SELECT_BASE) {
      return loadListingGenerationDiscovered(QUEUE_SELECT_BASE);
    }
    throw error;
  }
}

export async function searchListingGenerationQueue(input: {
  tab: "pending" | "listed";
  q?: string;
  district?: string;
  category?: string;
}): Promise<ListingQueueRow[]> {
  const q = sanitizeIlikeTerm(input.q || "");
  const district = sanitizeIlikeTerm(districtSearchLabel(input.district || ""));
  const category = sanitizeIlikeTerm(input.category || "");
  if (!q && !district && !category) return [];

  const clauses: string[] = [];
  if (q) {
    clauses.push(`or(name.ilike.%${q}%,slug.ilike.%${q}%,city.ilike.%${q}%,district.ilike.%${q}%,address.ilike.%${q}%)`);
  }
  if (district) {
    clauses.push(`or(district.ilike.%${district}%,city.ilike.%${district}%,address.ilike.%${district}%)`);
  }
  if (category) {
    clauses.push(`category.ilike.%${category}%`);
  }

  const andFilter = `(${clauses.join(",")})`;
  const select = encodeURIComponent(QUEUE_SELECT);

  const searchByStatus = async (status: string, extra: string[] = []) => {
    const qs = [
      `select=${select}`,
      `onboarding_status=eq.${encodeURIComponent(status)}`,
      ...extra,
      `and=${encodeURIComponent(andFilter)}`,
      "order=created_at.desc",
      `limit=${QUEUE_SEARCH_LIMIT}`,
    ];
    try {
      return mapQueueRows(asRecordArray(await restGet(`salons?${qs.join("&")}`)));
    } catch (error) {
      const fallbackQs = qs.map((part) =>
        part.startsWith("select=") ? `select=${encodeURIComponent(QUEUE_SELECT_BASE)}` : part
      );
      if (select !== encodeURIComponent(QUEUE_SELECT_BASE)) {
        return mapQueueRows(asRecordArray(await restGet(`salons?${fallbackQs.join("&")}`)));
      }
      throw error;
    }
  };

  if (input.tab === "listed") {
    return searchByStatus(LISTING_ONBOARDING_STATUS.PUBLISHED);
  }

  const [captured, discovered] = await Promise.all([
    searchByStatus(LISTING_ONBOARDING_STATUS.CAPTURED),
    searchByStatus("DISCOVERED", ["source_type=eq.LISTING_GENERATION"]),
  ]);
  const byId = new Map<string, ListingQueueRow>();
  for (const row of [...captured, ...discovered]) byId.set(row.id, row);
  return [...byId.values()];
}

async function loadFeaturedListedRows(select = QUEUE_SELECT): Promise<ListingQueueRow[]> {
  const qs = [
    `select=${encodeURIComponent(select)}`,
    `onboarding_status=eq.${encodeURIComponent(LISTING_ONBOARDING_STATUS.PUBLISHED)}`,
    "is_featured=eq.true",
    "order=name.asc",
    "limit=200",
  ];
  try {
    return mapQueueRows(asRecordArray(await restGet(`salons?${qs.join("&")}`)));
  } catch (error) {
    if (select !== QUEUE_SELECT_BASE) {
      return loadFeaturedListedRows(QUEUE_SELECT_BASE);
    }
    throw error;
  }
}

export async function loadListingGenerationQueue(
  _supabase?: SupabaseClient
): Promise<ListingQueuePayload> {
  const [pendingCaptured, pendingDiscovered, listedRows, featuredRows, pendingCount, listedCount] = await Promise.all([
    loadRowsByStatus(LISTING_ONBOARDING_STATUS.CAPTURED),
    loadListingGenerationDiscovered(),
    loadRowsByStatus(LISTING_ONBOARDING_STATUS.PUBLISHED),
    loadFeaturedListedRows(),
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
    featuredRows,
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
