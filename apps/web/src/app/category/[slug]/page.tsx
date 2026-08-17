import { createServerSupabaseClient } from "@/config/supabase-server";
import { fetchBusinessListingCards } from "@/lib/public-salon-search";
import { YOU_MAY_ALSO_LIKE_COUNT } from "@/lib/listing-marketplace-rank";
import { fetchPublicCategories, canonicalizeCategorySlug, findPublicCategory, retiredCategoryRedirectPath } from "@/lib/public-categories";
import CategoryClient from "./CategoryClient";
import { redirect } from "next/navigation";

export const revalidate = 60;

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ q?: string; l?: string }>;
};

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const retiredRedirect = retiredCategoryRedirectPath(slug);
  if (retiredRedirect) {
    redirect(retiredRedirect);
  }
  const canonicalSlug = canonicalizeCategorySlug(slug);
  if (canonicalSlug !== slug) {
    const paramsOut = new URLSearchParams();
    if (sp.q?.trim()) paramsOut.set("q", sp.q.trim());
    if (sp.l?.trim()) paramsOut.set("l", sp.l.trim());
    const qs = paramsOut.toString();
    redirect(qs ? `/category/${canonicalSlug}?${qs}` : `/category/${canonicalSlug}`);
  }

  const supabase = createServerSupabaseClient();
  const categories = await fetchPublicCategories();
  const category = findPublicCategory(categories, canonicalSlug);
  const categoryLabel =
    category?.name ||
    slug
      .replace(/-/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());

  const initialQuery = sp.q?.trim() || "";
  const initialLocation = sp.l?.trim() || "";

  let initialListings: Awaited<ReturnType<typeof fetchBusinessListingCards>>["listings"] = [];
  let initialTopRated: Awaited<ReturnType<typeof fetchBusinessListingCards>>["topRated"] = [];
  let initialFeatured: Awaited<ReturnType<typeof fetchBusinessListingCards>>["featured"] = [];
  let initialHasMore = false;
  let initialTotalCount = 0;
  try {
    const result = await fetchBusinessListingCards(supabase, {
      q: initialQuery,
      location: initialLocation,
      category: canonicalSlug,
      categoryName: categoryLabel,
      publishedOnly: true,
      limit: YOU_MAY_ALSO_LIKE_COUNT,
      offset: 0,
    });
    initialListings = result.listings;
    initialTopRated = result.topRated;
    initialFeatured = result.featured;
    initialHasMore = result.hasMore;
    initialTotalCount = result.totalCount;
  } catch {
    initialListings = [];
  }

  return (
    <CategoryClient
      key={`${canonicalSlug}|${initialQuery}|${initialLocation}`}
      slug={canonicalSlug}
      categories={categories}
      initialListings={initialListings}
      initialTopRated={initialTopRated}
      initialFeatured={initialFeatured}
      initialHasMore={initialHasMore}
      initialTotalCount={initialTotalCount}
      categoryLabel={categoryLabel}
      initialQuery={initialQuery}
      initialLocation={initialLocation}
    />
  );
}
