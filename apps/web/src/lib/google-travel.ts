import type { TravelMode } from "@/lib/salon-map";

export type TravelLeg = {
  mode: TravelMode;
  distanceText: string;
  durationText: string;
  durationSeconds: number;
  distanceMeters: number;
};

export type TravelEstimate = {
  fastest: TravelLeg;
  options: TravelLeg[];
};

const MODE_ORDER: TravelMode[] = ["driving", "walking", "transit"];

function googleMapsKey(): string | null {
  return process.env.GOOGLE_API || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || null;
}

function destinationParam(input: {
  latitude?: number | null;
  longitude?: number | null;
  placeId?: string | null;
  address?: string | null;
}): string | null {
  if (input.placeId?.trim()) return `place_id:${input.placeId.trim()}`;
  if (
    typeof input.latitude === "number" &&
    typeof input.longitude === "number" &&
    Number.isFinite(input.latitude) &&
    Number.isFinite(input.longitude)
  ) {
    return `${input.latitude},${input.longitude}`;
  }
  if (input.address?.trim()) return input.address.trim();
  return null;
}

async function fetchMode(
  apiKey: string,
  origin: string,
  destination: string,
  mode: TravelMode
): Promise<TravelLeg | null> {
  const url = new URL("https://maps.googleapis.com/maps/api/distancematrix/json");
  url.searchParams.set("origins", origin);
  url.searchParams.set("destinations", destination);
  url.searchParams.set("mode", mode);
  url.searchParams.set("units", "metric");
  url.searchParams.set("key", apiKey);

  const response = await fetch(url.toString(), { cache: "no-store" });
  if (!response.ok) return null;

  const payload = (await response.json()) as {
    status?: string;
    rows?: Array<{
      elements?: Array<{
        status?: string;
        distance?: { text?: string; value?: number };
        duration?: { text?: string; value?: number };
      }>;
    }>;
  };

  const element = payload.rows?.[0]?.elements?.[0];
  if (payload.status !== "OK" || element?.status !== "OK") return null;
  if (!element.distance?.text || !element.duration?.text) return null;

  return {
    mode,
    distanceText: element.distance.text,
    durationText: element.duration.text,
    durationSeconds: Number(element.duration.value) || 0,
    distanceMeters: Number(element.distance.value) || 0,
  };
}

export async function fetchTravelEstimate(input: {
  originLat: number;
  originLng: number;
  latitude?: number | null;
  longitude?: number | null;
  placeId?: string | null;
  address?: string | null;
}): Promise<TravelEstimate | null> {
  const apiKey = googleMapsKey();
  if (!apiKey) return null;

  const destination = destinationParam(input);
  if (!destination) return null;

  const origin = `${input.originLat},${input.originLng}`;
  const legs = (
    await Promise.all(MODE_ORDER.map((mode) => fetchMode(apiKey, origin, destination, mode)))
  ).filter((leg): leg is TravelLeg => Boolean(leg));

  if (!legs.length) return null;

  const fastest = [...legs].sort((a, b) => a.durationSeconds - b.durationSeconds)[0];
  return { fastest, options: legs };
}
