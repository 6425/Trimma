import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { filterPublicSalons } from "@/lib/salon-list-filters";
import { SRI_LANKA_PROVINCES, slugifyLocation } from "@/lib/sri-lanka-locations";
import { KNOWN_CATEGORY_SLUGS, STATIC_INDEXABLE_PAGES } from "@/lib/site-seo";
import { canonicalizeCategorySlug, RETIRED_MARKETPLACE_CATEGORY_SLUGS } from "@/lib/public-categories";
import { absoluteUrl } from "@/lib/site-url";
import { fetchAllByIdCursor } from "@/lib/supabase-fetch-all";

export type SitemapEntry = {
  url: string;
  lastModified?: Date;
  changeFrequency?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: number;
};

function entry(
  path: string,
  options?: Omit<SitemapEntry, "url">
): SitemapEntry {
  return {
    url: absoluteUrl(path),
    ...options,
  };
}

function buildLocationEntries(): SitemapEntry[] {
  const entries: SitemapEntry[] = [];

  for (const province of SRI_LANKA_PROVINCES) {
    entries.push(
      entry(`/locations/${province.slug}`, {
        changeFrequency: "weekly",
        priority: 0.7,
      })
    );

    for (const district of province.districts) {
      entries.push(
        entry(`/locations/${province.slug}/${district.slug}`, {
          changeFrequency: "weekly",
          priority: 0.65,
        })
      );

      for (const city of district.cities) {
        entries.push(
          entry(`/locations/${province.slug}/${district.slug}/${slugifyLocation(city)}`, {
            changeFrequency: "weekly",
            priority: 0.6,
          })
        );
      }
    }
  }

  return entries;
}

async function fetchCategoryPaths(): Promise<string[]> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.from("categories").select("slug").order("name");

    if (error) {
      console.error("[sitemap] categories:", error.message);
      return KNOWN_CATEGORY_SLUGS.map((slug) => `/category/${slug}`);
    }

    const fromDb = (data || [])
      .map((row) => String(row.slug || "").trim().toLowerCase())
      .filter((slug) => slug && !RETIRED_MARKETPLACE_CATEGORY_SLUGS.has(slug))
      .map((slug) => `/category/${canonicalizeCategorySlug(slug)}`);

    const merged = new Set([...fromDb, ...KNOWN_CATEGORY_SLUGS.map((slug) => `/category/${slug}`)]);
    return [...merged];
  } catch (err) {
    console.error("[sitemap] categories fetch failed:", err);
    return KNOWN_CATEGORY_SLUGS.map((slug) => `/category/${slug}`);
  }
}

async function fetchSalonPaths(): Promise<string[]> {
  try {
    const supabase = createSupabaseAdminClient();
    const data = await fetchAllByIdCursor(async (afterId, pageSize) => {
      let query = supabase
        .from("salons")
        .select("id, slug, name, updated_at")
        .not("slug", "is", null)
        .order("id", { ascending: true })
        .limit(pageSize);
      if (afterId) query = query.gt("id", afterId);
      const { data: page, error } = await query;
      if (error) throw error;
      return page || [];
    });

    return filterPublicSalons(data || [])
      .map((row) => row.slug?.trim())
      .filter((slug): slug is string => Boolean(slug))
      .map((slug) => `/salons/${slug}`);
  } catch (err) {
    console.error("[sitemap] salons fetch failed:", err);
    return [];
  }
}

export async function buildPublicSitemapEntries(): Promise<SitemapEntry[]> {
  const now = new Date();
  const staticEntries = STATIC_INDEXABLE_PAGES.map((path) =>
    entry(path, {
      lastModified: now,
      changeFrequency: path === "/" ? "daily" : "weekly",
      priority: path === "/" ? 1 : 0.8,
    })
  );

  const [categoryPaths, salonPaths] = await Promise.all([
    fetchCategoryPaths(),
    fetchSalonPaths(),
  ]);

  const categoryEntries = categoryPaths.map((path) =>
    entry(path, {
      changeFrequency: "weekly",
      priority: 0.75,
    })
  );

  const salonEntries = salonPaths.map((path) =>
    entry(path, {
      changeFrequency: "daily",
      priority: 0.85,
    })
  );

  return [
    ...staticEntries,
    ...buildLocationEntries(),
    ...categoryEntries,
    ...salonEntries,
  ];
}
