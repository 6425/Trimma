import { isPlatformAdminRole } from "@/lib/trimma-role-core";
import { resolveAdminAccess } from "@/lib/trimma-role";

const ADMIN_CHECK_TIMEOUT_MS = 8_000;

/** Legacy readable cookie from setTrimmaMiddlewareCookies (pre-HttpOnly sessions). */
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

async function isAdminViaSecureSession(): Promise<boolean | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ADMIN_CHECK_TIMEOUT_MS);
    const response = await fetch("/api/auth/session", {
      credentials: "include",
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!response.ok) return false;
    const data = (await response.json()) as { role?: string };
    return isPlatformAdminRole(data.role);
  } catch {
    return null;
  }
}

async function isAdminViaServerAction(accessToken: string): Promise<boolean> {
  try {
    const { verifyAdminLoginSession } = await import("@/app/actions/admin-auth");
    const verified = await Promise.race([
      verifyAdminLoginSession(accessToken),
      new Promise<{ success: false }>((resolve) =>
        setTimeout(() => resolve({ success: false }), ADMIN_CHECK_TIMEOUT_MS)
      ),
    ]);
    return verified.success === true;
  } catch {
    return false;
  }
}

/** Verify admin access using HttpOnly session cookies, then fall back to client DB checks. */
export async function isAdminForSession(
  userId: string,
  email: string | null | undefined,
  accessToken?: string | null
): Promise<boolean> {
  const secureSession = await isAdminViaSecureSession();
  if (secureSession === true) return true;

  if (accessToken) {
    const serverVerified = await isAdminViaServerAction(accessToken);
    if (serverVerified) return true;
  }

  if (hasAdminRoleCookie()) return true;

  try {
    return await Promise.race([
      resolveAdminAccess(userId, email),
      new Promise<boolean>((resolve) => setTimeout(() => resolve(false), ADMIN_CHECK_TIMEOUT_MS)),
    ]);
  } catch {
    return false;
  }
}
