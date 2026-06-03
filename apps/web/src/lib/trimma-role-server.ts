import { createSupabaseAdminClient } from "@/config/supabase-admin";
import type { TrimmaUserRole } from "@/lib/auth-routes";
import { normalizeEmail } from "@/lib/normalize-email";
import { pickHighestRole } from "@/lib/trimma-role";

/** Resolve Trimma role from DB using the service role (server-only). */
export async function resolveTrimmaUserRoleServer(
  userId: string,
  email: string | null | undefined
): Promise<TrimmaUserRole | null> {
  const supabase = createSupabaseAdminClient();
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
