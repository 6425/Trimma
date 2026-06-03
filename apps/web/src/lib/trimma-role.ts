import { supabase } from "@/config/supabase";
import type { TrimmaUserRole } from "@/lib/auth-routes";
import { normalizeEmail } from "@/lib/normalize-email";

const ROLE_PRIORITY: TrimmaUserRole[] = ["admin", "salon_owner", "agent", "customer"];

function normalizeRoleValue(role: string | null | undefined): string | null {
  if (!role) return null;
  const value = role.toLowerCase();
  if (value === "superadmin" || value === "regional_admin") return "admin";
  return value;
}

function pickHighestRole(
  ...roles: (string | null | undefined)[]
): TrimmaUserRole | null {
  const normalized = roles.map(normalizeRoleValue).filter(Boolean) as string[];
  for (const priority of ROLE_PRIORITY) {
    if (normalized.some((role) => role === priority)) {
      return priority;
    }
  }
  return null;
}

/** Resolve the effective Trimma role from user_roles + users.global_role (DB is authoritative). */
export async function resolveTrimmaUserRole(
  userId: string,
  email: string | null | undefined
): Promise<TrimmaUserRole | null> {
  const normalizedEmail = normalizeEmail(email);

  const [{ data: roleRows }, { data: userData }] = await Promise.all([
    supabase.from("user_roles").select("role").eq("user_id", userId),
    normalizedEmail
      ? supabase.from("users").select("global_role").eq("email", normalizedEmail).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  const tableRoles = (roleRows || []).map((row) => row.role);
  return pickHighestRole(...tableRoles, userData?.global_role);
}

export async function resolveAdminAccess(
  userId: string,
  email: string | null | undefined
): Promise<boolean> {
  const role = await resolveTrimmaUserRole(userId, email);
  return role === "admin";
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

export { pickHighestRole, ROLE_PRIORITY };
