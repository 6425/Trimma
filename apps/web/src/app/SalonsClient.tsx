/* eslint-disable @next/next/no-img-element */
"use client";

import { Suspense, useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, MapPin, Star, Sparkles, Loader2, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SalonListRow } from "../components/marketplace/SalonListRow";
import { LiveCountdown } from "../components/marketplace/LiveCountdown";
import {
  SalonFiltersPanel,
  countActiveFilters,
  defaultSalonFilters,
  type SalonFilters,
} from "../components/marketplace/SalonFiltersPanel";
import { optimizeHeroImageUrl } from "@/lib/optimize-image-url";
import { DealsDiscountSection } from "../components/landing-v2/DealsDiscountSection";
import type { SalonDealRow } from "@/lib/deals";

const HERO_BACKGROUND = optimizeHeroImageUrl(
  "https://images.unsplash.com/photo-1522337660859-02fbefca4702?q=80&w=2938&auto=format&fit=crop",
  1280
);

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

interface Props {
  categories: Category[];
  initialSearch: InitialSearch;
  initialSalons?: Salon[];
  initialHasMore?: boolean;
  initialDeals?: SalonDealRow[];
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
}: Props) {
  const router = useRouter();
  const skipInitialFetchRef = useRef(initialSalons.length > 0);

  const [searchQuery, setSearchQuery] = useState(initialSearch.q);
  const [selectedLocation, setSelectedLocation] = useState(initialSearch.l);
  const [urlCategory, setUrlCategory] = useState(initialSearch.category);
  const [sortBy, setSortBy] = useState<SortOption>("recommended");
  const [filters, setFilters] = useState<SalonFilters>(() => ({
    ...defaultSalonFilters,
    selectedCategories: initialSearch.category ? [initialSearch.category] : [],
  }));
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const [searchResults, setSearchResults] = useState<Salon[]>(initialSalons);
  const [isLoading, setIsLoading] = useState(initialSalons.length === 0);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [page, setPage] = useState(0);
  const LIMIT = 12;

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

        const res = await fetch(`/api/salons/search?${params.toString()}`);
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();

        if (reset) {
          setSearchResults(data.salons || []);
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
    [searchQuery, selectedLocation, urlCategory, page, sortBy, filters.minRating, filters.verifiedOnly]
  );

  useEffect(() => {
    if (skipInitialFetchRef.current && page === 0) {
      skipInitialFetchRef.current = false;
      return;
    }
    void Promise.resolve().then(() => {
      fetchResults(page === 0);
    });
  }, [fetchResults, page]);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (selectedLocation) params.set("l", selectedLocation);
    if (urlCategory) params.set("category", urlCategory);
    setPage(0);
    router.push(`/?${params.toString()}`);
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
  });

  const locationLabel = selectedLocation
    ? selectedLocation.charAt(0).toUpperCase() + selectedLocation.slice(1)
    : "Sri Lanka";
  const activeFilterCount = countActiveFilters(filters);

  const clearFilters = () => {
    setFilters(defaultSalonFilters);
    setPage(0);
  };

  const syncFromUrl = useCallback((next: InitialSearch) => {
    setSearchQuery(next.q);
    setSelectedLocation(next.l);
    setUrlCategory(next.category);
    setFilters((prev) => ({
      ...prev,
      selectedCategories: next.category ? [next.category] : [],
    }));
    setPage(0);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Suspense fallback={null}>
        <SearchParamsSync onChange={syncFromUrl} />
      </Suspense>

      {/* HERO */}
      <section className="page-hero-shell py-10 md:py-14">
        <div className="absolute inset-0 z-0">
          <img
            src={HERO_BACKGROUND}
            alt=""
            width={1280}
            height={720}
            decoding="async"
            fetchPriority="high"
            className="page-hero-image"
          />
          <div className="absolute inset-0 page-hero-overlay" />
        </div>

        <div className="container relative z-10 mx-auto px-4 text-center max-w-4xl hero-ink">
          <Badge variant="hero" className="mb-6">
            <Sparkles className="w-3.5 h-3.5 mr-1.5 animate-pulse inline" />
            Discover Premium Grooming
          </Badge>

          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-black mb-4 leading-tight">
            Best Salons &amp; Spas <br />
            in{" "}
            <span className="text-black underline decoration-black/20 decoration-4 underline-offset-4">
              Sri Lanka
            </span>
          </h1>

          <LiveCountdown />

          <div className="bg-white p-2 rounded-2xl shadow-xl flex flex-col md:flex-row gap-2 max-w-3xl mx-auto border border-slate-100 mt-8">
            <div className="flex-1 flex items-center px-4 bg-zinc-50 rounded-xl">
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
                className="w-full h-12 bg-transparent text-zinc-900 placeholder:text-zinc-400 outline-none text-sm font-semibold"
              />
            </div>
            <div className="flex-1 flex items-center px-4 bg-zinc-50 rounded-xl">
              <MapPin className="w-5 h-5 text-brand-pink mr-3 shrink-0" />
              <select
                value={selectedLocation}
                onChange={(e) => {
                  setSelectedLocation(e.target.value);
                  setPage(0);
                }}
                className="w-full h-12 bg-transparent text-zinc-900 outline-none appearance-none cursor-pointer text-sm font-bold"
              >
                <option value="">Any Location</option>
                <option value="colombo">Colombo</option>
                <option value="gampaha">Gampaha</option>
                <option value="kandy">Kandy</option>
                <option value="anuradhapura">Anuradhapura</option>
              </select>
            </div>
            <Button
              onClick={handleSearch}
              size="lg"
              variant="hero"
              className="h-12 px-8 rounded-xl hero-btn-compact font-bold border-none shadow-md"
            >
              Search
            </Button>
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
            <span className="font-semibold text-white">Salons in {locationLabel}</span>
          </nav>
          <p className="text-zinc-400 text-xs md:text-sm">
            {isLoading && page === 0 ? (
              "Searching salons..."
            ) : (
              <>
                <span className="text-brand font-bold">{filteredSalons.length}</span> salon
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
                categories={categories}
                onChange={(next) => {
                  setFilters(next);
                  setPage(0);
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
                  Try adjusting your search, location, or filters to see more results.
                </p>
                <Button variant="outline" className="mt-4 rounded-xl border-brand/30 text-brand font-bold hover:bg-brand/5" onClick={clearFilters}>
                  Clear filters
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredSalons.map((salon, index) => (
                  <SalonListRow
                    key={salon.id}
                    salon={mapToRowProps(salon)}
                    priority={index < 4}
                  />
                ))}
              </div>
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

      <DealsDiscountSection initialDeals={initialDeals} />

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
                categories={categories}
                onChange={setFilters}
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
