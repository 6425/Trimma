import { loadListingGenerationQueue } from "@/lib/listing-generation-queue";
import type { ListingQueuePayload } from "@/lib/listing-generation-queue";
import ListingQueueClient from "./ListingQueueClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const EMPTY_QUEUE: ListingQueuePayload = { rows: [], pendingCount: 0, listedCount: 0 };

export default async function ListingQueuePage() {
  let initialQueue = EMPTY_QUEUE;
  try {
    initialQueue = await loadListingGenerationQueue();
  } catch (error) {
    console.error("[listing-queue]", error);
  }

  return <ListingQueueClient initialQueue={initialQueue} />;
}
