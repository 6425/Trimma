import type { SupabaseClient } from "@supabase/supabase-js";
import { filterPublicSalons } from "@/lib/salon-list-filters";
import { isSalonPubliclyBookable } from "@/lib/salon-bookability";
import { isSalonPubliclyListable } from "@/lib/salon-public-listing";
import { mapSalonRowToUI } from "@/lib/salons-mapper";
import { mapSalonRowToBusinessListing, type BusinessListingCardData } from "@/lib/business-listing-mapper";
import { buildSalonLocationOrFilter } from "@/lib/sri-lanka-locations";

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

function salonMatchesCategory(
  row: Record<string, unknown>,
  category: string,
  categoryName?: string
): boolean {
  const needles = buildCategoryNeedles(category, categoryName);
  if (!needles.length) return true;

  const salonCategory = normalizeCategoryText(String(row.category || ""));
  if (needles.some((needle) => textMatchesCategoryNeedle(salonCategory, needle))) {
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
  /** When true, only browse/discovery listings (Lead Mgmt / unbookable public listings). */
  browseOnly?: boolean;
  /** When true, only admin Lead Management / listing-generation sources. */
  leadListingsOnly?: boolean;
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
    leadListingsOnly = false,
    limit = 12,
    offset = 0,
  }: PublicSalonSearchParams
) {
  let query = supabase
    .from("salons")
    .select(`
      id, name, slug, rating, review_count,
      city, district, province, category, logo_url, cover_url, hero_url, featured_images,
      is_featured, is_verified, working_hours, status, public_visibility,
      booking_enabled, source_type, onboarding_status,
      phone, owner_email, owner_gmail, website, map_url,
      services ( id, name, price, category )
    `);

  if (q) {
    query = query.or(
      `name.ilike.%${q}%,category.ilike.%${q}%,city.ilike.%${q}%,district.ilike.%${q}%,province.ilike.%${q}%`
    );
  }
  if (location) {
    const locationFilter = buildSalonLocationOrFilter(location);
    if (locationFilter) {
      query = query.or(locationFilter);
    }
  }
  if (minRating > 0) {
    query = query.gt("review_count", 0).gte("rating", minRating);
  }
  if (verifiedOnly) {
    query = query.eq("is_verified", true);
  }

  if (sort === "rating") {
    query = query.order("rating", { ascending: false });
  } else if (sort === "name") {
    query = query.order("name", { ascending: true });
  } else {
    query = query.order("is_featured", { ascending: false }).order("rating", { ascending: false });
  }

  const normalizedCategory = category.replace(/-/g, " ").trim().toLowerCase();
  const categoryFilterActive = normalizedCategory.length > 0;
  const postFilterActive = categoryFilterActive || bookableOnly || browseOnly || leadListingsOnly;
  const fetchLimit = postFilterActive ? Math.max(limit * 8, 100) : limit;
  const fetchOffset = postFilterActive ? 0 : offset;

  query = query.range(fetchOffset, fetchOffset + fetchLimit - 1);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  let rows = filterPublicSalons(data || []).filter(isSalonPubliclyListable);
  if (bookableOnly) {
    rows = rows.filter(isSalonPubliclyBookable);
  } else if (browseOnly) {
    rows = rows.filter((row) => !isSalonPubliclyBookable(row));
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

export async function fetchBusinessListingCards(
  supabase: SupabaseClient,
  params: Omit<PublicSalonSearchParams, "bookableOnly">
): Promise<{ listings: BusinessListingCardData[]; hasMore: boolean }> {
  let query = supabase
    .from("salons")
    .select(`
      id, name, slug, rating, review_count,
      city, district, province, category, logo_url, cover_url, hero_url, featured_images,
      is_featured, is_verified, working_hours, status, public_visibility,
      booking_enabled, source_type, onboarding_status,
      phone, owner_email, owner_gmail, website, map_url, business_info_extended,
      services ( id, name, price, category )
    `);

  const {
    q = "",
    location = "",
    category = "",
    categoryName = "",
    sort = "recommended",
    minRating = 0,
    verifiedOnly = false,
    limit = 24,
    offset = 0,
  } = params;

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

  if (sort === "rating") query = query.order("rating", { ascending: false });
  else if (sort === "name") query = query.order("name", { ascending: true });
  else query = query.order("is_featured", { ascending: false }).order("rating", { ascending: false });

  const normalizedCategory = category.replace(/-/g, " ").trim().toLowerCase();
  const categoryFilterActive = normalizedCategory.length > 0;
  const fetchLimit = Math.max(limit * 8, 100);
  query = query.range(0, fetchLimit - 1);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  let rows = filterPublicSalons(data || [])
    .filter(isSalonPubliclyListable)
    .filter((row) => !isSalonPubliclyBookable(row))
    .filter((row) => {
      const source = String(row.source_type || "");
      return source === "GOOGLE_PLACES" || source === "LISTING_GENERATION";
    });

  if (categoryFilterActive) {
    rows = rows.filter((row) => salonMatchesCategory(row, category, categoryName));
  }

  const pagedRows = rows.slice(offset, offset + limit);
  const listings = pagedRows.map((row, idx) => mapSalonRowToBusinessListing(row, idx + offset));

  return {
    listings,
    hasMore: rows.length > offset + limit,
  };
}
