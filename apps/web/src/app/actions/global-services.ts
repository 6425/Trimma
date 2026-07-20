"use server";

import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { requirePlatformAdminFromCookies } from "@/lib/server-admin-auth";
import { getServicePriceBelowMinimumError } from "@/lib/service-pricing";

export type SaveGlobalServiceInput = {
  id?: string;
  name: string;
  slug?: string;
  category_id: string;
  description?: string | null;
  suggested_price?: string | number | null;
  suggested_duration_minutes?: number;
  icon?: string | null;
  icon_image_url?: string | null;
};

function mapGlobalServiceError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("icon_image_url")) {
    return "Database missing icon_image_url column. Run packages/db/GLOBAL_SERVICES_ICON_IMAGE_PATCH.sql in Supabase SQL Editor, then try again.";
  }
  if (lower.includes("duplicate key") || lower.includes("global_services_slug")) {
    return "A global service with this slug already exists. Change the service name or slug.";
  }
  if (lower.includes("pgrst116") || lower.includes("0 rows")) {
    return "Update did not apply. Refresh the page and try again, or confirm the service still exists.";
  }
  if (lower.includes("row-level security") || lower.includes("permission denied")) {
    return "Save blocked by database permissions. Ensure GUEST_WRITE_RLS_PATCH.sql is applied and your account has admin role.";
  }
  return message;
}

function buildPayload(input: SaveGlobalServiceInput) {
  return {
    name: input.name.trim(),
    slug: (input.slug || input.name).toLowerCase().replace(/\s+/g, "-"),
    category_id: input.category_id,
    description: input.description?.trim() || null,
    suggested_price: input.suggested_price ? Number(input.suggested_price) : null,
    suggested_duration_minutes: Number(input.suggested_duration_minutes) || 30,
    icon: input.icon || "Scissors",
    icon_image_url: input.icon_image_url || null,
    updated_at: new Date().toISOString(),
  };
}

function mapServiceRow(row: Record<string, unknown>, categoriesById: Map<string, { name: string }>) {
  const categoryId = String(row.category_id ?? "");
  return {
    ...row,
    category: categoriesById.get(categoryId) ?? null,
  };
}

export async function fetchGlobalServicesCatalog() {
  try {
    const auth = await requirePlatformAdminFromCookies();
    if ("error" in auth) {
      return { success: false as const, error: auth.error };
    }

    const supabase = createSupabaseAdminClient();
    const [servicesRes, categoriesRes] = await Promise.all([
      supabase.from("global_services").select("*").order("name"),
      supabase.from("categories").select("*").order("name"),
    ]);

    if (servicesRes.error) {
      return { success: false as const, error: servicesRes.error.message };
    }
    if (categoriesRes.error) {
      return { success: false as const, error: categoriesRes.error.message };
    }

    const categories = categoriesRes.data || [];
    const categoriesById = new Map(categories.map((c) => [c.id, { name: c.name }]));
    const services = (servicesRes.data || []).map((row) => mapServiceRow(row, categoriesById));

    return { success: true as const, services, categories };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load catalog.";
    if (message.includes("SUPABASE_SERVICE_ROLE_KEY")) {
      return {
        success: false as const,
        error: "Server is missing SUPABASE_SERVICE_ROLE_KEY. Add it in Vercel environment variables.",
      };
    }
    return { success: false as const, error: message };
  }
}

export async function saveGlobalService(input: SaveGlobalServiceInput) {
  try {
    if (!input.name?.trim() || !input.category_id) {
      return { success: false as const, error: "Please fill in required fields." };
    }

    if (input.suggested_price != null && String(input.suggested_price).trim() !== "") {
      const priceError = getServicePriceBelowMinimumError(input.suggested_price);
      if (priceError) {
        return { success: false as const, error: priceError };
      }
    }

    const auth = await requirePlatformAdminFromCookies();
    if ("error" in auth) {
      return { success: false as const, error: auth.error };
    }

    const supabase = createSupabaseAdminClient();
    const payload = buildPayload(input);

    if (input.id) {
      const { data, error } = await supabase
        .from("global_services")
        .update(payload)
        .eq("id", input.id)
        .select("*")
        .maybeSingle();

      if (error) {
        return { success: false as const, error: mapGlobalServiceError(error.message) };
      }

      if (!data) {
        return {
          success: false as const,
          error: "Update did not apply. The service may have been deleted. Refresh and try again.",
        };
      }

      return { success: true as const, service: data };
    }

    const { data, error } = await supabase
      .from("global_services")
      .insert([payload])
      .select("*")
      .single();

    if (error) {
      return { success: false as const, error: mapGlobalServiceError(error.message) };
    }

    return { success: true as const, service: data };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Save failed.";
    if (message.includes("SUPABASE_SERVICE_ROLE_KEY")) {
      return {
        success: false as const,
        error: "Server is missing SUPABASE_SERVICE_ROLE_KEY. Add it in Vercel environment variables.",
      };
    }
    return { success: false as const, error: mapGlobalServiceError(message) };
  }
}

export async function deleteGlobalService(id: string) {
  try {
    if (!id) {
      return { success: false as const, error: "Service id is required." };
    }

    const auth = await requirePlatformAdminFromCookies();
    if ("error" in auth) {
      return { success: false as const, error: auth.error };
    }

    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("global_services").delete().eq("id", id);

    if (error) {
      return { success: false as const, error: mapGlobalServiceError(error.message) };
    }

    return { success: true as const };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Delete failed.";
    return { success: false as const, error: mapGlobalServiceError(message) };
  }
}
