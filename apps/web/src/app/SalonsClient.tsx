"use client";

import { Suspense, useState, useEffect, useCallback, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, MapPin, Star, Sparkles, Loader2, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SalonListRow } from "../components/marketplace/SalonListRow";
import { SalonCard } from "../components/marketplace/SalonCard";
import {
  SalonFiltersPanel,
  countActiveFilters,
  defaultSalonFilters,
  type SalonFilters,
} from "../components/marketplace/SalonFiltersPanel";
import type { SalonDealRow } from "@/lib/deals";
import { AnalyticsEvent, trackEvent } from "@/lib/analytics";
import { SriLankaLocationSelect } from "../components/locations/SriLankaLocationSelect";
import { resolveLocationDisplayLabel, resolveLocationSearchValue } from "@/lib/sri-lanka-locations";

const DealsDiscountSection = dynamic(
  () =>
    import("../components/landing-v2/DealsDiscountSection").then((m) => m.DealsDiscountSection),
  { loading: () => null }
);

const LANDING_HERO_IMAGE = "/assets/beauty-salon-hero.webp";


interface Salon {
  id: string;
  name: string;
  slug: string;
  rating: number;
  reviews: number;
  location: string;
  category: string;
  logo: string;
  image: string;
  featured: boolean;
  openNow: boolean;
  startingPrice: number;
  tags: string[];
  nextSlot: string;
  status?: "Open Now" | "Closed";
  popularService: string;
  isVerified?: boolean;
  isClaimable?: boolean;
}

interface Category {
  slug: string;
  name: string;
  icon: string;
}

type InitialSearch = {
  q: string;
  l: string;
  category: string;
};

export type SalonsClientVariant = "directory" | "booking";

interface Props {
  categories: Category[];
  initialSearch: InitialSearch;
  initialSalons?: Salon[];
  initialHasMore?: boolean;
  initialDeals?: SalonDealRow[];
  /** True when the server already ran the default listing query for initialSearch. */
  ssrSeeded?: boolean;
  /** directory = browse published listings; booking = admin-approved verified salons */
  variant?: SalonsClientVariant;
}

type SortOption = "recommended" | "rating" | "price_low" | "price_high";

function SearchParamsSync({
  onChange,
}: {
  onChange: (next: InitialSearch) => void;
}) {
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

export default function SalonsClient({
  categories,
  initialSearch,
  initialSalons = [],
  initialHasMore = true,
  initialDeals = [],
  ssrSeeded = false,
  variant = "directory",
}: Props) {
  const isBooking = variant === "booking";
  const basePath = isBooking ? "/bookings" : "/";
  const router = useRouter();
  // Skip the first client fetch when the server already seeded results.
  const skipClientFetchRef = useRef(ssrSeeded);
  const seededSearchKeyRef = useRef(
    `${initialSearch.q}|${initialSearch.l}|${initialSearch.category}`
  );

  const [searchQuery, setSearchQuery] = useState(initialSearch.q);
  const [selectedLocation, setSelectedLocation] = useState(() =>
    resolveLocationSearchValue(initialSearch.l)
  );
  const [urlCategory, setUrlCategory] = useState(initialSearch.category);
  const [sortBy, setSortBy] = useState<SortOption>("recommended");
  const [filters, setFilters] = useState<SalonFilters>(() => ({
    ...defaultSalonFilters,
    selectedCategories: initialSearch.category ? [initialSearch.category] : [],
  }));
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const [searchResults, setSearchResults] = useState<Salon[]>(initialSalons);
  // Only show the spinner when we have no SSR seed to paint.
  const [isLoading, setIsLoading] = useState(!ssrSeeded);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [page, setPage] = useState(0);
  const LIMIT = isBooking ? 20 : 12;
  const trackedSearchKeyRef = useRef<string | null>(null);
  const trackedPageViewRef = useRef(false);

  const trackSearchResults = useCallback(
    (source: "page_load" | "search_submit" | "url_sync" | "filter", resultCount?: number) => {
      const key = [
        source,
        searchQuery.trim(),
        selectedLocation.trim(),
        urlCategory.trim(),
        filters.selectedCategories.join(","),
        String(resultCount ?? ""),
      ].join("|");
      if (trackedSearchKeyRef.current === key) return;
      trackedSearchKeyRef.current = key;

      trackEvent(AnalyticsEvent.SalonSearch, {
        source,
        query: searchQuery.trim() || null,
        location: selectedLocation.trim() || null,
        category: urlCategory.trim() || filters.selectedCategories[0] || null,
        categories: filters.selectedCategories.join(",") || null,
        result_count: typeof resultCount === "number" ? resultCount : null,
        sort: sortBy,
      });
    },
    [searchQuery, selectedLocation, urlCategory, filters.selectedCategories, sortBy]
  );

  useEffect(() => {
    if (trackedPageViewRef.current) return;
    trackedPageViewRef.current = true;
    trackEvent(AnalyticsEvent.SearchPageViewed, {
      query: initialSearch.q || null,
      location: initialSearch.l || null,
      category: initialSearch.category || null,
      initial_result_count: initialSalons.length,
    });
    if (initialSearch.q || initialSearch.l || initialSearch.category) {
      trackSearchResults("page_load", initialSalons.length);
    }
  }, [initialSearch, initialSalons.length, trackSearchResults]);

  const fetchResults = useCallback(
    async (reset: boolean = false) => {
      setIsLoading(true);
      try {
        const offset = reset ? 0 : page * LIMIT;
        const params = new URLSearchParams({
          q: searchQuery,
          location: selectedLocation,
          category: urlCategory,
          limit: LIMIT.toString(),
          offset: offset.toString(),
          sort: sortBy === "price_low" || sortBy === "price_high" ? "recommended" : sortBy,
        });
        if (filters.minRating > 0) params.set("minRating", String(filters.minRating));
        if (filters.verifiedOnly) params.set("verified", "true");
        if (isBooking) params.set("approved", "true");
        else params.set("browse", "true");

        const res = await fetch(`/api/salons/search?${params.toString()}`);
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();

        if (reset) {
          const salons = data.salons || [];
          setSearchResults(salons);
          if (searchQuery || selectedLocation || urlCategory) {
            trackSearchResults("url_sync", salons.length);
          }
        } else {
          setSearchResults((prev) => {
            const newSalons = data.salons || [];
            const existingIds = new Set(prev.map((s) => s.id));
            const uniqueNewSalons = newSalons.filter((s) => !existingIds.has(s.id));
            return [...prev, ...uniqueNewSalons];
          });
        }
        setHasMore(data.hasMore);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    },
    [searchQuery, selectedLocation, urlCategory, page, sortBy, filters.minRating, filters.verifiedOnly, isBooking, trackSearchResults]
  );

  useEffect(() => {
    const searchKey = `${searchQuery}|${selectedLocation}|${urlCategory}`;
    const matchesSeed =
      skipClientFetchRef.current &&
      page === 0 &&
      sortBy === "recommended" &&
      filters.minRating === 0 &&
      !filters.verifiedOnly &&
      searchKey === seededSearchKeyRef.current;

    if (matchesSeed) {
      skipClientFetchRef.current = false;
      setIsLoading(false);
      return;
    }

    skipClientFetchRef.current = false;
    void Promise.resolve().then(() => {
      fetchResults(page === 0);
    });
  }, [
    fetchResults,
    page,
    searchQuery,
    selectedLocation,
    urlCategory,
    sortBy,
    filters.minRating,
    filters.verifiedOnly,
  ]);

  const handleSearch = () => {
    trackEvent(AnalyticsEvent.SalonSearch, {
      source: "search_submit",
      query: searchQuery.trim() || null,
      location: selectedLocation.trim() || null,
      category: urlCategory.trim() || null,
      sort: sortBy,
    });
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (selectedLocation) params.set("l", selectedLocation);
    if (urlCategory) params.set("category", urlCategory);
    setPage(0);
    router.push(`${basePath}?${params.toString()}`);
  };

  const applyClientFilters = useCallback(
    (salons: Salon[]) => {
      let rows = [...salons];

      if (filters.maxPrice != null) {
        rows = rows.filter((s) => s.startingPrice <= filters.maxPrice!);
      }
      if (filters.openNowOnly) {
        rows = rows.filter((s) => s.openNow);
      }
      if (filters.selectedCategories.length > 0) {
        rows = rows.filter((s) =>
          filters.selectedCategories.some(
            (slug) =>
              s.category.toLowerCase().includes(slug.replace(/-/g, " ")) ||
              s.tags.some((t) => t.toLowerCase().includes(slug.replace(/-/g, " ")))
          )
        );
      }

      if (sortBy === "price_low") {
        rows.sort((a, b) => a.startingPrice - b.startingPrice);
      } else if (sortBy === "price_high") {
        rows.sort((a, b) => b.startingPrice - a.startingPrice);
      } else if (sortBy === "rating") {
        rows.sort((a, b) => b.rating - a.rating);
      }

      return rows;
    },
    [filters, sortBy]
  );

  const filteredSalons = useMemo(
    () => applyClientFilters(searchResults),
    [searchResults, applyClientFilters]
  );

  const mapToRowProps = (s: Salon) => ({
    id: s.id,
    slug: s.slug,
    name: s.name,
    image: s.image,
    status: s.status || (s.openNow ? "Open Now" : "Closed"),
    rating: s.rating,
    reviews: s.reviews,
    city: s.location.split(",")[0].trim(),
    location: s.location,
    categories: s.tags.length ? s.tags : [s.category],
    nextAvailable: s.nextSlot,
    priceFrom: s.startingPrice,
    popularService: s.popularService,
    featured: s.featured,
    isVerified: s.isVerified,
    isClaimable: s.isClaimable,
  });

  const mapToCardProps = (s: Salon) => {
    const row = mapToRowProps(s);
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      image: row.image,
      status: row.status,
      rating: row.rating,
      reviews: row.reviews,
      city: row.city,
      categories: row.categories,
      nextAvailable: row.nextAvailable,
      priceFrom: row.priceFrom,
      isVerified: row.isVerified,
      isClaimable: row.isClaimable,
    };
  };

  const locationLabel = resolveLocationDisplayLabel(selectedLocation);
  const activeFilterCount = countActiveFilters(filters);

  const clearFilters = () => {
    setFilters(defaultSalonFilters);
    setPage(0);
  };

  const syncFromUrl = useCallback((next: InitialSearch) => {
    setSearchQuery((prev) => (prev === next.q ? prev : next.q));
    setSelectedLocation((prev) => {
      const resolved = resolveLocationSearchValue(next.l);
      return prev === resolved ? prev : resolved;
    });
    setUrlCategory((prev) => (prev === next.category ? prev : next.category));
    setFilters((prev) => {
      const nextCats = next.category ? [next.category] : [];
      const same =
        prev.selectedCategories.length === nextCats.length &&
        prev.selectedCategories.every((c, i) => c === nextCats[i]);
      if (same) return prev;
      return { ...prev, selectedCategories: nextCats };
    });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Suspense fallback={null}>
        <SearchParamsSync onChange={syncFromUrl} />
      </Suspense>

      {/* HERO — full background image, copy on left 50% */}
      <section className="page-hero-shell home-hero home-hero-split relative min-h-[500px]">
        <Image
          src={LANDING_HERO_IMAGE}
          alt=""
          fill
          priority
          sizes="100vw"
          className="home-hero-bg-image object-cover pointer-events-none"
        />
        <div className="home-hero-left-overlay absolute inset-0 hidden lg:block pointer-events-none" aria-hidden="true" />
        <div className="home-hero-mobile-overlay lg:hidden absolute inset-0 pointer-events-none" aria-hidden="true" />

        <div className="container relative z-10 mx-auto max-w-7xl">
          <div className="home-hero-content-col home-hero-content hero-ink text-left w-full lg:w-1/2 flex flex-col justify-between p-[3%]">
            <div className="home-hero-top">
              <Badge variant="hero">
                <Sparkles className="w-3.5 h-3.5 mr-1.5 animate-pulse inline" />
                {isBooking ? "Book Instantly" : "Business Listings"}
              </Badge>

              <h1 className="home-hero-title text-3xl sm:text-4xl md:text-5xl xl:text-5xl font-black tracking-tight">
                <span className="home-hero-title-line">
                  {isBooking ? "Book Verified Salons & Spas" : "Discover Salons & Spas"}
                </span>
                <span className="home-hero-title-accent underline decoration-[#ffde5a] decoration-4 underline-offset-4">
                  in Sri Lanka
                </span>
              </h1>

              <p className="text-sm sm:text-base md:text-lg font-medium max-w-lg leading-relaxed">
                {isBooking
                  ? "Browse approved salons with live online booking — compare ratings, prices, services, and availability."
                  : "Browse salons discovered across Sri Lanka. Own a business listed here? Claim it with Google sign-in and activate your Trimma profile."}
              </p>
            </div>

            <div className="home-hero-middle">
              <div className="trimma-hero-search bg-white p-2 rounded-2xl shadow-xl flex flex-col sm:flex-row gap-2 border border-slate-100 w-full">
                <div className="flex-1 flex items-center px-4 bg-zinc-50 rounded-xl min-w-0">
                  <Search className="w-5 h-5 text-brand-pink mr-3 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPage(0);
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    placeholder="Haircut, color, spa..."
                    className="w-full h-12 bg-transparent text-zinc-900 placeholder:text-zinc-400 outline-none text-sm font-semibold min-w-0"
                  />
                </div>
                <div className="flex-1 flex items-center px-4 bg-zinc-50 rounded-xl min-w-0">
                  <MapPin className="w-5 h-5 text-brand-pink mr-3 shrink-0" />
                  <SriLankaLocationSelect
                    value={selectedLocation}
                    onChange={(value) => {
                      setSelectedLocation(value);
                      setPage(0);
                    }}
                    anyLabel="Any Location"
                    className="w-full h-12 bg-transparent text-zinc-900 outline-none appearance-none cursor-pointer text-sm font-bold min-w-0"
                  />
                </div>
                <Button
                  onClick={handleSearch}
                  size="lg"
                  variant="hero"
                  className="h-12 px-8 rounded-xl hero-btn-compact font-bold border-none shadow-md w-full sm:w-auto shrink-0"
                >
                  Search
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Results sub-header */}
      <div className="bg-zinc-950 border-b border-white/5">
        <div className="container mx-auto px-4 max-w-7xl py-3 flex flex-wrap items-center justify-between gap-3 text-sm">
          <nav className="flex items-center gap-2 text-zinc-400">
            <Link href="/" className="hover:text-brand transition-colors">
              Home
            </Link>
            <span className="text-zinc-600">›</span>
            {isBooking && (
              <>
                <Link href="/bookings" className="hover:text-brand transition-colors">
                  Book
                </Link>
                <span className="text-zinc-600">›</span>
              </>
            )}
            <span className="font-semibold text-white">
              {isBooking ? "Bookable salons" : "Business listings"} in {locationLabel}
            </span>
          </nav>
          <p className="text-zinc-400 text-xs md:text-sm">
            {isLoading && page === 0 ? (
              isBooking ? "Loading approved salons..." : "Searching listings..."
            ) : (
              <>
                <span className="text-brand font-bold">{filteredSalons.length}</span>{" "}
                {isBooking ? "approved salon" : "listing"}
                {filteredSalons.length === 1 ? "" : "s"} found
              </>
            )}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-7xl py-6">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Left filter sidebar — desktop */}
          <aside className="hidden lg:block w-[280px] shrink-0 sticky bottom-4 self-end max-h-[calc(100vh-2rem)] overflow-y-auto custom-scrollbar rounded-2xl">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
              <SalonFiltersPanel
                filters={filters}
                onChange={(next) => {
                  const prevCategories = filters.selectedCategories.join(",");
                  const nextCategories = next.selectedCategories.join(",");
                  setFilters(next);
                  setPage(0);
                  if (prevCategories !== nextCategories) {
                    trackEvent(AnalyticsEvent.CategoryFilterChanged, {
                      source: "home_filters",
                      previous: prevCategories || null,
                      categories: nextCategories || null,
                      category: next.selectedCategories[0] || null,
                    });
                  }
                }}
                onClear={clearFilters}
              />
            </div>
          </aside>

          {/* Results column */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Sort + mobile filter trigger */}
            <div className="bg-white border border-slate-200/80 rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-sm">
              <Button
                type="button"
                variant="outline"
                className="lg:hidden h-10 rounded-xl border-slate-200 font-bold text-sm hover:border-brand/40 hover:text-brand"
                onClick={() => setMobileFiltersOpen(true)}
              >
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="ml-2 bg-brand text-black text-[10px] font-black px-1.5 py-0.5 rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </Button>

              <div className="flex items-center gap-2 ml-auto">
                <label htmlFor="salon-sort" className="text-sm font-bold text-zinc-600 whitespace-nowrap">
                  Sort by:
                </label>
                <select
                  id="salon-sort"
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value as SortOption);
                    setPage(0);
                  }}
                  className="h-10 min-w-[180px] rounded-xl border border-slate-200 bg-zinc-50 px-3 text-sm font-semibold text-zinc-900 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                >
                  <option value="recommended">Our top picks</option>
                  <option value="rating">Highest rated</option>
                  <option value="price_low">Price (lowest first)</option>
                  <option value="price_high">Price (highest first)</option>
                </select>
              </div>
            </div>

            {/* Active filter chips */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap gap-2">
                {filters.verifiedOnly && (
                  <Badge variant="secondary" className="bg-brand/10 text-brand border border-brand/20 font-semibold">
                    Verified only
                  </Badge>
                )}
                {filters.openNowOnly && (
                  <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border border-emerald-100 font-semibold">
                    Open now
                  </Badge>
                )}
                {filters.minRating > 0 && (
                  <Badge variant="secondary" className="bg-white border border-slate-200 text-zinc-700 font-semibold">
                    {filters.minRating}+ rating
                  </Badge>
                )}
                {filters.minDiscount > 0 && (
                  <Badge variant="secondary" className="bg-white border border-slate-200 text-zinc-700 font-semibold">
                    {filters.minDiscount}%+ off
                  </Badge>
                )}
                {filters.maxPrice != null && (
                  <Badge variant="secondary" className="bg-white border border-slate-200 text-zinc-700 font-semibold">
                    Under LKR {filters.maxPrice.toLocaleString()}
                  </Badge>
                )}
              </div>
            )}

            {/* Results list */}
            {isLoading && page === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-slate-200/80">
                <Loader2 className="w-10 h-10 text-brand animate-spin mb-4" />
                <p className="text-sm font-bold text-zinc-500">Loading salons...</p>
              </div>
            ) : filteredSalons.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-slate-200/80 text-center px-6">
                <Star className="w-12 h-12 text-zinc-300 mb-4" />
                <p className="text-lg font-black text-[#1A1C29]">No salons match your filters</p>
                <p className="text-sm text-zinc-500 mt-1 max-w-md">
                  {isBooking
                    ? "No approved salons match your search yet. Browse business listings on the home page or try another location."
                    : "Try adjusting your search, location, or filters. Ready to book? Visit the bookings page for verified salons."}
                </p>
                {isBooking ? (
                  <Button asChild variant="default" className="mt-4 rounded-xl font-bold">
                    <Link href="/">Browse business listings</Link>
                  </Button>
                ) : (
                  <Button asChild variant="default" className="mt-4 rounded-xl font-bold">
                    <Link href="/bookings">Book verified salons</Link>
                  </Button>
                )}
                <Button variant="outline" className="mt-4 rounded-xl border-brand/30 text-brand font-bold hover:bg-brand/5" onClick={clearFilters}>
                  Clear filters
                </Button>
              </div>
            ) : (
              <>
                <div
                  className={
                    isBooking
                      ? "grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 sm:gap-6"
                      : "grid grid-cols-2 gap-3 lg:hidden"
                  }
                >
                  {filteredSalons.map((salon, index) => (
                    <SalonCard key={salon.id} salon={mapToCardProps(salon)} priority={index < 4} />
                  ))}
                </div>
                {isBooking ? null : (
                  <div className="hidden lg:flex lg:flex-col lg:space-y-4">
                    {filteredSalons.map((salon, index) => (
                      <SalonListRow
                        key={salon.id}
                        salon={mapToRowProps(salon)}
                        priority={index < 4}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {isLoading && page > 0 && (
              <div className="flex justify-center py-6">
                <Loader2 className="w-8 h-8 text-brand animate-spin" />
              </div>
            )}

            {hasMore && !isLoading && filteredSalons.length > 0 && (
              <div className="flex justify-center pt-4 pb-8">
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-xl px-8 border-slate-200 text-[#1A1C29] font-bold hover:border-brand/40 hover:text-brand shadow-sm"
                  onClick={() => setPage((p) => p + 1)}
                >
                  Load more salons
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {isBooking ? <DealsDiscountSection initialDeals={initialDeals} /> : null}

      {/* Mobile filters drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileFiltersOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-y-0 left-0 w-full max-w-sm bg-white shadow-2xl overflow-y-auto border-r border-slate-100">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between">
              <h2 className="font-black text-lg text-[#1A1C29]">Filters</h2>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="p-2 rounded-md hover:bg-slate-100"
                aria-label="Close filters"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <SalonFiltersPanel
                filters={filters}
                onChange={(next) => {
                  const prevCategories = filters.selectedCategories.join(",");
                  const nextCategories = next.selectedCategories.join(",");
                  setFilters(next);
                  setPage(0);
                  if (prevCategories !== nextCategories) {
                    trackEvent(AnalyticsEvent.CategoryFilterChanged, {
                      source: "home_filters_mobile",
                      previous: prevCategories || null,
                      categories: nextCategories || null,
                      category: next.selectedCategories[0] || null,
                    });
                  }
                }}
                onClear={clearFilters}
                compact
                onApply={() => {
                  setPage(0);
                  setMobileFiltersOpen(false);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
