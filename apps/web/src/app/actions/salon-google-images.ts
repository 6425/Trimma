"use server";

import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { requirePlatformAdminFromCookies } from "@/lib/server-admin-auth";
import { syncSalonImagesFromGooglePlace, applySalonGoogleImageSync } from "@/lib/google-place-images";

export async function refreshSalonGooglePlaceImages(salonId: string) {
  const auth = await requirePlatformAdminFromCookies();
  if ("error" in auth) {
    return { success: false as const, error: auth.error };
  }

  const supabase = createSupabaseAdminClient();

  try {
    const { data: salon, error } = await supabase
      .from("salons")
      .select("id, name, address, city, district, place_id, cover_url, hero_url")
      .eq("id", salonId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!salon) {
      return { success: false as const, error: "Salon not found." };
    }

    const images = await syncSalonImagesFromGooglePlace(supabase, salon);
    if (!images) {
      return { success: false as const, error: "Google Place found but no photos are available." };
    }

    await applySalonGoogleImageSync(supabase, salonId, images, salon.place_id);

    return {
      success: true as const,
      cover_url: images.cover_url,
      hero_url: images.hero_url,
      featured_images: images.featured_images,
      place_id: images.place_id,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to refresh salon images.";
    return { success: false as const, error: message };
  }
}
