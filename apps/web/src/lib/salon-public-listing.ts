import { normalizeEmail } from "@/lib/normalize-email";
import { isSalonApprovedForBookings } from "@/lib/salon-bookability";

export type PublicVisibility = "hidden" | "public" | "preview";

/** Normalize legacy boolean / string public_visibility values. */
export function normalizePublicVisibility(value: unknown): PublicVisibility {
  if (value === false || value === "false" || value === "hidden") return "hidden";
  if (value === "preview") return "preview";
  if (value === "public" || value === true || value === "true") return "public";
  return "hidden";
}

export function isDraftOwnerEmail(email: string | null | undefined): boolean {
  const normalized = normalizeEmail(email || "");
  if (!normalized) return false;
  return normalized.startsWith("draft-") && normalized.endsWith("@trimma.io");
}

export function isSalonClaimable(salon: {
  owner_email?: string | null;
  owner_gmail?: string | null;
  is_verified?: boolean | null;
  onboarding_status?: string | null;
}): boolean {
  if (salon.is_verified) return false;
  const status = String(salon.onboarding_status || "");
  if (["VERIFIED", "PENDING_ADMIN_VERIFICATION", "OWNER_ACTIVATED"].includes(status)) {
    return false;
  }
  const gmail = salon.owner_gmail?.trim();
  if (gmail && !isDraftOwnerEmail(gmail)) return false;
  const ownerEmail = salon.owner_email?.trim();
  if (ownerEmail && !isDraftOwnerEmail(ownerEmail)) return false;
  return true;
}

/** Whether a salon should appear in marketplace search / browse. */
export function isSalonPubliclyListable(salon: {
  status?: string | null;
  public_visibility?: unknown;
  is_verified?: boolean | null;
  booking_enabled?: boolean | null;
  source_type?: string | null;
  onboarding_status?: string | null;
}): boolean {
  const status = String(salon.status || "").toLowerCase();
  if (status === "inactive" || status === "rejected") return false;

  const visibility = normalizePublicVisibility(salon.public_visibility);
  if (visibility === "public" || visibility === "preview") return true;

  const onboardingStatus = String(salon.onboarding_status || "");
  if (onboardingStatus === "LISTING_PUBLISHED") return true;

  if (salon.is_verified && status === "active") return true;
  if (salon.booking_enabled && status === "active") return true;

  return false;
}

/** Browse/discovery listings only — excludes admin-approved salons (those live on /bookings). */
export function isSalonPublicBrowseListing(salon: {
  status?: string | null;
  public_visibility?: unknown;
  is_verified?: boolean | null;
  booking_enabled?: boolean | null;
  source_type?: string | null;
  onboarding_status?: string | null;
}): boolean {
  if (isSalonApprovedForBookings(salon)) return false;
  return isSalonPubliclyListable(salon);
}

export type GooglePlaceReviewSnippet = {
  author_name?: string;
  rating?: number;
  text?: string;
  relative_time_description?: string;
};

export function readGooglePlaceReviews(
  businessInfoExtended: unknown
): GooglePlaceReviewSnippet[] {
  if (!businessInfoExtended || typeof businessInfoExtended !== "object" || Array.isArray(businessInfoExtended)) {
    return [];
  }
  const raw = (businessInfoExtended as Record<string, unknown>).google_reviews;
  if (!Array.isArray(raw)) return [];
  return raw.filter((item) => item && typeof item === "object") as GooglePlaceReviewSnippet[];
}

export function resolvePublicSalonRatingDisplay(
  salon: { rating?: number | string | null; review_count?: number | string | null },
  trimmaReviewCount: number,
  trimmaAverageRating: number
): { averageRating: number; totalReviews: number; source: "trimma" | "google" | "none" } {
  if (trimmaReviewCount > 0 && trimmaAverageRating > 0) {
    return {
      averageRating: trimmaAverageRating,
      totalReviews: trimmaReviewCount,
      source: "trimma",
    };
  }

  const googleCount = Math.max(0, Number(salon.review_count) || 0);
  const googleRating = Number(salon.rating) || 0;
  if (googleCount > 0 && googleRating > 0) {
    return {
      averageRating: parseFloat(googleRating.toFixed(1)),
      totalReviews: googleCount,
      source: "google",
    };
  }

  return { averageRating: 0, totalReviews: 0, source: "none" };
}

export function buildSalonClaimLoginUrl(salonId: string, redirectTo = "/dashboard/profile"): string {
  const params = new URLSearchParams({
    intent: "salon-owner",
    salon: salonId,
    redirectTo,
  });
  return `/login?${params.toString()}`;
}

/** Default row shape for Google Places auto-listings (SEO browse-only, no booking). */
export const GOOGLE_DISCOVERY_SALON_DEFAULTS = {
  status: "active",
  public_visibility: "public",
  booking_enabled: false,
  is_verified: false,
  source_type: "GOOGLE_PLACES",
  onboarding_status: "DISCOVERED",
  activation_status: "INACTIVE",
} as const;
