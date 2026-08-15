import { createServerSupabaseClient } from "@/config/supabase-server";
import { fetchBusinessListingCards } from "@/lib/public-salon-search";
import { fetchPublicCategories, canonicalizeCategorySlug } from "@/lib/public-categories";
import CategoryClient from "./CategoryClient";
import { redirect } from "next/navigation";

export const revalidate = 60;

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const canonicalSlug = canonicalizeCategorySlug(slug);
  if (canonicalSlug !== slug) {
    redirect(`/category/${canonicalSlug}`);
  }

  const supabase = createServerSupabaseClient();
  const categories = await fetchPublicCategories();
  const category = categories.find((c) => c.slug === canonicalSlug);
  const categoryLabel =
    category?.name ||
    slug
      .replace(/-/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());

  let initialListings: Awaited<ReturnType<typeof fetchBusinessListingCards>>["listings"] = [];
  try {
    const result = await fetchBusinessListingCards(supabase, {
      category: canonicalSlug,
      categoryName: categoryLabel,
      publishedOnly: true,
      limit: 48,
      offset: 0,
    });
    initialListings = result.listings;
  } catch {
    initialListings = [];
  }

  return (
    <CategoryClient
      key={canonicalSlug}
      slug={canonicalSlug}
      categories={categories}
      initialListings={initialListings}
      categoryLabel={categoryLabel}
    />
  );
}
