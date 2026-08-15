export type TravelMode = "driving" | "walking" | "transit";

export type SalonMapInput = {
  name?: string | null;
  address?: string | null;
  city?: string | null;
  district?: string | null;
  province?: string | null;
  place_id?: string | null;
  map_url?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
};

function parseCoord(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

export function getSalonFullAddress(salon: SalonMapInput & { location?: string | null }): string {
  const parts = [
    salon.address,
    (salon as { location?: string }).location,
    salon.city,
    salon.district,
    salon.province,
  ].filter((p): p is string => Boolean(p && String(p).trim()));
  if (parts.length > 0) return parts.join(", ");
  return salon.name?.trim() || "Salon location";
}

export function getSalonDirectionsUrl(
  salon: SalonMapInput,
  origin?: { lat: number; lng: number } | null,
  travelMode: TravelMode = "driving"
): string | null {
  const lat = parseCoord(salon.latitude);
  const lng = parseCoord(salon.longitude);
  const originParam =
    origin && Number.isFinite(origin.lat) && Number.isFinite(origin.lng)
      ? `&origin=${origin.lat},${origin.lng}`
      : "";
  const modeParam = `&travelmode=${travelMode}`;

  if (lat !== null && lng !== null) {
    return `https://www.google.com/maps/dir/?api=1${originParam}&destination=${lat},${lng}${modeParam}`;
  }

  if (salon.place_id?.trim()) {
    return `https://www.google.com/maps/dir/?api=1${originParam}&destination=place_id:${encodeURIComponent(salon.place_id.trim())}${modeParam}`;
  }

  const address = getSalonFullAddress(salon);
  if (address) {
    return `https://www.google.com/maps/dir/?api=1${originParam}&destination=${encodeURIComponent(address)}${modeParam}`;
  }

  if (salon.map_url?.trim()) {
    return salon.map_url.trim();
  }

  return null;
}

function destinationQuery(salon: SalonMapInput): string | null {
  const lat = parseCoord(salon.latitude);
  const lng = parseCoord(salon.longitude);
  if (salon.place_id?.trim()) return `place_id:${salon.place_id.trim()}`;
  if (lat !== null && lng !== null) return `${lat},${lng}`;
  const address = getSalonFullAddress(salon);
  return address || null;
}

/** Directions embed from the visitor's location to the salon (API key preferred). */
export function getSalonDirectionsEmbedUrl(
  salon: SalonMapInput,
  origin: { lat: number; lng: number },
  travelMode: TravelMode = "driving"
): string | null {
  const destination = destinationQuery(salon);
  if (!destination) return null;

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (apiKey) {
    return `https://www.google.com/maps/embed/v1/directions?key=${apiKey}&origin=${origin.lat},${origin.lng}&destination=${encodeURIComponent(destination)}&mode=${travelMode}`;
  }

  return `https://www.google.com/maps?saddr=${origin.lat},${origin.lng}&daddr=${encodeURIComponent(destination)}&mode=${travelMode}&output=embed`;
}

/** Embed URL for an iframe (no API key required). */
export function getSalonMapEmbedUrl(salon: SalonMapInput): string | null {
  const lat = parseCoord(salon.latitude);
  const lng = parseCoord(salon.longitude);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (apiKey) {
    if (salon.place_id?.trim()) {
      return `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=place_id:${encodeURIComponent(salon.place_id.trim())}&zoom=16`;
    }
    if (lat !== null && lng !== null) {
      return `https://www.google.com/maps/embed/v1/view?key=${apiKey}&center=${lat},${lng}&zoom=16`;
    }
    const address = getSalonFullAddress(salon);
    if (address) {
      return `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodeURIComponent(address)}&zoom=16`;
    }
  }

  if (lat !== null && lng !== null) {
    return `https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed`;
  }

  if (salon.place_id?.trim()) {
    return `https://maps.google.com/maps?q=place_id:${encodeURIComponent(salon.place_id.trim())}&z=16&output=embed`;
  }

  const address = getSalonFullAddress(salon);
  if (address) {
    return `https://maps.google.com/maps?q=${encodeURIComponent(address)}&z=16&output=embed`;
  }

  return null;
}

export function salonHasMapData(salon: SalonMapInput | null | undefined): boolean {
  if (!salon) return false;
  return Boolean(
    getSalonMapEmbedUrl(salon) ||
      getSalonDirectionsUrl(salon) ||
      salon.address?.trim()
  );
}
