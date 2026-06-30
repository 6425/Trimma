// Server Component — no "use client" directive
// Data is fetched on the server and HTML is sent to the browser pre-populated.

import { createServerSupabaseClient } from "@/config/supabase-server";
import { fetchPublicSalons } from "@/lib/public-salon-search";
import { fetchPublicCategories } from "@/lib/public-categories";
import { fetchPublicDeals } from "@/lib/deals";
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

  const [categories, listingResult, deals] = await Promise.all([
    fetchPublicCategories(),
    (async () => {
      try {
        return await fetchPublicSalons(supabase, {
          q: sp.q ?? "",
          location: sp.l ?? "",
          category: sp.category ?? "",
          limit: 12,
          offset: 0,
        });
      } catch {
        return { salons: [], hasMore: false };
      }
    })(),
    fetchPublicDeals(supabase).catch(() => []),
  ]);

  const initialSalons = listingResult.salons;
  const initialHasMore = listingResult.hasMore;

  return (
    <SalonsClient
      categories={categories}
      initialSearch={{
        q: sp.q ?? "",
        l: sp.l ?? "",
        category: sp.category ?? "",
      }}
      initialSalons={initialSalons}
      initialHasMore={initialHasMore}
      initialDeals={deals}
    />
  );
}
