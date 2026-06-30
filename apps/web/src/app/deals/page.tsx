import { createServerSupabaseClient } from "@/config/supabase-server";
import DealsClient from "./DealsClient";
import {
  fetchPublicDeals,
  getDealLocationKey,
  type CategoryOption,
} from "@/lib/deals";

export const revalidate = 60;

async function loadDealsPageData() {
  try {
    const supabase = createServerSupabaseClient();

    const [deals, categoriesRes] = await Promise.all([
      fetchPublicDeals(supabase),
      supabase.from("categories").select("id, name, slug").order("name"),
    ]);

    if (categoriesRes.error) {
      console.error("Failed to load deal categories:", categoriesRes.error.message);
    }

    const categories: CategoryOption[] = categoriesRes.error ? [] : categoriesRes.data || [];

    const locationSet = new Set<string>();
    for (const deal of deals) {
      const key = getDealLocationKey(deal.salon);
      if (key && key !== "Other") locationSet.add(key);
    }
    const locations = [...locationSet].sort((a, b) => a.localeCompare(b));

    return { deals, categories, locations };
  } catch (error) {
    console.error("Deals page failed:", error);
    return { deals: [], categories: [], locations: [] };
  }
}

export default async function DealsPage() {
  const { deals, categories, locations } = await loadDealsPageData();
  return <DealsClient deals={deals} categories={categories} locations={locations} />;
}
