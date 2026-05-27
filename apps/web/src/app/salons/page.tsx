// Server Component — no "use client" directive
// Data is fetched on the server and HTML is sent to the browser pre-populated.
// This eliminates the client-side loading spinner entirely.

import { Suspense } from "react";
import { createServerSupabaseClient } from "@/config/supabase-server";
import SalonsClient from "./SalonsClient";

export const revalidate = 60; // Re-fetch from Supabase at most once every 60 seconds (ISR)

export default async function SalonsDirectoryPage() {
  const supabase = createServerSupabaseClient();

  // Fetch categories on the server; salon list loads via /api/salons/search on the client
  const categoriesResult = await supabase
    .from("categories")
    .select("slug, name, icon")
    .order("name");

  const categories = categoriesResult.data || [];

  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-pink"></div>
        <p className="text-zinc-500 font-bold text-sm">Loading Salons...</p>
      </div>
    }>
      <SalonsClient salons={[]} categories={categories} />
    </Suspense>
  );
}
