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
}: Props) {
  return (
    <div className="space-y-12">
      {topRated.length > 0 ? (
        <section>
          <SectionHeading
            title="Top Rated"
            description="Highest Google review counts and ratings among published businesses that list a contact number, so you can call or message them straight away."
          />
          <div className={gridClassName}>
            {topRated.slice(0, 4).map((listing, index) => (
              <BusinessListingCard key={listing.id} listing={listing} priority={index < 4} />
            ))}
          </div>
        </section>
      ) : null}

      {featured.length > 0 ? (
        <section>
          <SectionHeading
            title="Featured Salons"
            description="Businesses highlighted by Trimma admin for the marketplace."
          />
          <div className={gridClassName}>
            {featured.slice(0, 4).map((listing) => (
              <BusinessListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </section>
      ) : null}

      {more.length > 0 || hasMore ? (
        <section>
          <SectionHeading
            title="You may also like"
            description="The rest of the published listings, sorted from the highest Google reviews and ratings to the lowest."
          />
          {more.length > 0 ? (
            <div className={gridClassName}>
              {more.map((listing) => (
                <BusinessListingCard key={listing.id} listing={listing} />
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
  for (const listing of [...topRated, ...featured, ...more]) {
    if (seen.has(listing.id)) continue;
    seen.add(listing.id);
    merged.push(listing);
  }
  return merged;
}
