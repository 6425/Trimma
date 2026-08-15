/// <reference types="google.maps" />
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { APIProvider, Map, AdvancedMarker, InfoWindow, useMap } from "@vis.gl/react-google-maps";
import { MapPin, Store } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import type { BusinessListingCardData } from "@/lib/business-listing-mapper";
import { buildSalonClaimLoginUrl } from "@/lib/salon-public-listing";
import { buildSalonPublicPath } from "@/lib/salon-public-path";

const DEFAULT_CENTER = { lat: 7.8731, lng: 80.7718 };

export function listingHasMapPin(listing: BusinessListingCardData): boolean {
  return listing.latitude !== null && listing.longitude !== null;
}

type Props = {
  listings: BusinessListingCardData[];
};

function MapCameraController({
  selectedId,
  listings,
  focusSelected,
}: {
  selectedId: string | null;
  listings: BusinessListingCardData[];
  focusSelected: boolean;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map || !selectedId || !focusSelected) return;
    const listing = listings.find((item) => item.id === selectedId);
    if (!listing?.latitude || !listing?.longitude) return;
    map.panTo({ lat: listing.latitude, lng: listing.longitude });
    map.setZoom(15);
  }, [map, selectedId, listings, focusSelected]);

  return null;
}

function MapBoundsFitter({ listings }: { listings: BusinessListingCardData[] }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    const mappable = listings.filter(listingHasMapPin);
    if (!mappable.length) return;

    if (mappable.length === 1) {
      const only = mappable[0];
      map.setCenter({ lat: only.latitude!, lng: only.longitude! });
      map.setZoom(14);
      return;
    }

    const bounds = new google.maps.LatLngBounds();
    mappable.forEach((listing) => {
      bounds.extend({ lat: listing.latitude!, lng: listing.longitude! });
    });
    map.fitBounds(bounds, 48);
  }, [map, listings]);

  return null;
}

export function BusinessListingsMap({ listings }: Props) {
  const mappableListings = useMemo(() => listings.filter(listingHasMapPin), [listings]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focusSelected, setFocusSelected] = useState(false);

  useEffect(() => {
    if (!mappableListings.length) {
      setSelectedId(null);
      setFocusSelected(false);
      return;
    }
    setSelectedId((current) =>
      current && mappableListings.some((item) => item.id === current)
        ? current
        : mappableListings[0].id
    );
    setFocusSelected(false);
  }, [mappableListings]);

  const selectListing = (id: string) => {
    setSelectedId(id);
    setFocusSelected(true);
  };

  const selectedListing = mappableListings.find((item) => item.id === selectedId) || null;
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  const mapCenter =
    selectedListing?.latitude && selectedListing?.longitude
      ? { lat: selectedListing.latitude, lng: selectedListing.longitude }
      : mappableListings[0]?.latitude && mappableListings[0]?.longitude
        ? { lat: mappableListings[0].latitude, lng: mappableListings[0].longitude }
        : DEFAULT_CENTER;

  if (!listings.length) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="grid min-h-[520px] lg:grid-cols-[minmax(0,340px)_1fr]">
        <div className="max-h-[280px] overflow-y-auto border-b border-slate-200 lg:max-h-[640px] lg:border-b-0 lg:border-r">
          <div className="sticky top-0 z-10 border-b border-slate-100 bg-white px-4 py-3">
            <p className="text-sm font-bold text-zinc-900">{listings.length} businesses</p>
            <p className="text-xs text-zinc-500">
              {mappableListings.length} on map · select a listing to focus
            </p>
          </div>
          <ul className="divide-y divide-slate-100">
            {listings.map((listing) => {
              const hasPin = listingHasMapPin(listing);
              const isSelected = selectedId === listing.id;
              const claimUrl = buildSalonClaimLoginUrl(listing.id);
              const profileUrl = buildSalonPublicPath(listing);

              return (
                <li key={listing.id}>
                  <button
                    type="button"
                    onClick={() => hasPin && selectListing(listing.id)}
                    disabled={!hasPin}
                    className={`w-full px-4 py-3 text-left transition-colors ${
                      isSelected ? "bg-[#ffde5a]/20" : "hover:bg-slate-50"
                    } ${!hasPin ? "cursor-not-allowed opacity-60" : ""}`}
                  >
                    <p className="text-sm font-bold text-zinc-900 line-clamp-1">{listing.name}</p>
                    <p className="mt-0.5 flex items-start gap-1 text-xs text-zinc-500">
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span className="line-clamp-2">{listing.location}</span>
                    </p>
                    {!hasPin && (
                      <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                        Map pin unavailable
                      </p>
                    )}
                    {listing.isClaimable && (
                      <Link
                        href={claimUrl}
                        onClick={(event) => event.stopPropagation()}
                        className={buttonVariants({
                          variant: "default",
                          className: "mt-2 h-9 min-h-9 w-full rounded-lg text-xs font-bold",
                        })}
                      >
                        Claim this business
                      </Link>
                    )}
                    {!listing.isClaimable && (
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

        <div className="relative min-h-[360px] bg-zinc-100 lg:min-h-[640px]">
          {mappableListings.length === 0 ? (
            <div className="flex h-full min-h-[360px] flex-col items-center justify-center px-6 text-center">
              <MapPin className="mb-3 h-10 w-10 text-zinc-300" />
              <p className="text-sm font-bold text-zinc-700">No map coordinates for these listings yet</p>
              <p className="mt-1 text-xs text-zinc-500">Switch to grid view or open a listing profile for details.</p>
            </div>
          ) : (
            <APIProvider apiKey={apiKey}>
              <Map
                defaultCenter={mapCenter}
                defaultZoom={12}
                mapId="trimma_business_listings_map"
                className="h-full min-h-[360px] w-full lg:min-h-[640px]"
                disableDefaultUI={false}
                gestureHandling="greedy"
              >
                <MapBoundsFitter listings={mappableListings} />
                <MapCameraController
                  selectedId={selectedId}
                  listings={mappableListings}
                  focusSelected={focusSelected}
                />
                {mappableListings.map((listing) => {
                  const isSelected = selectedId === listing.id;
                  return (
                    <AdvancedMarker
                      key={listing.id}
                      position={{ lat: listing.latitude!, lng: listing.longitude! }}
                      onClick={() => selectListing(listing.id)}
                    >
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full shadow-lg transition-transform ${
                          isSelected
                            ? "z-10 scale-125 bg-zinc-900 text-[#ffde5a]"
                            : "scale-100 bg-[#ffde5a] text-black"
                        }`}
                        style={{ border: isSelected ? "2px solid white" : "none" }}
                      >
                        <Store className="h-5 w-5" />
                      </div>
                    </AdvancedMarker>
                  );
                })}

                {selectedListing?.latitude && selectedListing?.longitude && (
                  <InfoWindow
                    position={{
                      lat: selectedListing.latitude,
                      lng: selectedListing.longitude,
                    }}
                    onCloseClick={() => {
                      setFocusSelected(false);
                      setSelectedId(null);
                    }}
                  >
                    <div className="max-w-[220px] space-y-2 p-1">
                      <p className="text-sm font-bold text-zinc-900">{selectedListing.name}</p>
                      <p className="text-xs text-zinc-600">{selectedListing.location}</p>
                      {selectedListing.isClaimable ? (
                        <Link
                          href={buildSalonClaimLoginUrl(selectedListing.id)}
                          className={buttonVariants({
                            variant: "default",
                            className: "h-9 min-h-9 w-full rounded-lg text-xs font-bold",
                          })}
                        >
                          Claim this business
                        </Link>
                      ) : (
                        <Link
                          href={buildSalonPublicPath(selectedListing)}
                          className={buttonVariants({
                            variant: "outline",
                            className: "h-9 min-h-9 w-full rounded-lg text-xs font-bold",
                          })}
                        >
                          View profile
                        </Link>
                      )}
                    </div>
                  </InfoWindow>
                )}
              </Map>
            </APIProvider>
          )}
          {!apiKey && mappableListings.length > 0 && (
            <div className="absolute left-4 right-4 top-4 z-50 rounded-xl border border-red-200 bg-red-50/90 p-3 text-center text-xs font-bold text-red-600 shadow-sm backdrop-blur-sm">
              Google Maps API key missing (NEXT_PUBLIC_GOOGLE_MAPS_API_KEY).
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
