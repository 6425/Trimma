"use server";

import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { requirePlatformAdminFromCookies } from "@/lib/server-admin-auth";
import { syncSalonImagesFromGooglePlace } from "@/lib/google-place-images";

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

    const { error: updateError } = await supabase
      .from("salons")
      .update({
        cover_url: images.cover_url,
        hero_url: images.hero_url,
        place_id: salon.place_id || images.place_id,
      })
      .eq("id", salonId);

    if (updateError) throw new Error(updateError.message);

    return {
      success: true as const,
      cover_url: images.cover_url,
      hero_url: images.hero_url,
      place_id: images.place_id,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to refresh salon images.";
    return { success: false as const, error: message };
  }
}
