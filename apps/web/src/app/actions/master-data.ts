"use server";

import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { runSeedMarketplaceData } from "@/lib/seed-marketplace-core";
import { assertPlatformAdmin } from "@/lib/platform-admin";

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
