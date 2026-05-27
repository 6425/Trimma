/** Salon onboarding statuses where the owner must complete the activation wizard. */
export const OWNER_ACTIVATION_STATUSES = ["AGENT_VERIFIED", "OWNER_INVITED"] as const;

export function needsOwnerActivationWizard(status: string | null | undefined): boolean {
  if (!status) return false;
  return (OWNER_ACTIVATION_STATUSES as readonly string[]).includes(status);
}

export function isPlaceholderOwnerEmail(email: string | null | undefined): boolean {
  if (!email) return true;
  return (
    email.startsWith("draft-") ||
    email.startsWith("owner-") ||
    email.endsWith("@trimma.io")
  );
}
