import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { loadListingCaptureCatalog } from "@/lib/listing-generation-categories";
import { ListingCaptureForm } from "./ListingCaptureForm";

export default async function ListingDataCapturePage() {
  const supabase = createSupabaseAdminClient();
  const catalog = await loadListingCaptureCatalog(supabase);

  return (
    <ListingCaptureForm
      categories={catalog.categories}
      servicesByCategoryId={catalog.servicesByCategoryId}
    />
  );
}
