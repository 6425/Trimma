import { unstable_cache } from "next/cache";
import { createServerSupabaseClient } from "@/config/supabase-server";

export type PublicCategory = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
};

async function loadPublicCategories(): Promise<PublicCategory[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, icon")
    .order("name");

  if (error) {
    console.error("fetchPublicCategories:", error.message);
    return [];
  }

  return (data ?? []) as PublicCategory[];
}

/** Categories for marketplace nav and filters — always read from the DB, never hardcoded. */
export const fetchPublicCategories = unstable_cache(
  loadPublicCategories,
  ["public-categories"],
  { revalidate: 60 }
);
