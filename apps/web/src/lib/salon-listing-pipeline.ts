/**
 * Admin-driven marketplace listing pipeline (separate from agent field onboarding).
 *
 * Capture → publish browse-only listing → (optional) owner claim or salon request
 * → shared booking onboarding (OWNER_INVITED → … → VERIFIED).
 */

export const LISTING_ONBOARDING_STATUS = {
  /** Google/manual data captured; not on public marketplace yet. */
  CAPTURED: "LISTING_CAPTURED",
  /** Live on Trimma browse/search by category + location; booking off. */
  PUBLISHED: "LISTING_PUBLISHED",
} as const;

export type ListingOnboardingStatus =
  (typeof LISTING_ONBOARDING_STATUS)[keyof typeof LISTING_ONBOARDING_STATUS];

/** Statuses that belong to the listing-generation pipeline (not agent CRM). */
export const LISTING_PIPELINE_STATUSES = new Set<string>([
  LISTING_ONBOARDING_STATUS.CAPTURED,
  LISTING_ONBOARDING_STATUS.PUBLISHED,
]);

/** Shared booking activation path — both listing claim and salon requests enter here. */
export const BOOKING_ONBOARDING_ENTRY_STATUS = "OWNER_INVITED";

export function isListingPipelineSalon(salon: {
  source_type?: string | null;
  onboarding_status?: string | null;
}): boolean {
  if (salon.source_type === "LISTING_GENERATION") return true;
  const status = String(salon.onboarding_status || "");
  return LISTING_PIPELINE_STATUSES.has(status);
}

export function isListingPublished(salon: {
  onboarding_status?: string | null;
  public_visibility?: unknown;
}): boolean {
  if (salon.onboarding_status === LISTING_ONBOARDING_STATUS.PUBLISHED) return true;
  return false;
}

export function listingPipelineLabel(status: string | null | undefined): string {
  switch (status) {
    case LISTING_ONBOARDING_STATUS.CAPTURED:
      return "Captured — not published";
    case LISTING_ONBOARDING_STATUS.PUBLISHED:
      return "Published on marketplace";
    default:
      return status?.replace(/_/g, " ") || "Unknown";
  }
}

/** Defaults applied when admin captures listing data (before publish). */
export const LISTING_CAPTURE_SALON_DEFAULTS = {
  source_type: "LISTING_GENERATION",
  onboarding_status: LISTING_ONBOARDING_STATUS.CAPTURED,
  activation_status: "INACTIVE",
  public_visibility: "hidden",
  booking_enabled: false,
  is_verified: false,
  status: "active",
} as const;

/** Applied when admin publishes to the customer listing page. */
export const LISTING_PUBLISH_SALON_UPDATES = {
  onboarding_status: LISTING_ONBOARDING_STATUS.PUBLISHED,
  public_visibility: "public",
  booking_enabled: false,
  status: "active",
} as const;
