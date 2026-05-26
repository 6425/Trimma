"use server";

import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { createServerSupabaseClient } from "@/config/supabase-server";

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

export async function savePlatformStyle(input: SavePlatformStyleInput) {
  try {
    const supabase = createSupabaseAdminClient();
    const payload = {
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

    if (input.id) {
      const { data, error } = await supabase
        .from("platform_styles")
        .update(payload)
        .eq("id", input.id)
        .select(STYLE_SELECT)
        .single();

      if (error) {
        return { success: false as const, error: mapDbError(error.message) };
      }

      return { success: true as const, style: data };
    }

    const { data, error } = await supabase
      .from("platform_styles")
      .insert([payload])
      .select(STYLE_SELECT)
      .single();

    if (error) {
      return { success: false as const, error: mapDbError(error.message) };
    }

    return { success: true as const, style: data };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Save failed.";
    if (message.includes("SUPABASE_SERVICE_ROLE_KEY")) {
      return {
        success: false as const,
        error: "Server is missing SUPABASE_SERVICE_ROLE_KEY (add it to apps/web/.env).",
      };
    }
    return { success: false as const, error: message };
  }
}

export async function deletePlatformStyle(id: string) {
  try {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("platform_styles").delete().eq("id", id);

    if (error) {
      return { success: false as const, error: mapDbError(error.message) };
    }

    return { success: true as const };
  } catch (err) {
    return {
      success: false as const,
      error: err instanceof Error ? err.message : "Delete failed.",
    };
  }
}
