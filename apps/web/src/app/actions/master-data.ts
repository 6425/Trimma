"use server";

import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { createServerSupabaseClient } from "@/config/supabase-server";
import { runSeedMarketplaceData } from "@/lib/seed-marketplace-core";

const PLATFORM_ADMIN_ROLES = new Set(["admin", "superadmin"]);

async function assertPlatformAdmin(accessToken: string) {
  const supabaseAuth = createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabaseAuth.auth.getUser(accessToken);

  if (error || !user?.email) {
    throw new Error("Invalid or expired session. Please sign in again.");
  }

  const supabaseAdmin = createSupabaseAdminClient();
  const { data: profile } = await supabaseAdmin
    .from("users")
    .select("global_role")
    .eq("email", user.email)
    .maybeSingle();

  const role = profile?.global_role;
  const isAllowed =
    (role && PLATFORM_ADMIN_ROLES.has(role)) ||
    user.email === "thusitha.jayalath@gmail.com";

  if (!isAllowed) {
    throw new Error("Admin access required.");
  }
}

export async function syncMasterData(accessToken: string) {
  try {
    if (!accessToken) {
      return { success: false as const, error: "You must be signed in as an admin." };
    }

    await assertPlatformAdmin(accessToken);

    const supabaseAdmin = createSupabaseAdminClient();
    await runSeedMarketplaceData(supabaseAdmin);

    return { success: true as const };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sync failed.";
    console.error("Master data sync error:", message);

    if (message.includes("SUPABASE_SERVICE_ROLE_KEY")) {
      return {
        success: false as const,
        error: "Server is missing SUPABASE_SERVICE_ROLE_KEY. Add it to apps/web/.env.",
      };
    }

    return { success: false as const, error: message };
  }
}
