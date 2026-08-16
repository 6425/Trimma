import { revalidatePath } from "next/cache";

/** Bust ISR/CDN for every public surface that shows published listings. */
export function revalidateMarketplaceListingPages() {
  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/category", "layout");
  revalidatePath("/categories");
  revalidatePath("/locations");
  revalidatePath("/bookings");
  revalidatePath("/deals");
  revalidatePath("/salons", "layout");
  revalidatePath("/admin/listing-generation/queue");
}
