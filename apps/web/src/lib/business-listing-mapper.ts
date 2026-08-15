import { optimizeListingImageUrl } from "@/lib/optimize-image-url";
import { isSalonClaimable } from "@/lib/salon-public-listing";
import { readSalonSocialLinks } from "@/lib/salon-public-social";
import { getSalonListingImage, mapVerifiedSalonListingStats } from "@/lib/salons-mapper";
import { getSalonMapEmbedUrl, salonHasMapData } from "@/lib/salon-map";

export type BusinessListingCardData = {
  id: string;
  slug: string;
  name: string;
  image: string;
  phone: string | null;
  rating: number;
  reviews: number;
  city: string;
  district: string;
  province: string;
  location: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  placeId: string | null;
  category: string;
  website: string | null;
  mapUrl: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  isClaimable: boolean;
};

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1621605815971-fbc98d665033?q=80&w=600&auto=format&fit=crop",
];

function readExtendedString(row: Record<string, unknown>, key: string): string | null {
  const ext = row.business_info_extended;
  if (!ext || typeof ext !== "object" || Array.isArray(ext)) return null;
  const value = (ext as Record<string, unknown>)[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeExternalUrl(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  const trimmed = value.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  return `https://${trimmed}`;
}

function parseCoord(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : parseFloat(String(value));
  return Number.isFinite(n) ? n : null;
}

function isBusinessListingClaimable(row: Record<string, unknown>): boolean {
  if (row.is_verified) return false;
  const status = String(row.onboarding_status || "");
  if (["VERIFIED", "PENDING_ADMIN_VERIFICATION", "OWNER_ACTIVATED"].includes(status)) {
    return false;
  }
  if (status === "LISTING_PUBLISHED" || status === "LISTING_CAPTURED") {
    return true;
  }
  if (String(row.source_type || "") === "LISTING_GENERATION") {
    return true;
  }
  return isSalonClaimable(row);
}

function formatBusinessListingLocation(city: string, district: string, province: string): string {
  const parts = [city, district, province].filter(Boolean);
  return parts.length ? parts.join(", ") : "Sri Lanka";
}

export function mapSalonRowToBusinessListing(row: Record<string, unknown>, idx = 0): BusinessListingCardData {
  const city = String(row.city || "").trim();
  const district = String(row.district || "").trim();
  const province = String(row.province || "").trim();
  const location = formatBusinessListingLocation(city, district, province);
  const { rating, reviews } = mapVerifiedSalonListingStats(row);
  const social = readSalonSocialLinks(row);
  const phone = String(row.phone || "").trim() || null;
  const website =
    normalizeExternalUrl(String(row.website || "")) ||
    normalizeExternalUrl(readExtendedString(row, "google_website"));
  const mapUrl =
    normalizeExternalUrl(String(row.map_url || "")) ||
    normalizeExternalUrl(readExtendedString(row, "google_maps_url"));
  const instagramUrl =
    normalizeExternalUrl(readExtendedString(row, "instagram_url")) ||
    normalizeExternalUrl(readExtendedString(row, "google_instagram_url"));
  const address = String(row.address || readExtendedString(row, "google_address") || "").trim() || null;
  const latitude =
    parseCoord(row.latitude as number | string | null | undefined) ??
    parseCoord(readExtendedString(row, "latitude"));
  const longitude =
    parseCoord(row.longitude as number | string | null | undefined) ??
    parseCoord(readExtendedString(row, "longitude"));
  const placeId = String(row.place_id || readExtendedString(row, "google_place_id") || "").trim() || null;

  return {
    id: String(row.id),
    slug: String(row.slug || row.id),
    name: String(row.name || "Unnamed business"),
    image: optimizeListingImageUrl(
      getSalonListingImage(row, FALLBACK_IMAGES[idx % FALLBACK_IMAGES.length]),
      640
    ),
    phone,
    rating,
    reviews,
    city,
    district,
    province,
    location,
    address,
    latitude,
    longitude,
    placeId,
    category: String(row.category || "Beauty salon"),
    website,
    mapUrl,
    facebookUrl: social.facebookUrl,
    instagramUrl,
    isClaimable: isBusinessListingClaimable(row),
  };
}

export function listingHasMapDisplay(listing: BusinessListingCardData): boolean {
  return salonHasMapData({
    name: listing.name,
    address: listing.address,
    city: listing.city,
    district: listing.district,
    province: listing.province,
    place_id: listing.placeId,
    latitude: listing.latitude,
    longitude: listing.longitude,
    map_url: listing.mapUrl,
  });
}

export function getListingMapEmbedUrl(listing: BusinessListingCardData): string | null {
  return getSalonMapEmbedUrl({
    name: listing.name,
    address: listing.address,
    city: listing.city,
    district: listing.district,
    province: listing.province,
    place_id: listing.placeId,
    latitude: listing.latitude,
    longitude: listing.longitude,
    map_url: listing.mapUrl,
  });
}
