"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { adminDbFailure, isAdminDbSuccess, withAdminDb } from "@/lib/with-admin-db";
import { slugifyLocation } from "@/lib/sri-lanka-locations";

type TerritoryPayload = {
  name: string;
  slug: string;
  image_url?: string | null;
  province_id?: string;
  district_id?: string;
};

async function syncTerritoryMirror(
  supabase: SupabaseClient,
  input: { name: string; slug: string; type: "province" | "district" | "city"; parentSlug?: string }
) {
  let parentId: string | null = null;
  if (input.parentSlug) {
    const { data: parent, error: parentError } = await supabase
      .from("territories")
      .select("id")
      .eq("slug", input.parentSlug)
      .maybeSingle();
    if (parentError) throw new Error(parentError.message);
    if (!parent?.id) throw new Error(`Parent territory ${input.parentSlug} is not synchronized.`);
    parentId = parent.id;
  }
  const { error } = await supabase.from("territories").upsert(
    {
      name: input.name,
      slug: input.slug,
      type: input.type,
      parent_id: parentId,
    },
    { onConflict: "slug" }
  );
  if (error) throw new Error(error.message);
}

export async function fetchProvincesCatalog() {
  const result = await withAdminDb(async (supabase) => {
    const { data: provinces, error } = await supabase.from("provinces").select("*").order("name");
    if (error) throw new Error(error.message);

    const { data: districts, error: districtError } = await supabase.from("districts").select("province_id");
    if (districtError) throw new Error(districtError.message);

    const counts = new Map<string, number>();
    for (const row of districts || []) {
      const id = row.province_id as string | null;
      if (!id) continue;
      counts.set(id, (counts.get(id) || 0) + 1);
    }

    return {
      provinces: (provinces || []).map((province) => ({
        ...province,
        districts: [{ count: counts.get(province.id) || 0 }],
      })),
    };
  });

  if (!isAdminDbSuccess(result)) return adminDbFailure(result);
  return { success: true as const, provinces: result.data.provinces };
}

export async function saveProvince(input: { id?: string; name: string; slug?: string; image_url?: string | null }) {
  if (!input.name?.trim()) return { success: false as const, error: "Name is required." };

  const payload: TerritoryPayload = {
    name: input.name.trim(),
    slug: slugifyLocation(input.slug || input.name),
    image_url: input.image_url || null,
  };

  const result = await withAdminDb(async (supabase) => {
    let saved;
    if (input.id) {
      const { data, error } = await supabase
        .from("provinces")
        .update(payload)
        .eq("id", input.id)
        .select("*")
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) throw new Error("Update did not apply.");
      saved = data;
    } else {
      const { data, error } = await supabase.from("provinces").insert([payload]).select("*").single();
      if (error) throw new Error(error.message);
      saved = data;
    }
    await syncTerritoryMirror(supabase, {
      name: saved.name,
      slug: saved.slug,
      type: "province",
    });
    return saved;
  });

  if (!isAdminDbSuccess(result)) return adminDbFailure(result);
  revalidatePath("/", "layout");
  return { success: true as const, province: result.data };
}

export async function deleteProvince(id: string) {
  const result = await withAdminDb(async (supabase) => {
    const { error } = await supabase.from("provinces").delete().eq("id", id);
    if (error) throw new Error(error.message);
  });
  if (!isAdminDbSuccess(result)) return adminDbFailure(result);
  revalidatePath("/", "layout");
  return { success: true as const };
}

export async function fetchDistrictsCatalog() {
  const result = await withAdminDb(async (supabase) => {
    const [districtsRes, provincesRes, citiesRes] = await Promise.all([
      supabase.from("districts").select("*").order("name"),
      supabase.from("provinces").select("*").order("name"),
      supabase.from("cities").select("district_id"),
    ]);

    if (districtsRes.error) throw new Error(districtsRes.error.message);
    if (provincesRes.error) throw new Error(provincesRes.error.message);
    if (citiesRes.error) throw new Error(citiesRes.error.message);

    const cityCounts = new Map<string, number>();
    for (const row of citiesRes.data || []) {
      const id = row.district_id as string | null;
      if (!id) continue;
      cityCounts.set(id, (cityCounts.get(id) || 0) + 1);
    }

    const provincesById = new Map((provincesRes.data || []).map((p) => [p.id, p]));
    const districts = (districtsRes.data || []).map((district) => ({
      ...district,
      provinces: provincesById.get(district.province_id) || null,
      cities: [{ count: cityCounts.get(district.id) || 0 }],
    }));

    return { districts, provinces: provincesRes.data || [] };
  });

  if (!isAdminDbSuccess(result)) return adminDbFailure(result);
  return { success: true as const, districts: result.data.districts, provinces: result.data.provinces };
}

export async function saveDistrict(input: {
  id?: string;
  name: string;
  slug?: string;
  image_url?: string | null;
  province_id: string;
}) {
  if (!input.name?.trim() || !input.province_id) {
    return { success: false as const, error: "Name and province are required." };
  }

  const payload = {
    name: input.name.trim(),
    slug: slugifyLocation(input.slug || input.name),
    province_id: input.province_id,
    image_url: input.image_url || null,
  };

  const result = await withAdminDb(async (supabase) => {
    let saved;
    if (input.id) {
      const { data, error } = await supabase
        .from("districts")
        .update(payload)
        .eq("id", input.id)
        .select("*")
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) throw new Error("Update did not apply.");
      saved = data;
    } else {
      const { data, error } = await supabase.from("districts").insert([payload]).select("*").single();
      if (error) throw new Error(error.message);
      saved = data;
    }
    const { data: province, error: provinceError } = await supabase
      .from("provinces")
      .select("slug")
      .eq("id", saved.province_id)
      .maybeSingle();
    if (provinceError) throw new Error(provinceError.message);
    if (!province?.slug) throw new Error("Parent province was not found.");
    await syncTerritoryMirror(supabase, {
      name: saved.name,
      slug: saved.slug,
      type: "district",
      parentSlug: province.slug,
    });
    return saved;
  });

  if (!isAdminDbSuccess(result)) return adminDbFailure(result);
  revalidatePath("/", "layout");
  return { success: true as const, district: result.data };
}

export async function deleteDistrict(id: string) {
  const result = await withAdminDb(async (supabase) => {
    const { error } = await supabase.from("districts").delete().eq("id", id);
    if (error) throw new Error(error.message);
  });
  if (!isAdminDbSuccess(result)) return adminDbFailure(result);
  revalidatePath("/", "layout");
  return { success: true as const };
}

export async function fetchCitiesCatalog() {
  const result = await withAdminDb(async (supabase) => {
    const [citiesRes, districtsRes, salonsRes] = await Promise.all([
      supabase.from("cities").select("*").order("name"),
      supabase.from("districts").select("*").order("name"),
      supabase.from("salons").select("city_id"),
    ]);

    if (citiesRes.error) throw new Error(citiesRes.error.message);
    if (districtsRes.error) throw new Error(districtsRes.error.message);
    if (salonsRes.error) throw new Error(salonsRes.error.message);

    const salonCounts = new Map<string, number>();
    for (const row of salonsRes.data || []) {
      const id = row.city_id as string | null;
      if (!id) continue;
      salonCounts.set(id, (salonCounts.get(id) || 0) + 1);
    }

    const districtsById = new Map((districtsRes.data || []).map((d) => [d.id, d]));
    const cities = (citiesRes.data || []).map((city) => ({
      ...city,
      districts: districtsById.get(city.district_id) || null,
      salons: [{ count: salonCounts.get(city.id) || 0 }],
    }));

    return { cities, districts: districtsRes.data || [] };
  });

  if (!isAdminDbSuccess(result)) return adminDbFailure(result);
  return { success: true as const, cities: result.data.cities, districts: result.data.districts };
}

export async function saveCity(input: {
  id?: string;
  name: string;
  slug?: string;
  image_url?: string | null;
  district_id: string;
}) {
  if (!input.name?.trim() || !input.district_id) {
    return { success: false as const, error: "Name and district are required." };
  }

  const payload = {
    name: input.name.trim(),
    slug: slugifyLocation(input.slug || input.name),
    district_id: input.district_id,
  };

  const result = await withAdminDb(async (supabase) => {
    let saved;
    if (input.id) {
      const { data, error } = await supabase
        .from("cities")
        .update(payload)
        .eq("id", input.id)
        .select("*")
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) throw new Error("Update did not apply.");
      saved = data;
    } else {
      const { data, error } = await supabase.from("cities").insert([payload]).select("*").single();
      if (error) throw new Error(error.message);
      saved = data;
    }
    const { data: district, error: districtError } = await supabase
      .from("districts")
      .select("slug")
      .eq("id", saved.district_id)
      .maybeSingle();
    if (districtError) throw new Error(districtError.message);
    if (!district?.slug) throw new Error("Parent district was not found.");
    await syncTerritoryMirror(supabase, {
      name: saved.name,
      slug: saved.slug,
      type: "city",
      parentSlug: district.slug,
    });
    return saved;
  });

  if (!isAdminDbSuccess(result)) return adminDbFailure(result);
  revalidatePath("/", "layout");
  return { success: true as const, city: result.data };
}

export async function deleteCity(id: string) {
  const result = await withAdminDb(async (supabase) => {
    const { error } = await supabase.from("cities").delete().eq("id", id);
    if (error) throw new Error(error.message);
  });
  if (!isAdminDbSuccess(result)) return adminDbFailure(result);
  revalidatePath("/", "layout");
  return { success: true as const };
}
