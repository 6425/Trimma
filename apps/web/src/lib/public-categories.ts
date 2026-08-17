import { unstable_cache } from "next/cache";
import { createServerSupabaseClient } from "@/config/supabase-server";
import { ADMIN_LEAD_DISCOVERY_CATEGORY_FALLBACKS } from "@/lib/admin-lead-categories";
import { withTimeout } from "@/lib/promise-timeout";

const CATEGORY_FETCH_TIMEOUT_MS = 8_000;

function isProductionBuildPhase(): boolean {
  return (
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.NEXT_PRIVATE_BUILD_WORKER === "1"
  );
}

export type PublicCategory = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
};

function normalizeCategoryNameKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Duplicate / retired marketplace categories — never show or re-seed these.
 * Spa & Wellness stays. Do not re-add Beauty Parlours or Kids & Family.
 */
export const RETIRED_MARKETPLACE_CATEGORY_SLUGS = new Set([
  "beauty-parlours",
  "beauty-salon",
  "kids-family",
  "kids-and-family",
]);

export function isRetiredPublicCategory(category: { slug?: string | null; name?: string | null }): boolean {
  const rawSlug = String(category.slug || "").trim().toLowerCase();
  if (RETIRED_MARKETPLACE_CATEGORY_SLUGS.has(rawSlug)) return true;
  const nameKey = normalizeCategoryNameKey(String(category.name || ""));
  if (nameKey === "beauty parlours" || nameKey === "beauty parlors") return true;
  if (nameKey === "kids family" || nameKey === "kids and family") return true;
  return false;
}

export function isSpaWellnessCategory(category: { slug?: string | null; name?: string | null }): boolean {
  const rawSlug = String(category.slug || "").trim().toLowerCase();
  if (rawSlug === "spa-wellness" || rawSlug === "spa-and-wellness") return true;
  const nameKey = normalizeCategoryNameKey(String(category.name || ""));
  return nameKey === "spa and wellness" || nameKey === "spa wellness";
}

export function rejectRetiredPublicCategories<T extends { slug?: string | null; name?: string | null }>(
  categories: T[]
): T[] {
  return categories.filter((category) => !isRetiredPublicCategory(category));
}

/** Legacy / duplicate slugs → canonical marketplace slug. */
export const CATEGORY_SLUG_ALIASES: Record<string, string> = {
  "spa-and-wellness": "spa-wellness",
  "bridal-and-beauty": "bridal-beauty",
  "beauty-salon": "bridal-beauty",
  "beauty-parlours": "bridal-beauty",
};

export function canonicalizeCategorySlug(slug: string): string {
  const normalized = slug.trim().toLowerCase();
  return CATEGORY_SLUG_ALIASES[normalized] || normalized;
}

/** Retired slugs with no replacement (e.g. Kids & Family) go to /categories. */
export function retiredCategoryRedirectPath(slug: string): string | null {
  const normalized = slug.trim().toLowerCase();
  if (!RETIRED_MARKETPLACE_CATEGORY_SLUGS.has(normalized)) return null;
  const aliased = CATEGORY_SLUG_ALIASES[normalized];
  return aliased ? `/category/${aliased}` : "/categories";
}

/** Remove duplicate slugs/names — single canonical list for nav and filters. */
export function dedupePublicCategories(categories: PublicCategory[]): PublicCategory[] {
  const seenSlugs = new Set<string>();
  const seenNames = new Set<string>();
  const result: PublicCategory[] = [];

  for (const raw of rejectRetiredPublicCategories(categories)) {
    const slug = canonicalizeCategorySlug(raw.slug);
    const nameKey = normalizeCategoryNameKey(raw.name);
    if (!slug || seenSlugs.has(slug) || seenNames.has(nameKey)) continue;
    seenSlugs.add(slug);
    seenNames.add(nameKey);
    result.push({ ...raw, slug });
  }

  return result.sort((a, b) => a.name.localeCompare(b.name));
}

/** Marketplace category page — always a dedicated hero + matching listings. */
export function getCategoryPageHref(slug: string): string {
  return `/category/${encodeURIComponent(canonicalizeCategorySlug(slug))}`;
}

export function findPublicCategory(
  categories: PublicCategory[],
  slug: string
): PublicCategory | undefined {
  const canonical = canonicalizeCategorySlug(slug);
  return categories.find((category) => canonicalizeCategorySlug(category.slug) === canonical);
}

/** Context-aware category link — bookings stay on /bookings; everywhere else opens the category page. */
export function buildCategoryHref(pathname: string | null, slug: string): string {
  if (!slug) {
    if (pathname?.startsWith("/bookings")) return "/bookings";
    return "/";
  }

  const canonical = canonicalizeCategorySlug(slug);
  if (pathname?.startsWith("/bookings")) {
    return `/bookings?category=${encodeURIComponent(canonical)}`;
  }
  return getCategoryPageHref(canonical);
}

export function resolveActiveCategorySlug(
  pathname: string | null,
  searchCategory: string | null
): string | null {
  if (pathname?.startsWith("/category/")) {
    const slug = pathname.split("/")[2];
    return slug ? canonicalizeCategorySlug(decodeURIComponent(slug)) : null;
  }
  if (searchCategory?.trim()) {
    return canonicalizeCategorySlug(searchCategory.trim());
  }
  return null;
}

function slugifyPublicCategoryName(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return canonicalizeCategorySlug(slug);
}

function buildFallbackPublicCategories(): PublicCategory[] {
  return ADMIN_LEAD_DISCOVERY_CATEGORY_FALLBACKS.map((name, index) => ({
    id: `fallback-${index}`,
    name,
    slug: slugifyPublicCategoryName(name),
    icon: null,
  }));
}

async function loadPublicCategories(): Promise<PublicCategory[]> {
  const fallbacks = dedupePublicCategories(buildFallbackPublicCategories());

  // Production SSG prerenders ~160 pages through the root layout. A hung
  // Supabase call during `next build` exceeds Next's 60s page timeout.
  if (isProductionBuildPhase()) {
    return fallbacks;
  }

  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await withTimeout<{
      data: PublicCategory[] | null;
      error: { message: string } | null;
    }>(
      Promise.resolve(
        supabase.from("categories").select("id, name, slug, icon").order("name")
      ),
      CATEGORY_FETCH_TIMEOUT_MS,
      "upstream request timeout"
    );

    if (error) {
      console.error("fetchPublicCategories:", error.message);
      return fallbacks;
    }

    const categories = dedupePublicCategories((data ?? []) as PublicCategory[]);
    return categories.length ? categories : fallbacks;
  } catch (error) {
    console.error("fetchPublicCategories:", error);
    return fallbacks;
  }
}

/** Categories for marketplace nav and filters — always read from the DB, never hardcoded. */
export const fetchPublicCategories = unstable_cache(
  loadPublicCategories,
  ["public-categories"],
  { revalidate: 60 }
);
