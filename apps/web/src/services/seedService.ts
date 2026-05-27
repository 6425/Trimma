import { syncMasterData } from "@/app/actions/master-data";
import { supabase } from "../config/supabase";

export const seedMarketplaceData = async () => {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      return { success: false, error: "You must be signed in as an admin." };
    }

    return syncMasterData(session.access_token);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Sync failed.";
    console.error("Seeding Error Details:", message);
    return { success: false, error: message };
  }
};
