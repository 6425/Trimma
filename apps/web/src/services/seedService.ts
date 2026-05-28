import { syncMasterData } from "@/app/actions/master-data";

export const seedMarketplaceData = async () => {
  try {
    return syncMasterData();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Sync failed.";
    console.error("Seeding Error Details:", message);
    return { success: false, error: message };
  }
};
