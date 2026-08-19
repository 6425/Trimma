import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { filterPublicSalons } from "@/lib/salon-list-filters";
import { isSalonPubliclyBookable, isSalonApprovedForBookings } from "@/lib/salon-bookability";
import { isSalonPubliclyListable, isSalonPublicBrowseListing } from "@/lib/salon-public-listing";
import { mapSalonRowToUI } from "@/lib/salons-mapper";
import { mapSalonRowToBusinessListing, type BusinessListingCardData } from "@/lib/business-listing-mapper";
import { isListingPublished, LISTING_ONBOARDING_STATUS } from "@/lib/salon-listing-pipeline";
import { buildSalonLocationOrFilter } from "@/lib/sri-lanka-locations";
import { fetchAllByIdCursor } from "@/lib/supabase-fetch-all";
import { isMissingDbSchemaError } from "@/lib/with-admin-db";
import { todayInFeaturedTimezone } from "@/lib/listing-featured";
import {
  FEATURED_LISTING_COUNT,
  TOP_RATED_LISTING_COUNT,
  YOU_MAY_ALSO_LIKE_COUNT,
  pinTopReviewedListingsWithPhone,
  splitMarketplaceListingSections,
} from "@/lib/listing-marketplace-rank";

function normalizeCategoryText(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function buildCategoryNeedles(category: string, categoryName?: string): string[] {
  const needles = new Set<string>();
  const slugText = category.replace(/-/g, " ").trim();
  if (slugText) needles.add(normalizeCategoryText(slugText));
  if (categoryName?.trim()) needles.add(normalizeCategoryText(categoryName));
  return [...needles].filter(Boolean);
}

function textMatchesCategoryNeedle(haystack: string, needle: string): boolean {
  if (!needle) return false;
  return haystack.includes(needle) || needle.includes(haystack);
}

function readTrimmaCategoryTags(row: Record<string, unknown>): string[] {
  const tags = new Set<string>();
  const primary = String(row.category || "").trim();
  if (primary) tags.add(primary);

  const ext = row.business_info_extended;
  if (ext && typeof ext === "object" && !Array.isArray(ext)) {
    const arr = (ext as Record<string, unknown>).trimma_categories;
    if (Array.isArray(arr)) {
      for (const item of arr) {
        const name = String(item || "").trim();
        if (name) tags.add(name);
      }
    }
  }

  return [...tags];
}

function salonMatchesCategory(
  row: Record<string, unknown>,
  category: string,
  categoryName?: string
): boolean {
  const needles = buildCategoryNeedles(category, categoryName);
  if (!needles.length) return true;

  const tagNeedles = readTrimmaCategoryTags(row).map(normalizeCategoryText);
  if (
    tagNeedles.some((tag) => needles.some((needle) => textMatchesCategoryNeedle(tag, needle)))
  ) {
    return true;
  }

  const services = Array.isArray(row.services) ? row.services : [];
  return services.some((service) => {
    const serviceCategory = normalizeCategoryText(String(service?.category || ""));
    return needles.some((needle) => textMatchesCategoryNeedle(serviceCategory, needle));
  });
}

export type PublicSalonSearchParams = {
  q?: string;
  location?: string;
  category?: string;
  categoryName?: string;
  sort?: string;
  minRating?: number;
  verifiedOnly?: boolean;
  /** When true, only salons with online booking enabled and valid owner contact details. */
  bookableOnly?: boolean;
  /** When true, only admin-approved / verified salons (for /bookings directory). */
  approvedOnly?: boolean;
  /** When true, only browse/discovery listings (Lead Mgmt / unbookable public listings). */
  browseOnly?: boolean;
  /** When true, only admin Lead Management / listing-generation sources. */
  leadListingsOnly?: boolean;
  /** When true, only admin-published listing-generation rows (LISTING_PUBLISHED). */
  publishedOnly?: boolean;
  limit?: number;
  offset?: number;
};

export async function fetchPublicSalons(
  supabase: SupabaseClient,
  {
    q = "",
    location = "",
    category = "",
    categoryName = "",
    sort = "recommended",
    minRating = 0,
    verifiedOnly = false,
    bookableOnly = false,
    browseOnly = false,
    approvedOnly = false,
    leadListingsOnly = false,
    limit = 12,
    offset = 0,
  }: PublicSalonSearchParams
) {
  const normalizedCategory = category.replace(/-/g, " ").trim().toLowerCase();
  const categoryFilterActive = normalizedCategory.length > 0;
  const postFilterActive =
    categoryFilterActive || bookableOnly || browseOnly || approvedOnly || leadListingsOnly;

  let select = `
      id, name, slug, rating, review_count,
      city, district, province, category, logo_url, cover_url, hero_url, featured_images,
      is_featured, featured_starts_at, featured_ends_at, is_verified, working_hours, status, public_visibility,
      booking_enabled, source_type, onboarding_status,
      phone, owner_email, owner_gmail, website, map_url,
      services ( id, name, price, category )
    `;

  const applyFilters = (builder: ReturnType<typeof supabase.from>, withDisplayOrder: boolean) => {
    let query = builder.select(select);
    if (q) {
      query = query.or(
        `name.ilike.%${q}%,category.ilike.%${q}%,city.ilike.%${q}%,district.ilike.%${q}%,province.ilike.%${q}%`
      );
    }
    if (location) {
      const locationFilter = buildSalonLocationOrFilter(location);
      if (locationFilter) query = query.or(locationFilter);
    }
    if (minRating > 0) query = query.gt("review_count", 0).gte("rating", minRating);
    if (verifiedOnly) query = query.eq("is_verified", true);
    if (withDisplayOrder) {
      if (sort === "rating") query = query.order("rating", { ascending: false });
      else if (sort === "name") query = query.order("name", { ascending: true });
      else query = query.order("is_featured", { ascending: false }).order("rating", { ascending: false });
    }
    return query;
  };

  const fetchRows = async (): Promise<Array<Record<string, unknown>>> =>
    postFilterActive
      ? fetchAllByIdCursor(async (afterId, pageSize) => {
          let query = applyFilters(supabase.from("salons"), false);
          if (afterId) query = query.gt("id", afterId);
          const { data: page, error } = await query.order("id", { ascending: true }).limit(pageSize);
          if (error) throw new Error(error.message);
          return asSalonRows(page);
        })
      : (async () => {
          const { data: page, error } = await applyFilters(supabase.from("salons"), true).range(
            offset,
            offset + Math.max(limit, 1) - 1
          );
          if (error) throw new Error(error.message);
          return asSalonRows(page);
        })();

  let data: Array<Record<string, unknown>>;
  try {
    data = await fetchRows();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const fallbackSelect = withoutFeaturedPeriodSelect(select);
    if (fallbackSelect === select || !isMissingDbSchemaError(message)) throw error;
    select = fallbackSelect;
    data = await fetchRows();
  }

  let rows = filterPublicSalons(data);
  if (approvedOnly) {
    rows = rows.filter(isSalonApprovedForBookings);
  } else {
    rows = rows.filter(isSalonPubliclyListable);
    if (bookableOnly) {
      rows = rows.filter(isSalonPubliclyBookable);
    } else if (browseOnly) {
      rows = rows.filter((row) => isSalonPublicBrowseListing(row));
    }
  }
  if (leadListingsOnly) {
    rows = rows.filter((row) => {
      const source = String(row.source_type || "");
      return source === "GOOGLE_PLACES" || source === "LISTING_GENERATION";
    });
  }
  if (categoryFilterActive) {
    rows = rows.filter((row) => salonMatchesCategory(row, category, categoryName));
  }

  const pagedRows = postFilterActive ? rows.slice(offset, offset + limit) : rows;
  const salons = pagedRows.map((row, idx) => mapSalonRowToUI(row, idx + offset));

  return {
    salons,
    hasMore: postFilterActive
      ? rows.length > offset + limit
      : salons.length === limit,
  };
}

const BUSINESS_LISTING_CARD_SELECT = `
      id, name, slug, rating, review_count,
      city, district, province, category, logo_url, cover_url, hero_url, featured_images,
      is_featured, featured_starts_at, featured_ends_at, is_verified, working_hours, status, public_visibility,
      booking_enabled, source_type, onboarding_status,
      phone, owner_email, owner_gmail, website, map_url, business_info_extended,
      address, latitude, longitude, place_id
    `;

const BUSINESS_LISTING_SELECT = `
      ${BUSINESS_LISTING_CARD_SELECT},
      services ( id, name, price, category )
    `;

function withoutFeaturedPeriodSelect(select: string): string {
  return select.replace("featured_starts_at, featured_ends_at, ", "");
}

function isLeadGenerationSource(row: Record<string, unknown>): boolean {
  const source = String(row.source_type || "");
  return source === "GOOGLE_PLACES" || source === "LISTING_GENERATION";
}

function isPublishedMarketplaceRow(row: Record<string, unknown>): boolean {
  if (!isListingPublished(row)) return false;
  const status = String(row.status || "").toLowerCase();
  return status !== "rejected" && status !== "inactive";
}

function filterBusinessListingRows(
  data: Array<Record<string, unknown>>,
  params: {
    category?: string;
    categoryName?: string;
    publishedOnly?: boolean;
  }
) {
  let rows = filterPublicSalons(data);

  if (params.publishedOnly) {
    // Show every published listing. Do not hide rows because of leftover
    // is_verified / booking / source_type flags from an import or update.
    rows = rows.filter(isPublishedMarketplaceRow);
  } else {
    rows = rows
      .filter(isSalonPublicBrowseListing)
      .filter((row) => !isSalonPubliclyBookable(row))
      .filter(isLeadGenerationSource);
  }

  const category = params.category || "";
  const categoryName = params.categoryName || "";
  if (category.replace(/-/g, " ").trim()) {
    rows = rows.filter((row) => salonMatchesCategory(row, category, categoryName));
  }

  return rows;
}

function sortBusinessListingRows(
  rows: Array<Record<string, unknown>>,
  sort: string
): Array<Record<string, unknown>> {
  if (sort === "name") {
    return [...rows].sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
  }
  if (sort === "rating") {
    return [...rows].sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
  }
  return pinTopReviewedListingsWithPhone(
    rows.map((row) => ({
      ...row,
      reviews: Number(row.review_count || 0),
    }))
  );
}

function publishedListingsClient(fallback: SupabaseClient): SupabaseClient {
  try {
    return createSupabaseAdminClient();
  } catch {
    return fallback;
  }
}

type LooseListingQuery = {
  eq: (column: string, value: unknown) => LooseListingQuery;
  or: (filters: string) => LooseListingQuery;
  not: (column: string, operator: string, value: string) => LooseListingQuery;
  gt: (column: string, value: number) => LooseListingQuery;
  lte: (column: string, value: unknown) => LooseListingQuery;
  gte: (column: string, value: unknown) => LooseListingQuery;
  order: (column: string, options?: { ascending?: boolean }) => LooseListingQuery;
  limit: (count: number) => Promise<{ data: unknown; error: { message: string } | null }>;
};

function applyPublishedListingFilters(
  query: unknown,
  params: {
    q: string;
    location: string;
    minRating: number;
    verifiedOnly: boolean;
    category?: string;
    categoryName?: string;
  }
): LooseListingQuery {
  let next = query as LooseListingQuery;
  next = next.eq("onboarding_status", LISTING_ONBOARDING_STATUS.PUBLISHED);
  next = next.not("status", "in", "(rejected,inactive)");
  const q = params.q.trim();
  if (q) {
    next = next.or(
      `name.ilike.%${q}%,category.ilike.%${q}%,city.ilike.%${q}%,district.ilike.%${q}%,province.ilike.%${q}%,address.ilike.%${q}%`
    );
  }
  if (params.location.trim()) {
    const locationFilter = buildSalonLocationOrFilter(params.location);
    if (locationFilter) next = next.or(locationFilter);
  }
  const categoryNeedles = [
    ...new Set(
      [params.category?.replace(/-/g, " ").trim(), params.categoryName?.trim()].filter(
        (value): value is string => Boolean(value)
      )
    ),
  ];
  if (categoryNeedles.length) {
    next = next.or(categoryNeedles.map((needle) => `category.ilike.%${needle}%`).join(","));
  }
  if (params.minRating > 0) {
    next = next.gt("review_count", 0).gte("rating", params.minRating);
  }
  if (params.verifiedOnly) {
    next = next.eq("is_verified", true);
  }
  return next;
}

async function countPublishedMarketplaceListings(
  supabase: SupabaseClient,
  filters: {
    q: string;
    location: string;
    minRating: number;
    verifiedOnly: boolean;
    category?: string;
    categoryName?: string;
  }
): Promise<number> {
  const client = publishedListingsClient(supabase);
  const query = applyPublishedListingFilters(
    client.from("salons").select("id", { count: "exact", head: true }) as unknown,
    filters
  );
  const { count, error } = await (query as unknown as Promise<{
    count: number | null;
    error: { message: string } | null;
  }>);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

function asSalonRows(data: unknown): Array<Record<string, unknown>> {
  return (Array.isArray(data) ? data : []) as unknown as Array<Record<string, unknown>>;
}

async function loadPublishedSalonRows(
  supabase: SupabaseClient,
  select = BUSINESS_LISTING_CARD_SELECT
): Promise<Array<Record<string, unknown>>> {
  const client = publishedListingsClient(supabase);
  try {
    return await fetchAllByIdCursor(async (afterId, pageSize) => {
      let query = client
        .from("salons")
        .select(select)
        .eq("onboarding_status", LISTING_ONBOARDING_STATUS.PUBLISHED);
      if (afterId) query = query.gt("id", afterId);
      const { data: page, error } = await query.order("id", { ascending: true }).limit(pageSize);
      if (error) throw new Error(error.message);
      return asSalonRows(page);
    });
  } catch (error) {
    const fallbackSelect = withoutFeaturedPeriodSelect(select);
    const message = error instanceof Error ? error.message : String(error);
    if (fallbackSelect !== select && isMissingDbSchemaError(message)) {
      return loadPublishedSalonRows(supabase, fallbackSelect);
    }
    throw error;
  }
}

/** Homepage / browse: do not download every published salon on each request. */
async function loadPublishedMarketplaceWindow(
  supabase: SupabaseClient,
  params: {
    q: string;
    location: string;
    minRating: number;
    verifiedOnly: boolean;
    category?: string;
    categoryName?: string;
    limit: number;
    offset: number;
  }
): Promise<{ rows: Array<Record<string, unknown>>; totalCount: number; hasMore: boolean }> {
  const client = publishedListingsClient(supabase);
  const filters = {
    q: params.q,
    location: params.location,
    minRating: params.minRating,
    verifiedOnly: params.verifiedOnly,
    category: params.category,
    categoryName: params.categoryName,
  };
  const windowSize =
    !params.limit || params.limit <= 0
      ? 80
      : Math.min(
          400,
          params.offset + params.limit + FEATURED_LISTING_COUNT + TOP_RATED_LISTING_COUNT
        );

  const today = todayInFeaturedTimezone();
  const featuredSelect = BUSINESS_LISTING_CARD_SELECT;
  let featuredQuery = applyPublishedListingFilters(
    client.from("salons").select(featuredSelect) as unknown,
    filters
  ).eq("is_featured", true);
  featuredQuery = featuredQuery.lte("featured_starts_at", today).gte("featured_ends_at", today).limit(40);
  const popularQuery = applyPublishedListingFilters(
    client.from("salons").select(featuredSelect) as unknown,
    filters
  )
    .order("review_count", { ascending: false })
    .order("rating", { ascending: false })
    .limit(windowSize);

  let [featuredRes, popularRes, totalCount] = await Promise.all([
    featuredQuery,
    popularQuery,
    countPublishedMarketplaceListings(supabase, filters),
  ]);

  if (
    (featuredRes.error && isMissingDbSchemaError(featuredRes.error.message)) ||
    (popularRes.error && isMissingDbSchemaError(popularRes.error.message))
  ) {
    const fallbackSelect = withoutFeaturedPeriodSelect(BUSINESS_LISTING_CARD_SELECT);
    const fallbackFeatured = applyPublishedListingFilters(
      client.from("salons").select(fallbackSelect) as unknown,
      filters
    )
      .eq("is_featured", true)
      .limit(40);
    const fallbackPopular = applyPublishedListingFilters(
      client.from("salons").select(fallbackSelect) as unknown,
      filters
    )
      .order("review_count", { ascending: false })
      .order("rating", { ascending: false })
      .limit(windowSize);
    const fallback = await Promise.all([fallbackFeatured, fallbackPopular]);
    featuredRes = fallback[0];
    popularRes = fallback[1];
  }

  if (featuredRes.error) throw new Error(featuredRes.error.message);
  if (popularRes.error) throw new Error(popularRes.error.message);

  const featuredRows = asSalonRows(featuredRes.data);
  const popularRows = asSalonRows(popularRes.data);

  const byId = new Map<string, Record<string, unknown>>();
  for (const row of [...featuredRows, ...popularRows]) {
    const id = String(row.id || "");
    if (!id) continue;
    byId.set(id, row);
  }

  return {
    rows: [...byId.values()],
    totalCount,
    hasMore:
      !params.limit || params.limit <= 0
        ? false
        : params.offset + params.limit + FEATURED_LISTING_COUNT + TOP_RATED_LISTING_COUNT < totalCount,
  };
}

export async function countPublishedListingsForLocation(
  supabase: SupabaseClient,
  location: string
): Promise<number> {
  return countPublishedMarketplaceListings(supabase, {
    q: "",
    location,
    minRating: 0,
    verifiedOnly: false,
  });
}

export async function fetchBusinessListingCards(
  supabase: SupabaseClient,
  params: Omit<PublicSalonSearchParams, "bookableOnly">
): Promise<{
  listings: BusinessListingCardData[];
  topRated: BusinessListingCardData[];
  featured: BusinessListingCardData[];
  hasMore: boolean;
  totalCount: number;
}> {
  const {
    q = "",
    location = "",
    category = "",
    categoryName = "",
    sort = "recommended",
    minRating = 0,
    verifiedOnly = false,
    publishedOnly = false,
    limit = YOU_MAY_ALSO_LIKE_COUNT,
    offset = 0,
  } = params;

  const categoryActive = category.replace(/-/g, " ").trim().length > 0;

  let data: Array<Record<string, unknown>>;
  let countedTotal: number | null = null;
  let windowHasMore: boolean | null = null;

  if (publishedOnly) {
    const windowed = await loadPublishedMarketplaceWindow(supabase, {
      q,
      location,
      minRating,
      verifiedOnly,
      category,
      categoryName,
      limit,
      offset,
    });
    data = windowed.rows;
    countedTotal = windowed.totalCount;
    windowHasMore = windowed.hasMore;
  } else {
    data = await fetchAllByIdCursor(async (afterId, pageSize) => {
      let query = supabase
        .from("salons")
        .select(categoryActive ? BUSINESS_LISTING_SELECT : BUSINESS_LISTING_CARD_SELECT)
        .in("source_type", ["GOOGLE_PLACES", "LISTING_GENERATION"]);

      if (q) {
        query = query.or(
          `name.ilike.%${q}%,category.ilike.%${q}%,city.ilike.%${q}%,district.ilike.%${q}%,province.ilike.%${q}%`
        );
      }
      if (location) {
        const locationFilter = buildSalonLocationOrFilter(location);
        if (locationFilter) query = query.or(locationFilter);
      }
      if (minRating > 0) query = query.gt("review_count", 0).gte("rating", minRating);
      if (verifiedOnly) query = query.eq("is_verified", true);

      if (afterId) query = query.gt("id", afterId);
      const { data: page, error } = await query.order("id", { ascending: true }).limit(pageSize);
      if (error) throw new Error(error.message);
      return asSalonRows(page);
    });
  }

  const filtered = filterBusinessListingRows(data, { category, categoryName, publishedOnly });
  const toCards = (rows: Array<Record<string, unknown>>, start = 0) =>
    rows.map((row, idx) => mapSalonRowToBusinessListing(row, idx + start));

  if (sort === "name" || sort === "rating") {
    const rows = sortBusinessListingRows(filtered, sort);
    const pagedRows = !limit || limit <= 0 ? rows.slice(offset) : rows.slice(offset, offset + limit);
    const listings = toCards(pagedRows, offset);
    const totalCount = countedTotal ?? rows.length;
    return {
      listings,
      topRated: [],
      featured: [],
      hasMore: Boolean(limit && limit > 0 && offset + listings.length < totalCount),
      totalCount,
    };
  }

  const { topRated, featured, rest } = splitMarketplaceListingSections(
    filtered.map((row) => ({
      ...row,
      reviews: Number(row.review_count || 0),
      is_featured: row.is_featured === true,
    }))
  );
  const topRatedCards = toCards(topRated).slice(0, TOP_RATED_LISTING_COUNT);
  const featuredCards = toCards(featured).slice(0, FEATURED_LISTING_COUNT);
  const totalCount = countedTotal ?? topRated.length + featured.length + rest.length;

  if (!limit || limit <= 0) {
    return {
      listings: toCards([...topRated, ...featured, ...rest]),
      topRated: topRatedCards,
      featured: featuredCards,
      hasMore: false,
      totalCount,
    };
  }

  const pagedRest = rest.slice(offset, offset + limit);
  return {
    listings: toCards(pagedRest, offset),
    topRated: topRatedCards,
    featured: featuredCards,
    hasMore:
      windowHasMore != null
        ? windowHasMore
        : offset + pagedRest.length < rest.length,
    totalCount,
  };
}

export async function countPublishedListingsByCategory(
  supabase: SupabaseClient,
  categories: Array<{ name: string; slug: string }>
): Promise<Record<string, number>> {
  const data = await loadPublishedSalonRows(supabase);

  const rows = filterBusinessListingRows(data, { publishedOnly: true });
  const counts: Record<string, number> = {};

  for (const category of categories) {
    counts[category.slug] = rows.filter((row) =>
      salonMatchesCategory(row, category.slug, category.name)
    ).length;
  }

  return counts;
}
