import { getGoogleMapsApiKey } from "@/lib/google-place-images";
import { pickGooglePlacePhone } from "@/lib/google-place-details";

export type GooglePlaceProfile = {
  place_id?: string;
  name?: string;
  formatted_address?: string;
  address_components?: Array<{ long_name: string; short_name: string; types: string[] }>;
  formatted_phone_number?: string;
  international_phone_number?: string;
  website?: string;
  url?: string;
  geometry?: { location?: { lat?: number; lng?: number } };
  opening_hours?: {
    open_now?: boolean;
    periods?: unknown[];
    weekday_text?: string[];
  };
  price_level?: number;
  rating?: number;
  user_ratings_total?: number;
  types?: string[];
  editorial_summary?: { overview?: string };
  business_status?: string;
  plus_code?: { compound_code?: string; global_code?: string };
  utc_offset?: number;
  reviews?: Array<{ author_name?: string; rating?: number; text?: string; relative_time_description?: string }>;
};

const GOOGLE_PROFILE_FIELDS = [
  "place_id",
  "name",
  "formatted_address",
  "address_components",
  "formatted_phone_number",
  "international_phone_number",
  "website",
  "url",
  "geometry",
  "opening_hours",
  "price_level",
  "rating",
  "user_ratings_total",
  "types",
  "editorial_summary",
  "business_status",
  "plus_code",
  "utc_offset",
].join(",");

const GOOGLE_TYPE_CATEGORY_MAP: Record<string, string> = {
  hair_care: "Barber Salon",
  barber_shop: "Barber Salon",
  beauty_salon: "Beauty Parlours",
  spa: "Spa & Wellness",
  nail_salon: "Nail Studio",
  skin_care_clinic: "Skincare Clinics",
  gym: "Yoga Studio",
  yoga_studio: "Yoga Studio",
  tattoo_shop: "Tattoo Studio",
};

export function slugifySalonName(value: string): string {
  const base = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return base || `salon-${Date.now()}`;
}

export function inferTrimmaCategoryFromGoogleTypes(
  types: string[] | undefined,
  fallback?: string | null
): string | null {
  if (!types?.length) return fallback?.trim() || null;
  for (const type of types) {
    const mapped = GOOGLE_TYPE_CATEGORY_MAP[type];
    if (mapped) return mapped;
  }
  return fallback?.trim() || null;
}

export function formatGooglePriceLevel(priceLevel?: number | null): string | null {
  if (priceLevel === undefined || priceLevel === null) return null;
  return "$".repeat(Math.max(1, priceLevel));
}

export function formatGoogleWorkingHoursText(
  openingHours?: GooglePlaceProfile["opening_hours"]
): string | null {
  const lines = openingHours?.weekday_text?.filter(Boolean);
  if (lines?.length) return lines.join("\n");
  return null;
}

export function normalizeGoogleWorkingHours(
  openingHours?: GooglePlaceProfile["opening_hours"]
): string | null {
  const text = formatGoogleWorkingHoursText(openingHours);
  if (text) return text;
  if (openingHours?.periods?.length) {
    return JSON.stringify(openingHours.periods);
  }
  return null;
}

function pickAddressComponent(
  components: GooglePlaceProfile["address_components"],
  type: string
): string | null {
  const match = components?.find((c) => c.types?.includes(type));
  return match?.long_name?.trim() || null;
}

export function parseGoogleAddressParts(details: GooglePlaceProfile) {
  const components = details.address_components;
  return {
    city:
      pickAddressComponent(components, "locality") ||
      pickAddressComponent(components, "postal_town") ||
      pickAddressComponent(components, "administrative_area_level_2"),
    district: pickAddressComponent(components, "administrative_area_level_2"),
    province: pickAddressComponent(components, "administrative_area_level_1"),
    postalCode: pickAddressComponent(components, "postal_code"),
  };
}

export function buildGoogleBusinessExtended(details: GooglePlaceProfile): Record<string, unknown> {
  const addressParts = parseGoogleAddressParts(details);
  const hoursText = formatGoogleWorkingHoursText(details.opening_hours);

  return {
    google_place_id: details.place_id || null,
    google_types: details.types || [],
    google_business_status: details.business_status || null,
    google_open_now: details.opening_hours?.open_now ?? null,
    google_weekday_hours: details.opening_hours?.weekday_text || [],
    google_hours_text: hoursText,
    google_plus_code: details.plus_code?.global_code || null,
    google_utc_offset: details.utc_offset ?? null,
    google_last_synced_at: new Date().toISOString(),
    postal_code: addressParts.postalCode,
  };
}

export async function fetchGooglePlaceProfile(
  placeId: string,
  apiKey?: string | null
): Promise<GooglePlaceProfile | null> {
  const key = apiKey || getGoogleMapsApiKey();
  if (!key || !placeId?.trim()) return null;

  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId.trim())}&fields=${GOOGLE_PROFILE_FIELDS}&key=${key}`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.status !== "OK" || !data.result) {
      if (data.status && data.status !== "OK") {
        console.warn(
          `[fetchGooglePlaceProfile] ${placeId}: ${data.status}${data.error_message ? ` — ${data.error_message}` : ""}`
        );
      }
      return null;
    }
    return data.result as GooglePlaceProfile;
  } catch (err) {
    console.error("[fetchGooglePlaceProfile]", err);
    return null;
  }
}

export type GoogleSalonUpsertContext = {
  province?: string | null;
  district?: string | null;
  city?: string | null;
  category?: string | null;
};

export type GoogleTextSearchPlace = {
  place_id?: string;
  name?: string;
  formatted_address?: string;
  rating?: number;
  user_ratings_total?: number;
  types?: string[];
  geometry?: { location?: { lat?: number; lng?: number } };
};

export function mapGoogleTextSearchPlaceToSalonRecord(
  placeId: string,
  place: GoogleTextSearchPlace,
  context: GoogleSalonUpsertContext = {}
) {
  const name = place.name?.trim() || "Unnamed Salon";
  const slug = slugifySalonName(name);
  const category =
    inferTrimmaCategoryFromGoogleTypes(place.types, context.category) || context.category || null;

  return {
    place_id: placeId,
    name,
    slug: `${slug}-${Date.now().toString().slice(-4)}`,
    owner_email: `draft-${slug}-${Date.now().toString().slice(-4)}@trimma.io`,
    province: context.province || "Western Province",
    district: context.district || "Colombo",
    city: context.city || "Colombo",
    address: place.formatted_address || null,
    rating: place.rating ?? null,
    review_count: place.user_ratings_total ?? 0,
    category,
    latitude: place.geometry?.location?.lat ?? null,
    longitude: place.geometry?.location?.lng ?? null,
    source_type: "GOOGLE_PLACES",
    onboarding_status: "DISCOVERED",
    activation_status: "INACTIVE",
    business_info_extended: {
      google_place_id: placeId,
      google_types: place.types || [],
      google_last_synced_at: new Date().toISOString(),
      profile_fetch_status: "text_search_only",
    },
  };
}

export function mapGooglePlaceToSalonRecord(
  placeId: string,
  details: GooglePlaceProfile,
  context: GoogleSalonUpsertContext = {}
) {
  const name = details.name?.trim() || "Unnamed Salon";
  const slug = slugifySalonName(name);
  const addressParts = parseGoogleAddressParts(details);
  const phone = pickGooglePlacePhone(details);
  const category =
    inferTrimmaCategoryFromGoogleTypes(details.types, context.category) || context.category || null;
  const summary = details.editorial_summary?.overview?.trim() || null;
  const workingHours = normalizeGoogleWorkingHours(details.opening_hours);
  const googleExt = buildGoogleBusinessExtended({ ...details, place_id: placeId });

  return {
    place_id: placeId,
    name,
    slug: `${slug}-${Date.now().toString().slice(-4)}`,
    owner_email: `draft-${slug}-${Date.now().toString().slice(-4)}@trimma.io`,
    province: context.province || addressParts.province || "Western Province",
    district: context.district || addressParts.district || "Colombo",
    city: context.city || addressParts.city || "Colombo",
    address: details.formatted_address || null,
    rating: details.rating ?? null,
    review_count: details.user_ratings_total ?? 0,
    phone,
    website: details.website?.trim() || null,
    map_url: details.url?.trim() || null,
    category,
    working_hours: workingHours,
    latitude: details.geometry?.location?.lat ?? null,
    longitude: details.geometry?.location?.lng ?? null,
    price_level: formatGooglePriceLevel(details.price_level),
    summary,
    description: summary,
    source_type: "GOOGLE_PLACES",
    onboarding_status: "DISCOVERED",
    activation_status: "INACTIVE",
    business_info_extended: googleExt,
  };
}

export function mergeGoogleProfileIntoSalonRow(
  existing: Record<string, unknown> | null | undefined,
  incoming: Record<string, unknown>
): Record<string, unknown> {
  if (!existing) return incoming;

  const merged: Record<string, unknown> = { ...incoming };
  merged.slug = existing.slug || incoming.slug;

  const ownerEmail = String(existing.owner_email || "");
  if (ownerEmail && !ownerEmail.startsWith("draft-")) {
    merged.owner_email = existing.owner_email;
  }
  if (existing.owner_gmail) merged.owner_gmail = existing.owner_gmail;
  if (existing.description) merged.description = existing.description;
  else if (incoming.description) merged.description = incoming.description;

  const existingStatus = String(existing.onboarding_status || "");
  if (existingStatus && existingStatus !== "DISCOVERED") {
    merged.onboarding_status = existing.onboarding_status;
    merged.activation_status = existing.activation_status ?? incoming.activation_status;
  }

  if (existing.assign_to) merged.assign_to = existing.assign_to;
  if (existing.phone && !incoming.phone) merged.phone = existing.phone;

  const existingExt =
    existing.business_info_extended &&
    typeof existing.business_info_extended === "object" &&
    !Array.isArray(existing.business_info_extended)
      ? (existing.business_info_extended as Record<string, unknown>)
      : {};
  const incomingExt =
    incoming.business_info_extended &&
    typeof incoming.business_info_extended === "object" &&
    !Array.isArray(incoming.business_info_extended)
      ? (incoming.business_info_extended as Record<string, unknown>)
      : {};

  merged.business_info_extended = { ...existingExt, ...incomingExt };
  return merged;
}

export function prepareSalonDiscoveryUpsertRow(
  row: Record<string, unknown>
): Record<string, unknown> {
  const { id: _omitId, ...rest } = row;
  return rest;
}

/** Columns added after initial discovery rollout — omit when DB patch not applied yet. */
const OPTIONAL_DISCOVERY_COLUMNS = [
  "review_count",
  "business_info_extended",
  "description",
] as const;

export function stripOptionalDiscoveryColumns(
  row: Record<string, unknown>
): Record<string, unknown> {
  const copy = { ...row };
  for (const key of OPTIONAL_DISCOVERY_COLUMNS) {
    delete copy[key];
  }
  return copy;
}

export function isMissingDiscoveryColumnError(error: unknown): boolean {
  const message = String(
    typeof error === "object" && error && "message" in error
      ? (error as { message: unknown }).message
      : error instanceof Error
        ? error.message
        : error
  ).toLowerCase();

  return (
    message.includes("review_count") ||
    message.includes("business_info_extended") ||
    message.includes("could not find") ||
    message.includes("column") && message.includes("salons")
  );
}
