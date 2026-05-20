"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import * as Icons from "lucide-react";
import {
  Search, MapPin, Star, Grid, Map as MapIcon,
  SlidersHorizontal, CheckCircle2, Clock, Scissors,
  Loader2, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  FeaturedSalonsSection,
  PopularSalonsSection,
  DiscountsOffersSection,
  WhyTrimmaSection,
  SalonOnboardingCTA,
} from "../../components/marketplace/MarketplaceSections";

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

export default function SalonsClient({ salons, categories }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
      minimumFractionDigits: 0,
    }).format(price);

  const renderIcon = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName] || Icons.Sparkles;
    return <IconComponent className="w-5 h-5 text-brand-pink" />;
  };

  const filteredSalons = useMemo(() =>
    salons.filter((salon) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        q === "" ||
        salon.name.toLowerCase().includes(q) ||
        salon.popularService.toLowerCase().includes(q) ||
        salon.tags.some((t) => t.toLowerCase().includes(q));
      const matchesLocation =
        selectedLocation === "" ||
        salon.location.toLowerCase().includes(selectedLocation.toLowerCase());
      return matchesSearch && matchesLocation;
    }), [salons, searchQuery, selectedLocation]);

  const mappedSalons = filteredSalons.map((s) => ({
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
  }));

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
          <Badge className="bg-[#D81E5B]/15 text-[#D81E5B] border border-[#D81E5B]/20 font-extrabold text-[10px] tracking-wider uppercase px-3 py-1 rounded-full mb-4">
            <Sparkles className="w-3.5 h-3.5 text-[#D81E5B] mr-1.5 animate-pulse inline" />
            Discover Premium Grooming
          </Badge>

          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-4 leading-tight">
            Best Salons &amp; Spas <br />
            in{" "}
            <span className="text-gradient bg-primary-gradient">Sri Lanka</span>
          </h1>

          <p className="text-base md:text-lg text-zinc-300 mb-6 max-w-xl mx-auto font-medium">
            Discover top-rated barbers, beauty salons, and luxury spa centers.
            Compare services, styles, and book online instantly.
          </p>

          <div className="flex items-center justify-center gap-4 text-xs font-bold text-zinc-400 mb-6">
            <span className="font-extrabold text-white bg-[#D81E5B]/20 text-[#D81E5B] px-3 py-1 rounded-full">
              {filteredSalons.length} Salons Found
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
            <span className="uppercase tracking-wider">
              Colombo, Negombo, Kandy &amp; more
            </span>
          </div>

          {/* Search Bar */}
          <div className="bg-white p-2 rounded-2xl shadow-xl flex flex-col md:flex-row gap-2 max-w-3xl mx-auto border border-slate-100">
            <div className="flex-1 flex items-center px-4 bg-zinc-50 rounded-xl">
              <Search className="w-5 h-5 text-brand-pink mr-3 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
              size="lg"
              className="h-12 px-8 rounded-xl bg-primary-gradient hover:opacity-95 text-white font-bold border-none shadow-md shadow-brand-pink/20"
            >
              Search
            </Button>
          </div>
        </div>
      </section>

      {/* Province Nav Bar */}
      <div className="sticky top-14 sm:top-16 z-30 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 shadow-sm py-3">
        <div className="container mx-auto px-4 max-w-7xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full overflow-x-auto hide-scrollbar">
            <span className="text-xs font-extrabold text-zinc-400 uppercase tracking-wider mr-2 shrink-0">
              Provinces:
            </span>
            <div className="flex gap-2 shrink-0">
              {[
                ["All Regions", "/locations"],
                ["Western", "/locations/western"],
                ["Central", "/locations/central"],
                ["Southern", "/locations/southern"],
                ["Eastern", "/locations/eastern"],
                ["Northern", "/locations/northern"],
              ].map(([label, href]) => (
                <Link
                  key={href}
                  href={href}
                  className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-zinc-700 text-xs font-bold rounded-full transition-all whitespace-nowrap"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Categories Bar */}
      <section className="py-6 bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex overflow-x-auto gap-4 pb-2 hide-scrollbar snap-x justify-start md:justify-center">
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
        </div>
      </section>

      {/* Filter / View Bar */}
      <div className="sticky top-[calc(3.5rem+3rem)] z-20 bg-white/80 backdrop-blur-xl border-b border-slate-200 shadow-sm">
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
            <Button variant="outline" className="lg:hidden h-9 rounded-full border-slate-200 text-zinc-600 font-medium">
              <SlidersHorizontal className="w-4 h-4 mr-2" /> Filters
            </Button>
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

      {/* Salon Results */}
      <div className="container mx-auto px-4 max-w-7xl py-8">
        {filteredSalons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border border-slate-200/60 shadow-sm">
            <Scissors className="w-12 h-12 text-zinc-300 mb-4" />
            <p className="text-zinc-800 font-black text-lg">No salons match your search</p>
            <p className="text-zinc-400 text-xs mt-1">Try clearing your filters or adjusting your search.</p>
          </div>
        ) : (
          <>
            <FeaturedSalonsSection salons={mappedSalons} />
            <PopularSalonsSection salons={mappedSalons} />
            <DiscountsOffersSection />
            <WhyTrimmaSection />
            <SalonOnboardingCTA />
          </>
        )}
      </div>
    </div>
  );
}
