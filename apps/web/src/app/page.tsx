import { createServerSupabaseClient } from "@/config/supabase-server";
import { buildPublicPageMetadata } from "@/lib/public-page-metadata";
import { fetchPublicCategories } from "@/lib/public-categories";
import { fetchBusinessListingCards } from "@/lib/public-salon-search";
import ListingsClient from "./ListingsClient";

export const metadata = buildPublicPageMetadata({
  title: "Business Listings — Trimma OS",
  description:
    "Browse salons and spas discovered across Sri Lanka. Claim your business with Google sign-in.",
  path: "/",
});

export const revalidate = 60;

type PageProps = {
  searchParams: Promise<{
    q?: string;
    l?: string;
    category?: string;
  }>;
};

export default async function BusinessListingsPage({ searchParams }: PageProps) {
  const sp = await searchParams;

  let initialListings: Awaited<ReturnType<typeof fetchBusinessListingCards>>["listings"] = [];
  let initialHasMore = false;
  let categories: Awaited<ReturnType<typeof fetchPublicCategories>> = [];

  try {
    const supabase = createServerSupabaseClient();
    const [result, fetchedCategories] = await Promise.all([
      fetchBusinessListingCards(supabase, {
        q: sp.q ?? "",
        location: sp.l ?? "",
        category: sp.category ?? "",
        limit: 24,
        offset: 0,
      }).catch(() => ({ listings: [], hasMore: false })),
      fetchPublicCategories().catch(() => []),
    ]);

    initialListings = result.listings;
    initialHasMore = result.hasMore;
    categories = fetchedCategories;
  } catch (error) {
    console.error("BusinessListingsPage:", error);
  }

  return (
    <ListingsClient
      categories={categories}
      initialSearch={{
        q: sp.q ?? "",
        l: sp.l ?? "",
        category: sp.category ?? "",
      }}
      initialListings={initialListings}
      initialHasMore={initialHasMore}
      ssrSeeded
    />
  );
}
