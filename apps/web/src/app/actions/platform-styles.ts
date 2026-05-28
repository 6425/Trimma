"use server";

import { createServerSupabaseClient } from "@/config/supabase-server";
import { adminDbFailure, isAdminDbSuccess, withAdminDb } from "@/lib/with-admin-db";

export type SavePlatformStyleInput = {
  id?: string;
  title: string;
  description: string | null;
  category_id: string;
  category: string | null;
  tags: string[];
  image_url: string;
  is_active: boolean;
  sort_order: number;
};

const STYLE_SELECT = `
  *,
  categories ( id, name, slug )
`;

const PUBLIC_STYLE_SELECT = `
  id,
  title,
  description,
  category_id,
  tags,
  image_url,
  categories ( id, name, slug )
`;

export type PublicPlatformStyle = {
  id: string;
  title: string;
  description: string | null;
  category_id: string | null;
  tags: string[] | null;
  image_url: string;
  categories: { id: string; name: string; slug: string } | null;
};

function mapDbError(message: string): string {
  const lower = message.toLowerCase();
  if (
    lower.includes("platform_styles") &&
    (lower.includes("does not exist") || lower.includes("schema cache"))
  ) {
    return "Style tables are missing or not in the API cache. Run packages/db/STYLE_CATEGORIES_PATCH.sql in Supabase.";
  }
  if (lower.includes("category_id") && lower.includes("schema cache")) {
    return "category_id is not in the API cache yet. Re-run STYLE_CATEGORIES_PATCH.sql or reload the schema in Supabase.";
  }
  if (lower.includes("foreign key") || lower.includes("category_id_fkey")) {
    return "Invalid salon category. Choose a category from Admin → Service Mgmt → Service Categories.";
  }
  return message;
}

type RawPublicStyleRow = Omit<PublicPlatformStyle, "categories"> & {
  categories: PublicPlatformStyle["categories"] | NonNullable<PublicPlatformStyle["categories"]>[] | null;
};

function normalizePublicStyles(rows: RawPublicStyleRow[] | null): PublicPlatformStyle[] {
  return (rows ?? []).map((row) => {
    const category = Array.isArray(row.categories) ? row.categories[0] ?? null : row.categories;
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      category_id: row.category_id,
      tags: row.tags,
      image_url: row.image_url,
      categories: category,
    };
  });
}

export async function getPublicPlatformStyles() {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("platform_styles")
      .select(PUBLIC_STYLE_SELECT)
      .eq("is_active", true)
      .not("category_id", "is", null)
      .order("sort_order", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      return {
        success: false as const,
        error: mapDbError(error.message),
        styles: [] as PublicPlatformStyle[],
      };
    }

    return {
      success: true as const,
      error: null,
      styles: normalizePublicStyles(data as RawPublicStyleRow[]),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not load styles.";
    return { success: false as const, error: message, styles: [] as PublicPlatformStyle[] };
  }
}

type RawAdminStyleRow = {
  id: string;
  title: string;
  description: string | null;
  category_id: string | null;
  category: string | null;
  tags: string[] | null;
  image_url: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  categories: { id: string; name: string; slug: string } | { id: string; name: string; slug: string }[] | null;
};

function normalizeAdminStyles(rows: RawAdminStyleRow[] | null) {
  return (rows ?? []).map((row) => ({
    ...row,
    categories: Array.isArray(row.categories) ? row.categories[0] ?? null : row.categories,
  }));
}

function buildStylePayload(input: SavePlatformStyleInput) {
  return {
    title: input.title,
    description: input.description,
    category_id: input.category_id,
    category: input.category,
    tags: input.tags,
    image_url: input.image_url,
    is_active: input.is_active,
    sort_order: input.sort_order,
    updated_at: new Date().toISOString(),
  };
}

export async function fetchAdminPlatformStylesCatalog() {
  const result = await withAdminDb(async (supabase) => {
    const [stylesRes, categoriesRes] = await Promise.all([
      supabase
        .from("platform_styles")
        .select(STYLE_SELECT)
        .order("sort_order", { ascending: false })
        .order("created_at", { ascending: false }),
      supabase.from("categories").select("id, name, slug").order("name"),
    ]);

    if (stylesRes.error) throw new Error(mapDbError(stylesRes.error.message));
    if (categoriesRes.error) throw new Error(categoriesRes.error.message);

    return {
      styles: normalizeAdminStyles(stylesRes.data as RawAdminStyleRow[]),
      categories: categoriesRes.data || [],
    };
  });

  if (!isAdminDbSuccess(result)) {
    return adminDbFailure(result, "Style tables missing. Run packages/db/STYLE_CATEGORIES_PATCH.sql in Supabase.");
  }

  return { success: true as const, ...result.data };
}

export async function savePlatformStyle(input: SavePlatformStyleInput) {
  const payload = buildStylePayload(input);

  const result = await withAdminDb(async (supabase) => {
    if (input.id) {
      const { data, error } = await supabase
        .from("platform_styles")
        .update(payload)
        .eq("id", input.id)
        .select(STYLE_SELECT)
        .single();
      if (error) throw new Error(mapDbError(error.message));
      return normalizeAdminStyles([data as RawAdminStyleRow])[0];
    }

    const { data, error } = await supabase
      .from("platform_styles")
      .insert([payload])
      .select(STYLE_SELECT)
      .single();
    if (error) throw new Error(mapDbError(error.message));
    return normalizeAdminStyles([data as RawAdminStyleRow])[0];
  });

  if (!isAdminDbSuccess(result)) return adminDbFailure(result);
  return { success: true as const, style: result.data };
}

export async function deletePlatformStyle(id: string) {
  const result = await withAdminDb(async (supabase) => {
    const { error } = await supabase.from("platform_styles").delete().eq("id", id);
    if (error) throw new Error(mapDbError(error.message));
  });

  if (!isAdminDbSuccess(result)) return adminDbFailure(result);
  return { success: true as const };
}
