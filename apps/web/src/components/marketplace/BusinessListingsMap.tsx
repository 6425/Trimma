"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { MapPin, ExternalLink } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import type { BusinessListingCardData } from "@/lib/business-listing-mapper";
import { getListingMapEmbedUrl, listingHasMapDisplay } from "@/lib/business-listing-mapper";
import { buildSalonClaimLoginUrl } from "@/lib/salon-public-listing";
import { buildSalonPublicPath } from "@/lib/salon-public-path";
import { getSalonDirectionsUrl } from "@/lib/salon-map";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=600&auto=format&fit=crop";

type Props = {
  listings: BusinessListingCardData[];
};

export function BusinessListingsMap({ listings }: Props) {
  const mappableListings = useMemo(() => listings.filter(listingHasMapDisplay), [listings]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!listings.length) {
      setSelectedId(null);
      return;
    }
    setSelectedId((current) => {
      if (current && listings.some((item) => item.id === current)) return current;
      const firstMappable = mappableListings[0]?.id;
      return firstMappable || listings[0]?.id || null;
    });
  }, [listings, mappableListings]);

  const selectedListing =
    listings.find((item) => item.id === selectedId) || mappableListings[0] || listings[0] || null;
  const embedUrl = selectedListing ? getListingMapEmbedUrl(selectedListing) : null;
  const directionsUrl = selectedListing ? getSalonDirectionsUrl({
    name: selectedListing.name,
    address: selectedListing.address,
    city: selectedListing.city,
    district: selectedListing.district,
    province: selectedListing.province,
    place_id: selectedListing.placeId,
    latitude: selectedListing.latitude,
    longitude: selectedListing.longitude,
    map_url: selectedListing.mapUrl,
  }) : null;

  if (!listings.length) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="grid min-h-[560px] lg:grid-cols-[minmax(0,360px)_1fr]">
        <div className="max-h-[320px] overflow-y-auto border-b border-slate-200 lg:max-h-[680px] lg:border-b-0 lg:border-r">
          <div className="sticky top-0 z-10 border-b border-slate-100 bg-white px-4 py-3">
            <p className="text-sm font-bold text-zinc-900">{listings.length} businesses</p>
            <p className="text-xs text-zinc-500">Select a listing to show it on Google Maps</p>
          </div>
          <ul className="divide-y divide-slate-100">
            {listings.map((listing) => {
              const isSelected = selectedListing?.id === listing.id;
              const hasMap = listingHasMapDisplay(listing);
              const claimUrl = buildSalonClaimLoginUrl(listing.id);
              const profileUrl = buildSalonPublicPath(listing);

              return (
                <li key={listing.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(listing.id)}
                    className={`w-full px-4 py-3 text-left transition-colors ${
                      isSelected ? "bg-[#ffde5a]/25 ring-1 ring-inset ring-[#ffde5a]/60" : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                        <Image
                          src={listing.image || FALLBACK_IMAGE}
                          alt=""
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-zinc-900 line-clamp-1">{listing.name}</p>
                        <p className="mt-0.5 flex items-start gap-1 text-xs text-zinc-500">
                          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          <span className="line-clamp-2">{listing.location}</span>
                        </p>
                        {!hasMap && (
                          <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                            Address only — map preview limited
                          </p>
                        )}
                      </div>
                    </div>
                    {listing.isClaimable ? (
                      <Link
                        href={claimUrl}
                        onClick={(event) => event.stopPropagation()}
                        className={buttonVariants({
                          variant: "default",
                          className: "mt-2 h-9 min-h-9 w-full rounded-lg text-xs font-bold",
                        })}
                      >
                        Claim your business
                      </Link>
                    ) : (
                      <Link
                        href={profileUrl}
                        onClick={(event) => event.stopPropagation()}
                        className={buttonVariants({
                          variant: "outline",
                          className: "mt-2 h-9 min-h-9 w-full rounded-lg text-xs font-bold",
                        })}
                      >
                        View profile
                      </Link>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="flex min-h-[360px] flex-col bg-zinc-100 lg:min-h-[680px]">
          {selectedListing && (
            <div className="border-b border-slate-200 bg-white px-4 py-3">
              <p className="text-base font-bold text-zinc-900">{selectedListing.name}</p>
              <p className="mt-0.5 text-xs text-zinc-600">{selectedListing.location}</p>
              {directionsUrl && (
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-zinc-700 hover:text-zinc-900"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open in Google Maps
                </a>
              )}
            </div>
          )}

          <div className="relative flex-1 min-h-[300px]">
            {embedUrl ? (
              <iframe
                key={embedUrl}
                title={selectedListing ? `Map showing ${selectedListing.name}` : "Business listings map"}
                src={embedUrl}
                className="absolute inset-0 h-full w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            ) : (
              <div className="flex h-full min-h-[300px] flex-col items-center justify-center px-6 text-center">
                <MapPin className="mb-3 h-10 w-10 text-zinc-300" />
                <p className="text-sm font-bold text-zinc-700">Map preview unavailable</p>
                <p className="mt-1 text-xs text-zinc-500">
                  Select another listing or switch to grid view for full details.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
