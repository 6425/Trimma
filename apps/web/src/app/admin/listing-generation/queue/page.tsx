import { loadListingGenerationQueue } from "@/lib/listing-generation-queue";
import ListingQueueClient from "./ListingQueueClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ListingQueuePage() {
  const initialQueue = await loadListingGenerationQueue();

  return <ListingQueueClient initialQueue={initialQueue} />;
}
