import { revalidatePath } from "next/cache";

/** Bust ISR/CDN for every public surface that shows published listings. */
export function revalidateMarketplaceListingPages() {
  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/category", "layout");
  revalidatePath("/categories");
  revalidatePath("/locations");
  revalidatePath("/salons", "layout");
  revalidatePath("/bookings");
  revalidatePath("/deals");
  revalidatePath("/admin/listing-generation/queue");
}
