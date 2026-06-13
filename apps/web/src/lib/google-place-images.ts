import type { SupabaseClient } from "@supabase/supabase-js";

export function getGoogleMapsApiKey(): string | null {
  return process.env.GOOGLE_API || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || null;
}

export async function findGooglePlaceId(query: string, apiKey: string): Promise<string | null> {
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`;
  const res = await fetch(url);
  const data = await res.json();

  if (data.status === "OK" && data.results?.[0]?.place_id) {
    return data.results[0].place_id as string;
  }

  return null;
}

export async function fetchPlacePhotoReference(placeId: string, apiKey: string): Promise<string | null> {
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=photos&key=${apiKey}`;
  const res = await fetch(url);
  const data = await res.json();

  const photos = data.result?.photos;
  if (!Array.isArray(photos) || photos.length === 0) {
    return null;
  }

  return photos[0].photo_reference as string;
}

export async function downloadGooglePlacePhoto(
  photoReference: string,
  apiKey: string,
  maxWidth = 1200
): Promise<Buffer> {
  const url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${encodeURIComponent(photoReference)}&key=${apiKey}`;
  const res = await fetch(url, { redirect: "follow" });

  if (!res.ok) {
    throw new Error(`Failed to download Google photo (${res.status})`);
  }

  return Buffer.from(await res.arrayBuffer());
}

export async function uploadSalonImageBuffer(
  supabase: SupabaseClient,
  salonId: string,
  field: "cover" | "hero" | "logo",
  buffer: Buffer
): Promise<string> {
  const fileName = `${salonId}/${field}_${Date.now()}.jpg`;
  const { error } = await supabase.storage.from("salon-images").upload(fileName, buffer, {
    cacheControl: "3600",
    upsert: true,
    contentType: "image/jpeg",
  });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage.from("salon-images").getPublicUrl(fileName);
  return data.publicUrl;
}

type SalonImageSource = {
  id: string;
  name: string;
  address?: string | null;
  city?: string | null;
  district?: string | null;
  place_id?: string | null;
};

export async function syncSalonImagesFromGooglePlace(
  supabase: SupabaseClient,
  salon: SalonImageSource
): Promise<{ cover_url: string; hero_url: string; place_id: string }> {
  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) {
    throw new Error("Google API key is not configured (GOOGLE_API).");
  }

  let placeId = salon.place_id?.trim() || null;
  if (!placeId) {
    const query = [salon.name, salon.address, salon.city, salon.district, "Sri Lanka"]
      .filter((part) => Boolean(part && String(part).trim()))
      .join(", ");
    placeId = await findGooglePlaceId(query, apiKey);
  }

  if (!placeId) {
    throw new Error(`Could not find a Google Place match for "${salon.name}".`);
  }

  const photoReference = await fetchPlacePhotoReference(placeId, apiKey);
  if (!photoReference) {
    throw new Error(`Google Place found for "${salon.name}" but no photos are available.`);
  }

  const buffer = await downloadGooglePlacePhoto(photoReference, apiKey);
  const coverUrl = await uploadSalonImageBuffer(supabase, salon.id, "cover", buffer);
  const heroUrl = await uploadSalonImageBuffer(supabase, salon.id, "hero", buffer);

  return {
    cover_url: coverUrl,
    hero_url: heroUrl,
    place_id: placeId,
  };
}
