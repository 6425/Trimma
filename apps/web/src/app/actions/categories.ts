"use server";

import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { assertPlatformAdmin } from "@/lib/platform-admin";

export type SaveCategoryInput = {
  accessToken: string;
  id?: string;
  name: string;
  slug?: string;
  icon?: string | null;
  image_url?: string | null;
  description?: string | null;
};

function mapCategoryError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("row-level security") || lower.includes("permission denied")) {
    return "Save blocked by database permissions. Ensure GUEST_WRITE_RLS_PATCH.sql is applied and your account has admin role.";
  }
  if (lower.includes("duplicate key") || lower.includes("categories_slug")) {
    return "A category with this slug already exists. Choose a different name or slug.";
  }
  return message;
}

function buildPayload(input: SaveCategoryInput) {
  return {
    name: input.name.trim(),
    slug: (input.slug || input.name).toLowerCase().replace(/\s+/g, "-"),
    icon: input.icon?.trim() || null,
    image_url: input.image_url?.trim() || null,
    description: input.description?.trim() || null,
  };
}

export async function saveCategory(input: SaveCategoryInput) {
  try {
    if (!input.accessToken) {
      return { success: false as const, error: "You must be signed in as an admin." };
    }

    if (!input.name?.trim()) {
      return { success: false as const, error: "Category name is required." };
    }

    await assertPlatformAdmin(input.accessToken);

    const supabase = createSupabaseAdminClient();
    const payload = buildPayload(input);

    if (input.id) {
      const { data, error } = await supabase
        .from("categories")
        .update(payload)
        .eq("id", input.id)
        .select("*")
        .single();

      if (error) {
        return { success: false as const, error: mapCategoryError(error.message) };
      }

      return { success: true as const, category: data };
    }

    const { data, error } = await supabase
      .from("categories")
      .insert([payload])
      .select("*")
      .single();

    if (error) {
      return { success: false as const, error: mapCategoryError(error.message) };
    }

    return { success: true as const, category: data };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Save failed.";
    if (message.includes("SUPABASE_SERVICE_ROLE_KEY")) {
      return {
        success: false as const,
        error: "Server is missing SUPABASE_SERVICE_ROLE_KEY. Add it in Vercel environment variables.",
      };
    }
    return { success: false as const, error: mapCategoryError(message) };
  }
}

export async function deleteCategory(accessToken: string, id: string) {
  try {
    if (!accessToken) {
      return { success: false as const, error: "You must be signed in as an admin." };
    }

    if (!id) {
      return { success: false as const, error: "Category id is required." };
    }

    await assertPlatformAdmin(accessToken);

    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("categories").delete().eq("id", id);

    if (error) {
      return { success: false as const, error: mapCategoryError(error.message) };
    }

    return { success: true as const };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Delete failed.";
    return { success: false as const, error: mapCategoryError(message) };
  }
}
