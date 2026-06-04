import { isPlatformAdminRole } from "@/lib/trimma-role-core";
import { resolveAdminAccess } from "@/lib/trimma-role";

/** Role written by setTrimmaMiddlewareCookies after admin password login. */
export function readMiddlewareRoleCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)user-role=([^;]+)/);
  if (!match?.[1]) return null;
  try {
    return decodeURIComponent(match[1]).trim().toLowerCase();
  } catch {
    return match[1].trim().toLowerCase();
  }
}

export function hasAdminRoleCookie(): boolean {
  return isPlatformAdminRole(readMiddlewareRoleCookie());
}

/** After password login at /admin/login — trust middleware cookie, then DB. */
export async function isAdminForSession(
  userId: string,
  email: string | null | undefined
): Promise<boolean> {
  if (hasAdminRoleCookie()) return true;
  return resolveAdminAccess(userId, email);
}
