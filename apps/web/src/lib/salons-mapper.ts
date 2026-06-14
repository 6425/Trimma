import { optimizeListingImageUrl } from "@/lib/optimize-image-url";

export function mapVerifiedSalonListingStats(salon: {
  rating?: number | string | null;
  review_count?: number | string | null;
  reviews_count?: number | string | null;
}) {
  const reviews = Math.max(0, Number(salon.review_count ?? salon.reviews_count ?? 0) || 0);
  const rawRating = Number(salon.rating) || 0;
  const rating = reviews > 0 && rawRating > 0 ? parseFloat(rawRating.toFixed(1)) : 0;
  return { rating, reviews };
}

export function getSalonListingImage(
  salon: { cover_url?: string | null; hero_url?: string | null },
  fallback: string
): string {
  const image = (salon.cover_url || salon.hero_url || "").trim();
  return image || fallback;
}

export function mapSalonRowToUI(s: any, idx: number) {
  const prices = s.services?.map((ser: any) => Number(ser.price)) || [];
  const startingPrice = prices.length > 0 ? Math.min(...prices) : 1500;
  const popularService = s.services?.[0]?.name || "Premium Cut & Style";
  const tags = Array.from(
    new Set(s.services?.map((ser: any) => ser.category).filter(Boolean) || ["Salon", "Grooming"])
  ) as string[];

  const name = s.name;
  const city = s.city;
  const district = s.district;
  const locationString = city && district ? `${city}, ${district}` : city ? city : district ? district : "Location pending";
  const { rating, reviews } = mapVerifiedSalonListingStats(s);
  const fallbackImages = [
    "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1621605815971-fbc98d665033?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1600948836101-f9ffdb5965eb?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=600&auto=format&fit=crop",
  ];

  const image = optimizeListingImageUrl(
    getSalonListingImage(s, fallbackImages[idx % fallbackImages.length]),
    600
  );

  return {
    id: s.id,
    name,
    slug: s.slug,
    rating,
    reviews,
    location: locationString,
    category: s.category || tags[0] || "Beauty Lounge",
    logo: s.logo_url || `https://api.dicebear.com/7.x/initials/svg?seed=${s.slug}&backgroundColor=18181b`,
    image,
    featured: s.is_featured === true,
    openNow: true,
    startingPrice,
    tags: tags.slice(0, 3),
    nextSlot: "Today 4:00 PM",
    popularService,
    isVerified: s.is_verified,
  };
}
