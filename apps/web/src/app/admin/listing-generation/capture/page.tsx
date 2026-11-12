import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { loadListingCaptureCatalog } from "@/lib/listing-generation-categories";
import { ListingCaptureForm } from "./ListingCaptureForm";

// This page reads the live admin catalog. It must not attempt that request
// during a production build, when Supabase may be temporarily unavailable.
export const dynamic = "force-dynamic";
export const revalidate = 0;

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
