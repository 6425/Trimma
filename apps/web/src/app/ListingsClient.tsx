"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, MapPin, Loader2, Building2, Sparkles, Star, Scissors, Heart, Smile, User, ShieldCheck, Clock } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BusinessListingCard } from "../components/marketplace/BusinessListingCard";
import type { BusinessListingCardData } from "@/lib/business-listing-mapper";
import type { PublicCategory } from "@/lib/public-categories";
import { AnalyticsEvent, trackEvent } from "@/lib/analytics";
import { resolveLocationDisplayLabel, resolveLocationSearchValue, SRI_LANKA_PROVINCES } from "@/lib/sri-lanka-locations";

const CATEGORY_ICON_MAP: Record<string, typeof Scissors> = {
  Scissors,
  Sparkles,
  Heart,
  Smile,
  User,
  Star,
  Clock,
  ShieldCheck,
};

const HERO_IMAGE = "/assets/business-listings-hero.png";
const PAGE_SIZE = 24;

type InitialSearch = {
  q: string;
  l: string;
  category: string;
};

type Props = {
  categories?: PublicCategory[];
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
  categories = [],
  initialSearch,
  initialListings = [],
  initialHasMore = true,
  ssrSeeded = false,
}: Props) {
  const router = useRouter();
  const skipFetchRef = useRef(ssrSeeded);
  const seededKeyRef = useRef(`${initialSearch.q}|${initialSearch.l}|${initialSearch.category}`);

  const [searchQuery, setSearchQuery] = useState(initialSearch.q);
  const [selectedLocation, setSelectedLocation] = useState(() =>
    resolveLocationSearchValue(initialSearch.l)
  );
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

  const handleCategorySelect = (slug: string) => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (selectedLocation) params.set("l", selectedLocation);
    if (slug) params.set("category", slug);
    setPage(0);
    setUrlCategory(slug);
    router.push(params.toString() ? `/?${params.toString()}` : "/");
    trackEvent(AnalyticsEvent.CategoryFilterChanged, {
      source: "homepage_category_bar",
      previous: urlCategory || null,
      category: slug || null,
    });
  };

  const renderCategoryIcon = (iconName: string | null | undefined) => {
    const IconComponent = CATEGORY_ICON_MAP[iconName || ""] || Sparkles;
    return <IconComponent className="h-5 w-5 text-brand-pink" />;
  };

  const categoryPillClass = (active: boolean) =>
    [
      "snap-start shrink-0 flex min-h-11 flex-col items-center justify-center rounded-xl border px-2 py-1.5 transition-all w-[84px] cursor-pointer",
      active
        ? "border-brand-pink bg-brand-pink/5 text-brand-pink shadow-sm"
        : "border-slate-100 bg-slate-50 text-zinc-600 hover:border-brand-pink/30",
    ].join(" ");

  const syncFromUrl = useCallback((next: InitialSearch) => {
    setSearchQuery((prev) => (prev === next.q ? prev : next.q));
    setSelectedLocation((prev) => {
      const canonical = resolveLocationSearchValue(next.l);
      return prev === canonical ? prev : canonical;
    });
    setUrlCategory((prev) => (prev === next.category ? prev : next.category));
  }, []);

  const locationLabel = resolveLocationDisplayLabel(selectedLocation);
  const activeCategory = categories.find((category) => category.slug === urlCategory);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Suspense fallback={null}>
        <SearchParamsSync onChange={syncFromUrl} />
      </Suspense>

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
              <Badge variant="hero">
                <Building2 className="mr-1.5 h-3.5 w-3.5" />
                Admin Lead Listings
              </Badge>

              <h1 className="home-hero-title text-3xl sm:text-4xl md:text-5xl xl:text-5xl font-black tracking-tight">
                <span className="home-hero-title-line">Beauty Business Across</span>
                <span className="home-hero-title-accent underline decoration-[#ffde5a] decoration-4 underline-offset-4">
                  Sri Lanka
                </span>
              </h1>

              <p className="text-sm sm:text-base md:text-lg font-medium max-w-lg leading-relaxed">
                Salons and spas discovered by Trimma admin through Lead Management. Own a business here?
                Claim it with Google sign-in — same verified flow used for Google Business profile claims.
              </p>
            </div>

            <div className="home-hero-middle">
              <div className="home-hero-stats flex flex-wrap items-center gap-3 sm:gap-4 text-xs font-bold">
                <span className="hero-badge hero-eyebrow px-3 py-1">{listings.length} Businesses Listed</span>
                <span className="home-hero-stats-dot w-1.5 h-1.5 rounded-full shrink-0 hidden sm:block" aria-hidden="true" />
                <span className="uppercase tracking-wider">All provinces · districts · cities</span>
              </div>

              <div className="trimma-hero-search bg-white p-2 rounded-2xl shadow-xl flex flex-col sm:flex-row gap-2 border border-slate-100 w-full">
                <div className="flex-1 flex items-center px-4 bg-zinc-50 rounded-xl min-w-0">
                  <Search className="h-5 w-5 text-brand-pink mr-3 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPage(0);
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    placeholder="Salon name or category"
                    className="h-12 w-full bg-transparent text-sm font-semibold text-zinc-900 placeholder:text-zinc-400 outline-none min-w-0"
                  />
                </div>
                <div className="flex-1 flex items-center px-4 bg-zinc-50 rounded-xl min-w-0">
                  <MapPin className="h-5 w-5 text-brand-pink mr-3 shrink-0" />
                  <select
                    value={selectedLocation}
                    onChange={(e) => {
                      setSelectedLocation(e.target.value);
                      setPage(0);
                    }}
                    className="h-12 w-full cursor-pointer appearance-none bg-transparent text-sm font-bold text-zinc-900 outline-none min-w-0"
                  >
                    <option value="">Any location</option>
                    <optgroup label="Provinces">
                      {SRI_LANKA_PROVINCES.map((province) => (
                        <option key={`province-${province.slug}`} value={province.name}>
                          {province.name}
                        </option>
                      ))}
                    </optgroup>
                    {SRI_LANKA_PROVINCES.map((province) => (
                      <optgroup key={`districts-${province.slug}`} label={`${province.shortName} — Districts`}>
                        {province.districts.map((district) => (
                          <option key={`district-${province.slug}-${district.slug}`} value={district.name}>
                            {district.name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                    {SRI_LANKA_PROVINCES.map((province) => (
                      <optgroup key={`cities-${province.slug}`} label={`${province.shortName} — Cities`}>
                        {province.districts.flatMap((district) =>
                          district.cities.map((city) => (
                            <option
                              key={`city-${province.slug}-${district.slug}-${city}`}
                              value={city}
                            >
                              {city} ({district.name})
                            </option>
                          ))
                        )}
                      </optgroup>
                    ))}
                  </select>
                </div>
                <Button
                  onClick={handleSearch}
                  size="lg"
                  variant="hero"
                  className="hero-btn-compact h-12 min-h-12 w-full shrink-0 rounded-xl border-none px-8 font-bold shadow-md sm:w-auto"
                >
                  Search
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {categories.length > 0 && (
        <section className="border-b border-slate-200 bg-white py-6">
          <div className="container mx-auto max-w-7xl px-4">
            <div
              className="hide-scrollbar flex snap-x justify-start gap-4 overflow-x-auto pb-2 md:justify-center"
              aria-label="Browse by category"
            >
              <button
                type="button"
                onClick={() => handleCategorySelect("")}
                className={categoryPillClass(!urlCategory)}
              >
                <div className="mb-1 text-brand-pink">
                  <Star className="h-5 w-5 fill-brand-pink" />
                </div>
                <span className="text-center text-[10px] font-bold">All</span>
              </button>

              {categories.map((category) => {
                const active = urlCategory === category.slug;
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => handleCategorySelect(category.slug)}
                    className={categoryPillClass(active)}
                  >
                    <div className="mb-1">{renderCategoryIcon(category.icon)}</div>
                    <span className="text-center text-[10px] font-bold leading-tight">{category.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <div className="border-b border-slate-200 bg-white">
        <div className="container mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 text-sm">
          <p className="font-semibold text-zinc-800">
            {locationLabel}
            {activeCategory ? ` · ${activeCategory.name}` : " · Lead Management listings"}
          </p>
          <div className="flex items-center gap-3">
            <p className="text-zinc-500">
              <span className="font-bold text-zinc-900">{listings.length}</span> businesses
            </p>
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
