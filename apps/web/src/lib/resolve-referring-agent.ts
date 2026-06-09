export type SalonWithReferringAgent = {
  onboarding_agent_email?: string | null;
  assign_to?: string | null;
};

/** Prefer onboarding agent; fall back to territory assignee. */
export function resolveReferringAgentEmail(
  salon: SalonWithReferringAgent | null | undefined
): string | null {
  if (!salon) return null;
  const email = salon.onboarding_agent_email || salon.assign_to;
  return email?.trim() || null;
}
