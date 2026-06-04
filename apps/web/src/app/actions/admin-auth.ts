"use server";

import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { assertPlatformAdmin } from "@/lib/platform-admin";
import { normalizeEmail } from "@/lib/normalize-email";
import {
  fetchGlobalRolesForEmail,
  isPlatformAdminRole,
} from "@/lib/trimma-role-core";

export async function verifyAdminLoginSession(accessToken: string) {
  if (!accessToken?.trim()) {
    return { success: false as const, error: "Missing session token. Please sign in again." };
  }

  try {
    await assertPlatformAdmin(accessToken);

    const supabase = createSupabaseAdminClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(accessToken);

    if (error || !user?.id || !user.email) {
      return { success: false as const, error: "Invalid or expired session. Please sign in again." };
    }

    const email = normalizeEmail(user.email);
    const [{ data: roleRows }, globalRoles] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", user.id),
      fetchGlobalRolesForEmail(supabase, email),
    ]);

    const roles = [...globalRoles, ...(roleRows || []).map((row) => row.role)].filter(Boolean);
    const role = roles.find((value) => isPlatformAdminRole(String(value))) || "admin";

    return { success: true as const, role: String(role) };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Admin access required.";
    return { success: false as const, error: message };
  }
}
