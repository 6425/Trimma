import { createServerSupabaseClient } from "@/config/supabase-server";
import { buildPublicPageMetadata } from "@/lib/public-page-metadata";
import { fetchPublicSalons } from "@/lib/public-salon-search";
import { fetchPublicCategories } from "@/lib/public-categories";
import { fetchCachedPublicDeals } from "@/lib/deals";
import SalonsClient from "../SalonsClient";

export const metadata = buildPublicPageMetadata({
  title: "Book Salons — Trimma OS",
  description:
    "Book verified salons across Sri Lanka — compare ratings, prices, services, and live availability.",
  path: "/booking",
});

export const revalidate = 60;

type PageProps = {
  searchParams: Promise<{
    q?: string;
    l?: string;
    category?: string;
  }>;
};

export default async function BookingDirectoryPage({ searchParams }: PageProps) {
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
          bookableOnly: true,
          limit: 12,
          offset: 0,
        });
      } catch {
        return { salons: [], hasMore: false };
      }
    })(),
    fetchCachedPublicDeals().catch(() => []),
  ]);

  const initialSalons = listingResult.salons;
  const initialHasMore = listingResult.hasMore;
  const searchKey = `booking|${sp.q ?? ""}|${sp.l ?? ""}|${sp.category ?? ""}`;

  return (
    <SalonsClient
      key={searchKey}
      variant="booking"
      categories={categories}
      initialSearch={{
        q: sp.q ?? "",
        l: sp.l ?? "",
        category: sp.category ?? "",
      }}
      initialSalons={initialSalons}
      initialHasMore={initialHasMore}
      initialDeals={deals}
      ssrSeeded
    />
  );
}
