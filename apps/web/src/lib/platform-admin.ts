import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { normalizeEmail } from "@/lib/normalize-email";
import {
  fetchGlobalRolesForEmail,
  isPlatformAdminRole,
} from "@/lib/trimma-role-core";

export async function assertPlatformAdmin(accessToken: string) {
  const supabaseAdmin = createSupabaseAdminClient();
  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(accessToken);

  if (error || !user?.id || !user.email) {
    throw new Error("Invalid or expired session. Please sign in again.");
  }

  const email = normalizeEmail(user.email);

  const [{ data: roleRows }, globalRoles] = await Promise.all([
    supabaseAdmin.from("user_roles").select("role").eq("user_id", user.id),
    fetchGlobalRolesForEmail(supabaseAdmin, email),
  ]);

  const roles = [...globalRoles, ...(roleRows || []).map((row) => row.role)].filter(Boolean);
  const isAllowed = roles.some((role) => isPlatformAdminRole(String(role)));

  if (!isAllowed) {
    throw new Error(
      `Admin access required for ${email}. Add admin in user_roles (user_id=${user.id}) or users.global_role.`
    );
  }
}
