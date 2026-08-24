import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { loadListingCaptureCatalog } from "@/lib/listing-generation-categories";
import { loadListingGenerationQueue } from "@/lib/listing-generation-queue";
import type { ListingQueuePayload } from "@/lib/listing-generation-queue";
import type { PublicCategory } from "@/lib/public-categories";
import ListingQueueClient from "./ListingQueueClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const EMPTY_QUEUE: ListingQueuePayload = {
  rows: [],
  featuredRows: [],
  featuredCount: 0,
  pendingCount: 0,
  listedCount: 0,
};

export default async function ListingQueuePage() {
  let initialQueue = EMPTY_QUEUE;
  let categories: PublicCategory[] = [];
  try {
    initialQueue = await loadListingGenerationQueue();
  } catch (error) {
    console.error("[listing-queue]", error);
  }

  try {
    const catalog = await loadListingCaptureCatalog(createSupabaseAdminClient());
    categories = catalog.categories;
  } catch (error) {
    console.error("[listing-queue] categories", error);
  }

  return <ListingQueueClient initialQueue={initialQueue} categories={categories} />;
}
