import type { SupabaseClient } from "@supabase/supabase-js";
import type { TrimmaUserRole } from "@/lib/auth-routes";
import { normalizeEmail } from "@/lib/normalize-email";

const ROLE_PRIORITY: TrimmaUserRole[] = ["admin", "salon_owner", "agent", "customer"];

function normalizeRoleValue(role: string | null | undefined): string | null {
  if (!role) return null;
  const value = role.toLowerCase();
  if (value === "superadmin" || value === "regional_admin") return "admin";
  return value;
}

export function pickHighestRole(
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

/** Roles from user_roles (by auth user_id) plus users.global_role (case-insensitive email). */
export async function resolveTrimmaRoleFromDb(
  supabase: SupabaseClient,
  userId: string,
  email: string | null | undefined
): Promise<TrimmaUserRole | null> {
  const normalizedEmail = normalizeEmail(email);

  const [{ data: roleRows }, globalRoles] = await Promise.all([
    supabase.from("user_roles").select("role").eq("user_id", userId),
    fetchGlobalRolesForEmail(supabase, normalizedEmail),
  ]);

  const tableRoles = (roleRows || []).map((row) => row.role);
  return pickHighestRole(...tableRoles, ...globalRoles);
}

/** Supports duplicate users rows (e.g. thusitha.jayalath@gmail.com vs THUSITHA.JAYALATH@GMAIL.COM). */
export async function fetchGlobalRolesForEmail(
  supabase: SupabaseClient,
  normalizedEmail: string
): Promise<string[]> {
  if (!normalizedEmail) return [];

  const { data, error } = await supabase
    .from("users")
    .select("global_role")
    .ilike("email", normalizedEmail);

  if (error) throw new Error(error.message);

  return (data || [])
    .map((row) => row.global_role)
    .filter((role): role is string => Boolean(role));
}

export const PLATFORM_ADMIN_ROLE_VALUES = new Set(["admin", "superadmin", "regional_admin"]);

export function isPlatformAdminRole(role: string | null | undefined): boolean {
  if (!role) return false;
  const value = role.toLowerCase();
  return PLATFORM_ADMIN_ROLE_VALUES.has(value);
}
