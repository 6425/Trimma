import type { SupabaseClient } from "@supabase/supabase-js";
import { isRetiredPublicCategory, isSpaWellnessCategory } from "@/lib/public-categories";

const BEAUTY_PARLOUR_SALON_NAMES = ["Beauty Parlours", "Beauty Parlors"];
const KIDS_FAMILY_SALON_NAMES = ["Kids & Family", "Kids and Family"];

const SPA_WELLNESS_SLUG = "spa-wellness";
const SPA_WELLNESS_NAME = "Spa & Wellness";
const SPA_WELLNESS_IMAGE = "/assets/category-spa-wellness-hero.webp";

type CategoryRow = {
  id: string;
  name?: string | null;
  slug?: string | null;
  image_url?: string | null;
};

/**
 * Live Spa & Wellness was stored as `spa-and-wellness`. Keep that row (and its image),
 * rename it to `spa-wellness` when possible, and recreate the category if it is missing.
 */
export async function ensureCanonicalSpaWellnessCategory(supabase: SupabaseClient): Promise<void> {
  const { data: rows, error } = await supabase
    .from("categories")
    .select("id, name, slug, image_url");
  if (error) throw new Error(error.message);

  const spaRows = ((rows || []) as CategoryRow[]).filter((row) => isSpaWellnessCategory(row));

  if (!spaRows.length) {
    const { error: insertError } = await supabase.from("categories").insert([
      {
        name: SPA_WELLNESS_NAME,
        slug: SPA_WELLNESS_SLUG,
        icon: "Flower2",
        image_url: SPA_WELLNESS_IMAGE,
        description: "Relaxation and holistic body care.",
      },
    ]);
    if (insertError) throw new Error(insertError.message);
    return;
  }

  const withImage = spaRows.filter((row) => String(row.image_url || "").trim());
  const keep =
    withImage.find((row) => String(row.slug || "").toLowerCase() === SPA_WELLNESS_SLUG) ||
    withImage[0] ||
    spaRows.find((row) => String(row.slug || "").toLowerCase() === SPA_WELLNESS_SLUG) ||
    spaRows[0];

  const extras = spaRows.filter((row) => row.id !== keep.id);
  for (const extra of extras) {
    await supabase.from("global_services").update({ category_id: keep.id }).eq("category_id", extra.id);
    await supabase.from("services").update({ category_id: keep.id }).eq("category_id", extra.id);
    const { error: deleteExtraError } = await supabase.from("categories").delete().eq("id", extra.id);
    if (deleteExtraError) {
      console.warn("ensureCanonicalSpaWellnessCategory extra delete:", deleteExtraError.message);
    }
  }

  const patch: { slug?: string; name?: string; image_url?: string; icon?: string } = {};
  if (String(keep.slug || "").toLowerCase() !== SPA_WELLNESS_SLUG) {
    patch.slug = SPA_WELLNESS_SLUG;
  }
  if (String(keep.name || "").trim() !== SPA_WELLNESS_NAME) {
    patch.name = SPA_WELLNESS_NAME;
  }
  if (!String(keep.image_url || "").trim()) {
    patch.image_url = SPA_WELLNESS_IMAGE;
    patch.icon = "Flower2";
  }
  if (!Object.keys(patch).length) return;

  const { error: updateError } = await supabase.from("categories").update(patch).eq("id", keep.id);
  if (updateError) {
    console.warn("ensureCanonicalSpaWellnessCategory update:", updateError.message);
  }
}

export async function syncMarketplaceCategories(supabase: SupabaseClient): Promise<void> {
  await purgeRetiredMarketplaceCategories(supabase);
  await ensureCanonicalSpaWellnessCategory(supabase);
}

/**
 * Permanently remove retired marketplace categories from the DB.
 * Seed used to upsert them back; this deletes instead.
 */
export async function purgeRetiredMarketplaceCategories(supabase: SupabaseClient): Promise<number> {
  const { data: rows, error } = await supabase.from("categories").select("id, name, slug");
  if (error) throw new Error(error.message);

  const retired = (rows || []).filter(
    (row) => isRetiredPublicCategory(row) && !isSpaWellnessCategory(row)
  );
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
    .update({ category: "Barber Salon" })
    .in("category", BEAUTY_PARLOUR_SALON_NAMES);
  if (beautyRemapError) {
    console.warn("purgeRetiredMarketplaceCategories salon remap beauty:", beautyRemapError.message);
  }

  const { error: kidsRemapError } = await supabase
    .from("salons")
    .update({ category: "Barber Salon" })
    .in("category", KIDS_FAMILY_SALON_NAMES);
  if (kidsRemapError) {
    console.warn("purgeRetiredMarketplaceCategories salon remap kids:", kidsRemapError.message);
  }

  return ids.length;
}
