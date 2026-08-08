"use server";

import { adminDbFailure, isAdminDbSuccess, withAdminDb } from "@/lib/with-admin-db";

const INVENTORY_DB_HINT =
  "Inventory tables are missing. Run packages/db/INVENTORY_APPLY_ALL.sql in Supabase SQL Editor.";

export type SaveGlobalInventoryProductInput = {
  id?: string;
  name: string;
  slug?: string;
  category_id?: string | null;
  brand?: string | null;
  description?: string | null;
  unit?: string;
  suggested_cost_price?: string | number | null;
  suggested_retail_price?: string | number | null;
  icon_image_url?: string | null;
  is_active?: boolean;
};

function mapProductError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("duplicate key") || lower.includes("global_inventory_products_slug")) {
    return "A product with this slug already exists. Change the name or slug.";
  }
  if (lower.includes("row-level security") || lower.includes("permission denied")) {
    return "Save blocked by database permissions. Confirm your account has admin role.";
  }
  return message;
}

function buildPayload(input: SaveGlobalInventoryProductInput) {
  return {
    name: input.name.trim(),
    slug: (input.slug || input.name).toLowerCase().replace(/\s+/g, "-"),
    category_id: input.category_id || null,
    brand: input.brand?.trim() || null,
    description: input.description?.trim() || null,
    unit: input.unit?.trim() || "pcs",
    suggested_cost_price:
      input.suggested_cost_price != null && String(input.suggested_cost_price).trim() !== ""
        ? Number(input.suggested_cost_price)
        : null,
    suggested_retail_price:
      input.suggested_retail_price != null && String(input.suggested_retail_price).trim() !== ""
        ? Number(input.suggested_retail_price)
        : null,
    icon_image_url: input.icon_image_url?.trim() || null,
    is_active: input.is_active !== false,
    updated_at: new Date().toISOString(),
  };
}

function mapProductRow(
  row: Record<string, unknown>,
  categoriesById: Map<string, { name: string }>
) {
  const categoryId = row.category_id ? String(row.category_id) : "";
  return {
    ...row,
    category: categoryId ? categoriesById.get(categoryId) ?? null : null,
  };
}

export async function fetchGlobalInventoryProductsCatalog() {
  const result = await withAdminDb(async (supabase) => {
    const [productsRes, categoriesRes] = await Promise.all([
      supabase.from("global_inventory_products").select("*").order("name"),
      supabase.from("inventory_categories").select("*").order("name"),
    ]);

    if (productsRes.error) throw new Error(productsRes.error.message);
    if (categoriesRes.error) throw new Error(categoriesRes.error.message);

    const categories = categoriesRes.data || [];
    const categoriesById = new Map(categories.map((c) => [c.id, { name: c.name }]));
    const products = (productsRes.data || []).map((row) =>
      mapProductRow(row as Record<string, unknown>, categoriesById)
    );

    return { products, categories };
  });

  if (!isAdminDbSuccess(result)) return adminDbFailure(result, INVENTORY_DB_HINT);
  return { success: true as const, products: result.data.products, categories: result.data.categories };
}

export async function saveGlobalInventoryProduct(input: SaveGlobalInventoryProductInput) {
  if (!input.name?.trim()) {
    return { success: false as const, error: "Product name is required." };
  }

  const payload = buildPayload(input);
  const result = await withAdminDb(async (supabase) => {
    if (input.id) {
      const { data, error } = await supabase
        .from("global_inventory_products")
        .update(payload)
        .eq("id", input.id)
        .select("*")
        .maybeSingle();
      if (error) throw new Error(mapProductError(error.message));
      if (!data) throw new Error("Update did not apply.");
      return data;
    }

    const { data, error } = await supabase
      .from("global_inventory_products")
      .insert([payload])
      .select("*")
      .single();
    if (error) throw new Error(mapProductError(error.message));
    return data;
  });

  if (!isAdminDbSuccess(result)) {
    const message = result.error;
    return { success: false as const, error: mapProductError(message) };
  }
  return { success: true as const, product: result.data };
}

export async function deleteGlobalInventoryProduct(id: string) {
  if (!id) {
    return { success: false as const, error: "Product id is required." };
  }

  const result = await withAdminDb(async (supabase) => {
    const { error } = await supabase.from("global_inventory_products").delete().eq("id", id);
    if (error) throw new Error(mapProductError(error.message));
  });

  if (!isAdminDbSuccess(result)) return adminDbFailure(result, INVENTORY_DB_HINT);
  return { success: true as const };
}
