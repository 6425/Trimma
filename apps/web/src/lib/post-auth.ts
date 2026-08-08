import type { TrimmaUserRole } from "@/lib/auth-routes";
import { resolvePostAuthRedirect, sanitizeNextPath } from "@/lib/auth-routes";

export type PostAuthContext = {
  role: TrimmaUserRole;
  nextPath?: string | null;
  onboardingStatus?: string | null;
  salonOwnerIntent?: boolean;
};

/** Single redirect decision after DB role is resolved. */
export function resolveAuthenticatedDestination({
  role,
  nextPath,
  salonOwnerIntent,
}: PostAuthContext): string {
  if (role === "admin") {
    return "/admin";
  }

  if (salonOwnerIntent) {
    if (role === "agent" || role === "regional_head") {
      return resolvePostAuthRedirect(role, sanitizeNextPath(nextPath));
    }
    if (role === "salon_owner") {
      return resolvePostAuthRedirect(role, sanitizeNextPath(nextPath) || "/dashboard/profile");
    }
    // Owner claim still in progress — avoid sending customers to /dashboard (middleware blocks).
    return "/onboarding";
  }

  return resolvePostAuthRedirect(role, sanitizeNextPath(nextPath));
}
