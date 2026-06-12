import type { SupabaseClient } from "@supabase/supabase-js";
import type { TrimmaUserRole } from "@/lib/auth-routes";
import { normalizeEmail } from "@/lib/normalize-email";

const VALID_ROLES: TrimmaUserRole[] = [
  "admin",
  "regional_head",
  "salon_owner",
  "agent",
  "customer",
];

function normalizeGlobalRoleForSync(globalRole: string): TrimmaUserRole {
  const value = globalRole.toLowerCase();
  if (value === "superadmin") return "admin";
  if (value === "regional_admin") return "regional_head";
  if (VALID_ROLES.includes(value as TrimmaUserRole)) {
    return value as TrimmaUserRole;
  }
  return "customer";
}

export async function findAuthUserIdByEmail(
  supabase: SupabaseClient,
  email: string
): Promise<string | null> {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;

  let page = 1;
  const perPage = 1000;

  while (page <= 10) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(error.message);

    const match = (data?.users || []).find((user) => normalizeEmail(user.email) === normalized);
    if (match?.id) return match.id;

    if (!data?.users?.length || data.users.length < perPage) break;
    page += 1;
  }

  return null;
}

/** Keep user_roles aligned with users.global_role (admin edits, onboarding, salon linking). */
export async function syncUserRolesForGlobalRole(
  supabase: SupabaseClient,
  email: string,
  globalRole: string
): Promise<void> {
  const normalized = normalizeEmail(email);
  if (!normalized) return;

  const role = normalizeGlobalRoleForSync(globalRole);

  const authUserId = await findAuthUserIdByEmail(supabase, normalized);
  if (!authUserId) return;

  const { error: deleteError } = await supabase.from("user_roles").delete().eq("user_id", authUserId);
  if (deleteError && !deleteError.message.toLowerCase().includes("does not exist")) {
    throw new Error(deleteError.message);
  }

  const { error: upsertError } = await supabase
    .from("user_roles")
    .upsert({ user_id: authUserId, role }, { onConflict: "user_id,role" });

  if (upsertError && !upsertError.message.toLowerCase().includes("does not exist")) {
    throw new Error(upsertError.message);
  }
}
