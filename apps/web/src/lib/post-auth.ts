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

  if (salonOwnerIntent && role === "salon_owner") {
    return sanitizeNextPath(nextPath) || "/dashboard/profile";
  }

  return resolvePostAuthRedirect(role, sanitizeNextPath(nextPath));
}
