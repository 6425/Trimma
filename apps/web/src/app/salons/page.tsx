// Server Component — no "use client" directive
// Data is fetched on the server and HTML is sent to the browser pre-populated.
// This eliminates the client-side loading spinner entirely.

import { Suspense } from "react";
import { createServerSupabaseClient } from "@/config/supabase-server";
import SalonsClient from "./SalonsClient";
import { mapSalonRowToUI } from "@/lib/salons-mapper";

export const revalidate = 60; // Re-fetch from Supabase at most once every 60 seconds (ISR)

export default async function SalonsDirectoryPage() {
  const supabase = createServerSupabaseClient();

  // Fetch only 4 featured salons and categories in parallel on the server
  const [salonsResult, categoriesResult] = await Promise.all([
    supabase
      .from("salons")
      .select(`
        id, name, slug, rating,
        city, district, category, logo_url, cover_url,
        is_featured, is_verified,
        services ( id, name, price, category )
      `)
      .eq("is_featured", true)
      .limit(4),
    supabase
      .from("categories")
      .select("slug, name, icon")
      .order("name"),
  ]);

  // Transform raw DB rows into the UI shape using shared mapper
  const salons = (salonsResult.data || []).map((s: any, idx: number) => mapSalonRowToUI(s, idx));
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
