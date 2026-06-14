/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Search, MapPin, Star, Filter, ShieldCheck, Grid, SlidersHorizontal, Clock, Scissors, Loader2, Sparkles, Heart, Smile, User, Map as MapIcon } from "lucide-react";

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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/config/supabase";
import { 
  FeaturedSalonsSection, 
  PopularSalonsSection, 
  DiscountsOffersSection, 
  WhyTrimmaSection, 
  SalonOnboardingCTA 
} from "../../../components/marketplace/MarketplaceSections";
import { SalonCard } from "../../../components/marketplace/SalonCard";

export default function CategoryPage() {
  const { slug } = useParams();
  const slugStr = String(slug || "");

  const [salons, setSalons] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [appliedLocation, setAppliedLocation] = useState("");
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [loadedFetchKey, setLoadedFetchKey] = useState("");

  const categoryLabel =
    categories.find((c) => c.slug === slug)?.name ||
    slugStr
      .replace(/-/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());

  const fetchKey = `${slugStr}|${categoryLabel}|${appliedSearch}|${appliedLocation}`;
  const loading = Boolean(slugStr) && loadedFetchKey !== fetchKey;

  useEffect(() => {
    void Promise.resolve().then(() => {
      void (async () => {
        try {
          const { data, error } = await supabase
            .from("categories")
            .select("*")
            .order("name");
          if (error) throw error;
          if (data) {
            setCategories(data);
          }
        } catch (err) {
          console.error("Failed to fetch categories:", err);
        }
      })();
    });
  }, []);

  useEffect(() => {
    if (!slugStr) return;

    let cancelled = false;
    const key = fetchKey;

    void (async () => {
      try {
        const params = new URLSearchParams({
          limit: "48",
          category: categoryLabel,
        });
        if (appliedSearch) params.set("q", appliedSearch);
        if (appliedLocation) params.set("location", appliedLocation);

        const res = await fetch(`/api/salons/search?${params.toString()}`);
        const payload = await res.json();
        if (cancelled) return;
        if (!res.ok) throw new Error(payload.error || "Failed to load salons");

        setSalons(payload.salons || []);
        setLoadedFetchKey(key);
      } catch (err: unknown) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : String(err);
        console.error("Failed to load category page salons:", message);
        setSalons([]);
        setLoadedFetchKey(key);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [slugStr, categoryLabel, appliedSearch, appliedLocation, fetchKey]);

  const handleSearch = () => {
    setAppliedSearch(searchQuery.trim());
    setAppliedLocation(selectedLocation.trim());
  };

  const renderIcon = (iconName: string) => {
    const IconComponent = IconMap[iconName] || Sparkles;
    return <IconComponent className="w-5 h-5 text-brand-pink" />;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', minimumFractionDigits: 0 }).format(price);
  };

  const currentCategory = categories.find(c => c.slug === slug);
  const heroImage = currentCategory?.image_url || "https://images.unsplash.com/photo-1522337660859-02fbefca4702?q=80&w=2938&auto=format&fit=crop";
  const categoryName = currentCategory?.name || (slug ? (slug as string).split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : "Salons & Spas");

  const filteredSalons = salons;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-dark-gradient border-b border-white/5 py-14 md:py-20 flex items-center justify-center">
        <div className="absolute inset-0 z-0 bg-zinc-950">
          <img 
            src={heroImage} 
            alt="Category Hero" 
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-[#F5B700]/30 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-zinc-950" />
        </div>

        <div className="container relative z-10 mx-auto px-4 text-center max-w-4xl">
          <Badge className="bg-brand/15 text-brand border border-brand/20 font-extrabold text-[10px] tracking-wider uppercase px-3 py-1 rounded-full mb-4">
            <Sparkles className="w-3.5 h-3.5 text-brand mr-1.5 animate-pulse inline" /> {categoryName} Specialists
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-4 leading-tight">
            Best {categoryName} <br />
            in <span className="text-gradient bg-primary-gradient">Sri Lanka</span>
          </h1>
          
          <p className="text-base md:text-lg text-zinc-300 mb-6 max-w-xl mx-auto font-medium">
            Discover top-rated establishments specialized in {categoryName}. Compare styling prices and verified reviews.
          </p>
          
          <div className="flex items-center justify-center gap-4 text-xs font-bold text-zinc-400 mb-6">
             <span className="font-extrabold bg-brand/20 text-brand px-3 py-1 rounded-full">{filteredSalons.length} Salons Available</span>
             <span className="w-1.5 h-1.5 rounded-full bg-zinc-700"></span>
             <span className="uppercase tracking-wider">Locations: Colombo, Negombo, Kandy</span>
          </div>

          {/* Centered Premium Search Bar */}
          <div className="bg-white p-2 rounded-2xl shadow-xl flex flex-col md:flex-row gap-2 max-w-3xl mx-auto border border-slate-100">
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
               <select 
                 value={selectedLocation}
                 onChange={(e) => setSelectedLocation(e.target.value)}
                 className="w-full h-12 bg-transparent text-zinc-900 outline-none appearance-none cursor-pointer text-sm font-bold"
               >
                 <option value="" className="text-zinc-900">Any Location</option>
                 <option value="colombo" className="text-zinc-900">Colombo</option>
                 <option value="gampaha" className="text-zinc-900">Gampaha</option>
                 <option value="kandy" className="text-zinc-900">Kandy</option>
                 <option value="anuradhapura" className="text-zinc-900">Anuradhapura</option>
               </select>
             </div>
             
             <Button onClick={handleSearch} size="lg" className="h-12 px-8 rounded-xl bg-primary-gradient hover:opacity-95 text-white font-bold border-none shadow-md shadow-brand-pink/20">
               Search
             </Button>
          </div>
        </div>
      </section>

      {/* Categories Bar */}
      <section className="py-6 bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex overflow-x-auto gap-4 pb-2 hide-scrollbar snap-x justify-start md:justify-center">
             <Link
                href="/"
                className="snap-start shrink-0 flex flex-col items-center justify-center py-1.5 px-2 rounded-xl border transition-all w-[84px] cursor-pointer hover:border-brand-pink/30 border-slate-100 text-zinc-600 bg-slate-50"
              >
                <div className="mb-1 text-brand-pink">
                  <Star className="w-5 h-5 fill-brand-pink" />
                </div>
                <span className="text-[10px] font-bold text-center">All</span>
             </Link>
             
             {categories.map((category, i) => (
               <Link
                 key={i}
                 href={`/category/${category.slug}`}
                 className="snap-start shrink-0 flex flex-col items-center justify-center py-1.5 px-2 rounded-xl border transition-all w-[84px] cursor-pointer hover:border-brand-pink/30 border-slate-100 text-zinc-600 bg-slate-50"
               >
                 <div className="mb-1">{renderIcon(category.icon)}</div>
                 <span className="text-[10px] font-bold text-center leading-tight">{category.name}</span>
               </Link>
             ))}
          </div>
        </div>
      </section>

      {/* 2 & 3. QUICK FILTER BAR */}
      <div className="sticky top-16 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200 shadow-sm">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex items-center justify-between h-16">
            
            <div className="hidden lg:flex items-center gap-2">
               <Button variant="outline" className="h-9 rounded-full border-slate-200 text-zinc-600 font-medium">
                 <SlidersHorizontal className="w-4 h-4 mr-2" /> All Filters
               </Button>
               <div className="h-6 w-px bg-slate-200 mx-2" />
               <Button variant="ghost" className="h-9 rounded-full text-zinc-600 bg-slate-100 hover:bg-slate-200 font-medium">Any Price</Button>
               <Button variant="ghost" className="h-9 rounded-full text-zinc-600 bg-slate-100 hover:bg-slate-200 font-medium">Open Now</Button>
               <Button variant="ghost" className="h-9 rounded-full text-zinc-600 bg-slate-100 hover:bg-slate-200 font-medium">Highest Rated</Button>
            </div>

            <div className="flex items-center bg-slate-100 p-1 rounded-lg">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500 hover:text-zinc-900'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode('map')}
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'map' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500 hover:text-zinc-900'}`}
              >
                <MapIcon className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-7xl py-8">
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border border-slate-200/60 shadow-sm">
            <Loader2 className="w-10 h-10 text-zinc-900 animate-spin mb-4" />
            <p className="text-zinc-500 font-bold text-sm">Querying active luxury salons...</p>
          </div>
        ) : filteredSalons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border border-slate-200/60 shadow-sm">
            <Scissors className="w-12 h-12 text-zinc-300 mb-4" />
            <p className="text-zinc-800 font-black text-lg">No active {categoryName} salons found</p>
            <p className="text-zinc-400 text-xs mt-1">Try resetting your location search or refreshing the results.</p>
          </div>
        ) : (() => {
              const mappedSalons = filteredSalons.map(s => ({
                id: s.id,
                slug: s.slug,
                name: s.name,
                image: s.image,
                logo: s.logo,
                status: s.openNow ? "Open Now" : "Closed",
                rating: s.rating,
                reviews: s.reviews,
                city: s.location.split(',')[0].trim(),
                categories: s.tags,
                nextAvailable: s.nextSlot,
                priceFrom: s.startingPrice,
                featured: s.featured,
                isVerified: s.isVerified,
              }));

              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {mappedSalons.map((salon) => (
                    <SalonCard key={salon.id} salon={salon as any} />
                  ))}
                </div>
              );
            })()}

      </div>
    </div>
  );
}
