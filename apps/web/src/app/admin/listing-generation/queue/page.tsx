import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { loadListingGenerationQueue } from "@/lib/listing-generation-queue";
import ListingQueueClient from "./ListingQueueClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ListingQueuePage() {
  const supabase = createSupabaseAdminClient();
  const initialQueue = await loadListingGenerationQueue(supabase).catch(() => ({
    rows: [],
    pendingCount: 0,
    listedCount: 0,
  }));

  return <ListingQueueClient initialQueue={initialQueue} />;
}
