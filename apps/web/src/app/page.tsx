import { createServerSupabaseClient } from "@/config/supabase-server";
import { buildPublicPageMetadata } from "@/lib/public-page-metadata";
import { canonicalizeCategorySlug, fetchPublicCategories } from "@/lib/public-categories";
import { fetchBusinessListingCards } from "@/lib/public-salon-search";
import { YOU_MAY_ALSO_LIKE_COUNT } from "@/lib/listing-marketplace-rank";
import { withTimeout } from "@/lib/promise-timeout";
import ListingsClient from "./ListingsClient";
import { redirect } from "next/navigation";

export const metadata = buildPublicPageMetadata({
  title: "Your Business. Your Customers. Your Growth. — Trimma",
  description:
    "Salons, spas, and wellness businesses discovered by Trimma are brought to customers looking for their next appointment. Claim your business with Google Sign-In.",
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

  if (sp.category?.trim()) {
    const slug = canonicalizeCategorySlug(sp.category);
    const params = new URLSearchParams();
    if (sp.q?.trim()) params.set("q", sp.q.trim());
    if (sp.l?.trim()) params.set("l", sp.l.trim());
    const qs = params.toString();
    redirect(qs ? `/category/${slug}?${qs}` : `/category/${slug}`);
  }

  let initialListings: Awaited<ReturnType<typeof fetchBusinessListingCards>>["listings"] = [];
  let initialTopRated: Awaited<ReturnType<typeof fetchBusinessListingCards>>["topRated"] = [];
  let initialFeatured: Awaited<ReturnType<typeof fetchBusinessListingCards>>["featured"] = [];
  let initialHasMore = false;
  let initialTotalCount = 0;
  let categories: Awaited<ReturnType<typeof fetchPublicCategories>> = [];

  try {
    const supabase = createServerSupabaseClient();
    const emptyListings = {
      listings: [] as typeof initialListings,
      topRated: [] as typeof initialTopRated,
      featured: [] as typeof initialFeatured,
      hasMore: false,
      totalCount: 0,
    };

    const [nextCategories, result] = await Promise.all([
      fetchPublicCategories().catch(() => []),
      withTimeout(
        fetchBusinessListingCards(supabase, {
          q: sp.q ?? "",
          location: sp.l ?? "",
          publishedOnly: true,
          limit: YOU_MAY_ALSO_LIKE_COUNT,
          offset: 0,
        }),
        8_000,
        "Listing search timed out"
      ).catch(() => emptyListings),
    ]);

    categories = nextCategories;
    initialListings = result.listings;
    initialTopRated = result.topRated;
    initialFeatured = result.featured;
    initialHasMore = result.hasMore;
    initialTotalCount = result.totalCount;
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
      initialTopRated={initialTopRated}
      initialFeatured={initialFeatured}
      initialHasMore={initialHasMore}
      initialTotalCount={initialTotalCount}
      ssrSeeded={
        initialListings.length + initialTopRated.length + initialFeatured.length > 0
      }
    />
  );
}
