"use server";

import { adminDbFailure, isAdminDbSuccess, withAdminDb } from "@/lib/with-admin-db";

export type SaveCategoryInput = {
  id?: string;
  name: string;
  slug?: string;
  icon?: string | null;
  image_url?: string | null;
  description?: string | null;
};

function buildPayload(input: SaveCategoryInput) {
  return {
    name: input.name.trim(),
    slug: (input.slug || input.name).toLowerCase().replace(/\s+/g, "-"),
    icon: input.icon?.trim() || null,
    image_url: input.image_url?.trim() || null,
    description: input.description?.trim() || null,
  };
}

export async function fetchCategoriesCatalog() {
  const result = await withAdminDb(async (supabase) => {
    const [{ data: categories, error: categoriesError }, { data: services, error: servicesError }, { data: globalServices, error: globalError }] =
      await Promise.all([
        supabase.from("categories").select("*").order("name"),
        supabase.from("services").select("category_id"),
        supabase.from("global_services").select("category_id"),
      ]);

    if (categoriesError) throw new Error(categoriesError.message);
    if (servicesError) throw new Error(servicesError.message);
    if (globalError) throw new Error(globalError.message);

    const serviceCounts = new Map<string, number>();
    for (const row of services || []) {
      const id = row.category_id as string | null;
      if (!id) continue;
      serviceCounts.set(id, (serviceCounts.get(id) || 0) + 1);
    }

    const globalCounts = new Map<string, number>();
    for (const row of globalServices || []) {
      const id = row.category_id as string | null;
      if (!id) continue;
      globalCounts.set(id, (globalCounts.get(id) || 0) + 1);
    }

    const rows = (categories || []).map((category) => ({
      ...category,
      services: [{ count: serviceCounts.get(category.id) || 0 }],
      global_services: [{ count: globalCounts.get(category.id) || 0 }],
    }));

    return { categories: rows };
  });

  if (!isAdminDbSuccess(result)) return adminDbFailure(result);

  return { success: true as const, categories: result.data.categories };
}

export async function saveCategory(input: SaveCategoryInput) {
  if (!input.name?.trim()) {
    return { success: false as const, error: "Category name is required." };
  }

  const payload = buildPayload(input);
  const result = await withAdminDb(async (supabase) => {
    if (input.id) {
      const { data, error } = await supabase
        .from("categories")
        .update(payload)
        .eq("id", input.id)
        .select("*")
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) throw new Error("Update did not apply.");
      return data;
    }

    const { data, error } = await supabase.from("categories").insert([payload]).select("*").single();
    if (error) throw new Error(error.message);
    return data;
  });

  if (!isAdminDbSuccess(result)) return adminDbFailure(result);

  return { success: true as const, category: result.data };
}

export async function deleteCategory(id: string) {
  if (!id) {
    return { success: false as const, error: "Category id is required." };
  }

  const result = await withAdminDb(async (supabase) => {
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) throw new Error(error.message);
  });

  if (!isAdminDbSuccess(result)) return adminDbFailure(result);

  return { success: true as const };
}
