export const TOP_RATED_LISTING_COUNT = 4;
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
  is_featured?: boolean | null;
  isFeatured?: boolean | null;
};

function listingId(item: RankableListing): string {
  return String(item.id || "");
}

function isAdminFeatured(item: RankableListing): boolean {
  return item.is_featured === true || item.isFeatured === true;
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

export function pickFeaturedListingsWithPhone<T extends RankableListing>(
  items: T[],
  featuredCount = FEATURED_LISTING_COUNT
): T[] {
  return pinTopReviewedListingsWithPhone(items, featuredCount).slice(0, featuredCount);
}

export function splitMarketplaceListingSections<T extends RankableListing>(
  items: T[],
  topCount = TOP_RATED_LISTING_COUNT,
  featuredCount = FEATURED_LISTING_COUNT
): { topRated: T[]; featured: T[]; rest: T[] } {
  const popularity = [...items].sort(compareListingPopularity);
  const topRated = popularity.filter((item) => hasListingPhone(item.phone)).slice(0, topCount);
  const taken = new Set(topRated.map(listingId));

  const featured: T[] = [];
  for (const item of popularity) {
    if (featured.length >= featuredCount) break;
    const id = listingId(item);
    if (!id || taken.has(id) || !isAdminFeatured(item)) continue;
    featured.push(item);
    taken.add(id);
  }

  if (featured.length < featuredCount) {
    for (const item of popularity) {
      if (featured.length >= featuredCount) break;
      const id = listingId(item);
      if (!id || taken.has(id)) continue;
      featured.push(item);
      taken.add(id);
    }
  }

  const rest = popularity.filter((item) => !taken.has(listingId(item)));
  return { topRated, featured, rest };
}
