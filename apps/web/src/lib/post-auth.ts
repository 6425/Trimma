import type { TrimmaUserRole } from "@/lib/auth-routes";
import { resolvePostAuthRedirect, sanitizeNextPath } from "@/lib/auth-routes";
import { needsOwnerActivationWizard } from "@/lib/salon-onboarding";

export type PostAuthContext = {
  role: TrimmaUserRole;
  nextPath?: string | null;
  onboardingStatus?: string | null;
};

/** Single redirect decision after DB role is resolved. */
export function resolveAuthenticatedDestination({
  role,
  nextPath,
  onboardingStatus,
}: PostAuthContext): string {
  if (role === "admin") {
    return "/admin";
  }


  return resolvePostAuthRedirect(role, sanitizeNextPath(nextPath));
}
