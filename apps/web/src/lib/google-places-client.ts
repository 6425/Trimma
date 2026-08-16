import { getGoogleMapsApiKey } from "@/lib/google-place-images";
import { getSiteUrl } from "@/lib/site-url";

export type GoogleTextSearchResult = {
  place_id?: string;
  name?: string;
  formatted_address?: string;
  rating?: number;
  user_ratings_total?: number;
  types?: string[];
  geometry?: { location?: { lat?: number; lng?: number } };
};

export type GooglePlacesSearchPage = {
  places: GoogleTextSearchResult[];
  nextPageToken: string | null;
  status: string;
  errorMessage?: string;
};

function uniqueKeys(preferred?: string | null): string[] {
  return [...new Set([preferred, getGoogleMapsApiKey()].filter((key): key is string => Boolean(key?.trim())))];
}

function googleRequestHeaders(apiKey: string, fieldMask?: string): HeadersInit {
  const site = getSiteUrl();
  const headers: Record<string, string> = {
    Referer: site,
    Origin: site,
  };
  if (fieldMask) {
    headers["Content-Type"] = "application/json";
    headers["X-Goog-Api-Key"] = apiKey;
    headers["X-Goog-FieldMask"] = fieldMask;
  }
  return headers;
}

function mapNewPlaceToTextSearch(place: Record<string, unknown>): GoogleTextSearchResult {
  const location = place.location as { latitude?: number; longitude?: number } | undefined;
  const displayName = place.displayName as { text?: string } | undefined;
  return {
    place_id: String(place.id || "").replace(/^places\//, "") || undefined,
    name: displayName?.text || undefined,
    formatted_address: typeof place.formattedAddress === "string" ? place.formattedAddress : undefined,
    rating: typeof place.rating === "number" ? place.rating : undefined,
    user_ratings_total: typeof place.userRatingCount === "number" ? place.userRatingCount : undefined,
    types: Array.isArray(place.types) ? (place.types as string[]) : undefined,
    geometry:
      location?.latitude != null && location?.longitude != null
        ? { location: { lat: location.latitude, lng: location.longitude } }
        : undefined,
  };
}

async function searchLegacy(
  query: string,
  apiKey: string,
  pageToken?: string | null
): Promise<GooglePlacesSearchPage> {
  const params = new URLSearchParams({ query, key: apiKey });
  if (pageToken) params.set("pagetoken", pageToken);
  const res = await fetch(
    `https://maps.googleapis.com/maps/api/place/textsearch/json?${params.toString()}`,
    { headers: googleRequestHeaders(apiKey), cache: "no-store" }
  );
  const data = (await res.json()) as {
    results?: GoogleTextSearchResult[];
    next_page_token?: string;
    status?: string;
    error_message?: string;
  };
  return {
    places: data.results || [],
    nextPageToken: data.next_page_token || null,
    status: data.status || "UNKNOWN",
    errorMessage: data.error_message,
  };
}

async function searchPlacesNew(
  query: string,
  apiKey: string,
  pageToken?: string | null
): Promise<GooglePlacesSearchPage> {
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: googleRequestHeaders(
      apiKey,
      "places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.types,places.location,nextPageToken"
    ),
    body: JSON.stringify({
      textQuery: query,
      languageCode: "en",
      regionCode: "LK",
      pageSize: 20,
      ...(pageToken ? { pageToken } : {}),
    }),
    cache: "no-store",
  });
  const data = (await res.json()) as {
    places?: Array<Record<string, unknown>>;
    nextPageToken?: string;
    error?: { message?: string; status?: string };
  };
  if (data.error) {
    return {
      places: [],
      nextPageToken: null,
      status: "REQUEST_DENIED",
      errorMessage: data.error.message,
    };
  }
  const places = (data.places || [])
    .map(mapNewPlaceToTextSearch)
    .filter((place) => place.place_id);
  return {
    places,
    nextPageToken: data.nextPageToken || null,
    status: places.length ? "OK" : "ZERO_RESULTS",
  };
}

export async function searchGooglePlacesTextPage(
  query: string,
  apiKey?: string | null,
  pageToken?: string | null
): Promise<GooglePlacesSearchPage> {
  const keys = uniqueKeys(apiKey);
  if (!keys.length) {
    return { places: [], nextPageToken: null, status: "REQUEST_DENIED", errorMessage: "Google API key is not configured." };
  }

  let lastDenied: GooglePlacesSearchPage | null = null;
  for (const key of keys) {
    const legacy = await searchLegacy(query, key, pageToken);
    if (legacy.status === "OK" || legacy.status === "ZERO_RESULTS") return legacy;
    lastDenied = legacy;
    if (legacy.status === "REQUEST_DENIED" || legacy.status === "OVER_QUERY_LIMIT") {
      const next = await searchPlacesNew(query, key, pageToken);
      if (next.status === "OK" || next.status === "ZERO_RESULTS") return next;
      lastDenied = next;
    }
  }

  return lastDenied || { places: [], nextPageToken: null, status: "REQUEST_DENIED" };
}

export function formatGooglePlacesError(page: GooglePlacesSearchPage): string {
  const detail = page.errorMessage ? ` — ${page.errorMessage}` : "";
  return `Google Places API returned error status: ${page.status}${detail}`;
}

const NEW_DETAILS_MASK = [
  "id",
  "displayName",
  "formattedAddress",
  "addressComponents",
  "nationalPhoneNumber",
  "internationalPhoneNumber",
  "websiteUri",
  "googleMapsUri",
  "location",
  "regularOpeningHours",
  "priceLevel",
  "rating",
  "userRatingCount",
  "types",
  "editorialSummary",
  "businessStatus",
  "plusCode",
  "utcOffsetMinutes",
  "reviews",
].join(",");

const PRICE_LEVEL_TO_NUMBER: Record<string, number> = {
  PRICE_LEVEL_FREE: 0,
  PRICE_LEVEL_INEXPENSIVE: 1,
  PRICE_LEVEL_MODERATE: 2,
  PRICE_LEVEL_EXPENSIVE: 3,
  PRICE_LEVEL_VERY_EXPENSIVE: 4,
};

function mapNewPlaceToLegacyProfile(place: Record<string, unknown>): Record<string, unknown> {
  const displayName = place.displayName as { text?: string } | undefined;
  const location = place.location as { latitude?: number; longitude?: number } | undefined;
  const hours = place.regularOpeningHours as
    | { openNow?: boolean; weekdayDescriptions?: string[]; periods?: unknown[] }
    | undefined;
  const editorial = place.editorialSummary as { text?: string } | undefined;
  const plusCode = place.plusCode as { globalCode?: string; compoundCode?: string } | undefined;
  const components = Array.isArray(place.addressComponents)
    ? (place.addressComponents as Array<{ longText?: string; shortText?: string; types?: string[] }>)
    : [];
  const reviews = Array.isArray(place.reviews)
    ? (place.reviews as Array<{
        authorAttribution?: { displayName?: string };
        rating?: number;
        text?: { text?: string };
        relativePublishTimeDescription?: string;
      }>)
    : [];

  return {
    place_id: String(place.id || "").replace(/^places\//, ""),
    name: displayName?.text,
    formatted_address: place.formattedAddress,
    address_components: components.map((component) => ({
      long_name: component.longText || "",
      short_name: component.shortText || "",
      types: component.types || [],
    })),
    formatted_phone_number: place.nationalPhoneNumber,
    international_phone_number: place.internationalPhoneNumber,
    website: place.websiteUri,
    url: place.googleMapsUri,
    geometry:
      location?.latitude != null && location?.longitude != null
        ? { location: { lat: location.latitude, lng: location.longitude } }
        : undefined,
    opening_hours: hours
      ? {
          open_now: hours.openNow,
          weekday_text: hours.weekdayDescriptions,
          periods: hours.periods,
        }
      : undefined,
    price_level:
      typeof place.priceLevel === "string" ? PRICE_LEVEL_TO_NUMBER[place.priceLevel] : undefined,
    rating: place.rating,
    user_ratings_total: place.userRatingCount,
    types: place.types,
    editorial_summary: editorial?.text ? { overview: editorial.text } : undefined,
    business_status: place.businessStatus,
    plus_code: plusCode
      ? { global_code: plusCode.globalCode, compound_code: plusCode.compoundCode }
      : undefined,
    utc_offset: place.utcOffsetMinutes,
    reviews: reviews.map((review) => ({
      author_name: review.authorAttribution?.displayName,
      rating: review.rating,
      text: review.text?.text,
      relative_time_description: review.relativePublishTimeDescription,
    })),
  };
}

export async function fetchGooglePlaceDetailsRaw(
  placeId: string,
  apiKey?: string | null
): Promise<Record<string, unknown> | null> {
  const keys = uniqueKeys(apiKey);
  const id = placeId.trim();
  if (!keys.length || !id) return null;

  for (const key of keys) {
    try {
      const legacyRes = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(id)}&fields=place_id,name,formatted_address,address_components,formatted_phone_number,international_phone_number,website,url,geometry,opening_hours,price_level,rating,user_ratings_total,types,editorial_summary,business_status,plus_code,utc_offset,reviews&key=${key}`,
        { headers: googleRequestHeaders(key), cache: "no-store" }
      );
      const legacyData = (await legacyRes.json()) as {
        status?: string;
        result?: Record<string, unknown>;
      };
      if (legacyData.status === "OK" && legacyData.result) return legacyData.result;

      const newRes = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(id)}`, {
        headers: googleRequestHeaders(key, NEW_DETAILS_MASK),
        cache: "no-store",
      });
      const newData = (await newRes.json()) as Record<string, unknown> & {
        error?: { message?: string };
      };
      if (!newData.error && (newData.id || newData.displayName)) {
        return mapNewPlaceToLegacyProfile(newData);
      }
    } catch (err) {
      console.warn("[fetchGooglePlaceDetailsRaw]", err);
    }
  }

  return null;
}
