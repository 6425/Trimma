import type { SupabaseClient } from "@supabase/supabase-js";
import { filterPublicSalons } from "@/lib/salon-list-filters";
import { isSalonPubliclyBookable, isSalonApprovedForBookings } from "@/lib/salon-bookability";
import { isSalonPubliclyListable, isSalonPublicBrowseListing } from "@/lib/salon-public-listing";
import { mapSalonRowToUI } from "@/lib/salons-mapper";
import { mapSalonRowToBusinessListing, type BusinessListingCardData } from "@/lib/business-listing-mapper";
import { isListingPublished, LISTING_ONBOARDING_STATUS } from "@/lib/salon-listing-pipeline";
import { buildSalonLocationOrFilter } from "@/lib/sri-lanka-locations";
import { fetchAllByIdCursor } from "@/lib/supabase-fetch-all";

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

  const select = `
      id, name, slug, rating, review_count,
      city, district, province, category, logo_url, cover_url, hero_url, featured_images,
      is_featured, is_verified, working_hours, status, public_visibility,
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

  const data = postFilterActive
    ? await fetchAllByIdCursor(async (afterId, pageSize) => {
        let query = applyFilters(supabase.from("salons"), false);
        if (afterId) query = query.gt("id", afterId);
        const { data: page, error } = await query.order("id", { ascending: true }).limit(pageSize);
        if (error) throw new Error(error.message);
        return page || [];
      })
    : await (async () => {
        const { data: page, error } = await applyFilters(supabase.from("salons"), true).range(
          offset,
          offset + Math.max(limit, 1) - 1
        );
        if (error) throw new Error(error.message);
        return page || [];
      })();

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

const BUSINESS_LISTING_SELECT = `
      id, name, slug, rating, review_count,
      city, district, province, category, logo_url, cover_url, hero_url, featured_images,
      is_featured, is_verified, working_hours, status, public_visibility,
      booking_enabled, source_type, onboarding_status,
      phone, owner_email, owner_gmail, website, map_url, business_info_extended,
      address, latitude, longitude, place_id,
      services ( id, name, price, category )
    `;

function isLeadGenerationSource(row: Record<string, unknown>): boolean {
  const source = String(row.source_type || "");
  return source === "GOOGLE_PLACES" || source === "LISTING_GENERATION";
}

function filterBusinessListingRows(
  data: Array<Record<string, unknown>>,
  params: {
    category?: string;
    categoryName?: string;
    publishedOnly?: boolean;
  }
) {
  let rows = filterPublicSalons(data)
    .filter(isSalonPublicBrowseListing)
    .filter((row) => !isSalonPubliclyBookable(row))
    .filter(isLeadGenerationSource);

  if (params.publishedOnly) {
    rows = rows.filter(isListingPublished);
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
  const copy = [...rows];
  copy.sort((a, b) => {
    if (sort === "name") {
      return String(a.name || "").localeCompare(String(b.name || ""));
    }
    if (sort === "rating") {
      return Number(b.rating || 0) - Number(a.rating || 0);
    }
    const featured = Number(Boolean(b.is_featured)) - Number(Boolean(a.is_featured));
    if (featured) return featured;
    return Number(b.rating || 0) - Number(a.rating || 0);
  });
  return copy;
}

async function loadPublishedMarketplaceListings(
  supabase: SupabaseClient
): Promise<Array<Record<string, unknown>> | null> {
  const rpc = await supabase.rpc("published_marketplace_listings");
  if (rpc.error || rpc.data == null) return null;
  const raw = typeof rpc.data === "string" ? JSON.parse(rpc.data) : rpc.data;
  return Array.isArray(raw) ? (raw as Array<Record<string, unknown>>) : null;
}

function rowMatchesTextQuery(row: Record<string, unknown>, q: string): boolean {
  if (!q.trim()) return true;
  const needle = q.trim().toLowerCase();
  return [row.name, row.category, row.city, row.district, row.province, row.address]
    .some((value) => String(value || "").toLowerCase().includes(needle));
}

function rowMatchesLocationQuery(row: Record<string, unknown>, location: string): boolean {
  if (!location.trim()) return true;
  const needle = location.trim().toLowerCase();
  return [row.city, row.district, row.province, row.address]
    .some((value) => String(value || "").toLowerCase().includes(needle));
}

export async function fetchBusinessListingCards(
  supabase: SupabaseClient,
  params: Omit<PublicSalonSearchParams, "bookableOnly">
): Promise<{ listings: BusinessListingCardData[]; hasMore: boolean; totalCount: number }> {
  const {
    q = "",
    location = "",
    category = "",
    categoryName = "",
    sort = "recommended",
    minRating = 0,
    verifiedOnly = false,
    publishedOnly = false,
    limit = 24,
    offset = 0,
  } = params;

  let data = publishedOnly ? await loadPublishedMarketplaceListings(supabase) : null;

  if (!data) {
    data = await fetchAllByIdCursor(async (afterId, pageSize) => {
      let query = supabase.from("salons").select(BUSINESS_LISTING_SELECT);

      if (publishedOnly) {
        query = query.eq("onboarding_status", LISTING_ONBOARDING_STATUS.PUBLISHED);
      }
      query = query.in("source_type", ["GOOGLE_PLACES", "LISTING_GENERATION"]);

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
      return (page ?? []) as Array<Record<string, unknown>>;
    });
  } else {
    if (q) data = data.filter((row) => rowMatchesTextQuery(row, q));
    if (location) data = data.filter((row) => rowMatchesLocationQuery(row, location));
    if (minRating > 0) {
      data = data.filter(
        (row) => Number(row.review_count || 0) > 0 && Number(row.rating || 0) >= minRating
      );
    }
    if (verifiedOnly) data = data.filter((row) => Boolean(row.is_verified));
  }

  const rows = sortBusinessListingRows(
    filterBusinessListingRows(data, { category, categoryName, publishedOnly }),
    sort
  );
  const pagedRows = !limit || limit <= 0 ? rows.slice(offset) : rows.slice(offset, offset + limit);
  const listings = pagedRows.map((row, idx) => mapSalonRowToBusinessListing(row, idx + offset));

  return {
    listings,
    hasMore: Boolean(limit && limit > 0 && offset + listings.length < rows.length),
    totalCount: rows.length,
  };
}

export async function countPublishedListingsByCategory(
  supabase: SupabaseClient,
  categories: Array<{ name: string; slug: string }>
): Promise<Record<string, number>> {
  const rpcRows = await loadPublishedMarketplaceListings(supabase);
  const data =
    rpcRows ??
    (await fetchAllByIdCursor(async (afterId, pageSize) => {
      let query = supabase
        .from("salons")
        .select("id, name, slug, category, status, public_visibility, is_verified, booking_enabled, source_type, onboarding_status, business_info_extended")
        .eq("onboarding_status", LISTING_ONBOARDING_STATUS.PUBLISHED)
        .in("source_type", ["GOOGLE_PLACES", "LISTING_GENERATION"]);
      if (afterId) query = query.gt("id", afterId);
      const { data: page, error } = await query.order("id", { ascending: true }).limit(pageSize);
      if (error) throw new Error(error.message);
      return (page ?? []) as Array<Record<string, unknown>>;
    }));

  const rows = filterBusinessListingRows(data, { publishedOnly: true });
  const counts: Record<string, number> = {};

  for (const category of categories) {
    counts[category.slug] = rows.filter((row) =>
      salonMatchesCategory(row, category.slug, category.name)
    ).length;
  }

  return counts;
}
