import type { SupabaseClient } from "@supabase/supabase-js";
import type { PublicCategory } from "@/lib/public-categories";

function normalizeCategoryKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const GOOGLE_TYPE_CATEGORY_HINTS: Record<string, string[]> = {
  hair_care: ["barber", "grooming", "mens"],
  barber_shop: ["barber", "grooming", "mens"],
  beauty_salon: ["beauty", "parlour", "parlor", "salon"],
  spa: ["spa", "wellness"],
  nail_salon: ["nail"],
  skin_care_clinic: ["skincare", "skin", "clinic"],
  gym: ["yoga", "wellness"],
  yoga_studio: ["yoga"],
  tattoo_shop: ["tattoo"],
  physiotherapist: ["wellness", "spa"],
};

function readGoogleTypesFromExtended(businessInfoExtended: unknown): string[] {
  if (!businessInfoExtended || typeof businessInfoExtended !== "object" || Array.isArray(businessInfoExtended)) {
    return [];
  }
  const types = (businessInfoExtended as Record<string, unknown>).google_types;
  if (!Array.isArray(types)) return [];
  return types.filter((type): type is string => typeof type === "string" && type.trim().length > 0);
}

/** Map Google Places types + admin search category to a Trimma marketplace category name. */
export function mapGoogleTypesToTrimmaCategoryName(
  googleTypes: string[] | undefined,
  searchCategoryName: string | null | undefined,
  publicCategories: PublicCategory[]
): string | null {
  const categoryNames = publicCategories.map((category) => category.name).filter(Boolean);
  if (!categoryNames.length) {
    return searchCategoryName?.trim() || null;
  }

  const indexed = categoryNames.map((name) => ({
    name,
    key: normalizeCategoryKey(name),
  }));

  for (const type of googleTypes || []) {
    const hints = GOOGLE_TYPE_CATEGORY_HINTS[type];
    if (!hints?.length) continue;
    for (const hint of hints) {
      const match = indexed.find((entry) => entry.key.includes(hint));
      if (match) return match.name;
    }
  }

  const searchKey = normalizeCategoryKey(searchCategoryName || "");
  if (searchKey) {
    const exact = indexed.find((entry) => entry.key === searchKey);
    if (exact) return exact.name;
    const partial = indexed.find(
      (entry) => entry.key.includes(searchKey) || searchKey.includes(entry.key)
    );
    if (partial) return partial.name;
  }

  return searchCategoryName?.trim() || categoryNames[0] || null;
}

/** After listing capture, align stored salon.category with Trimma global categories. */
export async function applyListingCategoryMappingForPlaceIds(
  supabase: SupabaseClient,
  placeIds: string[],
  searchCategoryName: string,
  publicCategories: PublicCategory[]
): Promise<number> {
  if (!placeIds.length || !publicCategories.length) return 0;

  const { data, error } = await supabase
    .from("salons")
    .select("id, category, business_info_extended")
    .in("place_id", placeIds);

  if (error) throw new Error(error.message);

  let updated = 0;
  for (const row of data || []) {
    const googleTypes = readGoogleTypesFromExtended(row.business_info_extended);
    const mapped = mapGoogleTypesToTrimmaCategoryName(
      googleTypes,
      searchCategoryName,
      publicCategories
    );
    if (!mapped || mapped === row.category) continue;

    const { error: updateError } = await supabase
      .from("salons")
      .update({ category: mapped })
      .eq("id", row.id);

    if (updateError) throw new Error(updateError.message);
    updated += 1;
  }

  return updated;
}
