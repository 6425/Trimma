export const FEATURED_LISTING_COUNT = 4;

export function hasListingPhone(phone: unknown): boolean {
  return String(phone || "").replace(/\D/g, "").length >= 7;
}

type RankableListing = {
  id?: string;
  phone?: string | null;
  rating?: number | null;
  reviews?: number | null;
  review_count?: number | null;
};

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

export function pickFeaturedListingsWithPhone<T extends RankableListing>(
  items: T[],
  featuredCount = FEATURED_LISTING_COUNT
): T[] {
  return pinTopReviewedListingsWithPhone(items, featuredCount).slice(0, featuredCount);
}
