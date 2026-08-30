"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BusinessListingCard } from "./BusinessListingCard";
import type { BusinessListingCardData } from "@/lib/business-listing-mapper";

type Props = {
  topRated: BusinessListingCardData[];
  featured: BusinessListingCardData[];
  more: BusinessListingCardData[];
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  gridClassName: string;
  moreTitle?: string;
  moreDescription?: string;
};

function SectionHeading({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-black tracking-tight text-zinc-900">{title}</h2>
      <p className="mt-1 max-w-3xl text-sm font-medium leading-relaxed text-zinc-500">{description}</p>
    </div>
  );
}

export function ListingResultsSections({
  topRated,
  featured,
  more,
  hasMore,
  isLoadingMore,
  onLoadMore,
  gridClassName,
  moreTitle = "You may also like",
  moreDescription = "Contactable businesses first, followed by the highest ratings and strongest review counts.",
}: Props) {
  return (
    <div className="space-y-12">
      {featured.length > 0 ? (
        <section>
          <SectionHeading
            title="Featured Beauty Business"
            description="Businesses Trimma admin selected for a live featured period."
          />
          <div className={gridClassName}>
            {featured.map((listing, index) => (
              <BusinessListingCard
                key={listing.id}
                listing={listing}
                priority={index < 4}
                featuredBatch
              />
            ))}
          </div>
        </section>
      ) : null}

      {topRated.length > 0 ? (
        <section>
          <SectionHeading
            title="Top Rated"
            description="Businesses with contact numbers first, then ordered by highest rating and strongest review count."
          />
          <div className={gridClassName}>
            {topRated.slice(0, 4).map((listing) => (
              <BusinessListingCard
                key={listing.id}
                listing={listing}
                featuredBatch={listing.isFeatured}
              />
            ))}
          </div>
        </section>
      ) : null}

      {more.length > 0 || hasMore ? (
        <section>
          <SectionHeading
            title={moreTitle}
            description={moreDescription}
          />
          {more.length > 0 ? (
            <div className={gridClassName}>
            {more.map((listing) => (
              <BusinessListingCard
                key={listing.id}
                listing={listing}
                featuredBatch={listing.isFeatured}
              />
            ))}
            </div>
          ) : null}
          {hasMore ? (
            <div className="flex justify-center pt-8">
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="h-11 min-h-11 rounded-xl px-8 font-bold"
                disabled={isLoadingMore}
                onClick={onLoadMore}
              >
                {isLoadingMore ? <Loader2 className="h-5 w-5 animate-spin" /> : "Load more"}
              </Button>
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

export function mergeListingSectionCards(
  topRated: BusinessListingCardData[],
  featured: BusinessListingCardData[],
  more: BusinessListingCardData[]
): BusinessListingCardData[] {
  const seen = new Set<string>();
  const merged: BusinessListingCardData[] = [];
  for (const listing of [...featured, ...topRated, ...more]) {
    if (seen.has(listing.id)) continue;
    seen.add(listing.id);
    merged.push(listing);
  }
  return merged;
}
