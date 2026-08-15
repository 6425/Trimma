"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, MapPin, Star, ShieldCheck, SlidersHorizontal, Clock, Scissors, Loader2, Sparkles, Heart, Smile, User } from "lucide-react";

const IconMap: Record<string, any> = {
  Scissors,
  Sparkles,
  Heart,
  Smile,
  User,
  Star,
  Clock,
  ShieldCheck
};
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BusinessListingCard } from "../../../components/marketplace/BusinessListingCard";
import { BusinessListingsMap } from "../../../components/marketplace/BusinessListingsMap";
import { ListingBrowseToolbar } from "../../../components/marketplace/ListingBrowseToolbar";
import type { BusinessListingCardData } from "@/lib/business-listing-mapper";
import { FindBookGlowCta } from "../../../components/marketplace/FindBookGlowCta";
import type { PublicCategory } from "@/lib/public-categories";
import { AnalyticsEvent, trackEvent } from "@/lib/analytics";
import { SriLankaLocationSelect } from "../../../components/locations/SriLankaLocationSelect";

const CATEGORY_HERO_IMAGES: Record<string, string> = {
  "barber-salon": "/assets/category-barber-salon-hero.webp",
  "beauty-salon": "/assets/category-beauty-salon-hero.webp",
  "beauty-parlours": "/assets/category-beauty-parlours-hero.webp",
  "bridal-beauty": "/assets/category-bridal-beauty-hero.webp",
  "bridal-and-beauty": "/assets/category-bridal-beauty-hero.webp",
  "mens-grooming": "/assets/category-mens-grooming-hero.webp",
  "nail-studio": "/assets/category-nail-studio-hero.webp",
  "skincare-clinics": "/assets/category-skincare-clinics-hero.webp",
  "spa-wellness": "/assets/category-spa-wellness-hero.webp",
  "spa-and-wellness": "/assets/category-spa-wellness-hero.webp",
  "tattoo-studio": "/assets/category-tattoo-studio-hero.webp",
  "yoga-studio": "/assets/category-yoga-studio-hero.webp",
};

const DEFAULT_HERO_IMAGE =
  "https://images.unsplash.com/photo-1522337660859-02fbefca4702?q=80&w=2938&auto=format&fit=crop";

const PAGE_SIZE = 48;

type CategoryClientProps = {
  slug: string;
  categories: PublicCategory[];
  initialListings: BusinessListingCardData[];
  initialHasMore?: boolean;
  categoryLabel: string;
};

export default function CategoryClient({
  slug: slugStr,
  categories,
  initialListings,
  initialHasMore = false,
  categoryLabel: initialCategoryLabel,
}: CategoryClientProps) {
  const [listings, setListings] = useState<BusinessListingCardData[]>(initialListings);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [page, setPage] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [appliedLocation, setAppliedLocation] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");
  const skipInitialFetchRef = useRef(true);
  const trackedCategorySlugRef = useRef<string | null>(null);
  const trackedSearchKeyRef = useRef<string | null>(null);

  const categoryLabel =
    categories.find((c) => c.slug === slugStr)?.name || initialCategoryLabel;

  const fetchKey = `${slugStr}|${categoryLabel}|${appliedSearch}|${appliedLocation}`;
  const [loadedFetchKey, setLoadedFetchKey] = useState(
    `${slugStr}|${initialCategoryLabel}||`
  );
  const loading = Boolean(slugStr) && loadedFetchKey !== fetchKey;

  useEffect(() => {
    if (!slugStr) return;
    if (trackedCategorySlugRef.current === slugStr) return;
    trackedCategorySlugRef.current = slugStr;
    trackEvent(AnalyticsEvent.CategoryViewed, {
      category_slug: slugStr,
      category_name: categoryLabel,
      initial_result_count: initialListings.length,
    });
  }, [slugStr, categoryLabel, initialListings.length]);

  const loadListings = async (nextPage: number, reset: boolean) => {
    const params = new URLSearchParams({
      limit: String(PAGE_SIZE),
      offset: String(nextPage * PAGE_SIZE),
      category: slugStr,
      categoryName: categoryLabel,
      publishedOnly: "true",
    });
    if (appliedSearch) params.set("q", appliedSearch);
    if (appliedLocation) params.set("location", appliedLocation);

    const res = await fetch(`/api/business-listings/search?${params.toString()}`);
    const payload = await res.json();
    if (!res.ok) throw new Error(payload.error || "Failed to load listings");

    const nextListings = (payload.listings || []) as BusinessListingCardData[];
    if (reset) setListings(nextListings);
    else {
      setListings((prev) => {
        const ids = new Set(prev.map((item) => item.id));
        return [...prev, ...nextListings.filter((item) => !ids.has(item.id))];
      });
    }
    setHasMore(Boolean(payload.hasMore));
    return nextListings;
  };

  useEffect(() => {
    if (!slugStr) return;

    if (skipInitialFetchRef.current && !appliedSearch && !appliedLocation) {
      skipInitialFetchRef.current = false;
      setLoadedFetchKey(fetchKey);
      return;
    }

    let cancelled = false;
    const key = fetchKey;

    void (async () => {
      try {
        setPage(0);
        const nextListings = await loadListings(0, true);
        if (cancelled) return;
        setLoadedFetchKey(key);

        if (appliedSearch || appliedLocation) {
          const searchKey = `${slugStr}|${appliedSearch}|${appliedLocation}|${nextListings.length}`;
          if (trackedSearchKeyRef.current !== searchKey) {
            trackedSearchKeyRef.current = searchKey;
            trackEvent(AnalyticsEvent.SalonSearch, {
              source: "category_page",
              category_slug: slugStr,
              category_name: categoryLabel,
              query: appliedSearch || null,
              location: appliedLocation || null,
              result_count: nextListings.length,
            });
          }
        }
      } catch (err: unknown) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : String(err);
        console.error("Failed to load category page listings:", message);
        setListings([]);
        setHasMore(false);
        setLoadedFetchKey(key);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [slugStr, categoryLabel, appliedSearch, appliedLocation, fetchKey]);

  const handleSearch = () => {
    trackEvent(AnalyticsEvent.SalonSearch, {
      source: "category_search_submit",
      category_slug: slugStr,
      category_name: categoryLabel,
      query: searchQuery.trim() || null,
      location: selectedLocation.trim() || null,
    });
    setAppliedSearch(searchQuery.trim());
    setAppliedLocation(selectedLocation.trim());
  };

  const splitHeroImage = CATEGORY_HERO_IMAGES[slugStr];
  const heroImage = splitHeroImage || DEFAULT_HERO_IMAGE;
  const useSplitHero = Boolean(splitHeroImage);
  const categoryName = categoryLabel;
  const filteredListings = listings;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* 1. HERO SECTION */}
      {useSplitHero ? (
        <section className="page-hero-shell home-hero home-hero-split relative min-h-[500px]">
          <Image
            src={heroImage}
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
                  <Sparkles className="w-3.5 h-3.5 mr-1.5 animate-pulse inline" /> {categoryName} Specialists
                </Badge>

                <h1 className="home-hero-title text-3xl sm:text-4xl md:text-5xl xl:text-5xl font-black tracking-tight">
                  <span className="home-hero-title-line">Best {categoryName}</span>
                  <span className="home-hero-title-accent underline decoration-[#ffde5a] decoration-4 underline-offset-4">
                    in Sri Lanka
                  </span>
                </h1>

                <p className="text-sm sm:text-base md:text-lg font-medium max-w-lg leading-relaxed">
                  Discover top-rated establishments specialized in {categoryName}. Compare styling prices and verified reviews.
                </p>
              </div>

              <div className="home-hero-middle">
                <div className="home-hero-stats flex flex-wrap items-center gap-3 sm:gap-4 text-xs font-bold">
                  <span className="hero-badge hero-eyebrow px-3 py-1">{filteredListings.length} Listings Available</span>
                  <span className="home-hero-stats-dot w-1.5 h-1.5 rounded-full shrink-0 hidden sm:block" aria-hidden="true" />
                  <span className="uppercase tracking-wider">Island-wide coverage — all 9 provinces</span>
                </div>

                <div className="trimma-hero-search bg-white p-2 rounded-2xl shadow-xl flex flex-col sm:flex-row gap-2 border border-slate-100 w-full">
                  <div className="flex-1 flex items-center px-4 bg-zinc-50 rounded-xl min-w-0">
                    <Search className="w-5 h-5 text-brand-pink mr-3 shrink-0" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      placeholder={`Search in ${categoryName}...`}
                      className="w-full h-12 bg-transparent text-zinc-900 placeholder:text-zinc-400 outline-none text-sm font-semibold min-w-0"
                    />
                  </div>

                  <div className="flex-1 flex items-center px-4 bg-zinc-50 rounded-xl min-w-0">
                    <MapPin className="w-5 h-5 text-brand-pink mr-3 shrink-0" />
                    <SriLankaLocationSelect
                      value={selectedLocation}
                      onChange={setSelectedLocation}
                      anyLabel="Any Location"
                      className="w-full h-12 bg-transparent text-zinc-900 outline-none appearance-none cursor-pointer text-sm font-bold min-w-0"
                      optionClassName="text-zinc-900"
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
      ) : (
        <section className="page-hero-shell py-14 md:py-20 flex items-center justify-center">
          <div className="absolute inset-0 z-0">
            <Image
              src={heroImage}
              alt="Category Hero"
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 page-hero-overlay" />
          </div>

          <div className="container relative z-10 mx-auto px-4 text-center max-w-4xl">
            <Badge variant="hero" className="mb-6">
              <Sparkles className="w-3.5 h-3.5 mr-1.5 animate-pulse inline" /> {categoryName} Specialists
            </Badge>

            <h1 className="text-4xl md:text-6xl font-black tracking-tight text-zinc-900 mb-4 leading-tight">
              Best {categoryName} <br />
              in <span className="text-[#1A1C29] underline decoration-black/20 decoration-4 underline-offset-4">Sri Lanka</span>
            </h1>

            <p className="text-base md:text-lg text-zinc-700 mb-6 max-w-xl mx-auto font-medium">
              Discover top-rated establishments specialized in {categoryName}. Compare styling prices and verified reviews.
            </p>

            <div className="flex items-center justify-center gap-4 text-xs font-bold text-zinc-600 mb-6">
              <span className="hero-badge hero-eyebrow px-3 py-1">{filteredListings.length} Listings Available</span>
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-500"></span>
              <span className="uppercase tracking-wider">Island-wide coverage — all 9 provinces</span>
            </div>

            <div className="trimma-hero-search bg-white p-2 rounded-2xl shadow-xl flex flex-col md:flex-row gap-2 max-w-3xl mx-auto border border-slate-100">
              <div className="flex-1 flex items-center px-4 bg-zinc-50 rounded-xl relative group">
                <Search className="w-5 h-5 text-brand-pink mr-3 animate-pulse" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search in ${categoryName}...`}
                  className="w-full h-12 bg-transparent text-zinc-900 placeholder:text-zinc-400 outline-none text-sm font-semibold"
                />
              </div>

              <div className="flex-1 flex items-center px-4 bg-zinc-50 rounded-xl relative group">
                <MapPin className="w-5 h-5 text-brand-pink mr-3" />
                <SriLankaLocationSelect
                  value={selectedLocation}
                  onChange={setSelectedLocation}
                  anyLabel="Any Location"
                  className="w-full h-12 bg-transparent text-zinc-900 outline-none appearance-none cursor-pointer text-sm font-bold"
                  optionClassName="text-zinc-900"
                />
              </div>

              <Button onClick={handleSearch} size="lg" variant="hero" className="h-12 px-8 rounded-xl hero-btn-compact font-bold border-none shadow-md">
                Search
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* 2 & 3. QUICK FILTER BAR */}
      <ListingBrowseToolbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        count={filteredListings.length}
        countLabel={`${categoryName} listings`}
      />

      <div className="border-b border-slate-200 bg-white">
        <div className="container mx-auto max-w-7xl px-4 py-3">
          <div className="hidden lg:flex items-center gap-2">
             <Button variant="outline" className="h-9 rounded-full border-slate-200 text-zinc-600 font-medium">
               <SlidersHorizontal className="w-4 h-4 mr-2" /> All Filters
             </Button>
             <div className="h-6 w-px bg-slate-200 mx-2" />
             <Button variant="ghost" className="h-9 rounded-full text-zinc-600 bg-slate-100 hover:bg-slate-200 font-medium">Any Price</Button>
             <Button variant="ghost" className="h-9 rounded-full text-zinc-600 bg-slate-100 hover:bg-slate-200 font-medium">Open Now</Button>
             <Button variant="ghost" className="h-9 rounded-full text-zinc-600 bg-slate-100 hover:bg-slate-200 font-medium">Highest Rated</Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-7xl py-8">
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border border-slate-200/60 shadow-sm">
            <Loader2 className="w-10 h-10 text-zinc-900 animate-spin mb-4" />
            <p className="text-zinc-500 font-bold text-sm">Loading published listings...</p>
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border border-slate-200/60 shadow-sm">
            <Scissors className="w-12 h-12 text-zinc-300 mb-4" />
            <p className="text-zinc-800 font-black text-lg">No published {categoryName} listings yet</p>
            <p className="text-zinc-400 text-xs mt-1">Only admin-published listings appear here. Try another location or category.</p>
          </div>
        ) : viewMode === "map" ? (
          <BusinessListingsMap listings={filteredListings} />
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
              {filteredListings.map((listing, index) => (
                <BusinessListingCard key={listing.id} listing={listing} priority={index < 4} />
              ))}
            </div>
            {hasMore && (
              <div className="mt-10 flex justify-center">
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-xl px-8 font-bold"
                  disabled={loadingMore}
                  onClick={() => {
                    const nextPage = page + 1;
                    setPage(nextPage);
                    setLoadingMore(true);
                    void loadListings(nextPage, false)
                      .catch((error: unknown) => {
                        console.error(error);
                      })
                      .finally(() => setLoadingMore(false));
                  }}
                >
                  {loadingMore ? (
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

      </div>

      <FindBookGlowCta />
    </div>
  );
}
