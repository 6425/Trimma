"use server";

import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { canonicalizeCategorySlug } from "@/lib/public-categories";
import { filterPublicSalons } from "@/lib/salon-list-filters";
import { isSalonApprovedForBookings } from "@/lib/salon-bookability";
import { getSalonListingImage, mapVerifiedSalonListingStats } from "@/lib/salons-mapper";
import { countPublishedListingsByCategory } from "@/lib/public-salon-search";

export type LandingCategory = {
  id: string;
  name: string;
  slug: string;
  img: string;
  count: number;
};

const CATEGORY_IMAGES: Record<string, string> = {
  "hair": "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=400&fm=webp&fit=crop",
  "barbers": "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?q=80&w=400&fm=webp&fit=crop",
  "barber-salon": "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?q=80&w=400&fm=webp&fit=crop",
  "nails": "https://images.unsplash.com/photo-1519014816548-bf5fe059e98b?q=80&w=400&fm=webp&fit=crop",
  "nail-studio": "https://images.unsplash.com/photo-1519014816548-bf5fe059e98b?q=80&w=400&fm=webp&fit=crop",
  "spa": "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=400&fm=webp&fit=crop",
  "spa-wellness": "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=400&fm=webp&fit=crop",
  "skin": "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=400&fm=webp&fit=crop",
  "skincare-clinics": "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=400&fm=webp&fit=crop",
  "tattoo": "https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?q=80&w=400&fm=webp&fit=crop",
  "tattoo-studio": "https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?q=80&w=400&fm=webp&fit=crop",
  "bridal-beauty": "https://images.unsplash.com/photo-1509631179647-0c739a4e6dd5?q=80&w=400&fm=webp&fit=crop",
  "beauty-parlours": "https://images.unsplash.com/photo-1522337660859-02fbefca4702?q=80&w=400&fm=webp&fit=crop",
  "yoga-studio": "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=400&fm=webp&fit=crop",
  "mens-grooming": "https://images.unsplash.com/photo-1621605815971-fbc98d665033?q=80&w=400&fm=webp&fit=crop",
  "kids-family": "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=400&fm=webp&fit=crop",
};

const DEFAULT_IMG = "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=400&fm=webp&fit=crop";

export async function getLandingCategories(): Promise<LandingCategory[]> {
  try {
    const supabase = createSupabaseAdminClient();

    // Run both queries in parallel on the server
    const catRes = await supabase.from("categories").select("id, name, slug, image_url");
    if (catRes.error) throw catRes.error;

    const categoryRows = (catRes.data || []).map((c: { id: string; name: string; slug: string; image_url?: string | null }) => ({
      id: c.id,
      name: c.name,
      slug: canonicalizeCategorySlug(String(c.slug || "")),
      img: c.image_url,
    }));

    const counts = await countPublishedListingsByCategory(
      supabase,
      categoryRows.map((c) => ({ name: c.name, slug: c.slug }))
    );

    const enriched: LandingCategory[] = categoryRows.map((c) => {
      const slug = c.slug;
      return {
        id: c.id,
        name: c.name,
        slug,
        img: c.img || CATEGORY_IMAGES[slug] || DEFAULT_IMG,
        count: counts[slug] || 0,
      };
    });

    // Sort by count descending
    enriched.sort((a, b) => b.count - a.count);

    return enriched;
  } catch (err) {
    console.error("Error fetching landing categories:", err);
    return [];
  }
}

export type LandingTopSalon = {
  name: string;
  slug: string;
  rating: number;
  reviews: number;
  badge: string;
  img: string;
};

function ratingBadge(rating: number): string {
  if (rating >= 4.8) return "Excellent";
  if (rating >= 4.5) return "Superb";
  if (rating >= 4.0) return "Great";
  return "Rated";
}

export async function getTopRatedSalons(limit = 4): Promise<LandingTopSalon[]> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("salons")
      .select(
        "id, name, slug, rating, review_count, cover_url, hero_url, is_verified, onboarding_status, status"
      )
      .order("is_featured", { ascending: false })
      .order("rating", { ascending: false })
      .order("review_count", { ascending: false })
      .limit(Math.max(limit * 4, 16));

    if (error) throw error;

    return filterPublicSalons(data || [])
      .filter((row) => isSalonApprovedForBookings(row))
      .filter((row) => row.slug?.trim())
      .slice(0, limit)
      .map((row) => {
        const { rating, reviews } = mapVerifiedSalonListingStats(row);
        return {
          name: row.name?.trim() || "Salon",
          slug: row.slug!.trim(),
          rating,
          reviews,
          badge: ratingBadge(rating),
          img: getSalonListingImage(row, DEFAULT_IMG),
        };
      });
  } catch (err) {
    console.error("Error fetching top rated salons:", err);
    return [];
  }
}
