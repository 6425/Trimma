"use client";

import { BusinessListingCard } from "./BusinessListingCard";
import type { BusinessListingCardData } from "@/lib/business-listing-mapper";

type Props = {
  listings: BusinessListingCardData[];
  city?: string | null;
  embedded?: boolean;
};

export function SimilarBusinessesSection({ listings, city, embedded = false }: Props) {
  if (listings.length === 0) return null;

  const place = String(city || "").trim();

  return (
    <section
      className={embedded ? "mt-10 mb-8" : "container mx-auto max-w-6xl px-4 mt-10 mb-8"}
      aria-label="Similar businesses"
    >
      <div className="mb-5">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Similar businesses</h2>
        <p className="mt-1 text-sm font-medium text-zinc-500">
          {place ? `Same type in ${place}.` : "Same type nearby."}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 sm:gap-5">
        {listings.slice(0, 3).map((listing, index) => (
          <div key={listing.id} className={index === 2 ? "hidden md:block" : undefined}>
            <BusinessListingCard listing={listing} />
          </div>
        ))}
      </div>
    </section>
  );
}
