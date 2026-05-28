"use server";

import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { runSeedMarketplaceData } from "@/lib/seed-marketplace-core";
import { requirePlatformAdminFromCookies } from "@/lib/server-admin-auth";

export async function syncMasterData() {
  try {
    const auth = await requirePlatformAdminFromCookies();
    if ("error" in auth) {
      return { success: false as const, error: auth.error };
    }

    const supabaseAdmin = createSupabaseAdminClient();
    await runSeedMarketplaceData(supabaseAdmin);

    return { success: true as const };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sync failed.";
    console.error("Master data sync error:", message);

    if (message.includes("SUPABASE_SERVICE_ROLE_KEY")) {
      return {
        success: false as const,
        error: "Server is missing SUPABASE_SERVICE_ROLE_KEY. Add it in Vercel environment variables.",
      };
    }

    return { success: false as const, error: message };
  }
}
