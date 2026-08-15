"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { APIProvider, AdvancedMarker, Map, useMap } from "@vis.gl/react-google-maps";
import { ExternalLink, MapPin, Store } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import type { BusinessListingCardData } from "@/lib/business-listing-mapper";
import { listingHasMapDisplay } from "@/lib/business-listing-mapper";
import { buildSalonClaimLoginUrl } from "@/lib/salon-public-listing";
import { buildSalonPublicPath } from "@/lib/salon-public-path";
import { getSalonDirectionsUrl, type SalonMapInput } from "@/lib/salon-map";
import { useDeviceTravel, type DeviceCoords } from "@/hooks/use-device-travel";
import { MapTravelPanel } from "./MapTravelPanel";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=600&auto=format&fit=crop";
const SRI_LANKA_CENTER = { lat: 7.8731, lng: 80.7718 };

type Props = {
  listings: BusinessListingCardData[];
  searchLocation?: string;
};

type MarkerPoint = {
  id: string;
  lat: number;
  lng: number;
};

function listingToSalon(listing: BusinessListingCardData): SalonMapInput {
  return {
    name: listing.name,
    address: listing.address,
    city: listing.city,
    district: listing.district,
    province: listing.province,
    place_id: listing.placeId,
    latitude: listing.latitude,
    longitude: listing.longitude,
    map_url: listing.mapUrl,
  };
}

function FitListedBounds({ points }: { points: MarkerPoint[] }) {
  const map = useMap();
  const fittedKeyRef = useRef("");

  useEffect(() => {
    if (!map || points.length === 0) return;
    const key = points.map((point) => `${point.id}:${point.lat.toFixed(5)},${point.lng.toFixed(5)}`).join("|");
    if (fittedKeyRef.current === key) return;
    fittedKeyRef.current = key;

    if (points.length === 1) {
      map.setCenter({ lat: points[0].lat, lng: points[0].lng });
      map.setZoom(13);
      return;
    }

    const bounds = new google.maps.LatLngBounds();
    for (const point of points) bounds.extend({ lat: point.lat, lng: point.lng });
    map.fitBounds(bounds, 56);
  }, [map, points]);

  return null;
}

function RouteOverlay({
  origin,
  destination,
}: {
  origin: DeviceCoords | null;
  destination: { lat: number; lng: number } | null;
}) {
  const map = useMap();
  const rendererRef = useRef<google.maps.DirectionsRenderer | null>(null);

  useEffect(() => {
    if (!map) return;
    if (!rendererRef.current) {
      rendererRef.current = new google.maps.DirectionsRenderer({
        map,
        suppressMarkers: true,
        preserveViewport: true,
        polylineOptions: {
          strokeColor: "#111111",
          strokeOpacity: 0.9,
          strokeWeight: 5,
        },
      });
    }

    const renderer = rendererRef.current;
    if (!origin || !destination) {
      renderer.set("directions", null);
      return;
    }

    const service = new google.maps.DirectionsService();
    let cancelled = false;
    service.route(
      {
        origin,
        destination,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (cancelled || status !== google.maps.DirectionsStatus.OK || !result) return;
        renderer.setDirections(result);
      }
    );

    return () => {
      cancelled = true;
    };
  }, [map, origin?.lat, origin?.lng, destination?.lat, destination?.lng]);

  return null;
}

function ListingMarkers({
  points,
  selectedId,
  onSelect,
}: {
  points: MarkerPoint[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <>
      {points.map((point) => {
        const isSelected = selectedId === point.id;
        return (
          <AdvancedMarker
            key={point.id}
            position={{ lat: point.lat, lng: point.lng }}
            zIndex={isSelected ? 20 : 1}
            onClick={() => onSelect(point.id)}
          >
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-full shadow-lg ${
                isSelected ? "bg-black text-[#ffde5a] scale-110" : "bg-[#ffde5a] text-black"
              }`}
            >
              <Store className="h-4 w-4" />
            </div>
          </AdvancedMarker>
        );
      })}
    </>
  );
}

export function BusinessListingsMap({ listings, searchLocation = "" }: Props) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  const mappableListings = useMemo(
    () => listings.filter((listing) => listing.latitude != null && listing.longitude != null),
    [listings]
  );
  const points = useMemo<MarkerPoint[]>(
    () =>
      mappableListings.map((listing) => ({
        id: listing.id,
        lat: Number(listing.latitude),
        lng: Number(listing.longitude),
      })),
    [mappableListings]
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchOrigin, setSearchOrigin] = useState<DeviceCoords | null>(null);

  const defaultSelectedId = mappableListings[0]?.id || listings[0]?.id || null;
  const effectiveSelectedId =
    selectedId && listings.some((item) => item.id === selectedId) ? selectedId : defaultSelectedId;
  const selectedListing =
    listings.find((item) => item.id === effectiveSelectedId) || mappableListings[0] || listings[0] || null;
  const selectedSalon = selectedListing ? listingToSalon(selectedListing) : null;
  const selectedPoint = points.find((point) => point.id === selectedListing?.id) || null;

  const searchQuery = searchLocation.trim();

  useEffect(() => {
    if (!searchQuery) {
      setSearchOrigin(null);
      return;
    }

    const controller = new AbortController();
    void (async () => {
      try {
        const response = await fetch(`/api/maps/geocode?q=${encodeURIComponent(searchQuery)}`, {
          signal: controller.signal,
        });
        const payload = (await response.json()) as { lat?: number; lng?: number };
        if (!response.ok || payload.lat == null || payload.lng == null) return;
        setSearchOrigin((current) => {
          const next = { lat: payload.lat as number, lng: payload.lng as number };
          if (current && Math.abs(current.lat - next.lat) < 0.00001 && Math.abs(current.lng - next.lng) < 0.00001) {
            return current;
          }
          return next;
        });
      } catch {
        /* keep previous origin */
      }
    })();

    return () => controller.abort();
  }, [searchQuery]);

  const travel = useDeviceTravel(selectedSalon, searchOrigin);
  const fastestMode = travel.estimate?.fastest.mode || "driving";
  const directionsUrl = selectedSalon
    ? getSalonDirectionsUrl(selectedSalon, travel.origin, fastestMode)
    : null;
  const defaultCenter = points[0] ? { lat: points[0].lat, lng: points[0].lng } : SRI_LANKA_CENTER;

  if (!listings.length) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="grid min-h-[560px] lg:grid-cols-[minmax(0,360px)_1fr]">
        <div className="max-h-[320px] overflow-y-auto border-b border-slate-200 lg:max-h-[680px] lg:border-b-0 lg:border-r">
          <div className="sticky top-0 z-10 border-b border-slate-100 bg-white px-4 py-3">
            <p className="text-sm font-bold text-zinc-900">{listings.length} businesses on this map</p>
            <p className="text-xs text-zinc-500">
              {searchQuery
                ? `Select a business to see the route and distance from ${searchQuery}`
                : "Select a business to see the route and distance from your search location"}
            </p>
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
                            Address only — map pin unavailable
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
              <MapTravelPanel
                status={searchOrigin ? "granted" : travel.status}
                estimate={travel.estimate}
                loadingTravel={travel.loadingTravel}
                error={travel.error}
                onRequestLocation={travel.requestLocation}
              />
              {directionsUrl && (
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-zinc-700 hover:text-zinc-900"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open fastest route in Google Maps
                </a>
              )}
            </div>
          )}

          <div className="relative flex-1 min-h-[300px]">
            {apiKey ? (
              <APIProvider apiKey={apiKey}>
                <Map
                  defaultCenter={defaultCenter}
                  defaultZoom={12}
                  mapId="trimma_territory_map"
                  className="absolute inset-0 h-full w-full"
                  gestureHandling="greedy"
                  disableDefaultUI={false}
                >
                  <FitListedBounds points={points} />
                  <ListingMarkers points={points} selectedId={effectiveSelectedId} onSelect={setSelectedId} />
                  <RouteOverlay
                    origin={travel.origin}
                    destination={selectedPoint ? { lat: selectedPoint.lat, lng: selectedPoint.lng } : null}
                  />
                </Map>
              </APIProvider>
            ) : (
              <div className="flex h-full min-h-[300px] flex-col items-center justify-center px-6 text-center">
                <MapPin className="mb-3 h-10 w-10 text-zinc-300" />
                <p className="text-sm font-bold text-zinc-700">{points.length} businesses in this selection</p>
                <p className="mt-1 text-xs text-zinc-500">
                  Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to show every pin and the selected route on the map.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
