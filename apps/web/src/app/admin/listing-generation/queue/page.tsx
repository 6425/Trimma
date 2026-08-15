import { loadListingGenerationQueue } from "@/lib/listing-generation-queue";
import ListingQueueClient from "./ListingQueueClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ListingQueuePage() {
  try {
    const initialQueue = await loadListingGenerationQueue();
    return <ListingQueueClient initialQueue={initialQueue} />;
  } catch (error) {
    console.error("[listing-queue]", error);
    return (
      <ListingQueueClient
        initialQueue={{ rows: [], pendingCount: 0, listedCount: 0 }}
      />
    );
  }
}
