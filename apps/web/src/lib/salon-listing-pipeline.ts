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

/** Statuses already in booking onboarding — do not downgrade on re-capture. */
const BOOKING_PIPELINE_LOCK_STATUSES = new Set([
  "OWNER_INVITED",
  "ASSIGNED_TO_AGENT",
  "OWNER_ACTIVATED",
  "PENDING_ADMIN_VERIFICATION",
  "VERIFIED",
  "REJECTED",
]);

export function isBookingPipelineLockedStatus(status: string | null | undefined): boolean {
  return BOOKING_PIPELINE_LOCK_STATUSES.has(String(status || ""));
}

/** Force listing-generation fields after Google capture merge. */
export function applyListingPipelineCaptureFields(
  merged: Record<string, unknown>,
  existing?: Record<string, unknown> | null
): void {
  const existingStatus = String(existing?.onboarding_status || "");
  merged.source_type = "LISTING_GENERATION";

  if (existingStatus === LISTING_ONBOARDING_STATUS.PUBLISHED) {
    merged.onboarding_status = LISTING_ONBOARDING_STATUS.PUBLISHED;
  } else if (BOOKING_PIPELINE_LOCK_STATUSES.has(existingStatus)) {
    merged.onboarding_status = existing?.onboarding_status;
  } else {
    Object.assign(merged, LISTING_CAPTURE_SALON_DEFAULTS);
  }

  const existingExt =
    merged.business_info_extended &&
    typeof merged.business_info_extended === "object" &&
    !Array.isArray(merged.business_info_extended)
      ? (merged.business_info_extended as Record<string, unknown>)
      : {};

  merged.business_info_extended = {
    ...existingExt,
    listing_captured_at: new Date().toISOString(),
  };
}

export function readListingCapturedAt(row: {
  created_at?: string | null;
  onboarding_status?: string | null;
  source_type?: string | null;
  business_info_extended?: unknown;
}): string | null {
  const ext =
    row.business_info_extended &&
    typeof row.business_info_extended === "object" &&
    !Array.isArray(row.business_info_extended)
      ? (row.business_info_extended as Record<string, unknown>)
      : null;
  const capturedAt = ext?.listing_captured_at;
  if (typeof capturedAt === "string" && capturedAt.trim()) return capturedAt;

  return row.created_at || null;
}

/** Ensure captured Google rows are visible in the listing queue after upsert. */
export async function finalizeListingPipelineCapture(
  supabase: import("@supabase/supabase-js").SupabaseClient,
  placeIds: string[]
): Promise<number> {
  if (!placeIds.length) return 0;

  const { data: rows, error: fetchError } = await supabase
    .from("salons")
    .select("id, onboarding_status")
    .in("place_id", placeIds);

  if (fetchError) throw new Error(fetchError.message);

  const toCapture: string[] = [];
  const toRefresh: string[] = [];

  for (const row of rows || []) {
    const status = String(row.onboarding_status || "");
    if (isBookingPipelineLockedStatus(status)) continue;
    if (status === LISTING_ONBOARDING_STATUS.PUBLISHED) {
      toRefresh.push(String(row.id));
      continue;
    }
    toCapture.push(String(row.id));
  }

  if (toCapture.length) {
    const { error } = await supabase
      .from("salons")
      .update({
        ...LISTING_CAPTURE_SALON_DEFAULTS,
        subscription_plan_id: null,
      })
      .in("id", toCapture);
    if (error) throw new Error(error.message);
  }

  if (toRefresh.length) {
    const { error } = await supabase
      .from("salons")
      .update({
        source_type: "LISTING_GENERATION",
      })
      .in("id", toRefresh);
    if (error) throw new Error(error.message);
  }

  return toCapture.length + toRefresh.length;
}

export function formatListingCapturedDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-LK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
