import { supabase } from "@/config/supabase";
import type { TrimmaUserRole } from "@/lib/auth-routes";
import {
  resolveTrimmaRoleFromDb,
  pickHighestRole,
  fetchGlobalRolesForEmail,
  isPlatformAdminRole,
} from "@/lib/trimma-role-core";
import { normalizeEmail } from "@/lib/normalize-email";

/** Resolve role: user_roles.user_id first, then all users.global_role rows for email (ilike). */
export async function resolveTrimmaUserRole(
  userId: string,
  email: string | null | undefined
): Promise<TrimmaUserRole | null> {
  return resolveTrimmaRoleFromDb(supabase, userId, email);
}

/** Client-side admin gate (works when RLS allows reads; falls back to users.global_role only). */
export async function resolveAdminAccess(
  userId: string,
  email: string | null | undefined
): Promise<boolean> {
  try {
    const role = await resolveTrimmaUserRole(userId, email);
    if (role === "admin") return true;
  } catch (err) {
    console.warn("Full role resolve failed; trying users.global_role only.", err);
  }

  const normalized = normalizeEmail(email);
  if (!normalized) return false;

  try {
    const globalRoles = await fetchGlobalRolesForEmail(supabase, normalized);
    return globalRoles.some((r) => isPlatformAdminRole(r));
  } catch {
    return false;
  }
}

const ADMIN_VERIFY_TIMEOUT_MS = 10_000;

/** Prefer server verify; fall back to client DB reads (beta / broken serverless). */
export async function confirmAdminAccessForSession(
  accessToken: string,
  userId: string,
  email: string | null | undefined
): Promise<{ allowed: boolean; role: string; error?: string }> {
  try {
    const { verifyAdminLoginSession } = await import("@/app/actions/admin-auth");
    const verified = await Promise.race([
      verifyAdminLoginSession(accessToken),
      new Promise<{ success: false; error: string }>((resolve) =>
        setTimeout(
          () => resolve({ success: false, error: "Server verification timed out." }),
          ADMIN_VERIFY_TIMEOUT_MS
        )
      ),
    ]);
    if (verified.success) {
      return { allowed: true, role: verified.role || "admin" };
    }
  } catch (err) {
    console.warn("Admin server verification unavailable.", err);
  }

  const allowed = await resolveAdminAccess(userId, email);
  if (!allowed) {
    return {
      allowed: false,
      role: "customer",
      error:
        "Admin access required. Ensure your account has admin in user_roles (with your auth user_id) or users.global_role.",
    };
  }

  return { allowed: true, role: "admin" };
}

export function setTrimmaMiddlewareCookies(accessToken: string, role: string) {
  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
  
  // Try to set the full token for backward compatibility, but it might fail if > 4KB
  const encodedToken = encodeURIComponent(accessToken);
  document.cookie = `sb-access-token=${encodedToken}; path=/; max-age=86400; SameSite=Lax${secure}`;

  // Chunk the unencoded token into safe pieces
  const maxChunkSize = 2500;
  let chunkCount = 0;
  for (let i = 0; i < accessToken.length; i += maxChunkSize) {
    const chunk = encodeURIComponent(accessToken.slice(i, i + maxChunkSize));
    document.cookie = `sb-access-token.${chunkCount}=${chunk}; path=/; max-age=86400; SameSite=Lax${secure}`;
    chunkCount++;
  }
  // Clear any old extra chunks
  for (let i = chunkCount; i < 5; i++) {
    document.cookie = `sb-access-token.${i}=; path=/; max-age=0; SameSite=Lax${secure}`;
  }

  document.cookie = `user-role=${encodeURIComponent(role)}; path=/; max-age=86400; SameSite=Lax${secure}`;
}

/** Hard navigation so middleware receives freshly written auth cookies. */
export function redirectAfterAuth(destination: string) {
  window.location.replace(destination);
}

export { pickHighestRole } from "@/lib/trimma-role-core";
