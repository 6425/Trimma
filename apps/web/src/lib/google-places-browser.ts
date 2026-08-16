import { buildListingCaptureGoogleQuery, type GlobalServiceSummary } from "@/lib/listing-generation-categories";

export type BrowserPlaceResult = {
  place_id?: string;
  name?: string;
  formatted_address?: string;
  rating?: number;
  user_ratings_total?: number;
  types?: string[];
  geometry?: { location?: { lat?: number; lng?: number } };
};

function mapNewPlace(place: Record<string, unknown>): BrowserPlaceResult {
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

async function searchPlacesApiNew(query: string, pageToken?: string): Promise<{
  places: BrowserPlaceResult[];
  nextPageToken: string | null;
}> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) throw new Error("Google Maps key is not configured.");

  const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.types,places.location,nextPageToken",
    },
    body: JSON.stringify({
      textQuery: query,
      languageCode: "en",
      regionCode: "LK",
      pageSize: 20,
      ...(pageToken ? { pageToken } : {}),
    }),
  });
  const data = (await response.json()) as {
    places?: Array<Record<string, unknown>>;
    nextPageToken?: string;
    error?: { message?: string };
  };
  if (data.error) {
    throw new Error(data.error.message || "Google Places search was denied.");
  }
  return {
    places: (data.places || []).map(mapNewPlace).filter((place) => place.place_id),
    nextPageToken: data.nextPageToken || null,
  };
}

function loadMapsPlacesLibrary(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Places browser search is only available in the admin UI."));
  }
  const google = (window as Window & { google?: { maps?: { places?: unknown } } }).google;
  if (google?.maps?.places) return Promise.resolve();

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) return Promise.reject(new Error("Google Maps key is not configured."));

  return new Promise((resolve, reject) => {
    const existing = document.querySelector("script[data-trimma-maps-places]");
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Failed to load Google Maps.")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places`;
    script.async = true;
    script.dataset.trimmaMapsPlaces = "1";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Maps."));
    document.head.appendChild(script);
  });
}

type MapsPlaceResult = {
  place_id?: string;
  name?: string;
  formatted_address?: string;
  rating?: number;
  user_ratings_total?: number;
  types?: string[];
  geometry?: { location?: { lat: () => number; lng: () => number } };
};

type MapsPlacesService = {
  textSearch: (
    request: { query: string },
    callback: (
      results: MapsPlaceResult[] | null,
      status: string,
      pagination?: { hasNextPage: boolean; nextPage: () => void }
    ) => void
  ) => void;
};

function getMapsPlacesService(): MapsPlacesService {
  const googleWindow = window as unknown as {
    google?: {
      maps?: {
        places?: {
          PlacesService: {
            new (el: HTMLElement): MapsPlacesService;
          };
        };
      };
    };
  };
  const PlacesService = googleWindow.google?.maps?.places?.PlacesService;
  if (!PlacesService) {
    throw new Error("Google Maps Places is not available.");
  }
  return new PlacesService(document.createElement("div"));
}

async function searchPlacesService(query: string, limit: number): Promise<BrowserPlaceResult[]> {
  await loadMapsPlacesLibrary();
  const service = getMapsPlacesService();
  const collected: BrowserPlaceResult[] = [];

  await new Promise<void>((resolve, reject) => {
    const handlePage = (
      results: MapsPlaceResult[] | null,
      status: string,
      pagination?: { hasNextPage: boolean; nextPage: () => void }
    ) => {
      if (status !== "OK" && status !== "ZERO_RESULTS") {
        reject(new Error(`Google Places search failed (${status}).`));
        return;
      }
      for (const result of results || []) {
        collected.push({
          place_id: result.place_id,
          name: result.name,
          formatted_address: result.formatted_address,
          rating: result.rating,
          user_ratings_total: result.user_ratings_total,
          types: result.types,
          geometry: result.geometry?.location
            ? { location: { lat: result.geometry.location.lat(), lng: result.geometry.location.lng() } }
            : undefined,
        });
      }
      if (collected.length >= limit || !pagination?.hasNextPage) {
        resolve();
        return;
      }
      window.setTimeout(() => pagination.nextPage(), 2100);
    };
    service.textSearch({ query }, handlePage);
  });

  return collected;
}

export async function searchListingPlacesInBrowser(input: {
  categoryName: string;
  city: string;
  district: string;
  province: string;
  globalServices?: GlobalServiceSummary[];
  limit?: number;
}): Promise<{ places: BrowserPlaceResult[]; searchQuery: string }> {
  const searchQuery = buildListingCaptureGoogleQuery(input);
  const limit = !input.limit || input.limit <= 0 ? 60 : Math.max(input.limit, 1);
  const places: BrowserPlaceResult[] = [];

  try {
    let pageToken: string | undefined;
    do {
      const page = await searchPlacesApiNew(searchQuery, pageToken);
      places.push(...page.places);
      pageToken = page.nextPageToken || undefined;
    } while (pageToken && places.length < limit);
  } catch {
    const fallback = await searchPlacesService(searchQuery, limit);
    places.push(...fallback);
  }

  const unique = new Map<string, BrowserPlaceResult>();
  for (const place of places) {
    if (place.place_id && !unique.has(place.place_id)) unique.set(place.place_id, place);
  }

  return {
    searchQuery,
    places: [...unique.values()].slice(0, limit),
  };
}
