import { isListingFeaturedNow } from "@/lib/listing-featured";

export const TOP_RATED_LISTING_COUNT = 4;
/** Public Featured Beauty Business shows the live admin batch, not a review-ranked subset. */
export const FEATURED_LISTING_COUNT = 4;
export const FEATURED_BATCH_PUBLIC_LIMIT = 40;
/** First "You may also like" page, and each Load more page, on landing + category. */
export const YOU_MAY_ALSO_LIKE_COUNT = 8;

export function hasListingPhone(phone: unknown): boolean {
  return String(phone || "").replace(/\D/g, "").length >= 7;
}

type RankableListing = {
  id?: string;
  name?: string | null;
  phone?: string | null;
  rating?: number | null;
  reviews?: number | null;
  review_count?: number | null;
  is_featured?: boolean | null;
  isFeatured?: boolean | null;
  featured?: boolean | null;
  featured_starts_at?: unknown;
  featured_ends_at?: unknown;
  featuredStartsAt?: unknown;
  featuredEndsAt?: unknown;
};

function listingId(item: RankableListing): string {
  return String(item.id || "");
}

function isAdminFeatured(item: RankableListing): boolean {
  return isListingFeaturedNow(item);
}

export function listingReviewCount(listing: RankableListing): number {
  return Math.max(0, Number(listing.reviews ?? listing.review_count ?? 0) || 0);
}

export function listingRatingValue(listing: RankableListing): number {
  return Math.max(0, Number(listing.rating ?? 0) || 0);
}

export function compareListingPopularity(a: RankableListing, b: RankableListing): number {
  const reviewDelta = listingReviewCount(b) - listingReviewCount(a);
  if (reviewDelta) return reviewDelta;
  return listingRatingValue(b) - listingRatingValue(a);
}

/** Put the top reviewed, rated businesses with a phone number first. */
export function pinTopReviewedListingsWithPhone<T extends RankableListing>(
  items: T[],
  featuredCount = FEATURED_LISTING_COUNT
): T[] {
  const eligible = [...items]
    .filter((item) => hasListingPhone(item.phone))
    .sort(compareListingPopularity);
  const featured = eligible.slice(0, featuredCount);
  const featuredIds = new Set(featured.map((item) => String(item.id || "")));
  const rest = items
    .filter((item) => !featuredIds.has(String(item.id || "")))
    .sort(compareListingPopularity);
  return [...featured, ...rest];
}

export function compareFeaturedBatchOrder(a: RankableListing, b: RankableListing): number {
  return String(a.name || "").localeCompare(String(b.name || ""), undefined, { sensitivity: "base" });
}

export function pickFeaturedListingsWithPhone<T extends RankableListing>(
  items: T[],
  featuredCount = FEATURED_BATCH_PUBLIC_LIMIT
): T[] {
  return pickAdminFeaturedListings(items, featuredCount);
}

/** Homepage / district Featured = live admin batch, in the same name order as Featured Batch. */
export function pickAdminFeaturedListings<T extends RankableListing>(
  items: T[],
  featuredCount = FEATURED_BATCH_PUBLIC_LIMIT
): T[] {
  const featured = [...items].filter(isAdminFeatured).sort(compareFeaturedBatchOrder);
  return featuredCount > 0 ? featured.slice(0, featuredCount) : featured;
}

export function splitMarketplaceListingSections<T extends RankableListing>(
  items: T[],
  topCount = TOP_RATED_LISTING_COUNT,
  featuredCount = FEATURED_BATCH_PUBLIC_LIMIT
): { topRated: T[]; featured: T[]; rest: T[] } {
  const featured = pickAdminFeaturedListings(items, featuredCount);
  const taken = new Set(featured.map(listingId).filter(Boolean));
  const popularity = [...items].sort(compareListingPopularity);

  const topRated = popularity
    .filter((item) => !taken.has(listingId(item)) && hasListingPhone(item.phone))
    .slice(0, topCount);
  for (const item of topRated) taken.add(listingId(item));

  const rest = popularity.filter((item) => !taken.has(listingId(item)));
  return { topRated, featured, rest };
}
