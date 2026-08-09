"use server";

import { adminDbFailure, isAdminDbSuccess, withAdminDb } from "@/lib/with-admin-db";

const INVENTORY_DB_HINT =
  "Inventory tables are missing. Run packages/db/INVENTORY_APPLY_ALL.sql in Supabase SQL Editor.";

export type SaveInventoryCategoryInput = {
  id?: string;
  name: string;
  slug?: string;
  icon?: string | null;
  image_url?: string | null;
  description?: string | null;
};

function buildPayload(input: SaveInventoryCategoryInput) {
  return {
    name: input.name.trim(),
    slug: (input.slug || input.name).toLowerCase().replace(/\s+/g, "-"),
    icon: input.icon?.trim() || null,
    image_url: input.image_url?.trim() || null,
    description: input.description?.trim() || null,
  };
}

export async function fetchInventoryCategoriesCatalog() {
  const result = await withAdminDb(async (supabase) => {
    const [categoriesRes, globalProductsRes, salonItemsRes] = await Promise.all([
      supabase.from("inventory_categories").select("*").order("name"),
      supabase.from("global_inventory_products").select("category_id"),
      supabase.from("salon_inventory_items").select("category_id"),
    ]);

    if (categoriesRes.error) throw new Error(categoriesRes.error.message);
    if (globalProductsRes.error && !isMissingInventoryTable(globalProductsRes.error.message)) {
      throw new Error(globalProductsRes.error.message);
    }
    if (salonItemsRes.error && !isMissingInventoryTable(salonItemsRes.error.message)) {
      throw new Error(salonItemsRes.error.message);
    }

    const globalCounts = countByCategoryId(globalProductsRes.data || []);
    const salonCounts = countByCategoryId(salonItemsRes.data || []);

    const categories = (categoriesRes.data || []).map((category) => ({
      ...category,
      global_products: [{ count: globalCounts.get(category.id) || 0 }],
      salon_items: [{ count: salonCounts.get(category.id) || 0 }],
    }));

    return { categories };
  });

  if (!isAdminDbSuccess(result)) return adminDbFailure(result, INVENTORY_DB_HINT);
  return { success: true as const, categories: result.data.categories };
}

function isMissingInventoryTable(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes("does not exist") || lower.includes("schema cache");
}

function countByCategoryId(rows: { category_id?: string | null }[]) {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const id = row.category_id;
    if (!id) continue;
    counts.set(id, (counts.get(id) || 0) + 1);
  }
  return counts;
}

export async function saveInventoryCategory(input: SaveInventoryCategoryInput) {
  if (!input.name?.trim()) {
    return { success: false as const, error: "Category name is required." };
  }

  const payload = buildPayload(input);
  const result = await withAdminDb(async (supabase) => {
    if (input.id) {
      const { data, error } = await supabase
        .from("inventory_categories")
        .update(payload)
        .eq("id", input.id)
        .select("*")
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) throw new Error("Update did not apply.");
      return data;
    }

    const { data, error } = await supabase
      .from("inventory_categories")
      .insert([payload])
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return data;
  });

  if (!isAdminDbSuccess(result)) return adminDbFailure(result, INVENTORY_DB_HINT);
  return { success: true as const, category: result.data };
}

export async function deleteInventoryCategory(id: string) {
  if (!id) {
    return { success: false as const, error: "Category id is required." };
  }

  const result = await withAdminDb(async (supabase) => {
    const { error } = await supabase.from("inventory_categories").delete().eq("id", id);
    if (error) throw new Error(error.message);
  });

  if (!isAdminDbSuccess(result)) return adminDbFailure(result, INVENTORY_DB_HINT);
  return { success: true as const };
}

/** Copy service catalog categories into inventory_categories (non-destructive; skips existing slugs). */
export async function importServiceCategoriesToInventory() {
  const result = await withAdminDb(async (supabase) => {
    const [serviceRes, inventoryRes] = await Promise.all([
      supabase.from("categories").select("name, slug, description, icon, image_url").order("name"),
      supabase.from("inventory_categories").select("slug"),
    ]);

    if (serviceRes.error) throw new Error(serviceRes.error.message);
    if (inventoryRes.error) throw new Error(inventoryRes.error.message);

    const existingSlugs = new Set((inventoryRes.data || []).map((row) => row.slug));
    const toInsert = (serviceRes.data || [])
      .filter((row) => row.slug && !existingSlugs.has(row.slug))
      .map((row) => ({
        name: row.name,
        slug: row.slug,
        description: row.description ?? null,
        icon: (row as { icon?: string | null }).icon ?? null,
        image_url: (row as { image_url?: string | null }).image_url ?? null,
      }));

    if (!toInsert.length) {
      return { imported: 0, skipped: (serviceRes.data || []).length };
    }

    const { error } = await supabase.from("inventory_categories").insert(toInsert);
    if (error) throw new Error(error.message);

    return { imported: toInsert.length, skipped: (serviceRes.data || []).length - toInsert.length };
  });

  if (!isAdminDbSuccess(result)) return adminDbFailure(result, INVENTORY_DB_HINT);
  return { success: true as const, imported: result.data.imported, skipped: result.data.skipped };
}
