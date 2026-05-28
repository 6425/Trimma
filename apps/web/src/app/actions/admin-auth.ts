"use server";

import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { assertPlatformAdmin } from "@/lib/platform-admin";
import { normalizeEmail } from "@/lib/normalize-email";

const PLATFORM_ADMIN_ROLES = new Set(["admin", "superadmin"]);

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
    const [{ data: profile }, { data: roleRows }] = await Promise.all([
      supabase.from("users").select("global_role").ilike("email", email).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", user.id),
    ]);

    const roles = [profile?.global_role, ...(roleRows || []).map((row) => row.role)].filter(Boolean);
    const role = roles.find((value) => PLATFORM_ADMIN_ROLES.has(String(value))) || "admin";

    return { success: true as const, role: String(role) };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Admin access required.";
    return { success: false as const, error: message };
  }
}
