import { supabase } from "@/config/supabase";
import type { TrimmaUserRole } from "@/lib/auth-routes";
import { normalizeEmail } from "@/lib/normalize-email";

const ROLE_PRIORITY: TrimmaUserRole[] = ["admin", "salon_owner", "agent", "customer"];

function pickHighestRole(
  ...roles: (string | null | undefined)[]
): TrimmaUserRole | null {
  for (const priority of ROLE_PRIORITY) {
    if (roles.some((role) => role === priority)) {
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
  document.cookie = `sb-access-token=${accessToken}; path=/; max-age=86400; SameSite=Lax${secure}`;
  document.cookie = `user-role=${role}; path=/; max-age=86400; SameSite=Lax${secure}`;
}

/** Hard navigation so middleware receives freshly written auth cookies. */
export function redirectAfterAuth(destination: string) {
  window.location.replace(destination);
}

export { pickHighestRole, ROLE_PRIORITY };
