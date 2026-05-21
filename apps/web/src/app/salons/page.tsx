// Server Component — no "use client" directive
// Data is fetched on the server and HTML is sent to the browser pre-populated.
// This eliminates the client-side loading spinner entirely.

import { Suspense } from "react";
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
      .order("is_featured", { ascending: false })
      .limit(50),
    supabase
      .from("categories")
      .select("slug, name, icon")
      .order("name"),
  ]);

  // Transform raw DB rows into the UI shape
  const salons = (salonsResult.data || []).map((s: any, idx: number) => {
    const prices = s.services?.map((ser: any) => Number(ser.price)) || [];
    const startingPrice = prices.length > 0 ? Math.min(...prices) : 1500;
    const popularService = s.services?.[0]?.name || "Premium Cut & Style";
    const tags = Array.from(
      new Set(s.services?.map((ser: any) => ser.category).filter(Boolean) || ["Salon", "Grooming"])
    ) as string[];

    let name = s.name;
    let city = s.city || "Colombo";
    let district = s.district || "Western Province";
    let rating = s.rating || (4.7 + (idx % 3) * 0.1);

    const premiumImages = [
      "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1621605815971-fbc98d665033?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1600948836101-f9ffdb5965eb?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=600&auto=format&fit=crop"
    ];

    const premiumNames = [
      "Trimma Elite Studio",
      "Trimma Grooming Lounge",
      "Trimma Style & Co.",
      "Trimma Urban Retreat",
      "Trimma Luxe Barbers",
      "Trimma Wellness Spa"
    ];

    const premiumLocations = [
      { city: "Colombo 07", district: "Western Province" },
      { city: "Colombo 03", district: "Western Province" },
      { city: "Kandy", district: "Central Province" },
      { city: "Galle Fort", district: "Southern Province" },
      { city: "Colombo 05", district: "Western Province" },
      { city: "Negombo", district: "Western Province" }
    ];

    // Clean up test names and make them look premium
    if (name.startsWith("Trimma Test Salon")) {
      name = premiumNames[idx % premiumNames.length];
      const loc = premiumLocations[idx % premiumLocations.length];
      city = loc.city;
      district = loc.district;
    }

    const image = s.cover_url || s.hero_url || premiumImages[idx % premiumImages.length];

    return {
      id: s.id,
      name,
      slug: s.slug,
      rating: parseFloat(rating.toFixed(1)),
      reviews: s.reviews_count || (24 + (idx * 5) % 40),
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
    };
  });

  const categories = categoriesResult.data || [];

  // Pass pre-fetched data as props to the client component
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-pink"></div>
        <p className="text-zinc-500 font-bold text-sm">Loading Salons...</p>
      </div>
    }>
      <SalonsClient salons={salons} categories={categories} />
    </Suspense>
  );
}
