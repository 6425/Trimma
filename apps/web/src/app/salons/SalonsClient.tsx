"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import * as Icons from "lucide-react";
import { Search, MapPin, Star, Grid, SlidersHorizontal, Scissors, Sparkles, Loader2, Map as MapIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FeaturedSalonsSection,
  PopularSalonsSection,
  DiscountsOffersSection,
  WhyTrimmaSection,
  SalonOnboardingCTA,
} from "../../components/marketplace/MarketplaceSections";
import { SalonCard } from "../../components/marketplace/SalonCard";

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
  popularService: string;
  isVerified?: boolean;
}

interface Category {
  slug: string;
  name: string;
  icon: string;
}

interface Props {
  salons: Salon[];
  categories: Category[];
}

export default function SalonsClient({ salons: initialFeaturedSalons, categories }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qParam = searchParams?.get("q") || "";
  const lParam = searchParams?.get("l") || "";
  const categoryParam = searchParams?.get("category") || "";

  const [searchQuery, setSearchQuery] = useState(qParam);
  const [selectedLocation, setSelectedLocation] = useState(lParam);
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");

  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      const scrollAmount = direction === 'left' ? -current.offsetWidth / 2 : current.offsetWidth / 2;
      current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Lazy loading state
  const [searchResults, setSearchResults] = useState<Salon[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const LIMIT = 8;

  const isSearching = searchQuery !== "" || selectedLocation !== "" || categoryParam !== "";

  // Fetch results when search params or page changes
  const fetchResults = useCallback(async (reset: boolean = false) => {
    if (!isSearching) return;
    
    setIsLoading(true);
    try {
      const offset = reset ? 0 : page * LIMIT;
      const params = new URLSearchParams({
        q: searchQuery,
        location: selectedLocation,
        category: categoryParam,
        limit: LIMIT.toString(),
        offset: offset.toString(),
      });
      
      const res = await fetch(`/api/salons/search?${params.toString()}`);
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      
      if (reset) {
        setSearchResults(data.salons || []);
      } else {
        setSearchResults((prev) => [...prev, ...(data.salons || [])]);
      }
      setHasMore(data.hasMore);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedLocation, categoryParam, page, isSearching]);

  // Sync params when they change in URL
  useEffect(() => {
    void Promise.resolve().then(() => {
      setSearchQuery(qParam);
      setSelectedLocation(lParam);
      setPage(0);
    });
  }, [qParam, lParam, categoryParam]);

  // Trigger search on mount if params exist, or when page changes
  useEffect(() => {
    void Promise.resolve().then(() => {
      fetchResults(page === 0);
    });
  }, [fetchResults, page]);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (selectedLocation) params.set("l", selectedLocation);
    if (categoryParam) params.set("category", categoryParam);
    setPage(0); // reset pagination
    router.push(`/salons?${params.toString()}`);
  };

  const renderIcon = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName] || Icons.Sparkles;
    return <IconComponent className="w-5 h-5 text-brand-pink" />;
  };

  // Mapper for SalonCard props
  const mapToCardProps = (s: Salon) => ({
    id: s.id,
    slug: s.slug,
    name: s.name,
    image: s.image,
    logo: s.logo,
    status: s.openNow ? "Open Now" : "Closed",
    rating: s.rating,
    reviews: s.reviews,
    city: s.location.split(",")[0].trim(),
    categories: s.tags,
    nextAvailable: s.nextSlot,
    priceFrom: s.startingPrice,
    featured: s.featured,
    isVerified: s.isVerified,
  });

  const featuredMapped = initialFeaturedSalons.map(mapToCardProps);
  const searchMapped = searchResults.map(mapToCardProps);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* HERO */}
      <section className="relative overflow-hidden bg-dark-gradient border-b border-white/5 py-10 md:py-14">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1522337660859-02fbefca4702?q=80&w=2938&auto=format&fit=crop"
            alt="Salons Background"
            className="w-full h-full object-cover opacity-15 grayscale"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent" />
        </div>

        <div className="container relative z-10 mx-auto px-4 text-center max-w-4xl">
          <Badge className="bg-brand/15 text-brand border border-brand/20 font-extrabold text-[10px] tracking-wider uppercase px-3 py-1 rounded-full mb-4">
            <Sparkles className="w-3.5 h-3.5 text-brand mr-1.5 animate-pulse inline" />
            Discover Premium Grooming
          </Badge>

          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-4 leading-tight">
            Best Salons &amp; Spas <br />
            in{" "}
            <span className="text-gradient bg-primary-gradient">Sri Lanka</span>
          </h1>

          {/* Search Bar */}
          <div className="bg-white p-2 rounded-2xl shadow-xl flex flex-col md:flex-row gap-2 max-w-3xl mx-auto border border-slate-100 mt-8">
            <div className="flex-1 flex items-center px-4 bg-zinc-50 rounded-xl">
              <Search className="w-5 h-5 text-brand-pink mr-3 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Haircut, color, spa..."
                className="w-full h-12 bg-transparent text-zinc-900 placeholder:text-zinc-400 outline-none text-sm font-semibold"
              />
            </div>
            <div className="flex-1 flex items-center px-4 bg-zinc-50 rounded-xl">
              <MapPin className="w-5 h-5 text-brand-pink mr-3 shrink-0" />
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full h-12 bg-transparent text-zinc-900 outline-none appearance-none cursor-pointer text-sm font-bold"
              >
                <option value="">Any Location</option>
                <option value="colombo">Colombo</option>
                <option value="negombo">Negombo</option>
                <option value="kandy">Kandy</option>
                <option value="galle">Galle</option>
              </select>
            </div>
            <Button
              onClick={handleSearch}
              size="lg"
              className="h-12 px-8 rounded-xl bg-primary-gradient hover:opacity-95 text-white font-bold border-none shadow-md shadow-brand-pink/20"
            >
              Search
            </Button>
          </div>
        </div>
      </section>

      {/* Categories Bar */}
      <section className="py-6 bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="relative group">
            <button 
              onClick={() => scroll('left')} 
              className="absolute -left-4 top-[calc(50%-0.5rem)] -translate-y-1/2 z-10 bg-white shadow-md p-2 rounded-full hidden md:group-hover:flex items-center justify-center hover:bg-zinc-50 transition-colors border border-zinc-100 text-zinc-700"
            >
              <Icons.ChevronLeft className="w-4 h-4" />
            </button>
            <div ref={scrollRef} className="flex overflow-x-auto gap-4 pb-2 scrollbar-none snap-x justify-start md:justify-center scroll-smooth">
            <Link
              href="/salons"
              className="snap-start shrink-0 flex flex-col items-center justify-center py-1.5 px-2 rounded-xl border transition-all w-[84px] cursor-pointer hover:border-brand-pink/30 border-slate-100 text-zinc-600 bg-slate-50"
            >
              <div className="mb-1 text-brand-pink">
                <Star className="w-5 h-5 fill-brand-pink" />
              </div>
              <span className="text-[10px] font-bold text-center">All</span>
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/category/${cat.slug}`}
                className="snap-start shrink-0 flex flex-col items-center justify-center py-1.5 px-2 rounded-xl border transition-all w-[84px] cursor-pointer hover:border-brand-pink/30 border-slate-100 text-zinc-600 bg-slate-50"
              >
                <div className="mb-1">{renderIcon(cat.icon)}</div>
                <span className="text-[10px] font-bold text-center leading-tight">
                  {cat.name}
                </span>
              </Link>
            ))}
            </div>
            <button 
              onClick={() => scroll('right')} 
              className="absolute -right-4 top-[calc(50%-0.5rem)] -translate-y-1/2 z-10 bg-white shadow-md p-2 rounded-full hidden md:group-hover:flex items-center justify-center hover:bg-zinc-50 transition-colors border border-zinc-100 text-zinc-700"
            >
              <Icons.ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Filter / View Bar */}
      <div className="sticky top-[calc(3.5rem)] z-20 bg-white/80 backdrop-blur-xl border-b border-slate-200 shadow-sm">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex items-center justify-between h-14">
            <div className="hidden lg:flex items-center gap-2">
              <Button variant="outline" className="h-9 rounded-full border-slate-200 text-zinc-600 font-medium">
                <SlidersHorizontal className="w-4 h-4 mr-2" /> All Filters
              </Button>
              <div className="h-6 w-px bg-slate-200 mx-2" />
              {["Any Price", "Open Now", "Highest Rated", "AC Available"].map((f) => (
                <Button key={f} variant="ghost" className="h-9 rounded-full text-zinc-600 bg-slate-100 hover:bg-slate-200 font-medium">
                  {f}
                </Button>
              ))}
            </div>
            <div className="flex items-center bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:text-zinc-900"}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("map")}
                className={`p-1.5 rounded-md transition-colors ${viewMode === "map" ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:text-zinc-900"}`}
              >
                <MapIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Salon Results / Featured */}
      <div className="container mx-auto px-4 max-w-7xl py-8">
        {!isSearching ? (
          <>
            <FeaturedSalonsSection salons={featuredMapped} />
            <PopularSalonsSection salons={featuredMapped} />
            <DiscountsOffersSection />
            <WhyTrimmaSection />
            <SalonOnboardingCTA />
          </>
        ) : (
          <div className="flex flex-col space-y-8">
            <h2 className="text-2xl font-black text-zinc-900">Search Results</h2>
            {searchMapped.length === 0 && !isLoading ? (
              <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border border-slate-200/60 shadow-sm">
                <Scissors className="w-12 h-12 text-zinc-300 mb-4" />
                <p className="text-zinc-800 font-black text-lg">No salons match your search</p>
                <p className="text-zinc-400 text-xs mt-1">Try clearing your filters or adjusting your search.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {searchMapped.map((salon) => (
                  <SalonCard key={salon.id} salon={salon as any} />
                ))}
              </div>
            )}

            {isLoading && (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 text-brand-pink animate-spin" />
              </div>
            )}

            {hasMore && !isLoading && searchMapped.length > 0 && (
              <div className="flex justify-center mt-8">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="rounded-full px-8 border-slate-200 shadow-sm text-brand font-bold"
                  onClick={() => setPage(p => p + 1)}
                >
                  Load Next 8
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
