import type { SupabaseClient } from "@supabase/supabase-js";
import { isRetiredPublicCategory } from "@/lib/public-categories";

const BEAUTY_PARLOUR_SALON_NAMES = ["Beauty Parlours", "Beauty Parlors", "Beauty Salon"];
const KIDS_FAMILY_SALON_NAMES = ["Kids & Family", "Kids and Family"];

/**
 * Permanently remove retired marketplace categories from the DB.
 * Seed used to upsert them back; this deletes instead.
 */
export async function purgeRetiredMarketplaceCategories(supabase: SupabaseClient): Promise<number> {
  const { data: rows, error } = await supabase.from("categories").select("id, name, slug");
  if (error) throw new Error(error.message);

  const retired = (rows || []).filter((row) => isRetiredPublicCategory(row));
  if (!retired.length) return 0;

  const ids = retired.map((row) => String(row.id));

  const { error: globalServicesError } = await supabase
    .from("global_services")
    .delete()
    .in("category_id", ids);
  if (globalServicesError) throw new Error(globalServicesError.message);

  const { error: servicesUpdateError } = await supabase
    .from("services")
    .update({ category_id: null })
    .in("category_id", ids);
  if (servicesUpdateError) {
    console.warn("purgeRetiredMarketplaceCategories services:", servicesUpdateError.message);
  }

  const { error: deleteError } = await supabase.from("categories").delete().in("id", ids);
  if (deleteError) throw new Error(deleteError.message);

  const { error: beautyRemapError } = await supabase
    .from("salons")
    .update({ category: "Bridal & Beauty" })
    .in("category", BEAUTY_PARLOUR_SALON_NAMES);
  if (beautyRemapError) {
    console.warn("purgeRetiredMarketplaceCategories salon remap beauty:", beautyRemapError.message);
  }

  const { error: kidsRemapError } = await supabase
    .from("salons")
    .update({ category: null })
    .in("category", KIDS_FAMILY_SALON_NAMES);
  if (kidsRemapError) {
    console.warn("purgeRetiredMarketplaceCategories salon remap kids:", kidsRemapError.message);
  }

  return ids.length;
}
