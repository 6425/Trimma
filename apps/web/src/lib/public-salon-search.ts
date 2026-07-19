import type { SupabaseClient } from "@supabase/supabase-js";
import { filterPublicSalons } from "@/lib/salon-list-filters";
import { mapSalonRowToUI } from "@/lib/salons-mapper";
import { buildSalonLocationOrFilter } from "@/lib/sri-lanka-locations";

export type PublicSalonSearchParams = {
  q?: string;
  location?: string;
  category?: string;
  sort?: string;
  minRating?: number;
  verifiedOnly?: boolean;
  limit?: number;
  offset?: number;
};

export async function fetchPublicSalons(
  supabase: SupabaseClient,
  {
    q = "",
    location = "",
    category = "",
    sort = "recommended",
    minRating = 0,
    verifiedOnly = false,
    limit = 12,
    offset = 0,
  }: PublicSalonSearchParams
) {
  let query = supabase
    .from("salons")
    .select(`
      id, name, slug, rating, review_count,
      city, district, province, category, logo_url, cover_url, hero_url,
      is_featured, is_verified, working_hours,
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
  const fetchLimit = categoryFilterActive ? Math.max(limit * 8, 100) : limit;
  const fetchOffset = categoryFilterActive ? 0 : offset;

  query = query.range(fetchOffset, fetchOffset + fetchLimit - 1);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  let rows = filterPublicSalons(data || []);
  if (categoryFilterActive) {
    rows = rows.filter((row) => {
      const salonCategory = String(row.category || "").toLowerCase();
      if (salonCategory.includes(normalizedCategory)) return true;

      const services = Array.isArray(row.services) ? row.services : [];
      return services.some((service) =>
        String(service?.category || "").toLowerCase().includes(normalizedCategory)
      );
    });
  }

  const pagedRows = categoryFilterActive ? rows.slice(offset, offset + limit) : rows;
  const salons = pagedRows.map((row, idx) => mapSalonRowToUI(row, idx + offset));

  return {
    salons,
    hasMore: categoryFilterActive
      ? rows.length > offset + limit
      : salons.length === limit,
  };
}
