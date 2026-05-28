"use server";

import { adminDbFailure, isAdminDbSuccess, withAdminDb } from "@/lib/with-admin-db";

export type SaveAmenityInput = {
  id?: string;
  name: string;
  type: string;
  icon_name: string;
};

function buildPayload(input: SaveAmenityInput) {
  return {
    name: input.name.trim(),
    type: input.type,
    icon_name: input.icon_name,
  };
}

export async function fetchAmenitiesCatalog() {
  const result = await withAdminDb(async (supabase) => {
    const { data, error } = await supabase.from("global_amenities").select("*").order("name");
    if (error) throw new Error(error.message);
    return { amenities: data || [] };
  });

  if (!isAdminDbSuccess(result)) {
    return adminDbFailure(
      result,
      "global_amenities table missing. Run marketplace schema patches in Supabase."
    );
  }

  return { success: true as const, amenities: result.data.amenities };
}

export async function saveAmenity(input: SaveAmenityInput) {
  if (!input.name?.trim() || !input.type || !input.icon_name) {
    return { success: false as const, error: "Please fill in all fields." };
  }

  const payload = buildPayload(input);
  const result = await withAdminDb(async (supabase) => {
    if (input.id) {
      const { data, error } = await supabase
        .from("global_amenities")
        .update(payload)
        .eq("id", input.id)
        .select("*")
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) throw new Error("Update did not apply.");
      return data;
    }

    const { data, error } = await supabase.from("global_amenities").insert([payload]).select("*").single();
    if (error) throw new Error(error.message);
    return data;
  });

  if (!isAdminDbSuccess(result)) return adminDbFailure(result);

  return { success: true as const, amenity: result.data };
}

export async function deleteAmenity(id: string) {
  if (!id) return { success: false as const, error: "Id is required." };

  const result = await withAdminDb(async (supabase) => {
    const { error } = await supabase.from("global_amenities").delete().eq("id", id);
    if (error) throw new Error(error.message);
  });

  if (!isAdminDbSuccess(result)) return adminDbFailure(result);

  return { success: true as const };
}
