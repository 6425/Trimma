"use server";

import { adminDbFailure, isAdminDbSuccess, withAdminDb } from "@/lib/with-admin-db";

export type SavePromotionTypeInput = {
  id?: string;
  name: string;
  slug?: string;
  icon?: string | null;
  description?: string | null;
};

function buildPayload(input: SavePromotionTypeInput) {
  return {
    name: input.name.trim(),
    slug: (input.slug || input.name).toLowerCase().replace(/\s+/g, "-"),
    icon: input.icon || "Gift",
    description: input.description?.trim() || "",
  };
}

export async function fetchPromotionTypesCatalog() {
  const result = await withAdminDb(async (supabase) => {
    const [{ data: types, error: typesError }, { data: packages, error: packagesError }] =
      await Promise.all([
        supabase.from("promotion_types").select("*").order("name"),
        supabase.from("global_promotion_packages").select("promotion_type_id"),
      ]);

    if (typesError) throw new Error(typesError.message);
    if (packagesError) throw new Error(packagesError.message);

    const counts = new Map<string, number>();
    for (const row of packages || []) {
      const id = row.promotion_type_id as string | null;
      if (!id) continue;
      counts.set(id, (counts.get(id) || 0) + 1);
    }

    const promotionTypes = (types || []).map((type) => ({
      ...type,
      global_promotion_packages: [{ count: counts.get(type.id) || 0 }],
    }));

    return { promotionTypes };
  });

  if (!isAdminDbSuccess(result)) {
    return adminDbFailure(result, "Promotion tables missing. Run packages/db/PROMOTION_PACKAGES_PATCH.sql.");
  }

  return { success: true as const, promotionTypes: result.data.promotionTypes };
}

export async function savePromotionType(input: SavePromotionTypeInput) {
  if (!input.name?.trim()) {
    return { success: false as const, error: "Name is required." };
  }

  const payload = buildPayload(input);
  const result = await withAdminDb(async (supabase) => {
    if (input.id) {
      const { data, error } = await supabase
        .from("promotion_types")
        .update(payload)
        .eq("id", input.id)
        .select("*")
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) throw new Error("Update did not apply.");
      return data;
    }

    const { data, error } = await supabase.from("promotion_types").insert([payload]).select("*").single();
    if (error) throw new Error(error.message);
    return data;
  });

  if (!isAdminDbSuccess(result)) return adminDbFailure(result);

  return { success: true as const, promotionType: result.data };
}

export async function deletePromotionType(id: string) {
  if (!id) return { success: false as const, error: "Id is required." };

  const result = await withAdminDb(async (supabase) => {
    const { error } = await supabase.from("promotion_types").delete().eq("id", id);
    if (error) throw new Error(error.message);
  });

  if (!isAdminDbSuccess(result)) return adminDbFailure(result);

  return { success: true as const };
}
