import { cache } from "react";
import { fetchPublicSalonPage } from "@/app/actions/public-salon-page";

/** Dedupes salon page fetch within a single request (metadata + page). */
export const getCachedPublicSalonPage = cache(async (slug: string) => {
  return fetchPublicSalonPage(slug).catch(() => null);
});
