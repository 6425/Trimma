"use server";

import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { requirePlatformAdminFromCookies } from "@/lib/server-admin-auth";
import { requireAgentFromCookies } from "@/lib/server-agent-auth";
import {
  fetchGooglePlaceProfile,
  mapGooglePlaceToSalonRecord,
  mergeGoogleProfileIntoSalonRow,
} from "@/lib/google-place-profile";
import { syncSalonImagesFromGooglePlace } from "@/lib/google-place-images";

const DISCOVERY_EXPORT_COLUMNS =
  "id, name, slug, category, address, city, district, province, phone, website, owner_email, owner_gmail, map_url, place_id, rating, review_count, price_level, latitude, longitude, working_hours, summary, description, onboarding_status, assign_to, source_type, status, created_at, business_info_extended";

export async function fetchDiscoveryExportSalons(input?: {
  onboardingStatus?: string[];
  search?: string;
  salonIds?: string[];
}) {
  const adminAuth = await requirePlatformAdminFromCookies();
  if ("error" in adminAuth) return { success: false as const, error: adminAuth.error };

  const supabase = createSupabaseAdminClient();
  let query = supabase.from("salons").select(DISCOVERY_EXPORT_COLUMNS).order("created_at", { ascending: false });

  if (input?.salonIds?.length) {
    query = query.in("id", input.salonIds);
  } else if (input?.onboardingStatus?.length) {
    query = query.in("onboarding_status", input.onboardingStatus);
  }

  if (input?.search?.trim()) {
    const term = input.search.trim();
    query = query.or(
      `name.ilike.%${term}%,phone.ilike.%${term}%,address.ilike.%${term}%,category.ilike.%${term}%`
    );
  }

  const { data, error } = await query;
  if (error) return { success: false as const, error: error.message };
  return { success: true as const, rows: data || [] };
}

export async function fetchAgentDiscoveryExportSalons(input?: {
  search?: string;
  salonIds?: string[];
}) {
  const auth = await requireAgentFromCookies();
  if ("error" in auth) return { success: false as const, error: auth.error };

  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from("salons")
    .select(DISCOVERY_EXPORT_COLUMNS)
    .order("created_at", { ascending: false });

  if (auth.role === "agent") {
    query = query.eq("assign_to", auth.email);
  }

  if (input?.salonIds?.length) {
    query = query.in("id", input.salonIds);
  }

  if (input?.search?.trim()) {
    const term = input.search.trim();
    query = query.or(
      `name.ilike.%${term}%,phone.ilike.%${term}%,address.ilike.%${term}%,category.ilike.%${term}%`
    );
  }

  const { data, error } = await query;
  if (error) return { success: false as const, error: error.message };
  return { success: true as const, rows: data || [] };
}

export async function refreshSalonFromGoogleBusiness(salonId: string) {
  const adminAuth = await requirePlatformAdminFromCookies();
  const agentAuth = "error" in adminAuth ? await requireAgentFromCookies() : null;

  if ("error" in adminAuth && agentAuth && "error" in agentAuth) {
    return { success: false as const, error: adminAuth.error };
  }

  const supabase = createSupabaseAdminClient();
  const { data: salon, error } = await supabase
    .from("salons")
    .select("id, place_id, name, slug, assign_to, owner_email, owner_gmail, description, onboarding_status, activation_status, business_info_extended")
    .eq("id", salonId)
    .maybeSingle();

  if (error || !salon) {
    return { success: false as const, error: error?.message || "Salon not found." };
  }

  if (agentAuth && !("error" in agentAuth) && agentAuth.role === "agent") {
    if (salon.assign_to !== agentAuth.email) {
      return { success: false as const, error: "You can only refresh salons assigned to you." };
    }
  }

  if (!salon.place_id?.trim()) {
    return { success: false as const, error: "This salon has no Google Place ID." };
  }

  const profile = await fetchGooglePlaceProfile(salon.place_id);
  if (!profile) {
    return { success: false as const, error: "Could not fetch Google Business profile." };
  }

  const incoming = mapGooglePlaceToSalonRecord(salon.place_id, profile, {
    province: null,
    district: null,
    city: null,
    category: null,
  });
  const merged = mergeGoogleProfileIntoSalonRow(salon, incoming);
  delete merged.id;

  const { error: updateError } = await supabase.from("salons").update(merged).eq("id", salonId);
  if (updateError) return { success: false as const, error: updateError.message };

  try {
    const images = await syncSalonImagesFromGooglePlace(supabase, {
      id: salonId,
      name: String(merged.name || salon.name),
      address: String(merged.address || ""),
      city: String(merged.city || ""),
      district: String(merged.district || ""),
      place_id: salon.place_id,
    });
    await supabase
      .from("salons")
      .update({ cover_url: images.cover_url, hero_url: images.hero_url })
      .eq("id", salonId);
  } catch (imageErr) {
    console.warn("[refreshSalonFromGoogleBusiness] image sync skipped:", imageErr);
  }

  return { success: true as const };
}
