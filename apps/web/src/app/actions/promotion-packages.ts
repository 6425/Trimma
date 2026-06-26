"use server";

import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { normalizeDatePayload, validatePromotionDates } from "@/lib/promotion-package-dates";
import { requirePlatformAdminFromCookies } from "@/lib/server-admin-auth";

export type SavePromotionPackageInput = {
  id?: string;
  name: string;
  slug?: string;
  promotion_type_id: string;
  description?: string | null;
  package_price?: string | number | null;
  original_price?: string | number | null;
  included_services?: string[];
  icon?: string | null;
  image_url?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  is_active?: boolean;
};

function mapPromotionPackageError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("does not exist") || lower.includes("relation")) {
    return "Promotion tables are missing. Run packages/db/PROMOTION_PACKAGES_PATCH.sql in Supabase SQL Editor.";
  }
  if (lower.includes("duplicate key") || lower.includes("global_promotion_packages_slug")) {
    return "A promotion package with this slug already exists. Change the name or slug.";
  }
  if (lower.includes("row-level security") || lower.includes("permission denied")) {
    return "Save blocked by database permissions. Ensure your account has admin role.";
  }
  return message;
}

function buildPayload(input: SavePromotionPackageInput) {
  const { start_date, end_date } = normalizeDatePayload(input.start_date || "", input.end_date || "");

  return {
    name: input.name.trim(),
    slug: (input.slug || input.name).toLowerCase().replace(/\s+/g, "-"),
    promotion_type_id: input.promotion_type_id,
    description: input.description?.trim() || "",
    package_price: input.package_price ? Number(input.package_price) : 0,
    original_price: input.original_price ? Number(input.original_price) : 0,
    included_services: input.included_services || [],
    icon: input.icon || "Gift",
    image_url: input.image_url?.trim() || null,
    start_date,
    end_date,
    is_active: input.is_active !== false,
    updated_at: new Date().toISOString(),
  };
}

function mapPackageRow(
  row: Record<string, unknown>,
  typesById: Map<string, { name: string; icon: string | null }>
) {
  const typeId = String(row.promotion_type_id ?? "");
  const promotionType = typesById.get(typeId) ?? null;
  return {
    ...row,
    promotion_type: promotionType,
  };
}

export async function fetchPromotionPackagesCatalog() {
  try {
    const auth = await requirePlatformAdminFromCookies();
    if ("error" in auth) {
      return { success: false as const, error: auth.error };
    }

    const supabase = createSupabaseAdminClient();
    const [packagesRes, typesRes] = await Promise.all([
      supabase.from("global_promotion_packages").select("*").order("name"),
      supabase.from("promotion_types").select("*").order("name"),
    ]);

    if (packagesRes.error) {
      return { success: false as const, error: mapPromotionPackageError(packagesRes.error.message) };
    }
    if (typesRes.error) {
      return { success: false as const, error: mapPromotionPackageError(typesRes.error.message) };
    }

    const promotionTypes = typesRes.data || [];
    const typesById = new Map(
      promotionTypes.map((type) => [type.id, { name: type.name, icon: type.icon }])
    );
    const packages = (packagesRes.data || []).map((row) => mapPackageRow(row, typesById));

    return { success: true as const, packages, promotionTypes };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load promotion catalog.";
    if (message.includes("SUPABASE_SERVICE_ROLE_KEY")) {
      return {
        success: false as const,
        error: "Server is missing SUPABASE_SERVICE_ROLE_KEY. Add it in Vercel environment variables.",
      };
    }
    return { success: false as const, error: mapPromotionPackageError(message) };
  }
}

export async function savePromotionPackage(input: SavePromotionPackageInput) {
  try {
    if (!input.name?.trim() || !input.promotion_type_id) {
      return { success: false as const, error: "Please fill in required fields." };
    }

    const dateError = validatePromotionDates(input.start_date || "", input.end_date || "");
    if (dateError) {
      return { success: false as const, error: dateError };
    }

    const auth = await requirePlatformAdminFromCookies();
    if ("error" in auth) {
      return { success: false as const, error: auth.error };
    }

    const supabase = createSupabaseAdminClient();
    const payload = buildPayload(input);

    if (input.id) {
      const { data, error } = await supabase
        .from("global_promotion_packages")
        .update(payload)
        .eq("id", input.id)
        .select("*")
        .maybeSingle();

      if (error) {
        return { success: false as const, error: mapPromotionPackageError(error.message) };
      }

      if (!data) {
        return {
          success: false as const,
          error: "Update did not apply. Refresh the page and try again.",
        };
      }

      return { success: true as const, pkg: data };
    }

    const { data, error } = await supabase
      .from("global_promotion_packages")
      .insert([payload])
      .select("*")
      .single();

    if (error) {
      return { success: false as const, error: mapPromotionPackageError(error.message) };
    }

    return { success: true as const, pkg: data };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Save failed.";
    if (message.includes("SUPABASE_SERVICE_ROLE_KEY")) {
      return {
        success: false as const,
        error: "Server is missing SUPABASE_SERVICE_ROLE_KEY. Add it in Vercel environment variables.",
      };
    }
    return { success: false as const, error: mapPromotionPackageError(message) };
  }
}

export async function deletePromotionPackage(id: string) {
  try {
    if (!id) {
      return { success: false as const, error: "Promotion package id is required." };
    }

    const auth = await requirePlatformAdminFromCookies();
    if ("error" in auth) {
      return { success: false as const, error: auth.error };
    }

    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("global_promotion_packages").delete().eq("id", id);

    if (error) {
      return { success: false as const, error: mapPromotionPackageError(error.message) };
    }

    return { success: true as const };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Delete failed.";
    return { success: false as const, error: mapPromotionPackageError(message) };
  }
}
