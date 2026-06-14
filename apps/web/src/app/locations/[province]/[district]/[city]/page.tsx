/* eslint-disable @next/next/no-img-element */
"use client";

import { useMemo, useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import * as Icons from "lucide-react";
import { MapPin, Star, Scissors, Filter, Map, Clock, ChevronRight, Search, Heart, Store, Sparkles, Smile, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/config/supabase";
import { mapVerifiedSalonListingStats, getSalonListingImage } from "@/lib/salons-mapper";
import {
  getDistrictBySlugs,
  normalizeProvinceSlug,
  slugifyLocation,
  SRI_LANKA_PROVINCES,
} from "@/lib/sri-lanka-locations";
import { ProvinceNavLinks } from "../../../../../components/locations/ProvinceNavLinks";
import {
  FeaturedSalonsSection,
  PopularSalonsSection,
  DiscountsOffersSection,
  WhyTrimmaSection,
  SalonOnboardingCTA,
} from "../../../../../components/marketplace/MarketplaceSections";

const IconMap: Record<string, any> = {
  Scissors,
  Sparkles,
  Heart,
  Smile,
  User,
  Star,
  Clock,
};

export default function CityDetailPage() {
  const { province, district, city } = useParams();
  const provinceSlug = normalizeProvinceSlug(String(province || "western"));
  const districtSlug = String(district || "colombo");
  const citySlug = String(city || "colombo");
  const match = getDistrictBySlugs(provinceSlug, districtSlug);
  const provinceMeta = match?.province || SRI_LANKA_PROVINCES[0];
  const districtMeta = match?.district || provinceMeta.districts[0];
  const cityName =
    districtMeta.cities.find((entry) => slugifyLocation(entry) === slugifyLocation(citySlug)) ||
    citySlug.replace(/-/g, " ");

  const data = useMemo(
    () => ({
      id: slugifyLocation(cityName),
      name: cityName,
      district: districtMeta.name,
      province: provinceMeta.name,
      provinceSlug: provinceMeta.slug,
      districtSlug: districtMeta.slug,
      description: `Discover salons, spas, and grooming studios in ${cityName}, ${districtMeta.name} District.`,
      salonCount: 0,
      avgRating: 4.8,
      image: provinceMeta.image,
      popularCategories: ["Barber", "Luxury Salon", "Spa"],
      trendingServices: ["Skin Fade & Beard Sculpt", "Premium Hydra Facial", "Aesthetic Coloring"],
      insights: {
        avgPrice: "LKR 4,500",
        topCategory: "Barber",
      },
      salons: [],
    }),
    [cityName, districtMeta.name, districtMeta.slug, provinceMeta.image, provinceMeta.name, provinceMeta.slug]
  );
  const [isScrolled, setIsScrolled] = useState(false);
  const [mapView, setMapView] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [salons, setSalons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const cityOptions = districtMeta.cities;

  // Filter salons belonging to this city
  const filteredSalons = salons.filter(s => {
    const cityParam = String(city).toLowerCase().replace(/-/g, " ");
    const salonCity = s.city?.toLowerCase() || "";
    return salonCity.includes(cityParam) || cityParam.includes(salonCity);
  });

  useEffect(() => {
    async function fetchLiveSalons() {
      try {
        setLoading(true);
        const { data: dbSalons, error } = await supabase
          .from("salons")
          .select("id, slug, name, rating, review_count, city, district, category, logo_url, cover_url, hero_url, is_featured")
        .limit(10);

        if (error) throw error;

        // Transform DB records into UI formats
        const formatted = (dbSalons || []).map((s: any) => {
          const prices = s.services?.map((ser: any) => Number(ser.price)) || [];
          const startingPrice = prices.length > 0 ? Math.min(...prices) : 1500;
          const popularService = s.services?.[0]?.name || "Premium Cut & Style";
          const tags = Array.from(new Set(s.services?.map((ser: any) => ser.category) || ["Salon", "Grooming"]));

          return {
            id: s.id,
            slug: s.slug,
            name: s.name,
            ...mapVerifiedSalonListingStats(s),
            location: `${s.city || 'Colombo'}, ${s.district || 'Western Province'}`,
            city: s.city || 'Colombo',
            district: s.district || 'Western Province',
            tags: tags.slice(0, 3),
            categories: tags.slice(0, 3),
            category: s.category || (tags[0] as string) || "Beauty Lounge",
            logo: s.logo_url || `https://api.dicebear.com/7.x/initials/svg?seed=${s.slug}&backgroundColor=18181b`,
            image: getSalonListingImage(
              s,
              "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=800&q=80"
            ),
            featured: s.is_featured === true,
            openNow: true,
            startingPrice,
            nextSlot: "Today 4:00 PM",
            popularService,
          };
        });

        setSalons(formatted);
      } catch (err) {
        console.error("Failed to load live salons for city page:", err);
      } finally {
        setLoading(false);
      }
    }

    async function fetchCategories() {
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
    }

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 300);
    };

    fetchLiveSalons();
    fetchCategories();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [city]);

  const renderIcon = (iconName: string) => {
    const IconComponent = IconMap[iconName] || Sparkles;
    return <IconComponent className="w-5 h-5 text-brand-pink" />;
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24 md:pb-0 relative">
      
      {/* 1. CITY HERO SECTION */}
      <section className="page-hero-shell py-14 md:py-20">
        <div className="absolute inset-0 z-0">
           <img src={data.image} alt={data.name} className="page-hero-image border-none focus:outline-none" />
           <div className="absolute inset-0 page-hero-overlay"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-2 text-zinc-600 text-xs font-semibold uppercase tracking-wider mb-6">
            <Link href="/" className="hover:text-zinc-900 transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/locations" className="hover:text-zinc-900 transition-colors">Locations</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href={`/locations/${provinceSlug}`} className="hover:text-zinc-900 transition-colors">{data.province}</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href={`/locations/${provinceSlug}/${districtSlug}`} className="hover:text-zinc-900 transition-colors">{data.district}</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-zinc-800">{data.name}</span>
          </div>
          
          <div className="max-w-3xl">
             <Badge variant="hero" className="px-3 py-1 mb-4">
               <Sparkles className="w-3.5 h-3.5 mr-1.5 animate-pulse inline" /> {data.province} • {data.district} Directory
             </Badge>
             <h1 className="text-4xl md:text-6xl font-black tracking-tight text-zinc-900 mb-4 leading-tight">{data.name}</h1>
             <p className="text-base md:text-lg text-zinc-700 mb-6 font-medium leading-relaxed">
               {data.description}
             </p>
             
             <div className="flex flex-wrap items-center gap-3 text-xs font-bold mb-6">
               <div className="bg-black/10 backdrop-blur-md px-3.5 py-2 rounded-xl border border-black/10 flex items-center gap-2">
                 <Store className="w-4 h-4 text-zinc-900" />
                 <span className="text-zinc-900">{data.salonCount} Salons Here</span>
               </div>
               <div className="bg-black/10 backdrop-blur-md px-3.5 py-2 rounded-xl border border-black/10 flex items-center gap-2">
                 <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                 <span className="text-zinc-900">{data.avgRating} Avg Rating</span>
               </div>
             </div>

             {/* Centered Premium Search Bar */}
             <div className="bg-white p-2 rounded-2xl shadow-xl flex flex-col md:flex-row gap-2 max-w-xl border border-slate-100">
                <div className="flex-1 flex items-center px-4 bg-zinc-50 rounded-xl relative group">
                  <Search className="w-5 h-5 text-brand-pink mr-3 animate-pulse" />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`Search in ${data.name}...`} 
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
                    <option value="" className="text-zinc-900">Any City</option>
                    {cityOptions.map((entry) => (
                      <option key={entry} value={slugifyLocation(entry)} className="text-zinc-900">
                        {entry}
                      </option>
                    ))}
                  </select>
                </div>
                
                <Link 
                  href={`/search?q=${encodeURIComponent(searchQuery)}&l=${encodeURIComponent(selectedLocation)}`}
                  className="h-12 px-8 rounded-xl hero-btn-primary hero-btn-compact font-bold border-none shadow-md flex items-center justify-center text-sm"
                >
                  Search
                </Link>
             </div>
          </div>
        </div>
      </section>

      {/* Province Submenu Bar */}
      <div className="sticky top-20 z-30 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 shadow-sm py-3 transition-all duration-300">
        <div className="container mx-auto px-4 max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto hide-scrollbar">
            <span className="text-xs font-extrabold text-zinc-400 uppercase tracking-wider mr-2 shrink-0">Provinces:</span>
            <ProvinceNavLinks activeProvinceSlug={provinceSlug} />
          </div>
          <div className="hidden md:flex items-center gap-2 text-xs font-bold text-brand-pink bg-brand-pink/5 border border-brand-pink/10 px-3.5 py-1.5 rounded-full">
            <Icons.Navigation2 className="w-3.5 h-3.5 animate-pulse text-brand-pink" />
            <span>Premium Sri Lanka Directory</span>
          </div>
        </div>
      </div>

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

      {/* QUICK FILTER BAR (Sticky) */}
      <div className={`sticky top-16 z-30 bg-white border-b border-slate-200 transition-shadow duration-300 ${isScrolled ? 'shadow-md' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4 overflow-x-auto hide-scrollbar">
          <div className="flex items-center gap-2">
             <Button variant="outline" className="h-10 rounded-full border-slate-200 text-zinc-700 whitespace-nowrap bg-slate-50">
               <Scissors className="w-4 h-4 mr-2 text-zinc-400" /> Category
             </Button>
             <Button variant="outline" className="h-10 rounded-full border-slate-200 text-zinc-700 whitespace-nowrap bg-slate-50">
               Price Range
             </Button>
             <Button variant="outline" className="h-10 rounded-full border-slate-200 text-zinc-700 whitespace-nowrap bg-slate-50">
               <Clock className="w-4 h-4 mr-2 text-zinc-400" /> Open Now
             </Button>
             <Button variant="outline" className="h-10 rounded-full border-slate-200 text-zinc-700 whitespace-nowrap font-medium px-4">
               <Filter className="w-4 h-4 mr-2" /> All Filters
             </Button>
          </div>
          
          <div className="hidden md:flex items-center bg-slate-100 p-1 rounded-full shrink-0">
            <button 
              onClick={() => setMapView(false)} 
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${!mapView ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-900'}`}
            >
              List
            </button>
            <button 
              onClick={() => setMapView(true)} 
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all flex items-center gap-1.5 ${mapView ? 'bg-zinc-900 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-900'}`}
            >
              <Map className="w-4 h-4" /> Map
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border border-slate-200/60 shadow-sm">
            <Icons.Loader2 className="w-10 h-10 text-zinc-900 animate-spin mb-4" />
            <p className="text-zinc-500 font-bold text-sm">Querying active luxury salons...</p>
          </div>
        ) : filteredSalons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border border-slate-200/60 shadow-sm">
            <Scissors className="w-12 h-12 text-zinc-300 mb-4" />
            <p className="text-zinc-800 font-black text-lg">No active salons found in {data.name}</p>
            <p className="text-zinc-400 text-xs mt-1">Try resetting your location search or refreshing the results.</p>
          </div>
        ) : (
          <>
            {/* Featured Salons Section */}
            <FeaturedSalonsSection salons={filteredSalons} contextName={data.name} />
            
            {/* Most Popular Salons Section */}
            <PopularSalonsSection salons={filteredSalons} contextName={data.name} />
            
            {/* Discounts & Offers Section */}
            <DiscountsOffersSection />
            
            {/* Why Trimma Section */}
            <WhyTrimmaSection />
            
            {/* Salon Onboarding CTA */}
            <SalonOnboardingCTA />
          </>
        )}
      </div>
    </div>
  );
}
