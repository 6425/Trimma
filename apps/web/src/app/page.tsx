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

export const revalidate = 0;
export const dynamic = "force-dynamic";

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
    categories = await fetchPublicCategories().catch(() => []);
    const activeCategory = categories.find((category) => category.slug === (sp.category ?? ""));

    const result = await fetchBusinessListingCards(supabase, {
      q: sp.q ?? "",
      location: sp.l ?? "",
      category: sp.category ?? "",
      categoryName: activeCategory?.name ?? "",
      limit: 24,
      offset: 0,
    }).catch(() => ({ listings: [], hasMore: false }));

    initialListings = result.listings;
    initialHasMore = result.hasMore;
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
