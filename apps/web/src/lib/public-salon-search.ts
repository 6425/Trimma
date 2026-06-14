import type { SupabaseClient } from "@supabase/supabase-js";
import { mapSalonRowToUI } from "@/lib/salons-mapper";

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
      city, district, category, logo_url, cover_url, hero_url,
      is_featured, is_verified,
      services ( id, name, price, category )
    `);

  if (q) {
    query = query.or(
      `name.ilike.%${q}%,category.ilike.%${q}%,city.ilike.%${q}%,district.ilike.%${q}%`
    );
  }
  if (location) {
    query = query.or(`city.ilike.%${location}%,district.ilike.%${location}%`);
  }
  if (category) {
    query = query.ilike("category", `%${category}%`);
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

  query = query.range(offset, offset + limit - 1);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const salons = (data || []).map((row, idx) => mapSalonRowToUI(row, idx + offset));

  return {
    salons,
    hasMore: salons.length === limit,
  };
}
