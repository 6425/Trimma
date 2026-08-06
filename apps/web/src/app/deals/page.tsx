import DealsClient from "./DealsClient";
import {
  fetchCachedPublicDeals,
  getDealLocationKey,
  type CategoryOption,
} from "@/lib/deals";
import { fetchPublicCategories } from "@/lib/public-categories";

export const revalidate = 60;

async function loadDealsPageData() {
  try {
    const [deals, categories] = await Promise.all([
      fetchCachedPublicDeals(),
      fetchPublicCategories(),
    ]);

    const categoryOptions: CategoryOption[] = categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
    }));

    const locationSet = new Set<string>();
    for (const deal of deals) {
      const key = getDealLocationKey(deal.salon);
      if (key && key !== "Other") locationSet.add(key);
    }
    const locations = [...locationSet].sort((a, b) => a.localeCompare(b));

    return { deals, categories: categoryOptions, locations };
  } catch (error) {
    console.error("Deals page failed:", error);
    return { deals: [], categories: [], locations: [] };
  }
}

export default async function DealsPage() {
  const { deals, categories, locations } = await loadDealsPageData();
  return <DealsClient deals={deals} categories={categories} locations={locations} />;
}
