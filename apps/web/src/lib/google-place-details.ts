import { getGoogleMapsApiKey } from "@/lib/google-place-images";

export type GooglePlaceContactDetails = {
  formatted_address: string | null;
  formatted_phone_number: string | null;
  international_phone_number: string | null;
  website: string | null;
  url: string | null;
};

export function pickGooglePlacePhone(
  details:
    | {
        international_phone_number?: string | null;
        formatted_phone_number?: string | null;
      }
    | null
    | undefined
): string | null {
  if (!details) return null;
  return (
    details.international_phone_number?.trim() ||
    details.formatted_phone_number?.trim() ||
    null
  );
}

export async function fetchGooglePlaceContactDetails(
  placeId: string,
  apiKey?: string | null
): Promise<GooglePlaceContactDetails | null> {
  const key = apiKey || getGoogleMapsApiKey();
  if (!key || !placeId?.trim()) return null;

  const fields = [
    "formatted_address",
    "formatted_phone_number",
    "international_phone_number",
    "website",
    "url",
  ].join(",");

  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=${fields}&key=${key}`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.status !== "OK" || !data.result) return null;
    return data.result as GooglePlaceContactDetails;
  } catch (err) {
    console.error("[fetchGooglePlaceContactDetails]", err);
    return null;
  }
}
