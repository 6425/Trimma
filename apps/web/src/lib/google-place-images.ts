import type { SupabaseClient } from "@supabase/supabase-js";
import sharp from "sharp";
import {
  SALON_HERO_IMAGE_HEIGHT,
  SALON_HERO_IMAGE_WIDTH,
} from "@/lib/salon-hero-image";

/** Public listing gallery cap for Google-sourced discovery photos. */
export const GOOGLE_PLACE_LISTING_IMAGE_LIMIT = 9;

type GooglePlacePhotoReference =
  | { legacyReference: string }
  | { mediaName: string };

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
  const refs = await fetchPlacePhotoReferences(placeId, apiKey, 1);
  const first = refs[0];
  if (!first) return null;
  return "legacyReference" in first ? first.legacyReference : first.mediaName;
}

export async function fetchPlacePhotoReferences(
  placeId: string,
  apiKey: string,
  limit = GOOGLE_PLACE_LISTING_IMAGE_LIMIT
): Promise<GooglePlacePhotoReference[]> {
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=photos&key=${apiKey}`;
  try {
    const res = await fetch(url);
    const data = await res.json();

    const photos = data.result?.photos;
    if (Array.isArray(photos) && photos.length) {
      return photos
        .slice(0, Math.max(1, Math.min(limit, GOOGLE_PLACE_LISTING_IMAGE_LIMIT)))
        .map((photo: { photo_reference?: string }) => photo.photo_reference)
        .filter((ref: string | undefined): ref is string => Boolean(ref))
        .map((legacyReference) => ({ legacyReference }));
    }
  } catch {
    // Fall through to the current Places API below.
  }

  // New Places API is what current discovery uses. Legacy photo references
  // are unavailable for projects that only enable the current Places API.
  const newRes = await fetch(
    `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,
    {
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "photos",
      },
    }
  );
  if (!newRes.ok) return [];
  const newData = (await newRes.json()) as { photos?: Array<{ name?: string }> };
  return (newData.photos || [])
    .slice(0, Math.max(1, Math.min(limit, GOOGLE_PLACE_LISTING_IMAGE_LIMIT)))
    .map((photo) => photo.name?.trim())
    .filter((mediaName): mediaName is string => Boolean(mediaName))
    .map((mediaName) => ({ mediaName }));
}

export async function downloadGooglePlacePhoto(
  photoReference: GooglePlacePhotoReference,
  apiKey: string,
  maxWidth = 1200
): Promise<Buffer> {
  const res = "legacyReference" in photoReference
    ? await fetch(
        `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${encodeURIComponent(photoReference.legacyReference)}&key=${apiKey}`,
        { redirect: "follow" }
      )
    : await fetch(
        `https://places.googleapis.com/v1/${photoReference.mediaName}/media?maxWidthPx=${maxWidth}&maxHeightPx=900`,
        {
          headers: { "X-Goog-Api-Key": apiKey },
          redirect: "follow",
        }
      );

  if (!res.ok) {
    throw new Error(`Failed to download Google photo (${res.status})`);
  }

  const source = Buffer.from(await res.arrayBuffer());
  return sharp(source)
    .rotate()
    .resize(SALON_HERO_IMAGE_WIDTH, SALON_HERO_IMAGE_HEIGHT, {
      fit: "cover",
      position: "attention",
    })
    .jpeg({ quality: 86, mozjpeg: true })
    .toBuffer();
}

export async function uploadSalonImageBuffer(
  supabase: SupabaseClient,
  salonId: string,
  field: string,
  buffer: Buffer
): Promise<string> {
  const safeField = field.replace(/[^a-z0-9_-]+/gi, "_");
  const fileName = `${salonId}/${safeField}_${Date.now()}.jpg`;
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

export type SalonGoogleImageSyncResult = {
  cover_url: string;
  hero_url: string;
  featured_images: string[];
  place_id: string;
  photo_count: number;
};

export type GoogleImageSyncStats = {
  synced: number;
  failed: number;
  skipped: number;
  photos: number;
};

export async function syncSalonImagesFromGooglePlace(
  supabase: SupabaseClient,
  salon: SalonImageSource,
  options?: { maxPhotos?: number; apiKey?: string | null }
): Promise<SalonGoogleImageSyncResult | null> {
  const apiKey = options?.apiKey || getGoogleMapsApiKey();
  if (!apiKey) {
    throw new Error("Google API key is not configured (GOOGLE_API).");
  }

  const maxPhotos = Math.min(
    Math.max(options?.maxPhotos ?? GOOGLE_PLACE_LISTING_IMAGE_LIMIT, 1),
    GOOGLE_PLACE_LISTING_IMAGE_LIMIT
  );

  let placeId = salon.place_id?.trim() || null;
  if (!placeId) {
    const query = [salon.name, salon.address, salon.city, salon.district, "Sri Lanka"]
      .filter((part) => Boolean(part && String(part).trim()))
      .join(", ");
    placeId = await findGooglePlaceId(query, apiKey);
  }

  if (!placeId) {
    return null;
  }

  const photoReferences = await fetchPlacePhotoReferences(placeId, apiKey, maxPhotos);
  if (!photoReferences.length) {
    return null;
  }

  const uploadedUrls: string[] = [];
  for (let index = 0; index < photoReferences.length; index += 1) {
    const buffer = await downloadGooglePlacePhoto(photoReferences[index], apiKey);
    const publicUrl = await uploadSalonImageBuffer(
      supabase,
      salon.id,
      index === 0 ? "hero" : `featured_${index}`,
      buffer
    );
    uploadedUrls.push(publicUrl);
  }

  const heroUrl = uploadedUrls[0];
  return {
    cover_url: heroUrl,
    hero_url: heroUrl,
    featured_images: uploadedUrls,
    place_id: placeId,
    photo_count: uploadedUrls.length,
  };
}

export async function applySalonGoogleImageSync(
  supabase: SupabaseClient,
  salonId: string,
  images: SalonGoogleImageSyncResult,
  existingPlaceId?: string | null
): Promise<void> {
  const { error } = await supabase
    .from("salons")
    .update({
      cover_url: images.cover_url,
      hero_url: images.hero_url,
      hero_image: images.hero_url,
      featured_images: images.featured_images,
      place_id: existingPlaceId?.trim() || images.place_id,
    })
    .eq("id", salonId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function syncGoogleImagesForSalonIds(
  supabase: SupabaseClient,
  salonIds: string[],
  options?: { maxPhotos?: number; apiKey?: string | null; delayMs?: number }
): Promise<GoogleImageSyncStats> {
  const stats: GoogleImageSyncStats = { synced: 0, failed: 0, skipped: 0, photos: 0 };
  if (!salonIds.length) return stats;

  const apiKey = options?.apiKey || getGoogleMapsApiKey();
  if (!apiKey) {
    throw new Error("Google API key is not configured (GOOGLE_API).");
  }

  const { data: salons, error } = await supabase
    .from("salons")
    .select("id, name, address, city, district, place_id")
    .in("id", salonIds);

  if (error) throw error;

  for (const salon of salons || []) {
    try {
      const images = await syncSalonImagesFromGooglePlace(supabase, salon, {
        maxPhotos: options?.maxPhotos,
        apiKey,
      });

      if (!images) {
        stats.skipped += 1;
        continue;
      }

      await applySalonGoogleImageSync(supabase, salon.id, images, salon.place_id);
      stats.synced += 1;
      stats.photos += images.photo_count;
    } catch (imageErr) {
      console.warn("[syncGoogleImagesForSalonIds] skipped:", salon.id, imageErr);
      stats.failed += 1;
    }

    if (options?.delayMs && options.delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, options.delayMs));
    }
  }

  return stats;
}

export async function syncGoogleImagesForPlaceIds(
  supabase: SupabaseClient,
  placeIds: string[],
  options?: { maxPhotos?: number; apiKey?: string | null; delayMs?: number }
): Promise<GoogleImageSyncStats> {
  const uniquePlaceIds = [...new Set(placeIds.map((id) => id.trim()).filter(Boolean))];
  if (!uniquePlaceIds.length) {
    return { synced: 0, failed: 0, skipped: 0, photos: 0 };
  }

  const { data: salons, error } = await supabase
    .from("salons")
    .select("id")
    .in("place_id", uniquePlaceIds);

  if (error) throw error;

  return syncGoogleImagesForSalonIds(
    supabase,
    (salons || []).map((row) => String(row.id)),
    options
  );
}
