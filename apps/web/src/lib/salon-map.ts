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

export function getSalonDirectionsUrl(salon: SalonMapInput): string | null {
  const lat = parseCoord(salon.latitude);
  const lng = parseCoord(salon.longitude);

  if (salon.map_url?.trim()) {
    return salon.map_url.trim();
  }

  if (lat !== null && lng !== null) {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  }

  if (salon.place_id?.trim()) {
    return `https://www.google.com/maps/dir/?api=1&destination=place_id:${encodeURIComponent(salon.place_id.trim())}`;
  }

  const address = getSalonFullAddress(salon);
  if (address) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
  }

  return null;
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
