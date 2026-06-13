// Server Component — no "use client" directive
// Data is fetched on the server and HTML is sent to the browser pre-populated.

import { createServerSupabaseClient } from "@/config/supabase-server";
import SalonsClient from "./SalonsClient";

export const revalidate = 60; // Re-fetch from Supabase at most once every 60 seconds (ISR)

type PageProps = {
  searchParams: Promise<{
    q?: string;
    l?: string;
    category?: string;
  }>;
};

export default async function SalonsDirectoryPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const supabase = createServerSupabaseClient();

  // Fetch categories on the server; salon list loads via /api/salons/search on the client
  const categoriesResult = await supabase
    .from("categories")
    .select("slug, name, icon")
    .order("name");

  const categories = categoriesResult.data || [];

  return (
    <SalonsClient
      categories={categories}
      initialSearch={{
        q: sp.q ?? "",
        l: sp.l ?? "",
        category: sp.category ?? "",
      }}
    />
  );
}
