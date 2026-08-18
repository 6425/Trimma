import { createServerSupabaseClient } from "@/config/supabase-server";
import { countPublishedListingsForLocation } from "@/lib/public-salon-search";
import { SRI_LANKA_PROVINCES } from "@/lib/sri-lanka-locations";
import LocationsClient from "./LocationsClient";

export const revalidate = 60;

export default async function LocationsHubPage() {
  const supabase = createServerSupabaseClient();
  const salonCounts = Object.fromEntries(
    await Promise.all(
      SRI_LANKA_PROVINCES.map(async (province) => {
        try {
          const count = await countPublishedListingsForLocation(supabase, province.name);
          return [province.slug, count] as const;
        } catch {
          return [province.slug, 0] as const;
        }
      })
    )
  );

  return <LocationsClient salonCounts={salonCounts} />;
}
