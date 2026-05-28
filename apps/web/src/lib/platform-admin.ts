import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { createServerSupabaseClient } from "@/config/supabase-server";
import { normalizeEmail } from "@/lib/normalize-email";

const PLATFORM_ADMIN_ROLES = new Set(["admin", "superadmin"]);

export async function assertPlatformAdmin(accessToken: string) {
  const supabaseAuth = createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabaseAuth.auth.getUser(accessToken);

  if (error || !user?.id || !user.email) {
    throw new Error("Invalid or expired session. Please sign in again.");
  }

  const email = normalizeEmail(user.email);
  const supabaseAdmin = createSupabaseAdminClient();

  const [{ data: profile }, { data: roleRows }] = await Promise.all([
    supabaseAdmin.from("users").select("global_role").ilike("email", email).maybeSingle(),
    supabaseAdmin.from("user_roles").select("role").eq("user_id", user.id),
  ]);

  const roles = [profile?.global_role, ...(roleRows || []).map((row) => row.role)].filter(Boolean);
  const isAllowed = roles.some((role) => PLATFORM_ADMIN_ROLES.has(String(role)));

  if (!isAllowed) {
    throw new Error("Admin access required.");
  }
}
