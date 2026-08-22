"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Search, MapPin, Loader2, Sparkles } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { BusinessListingsMap } from "../components/marketplace/BusinessListingsMap";
import { ListingBrowseToolbar } from "../components/marketplace/ListingBrowseToolbar";
import {
  ListingResultsSections,
  mergeListingSectionCards,
} from "../components/marketplace/ListingResultsSections";
import type { BusinessListingCardData } from "@/lib/business-listing-mapper";
import type { PublicCategory } from "@/lib/public-categories";
import { resolveLocationDisplayLabel, resolveLocationSearchValue } from "@/lib/sri-lanka-locations";
import { SriLankaLocationSelect } from "../components/locations/SriLankaLocationSelect";
import { YOU_MAY_ALSO_LIKE_COUNT } from "@/lib/listing-marketplace-rank";

const HERO_IMAGE = "/assets/landing-hero-banner.webp?v=4";

type InitialSearch = {
  q: string;
  l: string;
  category: string;
};

type Props = {
  categories?: PublicCategory[];
  initialSearch: InitialSearch;
  initialListings?: BusinessListingCardData[];
  initialTopRated?: BusinessListingCardData[];
  initialFeatured?: BusinessListingCardData[];
  initialHasMore?: boolean;
  initialTotalCount?: number;
  ssrSeeded?: boolean;
};

type ListingFilters = {
  q: string;
  location: string;
  category: string;
};

function readFiltersFromLocation(): ListingFilters {
  if (typeof window === "undefined") {
    return { q: "", location: "", category: "" };
  }
  const params = new URLSearchParams(window.location.search);
  return {
    q: params.get("q") || "",
    location: params.get("l") || "",
    category: params.get("category") || "",
  };
}

function buildListingSearchParams(
  filters: ListingFilters,
  categories: PublicCategory[],
  page: number
): URLSearchParams {
  const params = new URLSearchParams({
    q: filters.q,
    location: filters.location,
    category: filters.category,
    limit: String(YOU_MAY_ALSO_LIKE_COUNT),
    offset: String(page * YOU_MAY_ALSO_LIKE_COUNT),
  });
  const activeCategory = categories.find((category) => category.slug === filters.category);
  if (activeCategory?.name) {
    params.set("categoryName", activeCategory.name);
  }
  params.set("publishedOnly", "true");
  return params;
}

export default function ListingsClient({
  categories = [],
  initialSearch,
  initialListings = [],
  initialTopRated = [],
  initialFeatured = [],
  initialHasMore = true,
  initialTotalCount = 0,
  ssrSeeded = false,
}: Props) {
  const [searchQuery, setSearchQuery] = useState(initialSearch.q);
  const [selectedLocation, setSelectedLocation] = useState(() =>
    resolveLocationSearchValue(initialSearch.l)
  );
  const [urlCategory, setUrlCategory] = useState(initialSearch.category);
  const [listings, setListings] = useState(initialListings);
  const [topRated, setTopRated] = useState(initialTopRated);
  const [featured, setFeatured] = useState(initialFeatured);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [isLoading, setIsLoading] = useState(!ssrSeeded);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [page, setPage] = useState(0);
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const loadListings = useCallback(
    async (
      filters: ListingFilters,
      nextPage: number,
      reset: boolean,
      categoryList: PublicCategory[]
    ) => {
      setIsLoading(reset);
      if (!reset) setIsLoadingMore(true);
      try {
        const params = buildListingSearchParams(filters, categoryList, nextPage);
        const res = await fetch(`/api/business-listings/search?${params.toString()}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();
        const rows = (data.listings || []) as BusinessListingCardData[];
        if (typeof data.totalCount === "number") {
          setTotalCount(data.totalCount);
        }

        if (reset) {
          setTopRated((data.topRated || []) as BusinessListingCardData[]);
          setFeatured((data.featured || []) as BusinessListingCardData[]);
          setListings(rows);
        } else {
          setListings((prev) => {
            const ids = new Set(prev.map((item) => item.id));
            return [...prev, ...rows.filter((item) => !ids.has(item.id))];
          });
        }
        setHasMore(Boolean(data.hasMore));
      } catch (error) {
        console.error(error);
        setHasMore(false);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    []
  );

  const applyFilters = useCallback(
    (filters: ListingFilters, options?: { syncUrl?: boolean }) => {
      const canonicalLocation = resolveLocationSearchValue(filters.location);
      const nextFilters = { ...filters, location: canonicalLocation };

      setSearchQuery(nextFilters.q);
      setSelectedLocation(nextFilters.location);
      setUrlCategory(nextFilters.category);
      setPage(0);

      if (options?.syncUrl !== false) {
        const params = new URLSearchParams();
        if (nextFilters.q) params.set("q", nextFilters.q);
        if (nextFilters.location) params.set("l", nextFilters.location);
        if (nextFilters.category) params.set("category", nextFilters.category);
        const qs = params.toString();
        window.history.replaceState(window.history.state, "", qs ? `/?${qs}` : "/");
      }

      void loadListings(nextFilters, 0, true, categories);
    },
    [categories, loadListings]
  );

  useEffect(() => {
    if (ssrSeeded) return;
    void loadListings(
      {
        q: searchQuery.trim(),
        location: selectedLocation,
        category: urlCategory,
      },
      0,
      true,
      categories
    );
  }, [ssrSeeded]);

  useEffect(() => {
    const onPopState = () => {
      applyFilters(readFiltersFromLocation(), { syncUrl: false });
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [applyFilters]);

  const handleSearch = () => {
    applyFilters({
      q: searchQuery.trim(),
      location: selectedLocation,
      category: urlCategory,
    });
  };

  const handleLoadMore = () => {
    if (isLoading || isLoadingMore || !hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    void loadListings(
      {
        q: searchQuery.trim(),
        location: selectedLocation,
        category: urlCategory,
      },
      nextPage,
      false,
      categories
    );
  };

  const locationLabel = resolveLocationDisplayLabel(selectedLocation);
  const activeCategory = categories.find((category) => category.slug === urlCategory);
  const allVisibleListings = mergeListingSectionCards(topRated, featured, listings);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <section className="page-hero-shell home-hero home-hero-split home-hero-split--business-listings relative min-h-[500px]">
        <img
          src={HERO_IMAGE}
          alt=""
          width={1920}
          height={500}
          decoding="async"
          fetchPriority="high"
          className="home-hero-bg-image absolute inset-0 h-full w-full object-cover pointer-events-none"
        />
        <div className="home-hero-left-overlay absolute inset-0 hidden lg:block pointer-events-none" aria-hidden="true" />
        <div className="home-hero-mobile-overlay lg:hidden absolute inset-0 pointer-events-none" aria-hidden="true" />

        <div className="container relative z-10 mx-auto max-w-7xl">
          <div className="home-hero-content-col home-hero-content hero-ink text-left w-full lg:w-1/2 flex flex-col justify-between">
            <div className="home-hero-top">
              <h1 className="home-hero-title text-3xl sm:text-4xl md:text-5xl xl:text-5xl font-black tracking-tight">
                <span className="home-hero-title-line">Your Business. Your Customers. Your Growth.</span>
                <span className="home-hero-title-accent underline decoration-[#ffde5a] decoration-4 underline-offset-4">
                  Powered by Trimma.
                </span>
              </h1>

              <p className="text-sm sm:text-base md:text-lg font-medium max-w-lg leading-relaxed">
                Salons, spas, and wellness businesses discovered by Trimma are brought to customers looking for
                their next appointment. Own a business listed on Trimma? Claim your business with Google Sign-In
                through our verified business claim flow.
              </p>
            </div>

            <div className="home-hero-middle">
              <div className="flex flex-col items-start gap-3">
                <Link
                  href="/onboarding"
                  className={buttonVariants({
                    variant: "hero",
                    size: "lg",
                    className:
                      "hero-btn-primary hero-btn-compact h-12 min-h-11 w-full rounded-xl px-8 font-bold sm:w-auto",
                  })}
                >
                  Claim Your Business — It&apos;s Free
                </Link>
                <p className="max-w-lg text-sm font-medium leading-relaxed text-zinc-800">
                  Get discovered. Manage bookings. Grow your business with Trimma.
                </p>
              </div>

              <div className="home-hero-stats flex flex-wrap items-center gap-3 sm:gap-4 text-xs font-bold">
                <span className="hero-badge hero-eyebrow px-3 py-1">
                  {totalCount.toLocaleString()} {totalCount === 1 ? "Business Listed" : "Businesses Listed"}
                </span>
                <span className="home-hero-stats-dot w-1.5 h-1.5 rounded-full shrink-0 hidden sm:block" aria-hidden="true" />
                <span className="uppercase tracking-wider">All provinces · districts · cities</span>
              </div>

              <div className="trimma-hero-search bg-white p-2 rounded-2xl shadow-xl flex flex-col sm:flex-row gap-2 border border-slate-100 w-full">
                <div className="flex-1 flex items-center px-4 bg-zinc-50 rounded-xl min-w-0">
                  <Search className="h-5 w-5 text-brand-pink mr-3 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    placeholder="Salon name or category"
                    className="h-12 w-full bg-transparent text-sm font-semibold text-zinc-900 placeholder:text-zinc-400 outline-none min-w-0"
                  />
                </div>
                <div className="flex-1 flex items-center px-4 bg-zinc-50 rounded-xl min-w-0">
                  <MapPin className="h-5 w-5 text-brand-pink mr-3 shrink-0" />
                  <SriLankaLocationSelect
                    value={selectedLocation}
                    onChange={(value) => {
                      applyFilters(
                        {
                          q: searchQuery.trim(),
                          location: value,
                          category: urlCategory,
                        },
                        { syncUrl: false }
                      );
                    }}
                    anyLabel="Any location"
                    className="h-12 w-full cursor-pointer appearance-none bg-transparent text-sm font-bold text-zinc-900 outline-none min-w-0"
                  />
                </div>
                <Button
                  onClick={handleSearch}
                  size="lg"
                  variant="hero"
                  className="hero-btn-primary hero-btn-compact h-12 min-h-11 w-full shrink-0 rounded-xl px-8 font-bold sm:w-auto"
                >
                  Search
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ListingBrowseToolbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        count={totalCount}
        countLabel={totalCount === 1 ? "business listed" : "businesses listed"}
        trailing={
          <Link
            href="/bookings"
            className={buttonVariants({
              variant: "outline",
              className: "h-10 min-h-10 rounded-xl font-bold",
            })}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Book verified salons
          </Link>
        }
      />

      <div className="border-b border-slate-200 bg-white">
        <div className="container mx-auto max-w-7xl px-4 py-3 text-sm">
          <p className="font-semibold text-zinc-800">
            {locationLabel}
            {activeCategory ? ` · ${activeCategory.name}` : " · Published listings"}
          </p>
        </div>
      </div>

      <main className="container mx-auto max-w-7xl flex-1 px-4 py-8">
        {isLoading && allVisibleListings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="mb-4 h-10 w-10 animate-spin text-brand" />
            <p className="text-sm font-bold text-zinc-500">Loading business listings…</p>
          </div>
        ) : allVisibleListings.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-20 text-center">
            <p className="text-lg font-black text-[#1A1C29]">No listings found</p>
            <p className="mt-2 text-sm text-zinc-500">
              Try another city or run Google Places discovery from Admin → Lead Management.
            </p>
          </div>
        ) : (
          <>
            {viewMode === "map" ? (
              <BusinessListingsMap listings={allVisibleListings} searchLocation={selectedLocation} />
            ) : (
              <ListingResultsSections
                topRated={topRated}
                featured={featured}
                more={listings}
                hasMore={hasMore}
                isLoadingMore={isLoadingMore}
                onLoadMore={handleLoadMore}
                gridClassName="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                moreTitle={searchQuery.trim() ? "Search results" : undefined}
                moreDescription={
                  searchQuery.trim()
                    ? "Businesses matching the name you searched."
                    : undefined
                }
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
