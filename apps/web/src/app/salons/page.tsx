// Server Component — no "use client" directive
// Data is fetched on the server and HTML is sent to the browser pre-populated.
// This eliminates the client-side loading spinner entirely.

import { createServerSupabaseClient } from "@/config/supabase-server";
import SalonsClient from "./SalonsClient";

export const revalidate = 60; // Re-fetch from Supabase at most once every 60 seconds (ISR)

export default async function SalonsDirectoryPage() {
  const supabase = createServerSupabaseClient();

  // Fetch salons and categories in parallel on the server
  const [salonsResult, categoriesResult] = await Promise.all([
    supabase
      .from("salons")
      .select(`
        id, name, slug, rating, reviews_count,
        city, district, category, logo_url, cover_url,
        is_featured, is_verified, status,
        services ( id, name, price, category )
      `)
      .or("status.eq.verified,status.eq.active,status.eq.pending,is_verified.eq.true")
      .order("is_featured", { ascending: false })
      .limit(10),
    supabase
      .from("categories")
      .select("slug, name, icon")
      .order("name"),
  ]);

  // Transform raw DB rows into the UI shape
  const salons = (salonsResult.data || []).map((s: any) => {
    const prices = s.services?.map((ser: any) => Number(ser.price)) || [];
    const startingPrice = prices.length > 0 ? Math.min(...prices) : 1500;
    const popularService = s.services?.[0]?.name || "Premium Cut & Style";
    const tags = Array.from(
      new Set(s.services?.map((ser: any) => ser.category).filter(Boolean) || ["Salon", "Grooming"])
    ) as string[];

    return {
      id: s.id,
      name: s.name,
      slug: s.slug,
      rating: s.rating || 4.9,
      reviews: s.reviews_count || 142,
      location: `${s.city || "Colombo"}, ${s.district || "Western Province"}`,
      category: s.category || tags[0] || "Beauty Lounge",
      logo: s.logo_url || `https://api.dicebear.com/7.x/initials/svg?seed=${s.slug}&backgroundColor=18181b`,
      image: s.cover_url || "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=800&q=80",
      featured: s.is_featured === true,
      openNow: true,
      startingPrice,
      tags: tags.slice(0, 3),
      nextSlot: "Today 4:00 PM",
      popularService,
    };
  });

  const categories = categoriesResult.data || [];

  // Pass pre-fetched data as props to the client component
  return <SalonsClient salons={salons} categories={categories} />;
}
