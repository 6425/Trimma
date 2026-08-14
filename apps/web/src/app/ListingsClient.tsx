"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, MapPin, Loader2, Building2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BusinessListingCard } from "../components/marketplace/BusinessListingCard";
import type { BusinessListingCardData } from "@/lib/business-listing-mapper";

const HERO_IMAGE = "/assets/beauty-salon-hero.webp";
const PAGE_SIZE = 24;

type InitialSearch = {
  q: string;
  l: string;
  category: string;
};

type Props = {
  initialSearch: InitialSearch;
  initialListings?: BusinessListingCardData[];
  initialHasMore?: boolean;
  ssrSeeded?: boolean;
};

function SearchParamsSync({ onChange }: { onChange: (next: InitialSearch) => void }) {
  const searchParams = useSearchParams();
  useEffect(() => {
    onChange({
      q: searchParams.get("q") || "",
      l: searchParams.get("l") || "",
      category: searchParams.get("category") || "",
    });
  }, [searchParams, onChange]);
  return null;
}

export default function ListingsClient({
  initialSearch,
  initialListings = [],
  initialHasMore = true,
  ssrSeeded = false,
}: Props) {
  const router = useRouter();
  const skipFetchRef = useRef(ssrSeeded);
  const seededKeyRef = useRef(`${initialSearch.q}|${initialSearch.l}|${initialSearch.category}`);

  const [searchQuery, setSearchQuery] = useState(initialSearch.q);
  const [selectedLocation, setSelectedLocation] = useState(initialSearch.l);
  const [urlCategory, setUrlCategory] = useState(initialSearch.category);
  const [listings, setListings] = useState(initialListings);
  const [isLoading, setIsLoading] = useState(!ssrSeeded);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [page, setPage] = useState(0);

  const fetchListings = useCallback(
    async (reset: boolean) => {
      setIsLoading(true);
      try {
        const offset = reset ? 0 : page * PAGE_SIZE;
        const params = new URLSearchParams({
          q: searchQuery,
          location: selectedLocation,
          category: urlCategory,
          limit: String(PAGE_SIZE),
          offset: String(offset),
        });
        const res = await fetch(`/api/business-listings/search?${params.toString()}`);
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();
        const rows = (data.listings || []) as BusinessListingCardData[];

        if (reset) setListings(rows);
        else {
          setListings((prev) => {
            const ids = new Set(prev.map((item) => item.id));
            return [...prev, ...rows.filter((item) => !ids.has(item.id))];
          });
        }
        setHasMore(Boolean(data.hasMore));
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    },
    [page, searchQuery, selectedLocation, urlCategory]
  );

  useEffect(() => {
    const key = `${searchQuery}|${selectedLocation}|${urlCategory}`;
    const matchesSeed = skipFetchRef.current && page === 0 && key === seededKeyRef.current;
    if (matchesSeed) {
      skipFetchRef.current = false;
      setIsLoading(false);
      return;
    }
    skipFetchRef.current = false;
    void fetchListings(page === 0);
  }, [fetchListings, page, searchQuery, selectedLocation, urlCategory]);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (selectedLocation) params.set("l", selectedLocation);
    if (urlCategory) params.set("category", urlCategory);
    setPage(0);
    router.push(`/?${params.toString()}`);
  };

  const syncFromUrl = useCallback((next: InitialSearch) => {
    setSearchQuery((prev) => (prev === next.q ? prev : next.q));
    setSelectedLocation((prev) => (prev === next.l ? prev : next.l));
    setUrlCategory((prev) => (prev === next.category ? prev : next.category));
  }, []);

  const locationLabel = selectedLocation
    ? selectedLocation.charAt(0).toUpperCase() + selectedLocation.slice(1)
    : "Sri Lanka";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Suspense fallback={null}>
        <SearchParamsSync onChange={syncFromUrl} />
      </Suspense>

      <section className="relative min-h-[360px] border-b border-slate-200 bg-zinc-950">
        <Image src={HERO_IMAGE} alt="" fill priority className="object-cover opacity-35" sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/90 to-zinc-950/40" />
        <div className="container relative z-10 mx-auto max-w-7xl px-4 py-12 md:py-16">
          <Badge variant="hero" className="mb-4">
            <Building2 className="mr-1.5 h-3.5 w-3.5" />
            Admin Lead Listings
          </Badge>
          <h1 className="max-w-3xl text-3xl font-black tracking-tight text-white md:text-5xl">
            Business listings across <span className="text-[#ffde5a] underline decoration-[#ffde5a] decoration-4 underline-offset-4">Sri Lanka</span>
          </h1>
          <p className="mt-4 max-w-2xl text-sm font-medium leading-relaxed text-zinc-300 md:text-base">
            Salons and spas discovered by Trimma admin through Lead Management. Own a business here?
            Claim it with Google sign-in — same verified flow used for Google Business profile claims.
          </p>

          <div className="mt-8 grid max-w-4xl grid-cols-1 gap-2 rounded-2xl border border-white/10 bg-white p-2 shadow-xl md:grid-cols-[1fr_1fr_auto]">
            <div className="flex items-center gap-2 rounded-xl bg-zinc-50 px-3">
              <Search className="h-5 w-5 shrink-0 text-brand-pink" />
              <input
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(0);
                }}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Salon name or category"
                className="h-12 w-full bg-transparent text-sm font-semibold text-zinc-900 outline-none"
              />
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-zinc-50 px-3">
              <MapPin className="h-5 w-5 shrink-0 text-brand-pink" />
              <select
                value={selectedLocation}
                onChange={(e) => {
                  setSelectedLocation(e.target.value);
                  setPage(0);
                }}
                className="h-12 w-full bg-transparent text-sm font-bold text-zinc-900 outline-none"
              >
                <option value="">Any location</option>
                <option value="colombo">Colombo</option>
                <option value="gampaha">Gampaha</option>
                <option value="kandy">Kandy</option>
                <option value="galle">Galle</option>
                <option value="anuradhapura">Anuradhapura</option>
              </select>
            </div>
            <Button onClick={handleSearch} variant="default" className="h-12 min-h-12 rounded-xl px-8 font-bold">
              Search
            </Button>
          </div>
        </div>
      </section>

      <div className="border-b border-slate-200 bg-white">
        <div className="container mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 text-sm">
          <p className="font-semibold text-zinc-800">
            {locationLabel} · Lead Management listings
          </p>
          <div className="flex items-center gap-3">
            <p className="text-zinc-500">
              <span className="font-bold text-zinc-900">{listings.length}</span> businesses
            </p>
            <Button asChild variant="outline" className="h-10 rounded-xl font-bold">
              <Link href="/bookings">
                <Sparkles className="mr-2 h-4 w-4" />
                Book verified salons
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <main className="container mx-auto max-w-7xl flex-1 px-4 py-8">
        {isLoading && page === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="mb-4 h-10 w-10 animate-spin text-brand" />
            <p className="text-sm font-bold text-zinc-500">Loading business listings…</p>
          </div>
        ) : listings.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-20 text-center">
            <p className="text-lg font-black text-[#1A1C29]">No listings found</p>
            <p className="mt-2 text-sm text-zinc-500">
              Try another city or run Google Places discovery from Admin → Lead Management.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {listings.map((listing, index) => (
                <BusinessListingCard key={listing.id} listing={listing} priority={index < 8} />
              ))}
            </div>

            {hasMore && (
              <div className="mt-10 flex justify-center">
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-xl px-8 font-bold"
                  disabled={isLoading}
                  onClick={() => setPage((p) => p + 1)}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading…
                    </>
                  ) : (
                    "Load more listings"
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
