export function mapSalonRowToUI(s: any, idx: number) {
  const prices = s.services?.map((ser: any) => Number(ser.price)) || [];
  const startingPrice = prices.length > 0 ? Math.min(...prices) : 1500;
  const popularService = s.services?.[0]?.name || "Premium Cut & Style";
  const tags = Array.from(
    new Set(s.services?.map((ser: any) => ser.category).filter(Boolean) || ["Salon", "Grooming"])
  ) as string[];

  const name = s.name;
  const city = s.city || "Colombo";
  const district = s.district || "Western Province";
  const rating = s.rating || (4.7 + (idx % 3) * 0.1);

  const fallbackImages = [
    "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1621605815971-fbc98d665033?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1600948836101-f9ffdb5965eb?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=600&auto=format&fit=crop",
  ];

  const image = s.cover_url || s.hero_url || fallbackImages[idx % fallbackImages.length];

  return {
    id: s.id,
    name,
    slug: s.slug,
    rating: parseFloat(Number(rating).toFixed(1)),
    reviews: s.reviews_count || s.review_count || (24 + (idx * 5) % 40),
    location: `${city}, ${district}`,
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
