import { supabase } from "@/config/supabase";
import type { TrimmaUserRole } from "@/lib/auth-routes";

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

/** Resolve the effective Trimma role from user_roles + users.global_role. */
export async function resolveTrimmaUserRole(
  userId: string,
  email: string | null | undefined
): Promise<TrimmaUserRole | null> {
  const [{ data: roleData }, { data: userData }] = await Promise.all([
    supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle(),
    supabase.from("users").select("global_role").eq("email", email).maybeSingle(),
  ]);

  return pickHighestRole(roleData?.role, userData?.global_role);
}

export async function resolveAdminAccess(
  userId: string,
  email: string | null | undefined
): Promise<boolean> {
  const role = await resolveTrimmaUserRole(userId, email);
  return role === "admin";
}

export function setTrimmaMiddlewareCookies(accessToken: string, role: string) {
  document.cookie = `sb-access-token=${accessToken}; path=/; max-age=86400; SameSite=Lax`;
  document.cookie = `user-role=${role}; path=/; max-age=86400; SameSite=Lax`;
}
