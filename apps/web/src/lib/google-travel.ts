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

function readCoord(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const n = parseFloat(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function destinationParam(input: {
  latitude?: number | string | null;
  longitude?: number | string | null;
  placeId?: string | null;
  address?: string | null;
}): string | null {
  if (input.placeId?.trim()) return `place_id:${input.placeId.trim()}`;
  const lat = readCoord(input.latitude);
  const lng = readCoord(input.longitude);
  if (lat !== null && lng !== null) return `${lat},${lng}`;
  if (input.address?.trim()) return input.address.trim();
  return null;
}

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.min(1, Math.sqrt(a)));
}

function formatKm(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(meters >= 10000 ? 0 : 1)} km`;
}

function formatMinutes(seconds: number): string {
  const minutes = Math.max(1, Math.round(seconds / 60));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} hr ${rest} min` : `${hours} hr`;
}

function fallbackEstimate(originLat: number, originLng: number, destLat: number, destLng: number): TravelEstimate {
  const meters = haversineMeters(originLat, originLng, destLat, destLng);
  const driving = Math.round((meters / 1000 / 28) * 3600);
  const walking = Math.round((meters / 1000 / 5) * 3600);
  const drivingLeg: TravelLeg = {
    mode: "driving",
    distanceText: formatKm(meters),
    durationText: formatMinutes(driving),
    durationSeconds: driving,
    distanceMeters: Math.round(meters),
  };
  const walkingLeg: TravelLeg = {
    mode: "walking",
    distanceText: formatKm(meters),
    durationText: formatMinutes(walking),
    durationSeconds: walking,
    distanceMeters: Math.round(meters),
  };
  const fastest = driving <= walking ? drivingLeg : walkingLeg;
  return { fastest, options: [drivingLeg, walkingLeg] };
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
  latitude?: number | string | null;
  longitude?: number | string | null;
  placeId?: string | null;
  address?: string | null;
}): Promise<TravelEstimate | null> {
  const destLat = readCoord(input.latitude);
  const destLng = readCoord(input.longitude);
  const apiKey = googleMapsKey();
  const destination = destinationParam(input);

  if (apiKey && destination) {
    const origin = `${input.originLat},${input.originLng}`;
    const legs = (
      await Promise.all(MODE_ORDER.map((mode) => fetchMode(apiKey, origin, destination, mode)))
    ).filter((leg): leg is TravelLeg => Boolean(leg));

    if (legs.length) {
      const fastest = [...legs].sort((a, b) => a.durationSeconds - b.durationSeconds)[0];
      return { fastest, options: legs };
    }
  }

  if (destLat !== null && destLng !== null) {
    return fallbackEstimate(input.originLat, input.originLng, destLat, destLng);
  }

  return null;
}
