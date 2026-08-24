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
  phone: string | null;
  website: string | null;
  map_url: string | null;
  place_id: string | null;
  latitude: number | null;
  longitude: number | null;
  logo_url: string | null;
  hero_url: string | null;
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

export type ListingQueuePagePayload = {
  rows: ListingQueueRow[];
  total: number;
  page: number;
  pageSize: number;
};

const QUEUE_SELECT_BASE =
  "id,name,slug,category,province,district,city,address,phone,website,map_url,place_id,latitude,longitude,logo_url,hero_url,rating,review_count,onboarding_status,public_visibility,source_type,is_featured,description,summary,created_at";
const QUEUE_SELECT = `${QUEUE_SELECT_BASE.replace(",created_at", "")},featured_starts_at,featured_ends_at,created_at`;

export const LISTING_QUEUE_PAGE_SIZE = 30;

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
    phone: (row.phone as string | null) ?? null,
    website: (row.website as string | null) ?? null,
    map_url: (row.map_url as string | null) ?? null,
    place_id: (row.place_id as string | null) ?? null,
    latitude: row.latitude == null ? null : Number(row.latitude),
    longitude: row.longitude == null ? null : Number(row.longitude),
    logo_url: (row.logo_url as string | null) ?? null,
    hero_url: (row.hero_url as string | null) ?? null,
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

function queueTabScope(tab: "pending" | "listed"): string {
  if (tab === "listed") {
    return `onboarding_status=eq.${encodeURIComponent(LISTING_ONBOARDING_STATUS.PUBLISHED)}`;
  }
  const pendingScope = `(onboarding_status.eq.${LISTING_ONBOARDING_STATUS.CAPTURED},and(source_type.eq.LISTING_GENERATION,onboarding_status.eq.DISCOVERED))`;
  return `or=${encodeURIComponent(pendingScope)}`;
}

function queueSearchFilter(input: { q?: string; district?: string; category?: string }): string | null {
  const q = sanitizeIlikeTerm(input.q || "");
  const district = sanitizeIlikeTerm(districtSearchLabel(input.district || ""));
  const category = sanitizeIlikeTerm(input.category || "");
  const clauses: string[] = [];
  if (q) {
    clauses.push(`or(name.ilike.%${q}%,slug.ilike.%${q}%,city.ilike.%${q}%,district.ilike.%${q}%,address.ilike.%${q}%)`);
  }
  if (district) {
    clauses.push(`or(district.ilike.%${district}%,city.ilike.%${district}%,address.ilike.%${district}%)`);
  }
  if (category) clauses.push(`category.ilike.%${category}%`);
  return clauses.length ? `(${clauses.join(",")})` : null;
}

async function restCountForQueuePage(
  tab: "pending" | "listed",
  filter: string | null
): Promise<number> {
  const { url, serviceRoleKey } = getSupabaseServerEnv();
  const query = ["select=id", queueTabScope(tab), filter ? `and=${encodeURIComponent(filter)}` : null]
    .filter(Boolean)
    .join("&");
  const response = await fetch(`${url}/rest/v1/salons?${query}`, {
    method: "HEAD",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      Prefer: "count=exact",
    },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`REST ${response.status}: listing count failed`);
  const total = Number((response.headers.get("content-range") || "").split("/")[1]);
  return Number.isFinite(total) ? total : 0;
}

export async function loadListingGenerationQueuePage(input: {
  tab: "pending" | "listed";
  page?: number;
  q?: string;
  district?: string;
  category?: string;
}): Promise<ListingQueuePagePayload> {
  const page = Math.max(1, Math.floor(Number(input.page) || 1));
  const offset = (page - 1) * LISTING_QUEUE_PAGE_SIZE;
  const filter = queueSearchFilter(input);

  const loadPage = async (select: string): Promise<ListingQueueRow[]> => {
    const query = [
      `select=${encodeURIComponent(select)}`,
      queueTabScope(input.tab),
      filter ? `and=${encodeURIComponent(filter)}` : null,
      "order=created_at.desc",
      `limit=${LISTING_QUEUE_PAGE_SIZE}`,
      `offset=${offset}`,
    ]
      .filter(Boolean)
      .join("&");
    return mapQueueRows(asRecordArray(await restGet(`salons?${query}`)));
  };

  const [rows, total] = await Promise.all([
    loadPage(QUEUE_SELECT).catch(() => loadPage(QUEUE_SELECT_BASE)),
    restCountForQueuePage(input.tab, filter),
  ]);

  return { rows, total, page, pageSize: LISTING_QUEUE_PAGE_SIZE };
}

export async function searchListingGenerationQueue(input: {
  tab: "pending" | "listed";
  q?: string;
  district?: string;
  category?: string;
}): Promise<ListingQueueRow[]> {
  const pageResult = await loadListingGenerationQueuePage(input);
  return pageResult.rows;
}

async function loadFeaturedListedRows(select = QUEUE_SELECT): Promise<ListingQueueRow[]> {
  const qs = [
    `select=${encodeURIComponent(select)}`,
    `onboarding_status=eq.${encodeURIComponent(LISTING_ONBOARDING_STATUS.PUBLISHED)}`,
    "is_featured=eq.true",
    "order=name.asc",
    `limit=${LISTING_QUEUE_PAGE_SIZE}`,
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
  const [pendingPage, listedPage, featuredRows] = await Promise.all([
    loadListingGenerationQueuePage({ tab: "pending", page: 1 }),
    loadListingGenerationQueuePage({ tab: "listed", page: 1 }),
    loadFeaturedListedRows(),
  ]);

  return {
    rows: sortQueueRowsNewestFirst([...pendingPage.rows, ...listedPage.rows]),
    featuredRows,
    pendingCount: pendingPage.total,
    listedCount: listedPage.total,
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
