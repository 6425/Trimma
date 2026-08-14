import { createServerSupabaseClient } from "@/config/supabase-server";
import { buildPublicPageMetadata } from "@/lib/public-page-metadata";
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
  const supabase = createServerSupabaseClient();

  let initialListings: Awaited<ReturnType<typeof fetchBusinessListingCards>>["listings"] = [];
  let initialHasMore = false;

  try {
    const result = await fetchBusinessListingCards(supabase, {
      q: sp.q ?? "",
      location: sp.l ?? "",
      category: sp.category ?? "",
      limit: 24,
      offset: 0,
    });
    initialListings = result.listings;
    initialHasMore = result.hasMore;
  } catch {
    initialListings = [];
    initialHasMore = false;
  }

  const searchKey = `${sp.q ?? ""}|${sp.l ?? ""}|${sp.category ?? ""}`;

  return (
    <ListingsClient
      key={searchKey}
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
