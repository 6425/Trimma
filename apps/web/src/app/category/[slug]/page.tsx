import { createServerSupabaseClient } from "@/config/supabase-server";
import { fetchPublicSalons } from "@/lib/public-salon-search";
import { fetchPublicCategories } from "@/lib/public-categories";
import CategoryClient from "./CategoryClient";

export const revalidate = 60;

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = createServerSupabaseClient();
  const categories = await fetchPublicCategories();
  const category = categories.find((c) => c.slug === slug);
  const categoryLabel =
    category?.name ||
    slug
      .replace(/-/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());

  let initialSalons: Awaited<ReturnType<typeof fetchPublicSalons>>["salons"] = [];
  try {
    const listing = await fetchPublicSalons(supabase, {
      category: categoryLabel,
      limit: 48,
      offset: 0,
    });
    initialSalons = listing.salons;
  } catch {
    initialSalons = [];
  }

  return (
    <CategoryClient
      key={slug}
      slug={slug}
      categories={categories}
      initialSalons={initialSalons}
      categoryLabel={categoryLabel}
    />
  );
}
