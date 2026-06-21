/** Values accepted by salons.status CHECK constraint in production. */
export const SALON_RECORD_STATUS_PENDING = "pending";

export const SALON_ACTIVATION_INACTIVE = "INACTIVE";
export const SALON_ONBOARDING_OWNER_INVITED = "OWNER_INVITED";

export function buildSelfServeSalonInsertRow(params: {
  displayName: string;
  slug: string;
  normalizedEmail: string;
  freePlanId: string | null;
  assignTo?: string | null;
}) {
  const now = new Date().toISOString();

  return {
    name: `${params.displayName}'s Salon`,
    slug: params.slug,
    owner_email: params.normalizedEmail,
    owner_gmail: params.normalizedEmail,
    email: params.normalizedEmail,
    status: SALON_RECORD_STATUS_PENDING,
    onboarding_status: SALON_ONBOARDING_OWNER_INVITED,
    activation_status: SALON_ACTIVATION_INACTIVE,
    booking_enabled: false,
    public_visibility: "hidden",
    is_verified: false,
    assign_to: params.assignTo || null,
    subscription_plan_id: params.freePlanId,
    source_type: "self_serve_onboarding",
    draft_created_at: now,
    owner_invited_at: now,
    onboarding_completion_score: 0,
    business_info_extended: {
      owner_full_name: params.displayName,
    },
  };
}
