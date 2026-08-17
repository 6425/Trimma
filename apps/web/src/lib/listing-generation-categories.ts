import type { SupabaseClient } from "@supabase/supabase-js";
import {
  ADMIN_LEAD_DISCOVERY_CATEGORY_FALLBACKS,
} from "@/lib/admin-lead-categories";
import {
  canonicalizeCategorySlug,
  dedupePublicCategories,
  type PublicCategory,
} from "@/lib/public-categories";
import { purgeRetiredMarketplaceCategories } from "@/lib/purge-retired-marketplace-categories";

export type GlobalServiceSummary = {
  id: string;
  name: string;
  category_id: string | null;
};

export type ListingCaptureCatalog = {
  categories: PublicCategory[];
  servicesByCategoryId: Record<string, GlobalServiceSummary[]>;
};

function normalizeCategoryKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function slugifyCategoryName(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return canonicalizeCategorySlug(slug);
}

const GOOGLE_TYPE_CATEGORY_HINTS: Record<string, string[]> = {
  hair_care: ["barber", "grooming", "mens"],
  barber_shop: ["barber", "grooming", "mens"],
  beauty_salon: ["bridal", "beauty"],
  spa: ["spa", "wellness"],
  nail_salon: ["nail"],
  skin_care_clinic: ["skincare", "skin", "clinic"],
  gym: ["yoga", "wellness"],
  yoga_studio: ["yoga"],
  tattoo_shop: ["tattoo"],
  physiotherapist: ["wellness", "spa"],
};

const TRIMMA_CATEGORY_GOOGLE_QUERY_HINTS: Record<string, string> = {
  "barber salon": "barber shop hair salon",
  "bridal and beauty": "bridal makeup beauty salon",
  "bridal & beauty": "bridal makeup beauty salon",
  "nail studio": "nail salon manicure",
  "spa and wellness": "spa wellness massage",
  "spa & wellness": "spa wellness massage",
  "mens grooming": "mens grooming barber",
  "skincare clinics": "skin care clinic facial",
  "tattoo studio": "tattoo shop",
  "yoga studio": "yoga studio wellness",
};

function fallbackCaptureCategories(): PublicCategory[] {
  return ADMIN_LEAD_DISCOVERY_CATEGORY_FALLBACKS.map((name, index) => ({
    id: `fallback-${index}`,
    name,
    slug: slugifyCategoryName(name),
    icon: null,
  }));
}

/** Admin catalog: Trimma marketplace categories + global services grouped by category. */
export async function loadListingCaptureCatalog(
  supabase: SupabaseClient
): Promise<ListingCaptureCatalog> {
  await purgeRetiredMarketplaceCategories(supabase);

  const [categoriesRes, servicesRes] = await Promise.all([
    supabase.from("categories").select("id, name, slug, icon").order("name"),
    supabase
      .from("global_services")
      .select("id, name, category_id, is_active")
      .eq("is_active", true)
      .order("name"),
  ]);

  let categories = dedupePublicCategories((categoriesRes.data || []) as PublicCategory[]);
  if (!categories.length) {
    categories = fallbackCaptureCategories();
  }

  const servicesByCategoryId: Record<string, GlobalServiceSummary[]> = {};
  for (const row of servicesRes.data || []) {
    if (row.is_active === false) continue;
    const categoryId = String(row.category_id || "");
    if (!categoryId) continue;
    if (!servicesByCategoryId[categoryId]) servicesByCategoryId[categoryId] = [];
    servicesByCategoryId[categoryId].push({
      id: String(row.id),
      name: String(row.name || ""),
      category_id: categoryId,
    });
  }

  return { categories, servicesByCategoryId };
}

export function resolveTrimmaCategoryName(
  rawName: string,
  categories: PublicCategory[]
): string | null {
  const key = normalizeCategoryKey(rawName);
  if (!key) return null;

  for (const category of categories) {
    const categoryKey = normalizeCategoryKey(category.name);
    if (categoryKey === key) return category.name;
  }
  for (const category of categories) {
    const categoryKey = normalizeCategoryKey(category.name);
    if (categoryKey.includes(key) || key.includes(categoryKey)) return category.name;
  }
  return rawName.trim() || null;
}

/** Build a Google Places text query for the selected Trimma category + location. */
export function buildListingCaptureGoogleQuery(input: {
  categoryName: string;
  city: string;
  district: string;
  province: string;
  globalServices?: GlobalServiceSummary[];
}): string {
  const categoryKey = normalizeCategoryKey(input.categoryName);
  const categoryHint =
    TRIMMA_CATEGORY_GOOGLE_QUERY_HINTS[categoryKey] ||
    input.globalServices?.slice(0, 2).map((service) => service.name).join(" ") ||
    input.categoryName;

  const location = [input.city, input.district, input.province, "Sri Lanka"]
    .filter(Boolean)
    .join(", ");

  return `${categoryHint} in ${location}`.replace(/\s+/g, " ").trim();
}

function readGoogleTypesFromExtended(businessInfoExtended: unknown): string[] {
  if (!businessInfoExtended || typeof businessInfoExtended !== "object" || Array.isArray(businessInfoExtended)) {
    return [];
  }
  const types = (businessInfoExtended as Record<string, unknown>).google_types;
  if (!Array.isArray(types)) return [];
  return types.filter((type): type is string => typeof type === "string" && type.trim().length > 0);
}

function readExistingTrimmaCategories(
  businessInfoExtended: unknown,
  fallbackCategory?: string | null
): string[] {
  const tags = new Set<string>();
  if (fallbackCategory?.trim()) tags.add(fallbackCategory.trim());

  if (businessInfoExtended && typeof businessInfoExtended === "object" && !Array.isArray(businessInfoExtended)) {
    const ext = businessInfoExtended as Record<string, unknown>;
    const arr = ext.trimma_categories;
    if (Array.isArray(arr)) {
      for (const item of arr) {
        const name = String(item || "").trim();
        if (name) tags.add(name);
      }
    }
  }

  return [...tags];
}

/** Map Google Places types + capture category to all matching Trimma marketplace categories. */
export function mapGoogleTypesToTrimmaCategoryNames(
  googleTypes: string[] | undefined,
  searchCategoryName: string | null | undefined,
  publicCategories: PublicCategory[]
): string[] {
  const results = new Set<string>();
  const categoryNames = publicCategories.map((category) => category.name).filter(Boolean);
  if (!categoryNames.length && searchCategoryName?.trim()) {
    return [searchCategoryName.trim()];
  }

  const indexed = categoryNames.map((name) => ({
    name,
    key: normalizeCategoryKey(name),
  }));

  const resolvedSearch = searchCategoryName
    ? resolveTrimmaCategoryName(searchCategoryName, publicCategories)
    : null;
  if (resolvedSearch) results.add(resolvedSearch);

  for (const type of googleTypes || []) {
    const hints = GOOGLE_TYPE_CATEGORY_HINTS[type];
    if (!hints?.length) continue;
    for (const hint of hints) {
      const match = indexed.find((entry) => entry.key.includes(hint));
      if (match) results.add(match.name);
    }
  }

  if (!results.size && resolvedSearch) results.add(resolvedSearch);
  if (!results.size && categoryNames[0]) results.add(categoryNames[0]);
  return [...results];
}

export function readSalonTrimmaCategoryTags(row: Record<string, unknown>): string[] {
  return readExistingTrimmaCategories(row.business_info_extended, String(row.category || "") || null);
}

/** After listing capture, tag salons with Trimma categories (supports multiple tags per salon). */
export async function applyListingCategoryMappingForPlaceIds(
  supabase: SupabaseClient,
  placeIds: string[],
  searchCategoryName: string,
  publicCategories: PublicCategory[]
): Promise<number> {
  if (!placeIds.length) return 0;

  const { data, error } = await supabase
    .from("salons")
    .select("id, category, business_info_extended")
    .in("place_id", placeIds);

  if (error) throw new Error(error.message);

  let updated = 0;
  for (const row of data || []) {
    const googleTypes = readGoogleTypesFromExtended(row.business_info_extended);
    const mapped = mapGoogleTypesToTrimmaCategoryNames(
      googleTypes,
      searchCategoryName,
      publicCategories
    );
    const existingExt =
      row.business_info_extended &&
      typeof row.business_info_extended === "object" &&
      !Array.isArray(row.business_info_extended)
        ? (row.business_info_extended as Record<string, unknown>)
        : {};

    const mergedTags = [
      ...new Set([
        ...readExistingTrimmaCategories(existingExt, String(row.category || "") || null),
        ...mapped,
      ]),
    ];
    const primaryCategory =
      resolveTrimmaCategoryName(searchCategoryName, publicCategories) ||
      mergedTags[0] ||
      String(row.category || "") ||
      null;

    const nextExt = {
      ...existingExt,
      trimma_categories: mergedTags,
      listing_capture_category: searchCategoryName,
    };

    const categoryChanged = primaryCategory && primaryCategory !== row.category;
    const tagsChanged =
      JSON.stringify(existingExt.trimma_categories || []) !== JSON.stringify(mergedTags);

    if (!categoryChanged && !tagsChanged) continue;

    const { error: updateError } = await supabase
      .from("salons")
      .update({
        category: primaryCategory,
        business_info_extended: nextExt,
      })
      .eq("id", row.id);

    if (updateError) throw new Error(updateError.message);
    updated += 1;
  }

  return updated;
}
