/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import * as Icons from "lucide-react";
import { MapPin, Star, Scissors, Filter, Map, Clock, ChevronRight, Search, Heart, Sparkles, Smile, User } from "lucide-react";

const IconMap: Record<string, any> = {
  Scissors,
  Sparkles,
  Heart,
  Smile,
  User,
  Star,
  Clock
};
import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/config/supabase";
import { filterPublicSalons } from "@/lib/salon-list-filters";
import {
  buildDistrictCards,
  getProvinceByRouteSlug,
  normalizeProvinceSlug,
  salonMatchesProvince,
  slugifyLocation,
  toDbProvinceSlug,
  SRI_LANKA_PROVINCES,
} from "@/lib/sri-lanka-locations";
import { ProvinceNavLinks } from "../../../components/locations/ProvinceNavLinks";
import { 
  FeaturedSalonsSection, 
  PopularSalonsSection,
  DiscountsOffersSection, 
  WhyTrimmaSection, 
  SalonOnboardingCTA 
} from "../../../components/marketplace/MarketplaceSections";

function buildInitialProvinceState(routeSlug: string) {
  const meta = getProvinceByRouteSlug(routeSlug) || SRI_LANKA_PROVINCES[0];
  return {
    id: meta.slug,
    name: meta.name,
    description: meta.description,
    salonCount: 0,
    image: meta.image,
    districts: buildDistrictCards(meta),
    popularCities: meta.districts.flatMap((d) => d.cities).slice(0, 6),
  };
}

const Store = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
    <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
    <path d="M2 7h20" />
    <path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7" />
  </svg>
)

export default function ProvinceDetailPage() {
  const { province } = useParams();
  const provinceSlug = normalizeProvinceSlug(String(province || "western"));
  const provinceMeta = getProvinceByRouteSlug(provinceSlug) || SRI_LANKA_PROVINCES[0];
  const [isScrolled, setIsScrolled] = useState(false);
  const [mapView, setMapView] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [categories, setCategories] = useState<any[]>([]);

  const [provinceDataState, setProvinceDataState] = useState<any>(() => buildInitialProvinceState(provinceSlug));
  const data = provinceDataState; 
  const [salons, setSalons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const cityOptions = provinceMeta.districts.flatMap((district) => district.cities);

  const filteredSalons = salons.filter((s) => salonMatchesProvince(s, provinceSlug));

  useEffect(() => {
    void Promise.resolve().then(() => {
      setProvinceDataState(buildInitialProvinceState(provinceSlug));
      setSelectedLocation("");
    });
  }, [provinceSlug]);

  useEffect(() => {
    async function fetchLiveSalons() {
      try {
        setLoading(true);
        const { data: dbSalons, error } = await supabase
          .from("salons")
          .select("id, slug, name, rating, review_count, city, district, category, logo_url, cover_url, is_featured")
        .limit(10);

        if (error) throw error;

        // Transform DB records into UI formats
        const formatted = filterPublicSalons(dbSalons || []).map((s: any) => {
          const prices = s.services?.map((ser: any) => Number(ser.price)) || [];
          const startingPrice = prices.length > 0 ? Math.min(...prices) : 1500;
          const popularService = s.services?.[0]?.name || "Premium Cut & Style";
          const tags = Array.from(new Set(s.services?.map((ser: any) => ser.category) || ["Salon", "Grooming"]));

          return {
            id: s.id,
            slug: s.slug,
            name: s.name,
            rating: s.rating || 4.9, 
            reviews: s.reviews_count || 142,
            location: `${s.city || 'Colombo'}, ${s.district || 'Western Province'}`,
            city: s.city || 'Colombo',
            district: s.district || 'Colombo',
            tags: tags.slice(0, 3),
            categories: tags.slice(0, 3),
            category: s.category || (tags[0] as string) || "Beauty Lounge",
            logo: s.logo_url || `https://api.dicebear.com/7.x/initials/svg?seed=${s.slug}&backgroundColor=18181b`,
            image: s.cover_url || "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=800&q=80",
            featured: s.is_featured === true,
            openNow: true,
            startingPrice,
            nextSlot: "Today 4:00 PM",
            popularService,
          };
        });

        setSalons(formatted);
      } catch (err) {
        console.error("Failed to load live salons for province page:", err.message || err);
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

    async function fetchProvinceDetails() {
      try {
        const meta = getProvinceByRouteSlug(provinceSlug);
        if (!meta) return;

        const { data: provData, error } = await supabase
          .from("provinces")
          .select("*")
          .eq("slug", toDbProvinceSlug(provinceSlug))
          .maybeSingle();

        let districts = buildDistrictCards(meta);

        if (provData && !error) {
          const { data: dbDistricts } = await supabase
            .from("districts")
            .select("*")
            .eq("province_id", provData.id)
            .order("name");

          if (dbDistricts?.length) {
            districts = dbDistricts.map((row) => {
              const staticDistrict = meta.districts.find((d) => d.slug === row.slug);
              return {
                name: row.name,
                slug: row.slug,
                count: row.salon_count || 0,
                top: staticDistrict?.cities.slice(0, 3).join(" • ") || "Salon • Spa",
              };
            });
          }
        }

        setProvinceDataState({
          id: meta.slug,
          name: provData?.name || meta.name,
          description: provData?.description || meta.description,
          salonCount: provData?.salon_count || 0,
          image: provData?.image_url || meta.image,
          districts,
          popularCities: meta.districts.flatMap((d) => d.cities).slice(0, 6),
        });
      } catch (err) {
        console.error("Failed to load province:", err);
      }
    }

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 300);
    };

    fetchLiveSalons();
    fetchCategories();
    fetchProvinceDetails();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [provinceSlug]);

  const renderIcon = (iconName: string) => {
    const IconComponent = IconMap[iconName] || Sparkles;
    return <IconComponent className="w-5 h-5 text-brand-pink" />;
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24 md:pb-0 relative">
      
      {/* 1. PROVINCE HERO SECTION */}
      <section className="relative overflow-hidden bg-dark-gradient border-b border-white/5 py-14 md:py-20">
        <div className="absolute inset-0 z-0">
           <img src={data.image} alt={data.name} className="w-full h-full object-cover opacity-25 grayscale" />
           <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-6">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/locations" className="hover:text-white transition-colors">Locations</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-zinc-200">{data.name}</span>
          </div>
          
          <div className="max-w-3xl">
             <Badge className="bg-brand/15 text-brand border border-brand/20 font-extrabold text-[10px] tracking-wider uppercase px-3 py-1 rounded-full mb-4">
               <Sparkles className="w-3.5 h-3.5 text-brand mr-1.5 animate-pulse inline" /> Regional Showcase Directory
             </Badge>
             <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-4 leading-tight">{data.name}</h1>
             <p className="text-base md:text-lg text-zinc-300 mb-6 font-medium leading-relaxed">
               {data.description}
             </p>
             
             <div className="flex flex-wrap items-center gap-3 text-xs font-bold mb-6">
               <div className="bg-white/5 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10 flex items-center gap-2">
                 <Scissors className="w-4 h-4 text-brand" />
                 <span className="text-white">{data.salonCount} Active Salons</span>
               </div>
               <div className="bg-white/5 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10 flex items-center gap-2">
                 <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                 <span className="text-white">4.6 Avg Rating</span>
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
                    {cityOptions.map((city) => (
                      <option key={city} value={slugifyLocation(city)} className="text-zinc-900">
                        {city}
                      </option>
                    ))}
                  </select>
                </div>
                
                <Link 
                  href={`/salons?q=${encodeURIComponent(searchQuery)}&l=${encodeURIComponent(selectedLocation)}`}
                  className="h-12 px-8 rounded-xl bg-primary-gradient hover:opacity-95 text-white font-bold border-none shadow-md shadow-brand-pink/20 flex items-center justify-center text-sm"
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
                href="/salons"
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

      {/* 2. QUICK FILTER BAR (Sticky) */}
      <div className={`sticky top-16 z-30 bg-white border-b border-slate-200 transition-shadow duration-300 ${isScrolled ? 'shadow-md' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4 overflow-x-auto hide-scrollbar">
          <div className="flex items-center gap-2">
             <Button variant="outline" className="h-10 rounded-full border-slate-200 text-zinc-700 whitespace-nowrap bg-slate-50">
               <MapPin className="w-4 h-4 mr-2 text-zinc-400" /> District
             </Button>
             <Button variant="outline" className="h-10 rounded-full border-slate-200 text-zinc-700 whitespace-nowrap bg-slate-50">
               <Search className="w-4 h-4 mr-2 text-zinc-400" /> City
             </Button>
             <Button variant="outline" className="h-10 rounded-full border-slate-200 text-zinc-700 whitespace-nowrap bg-slate-50">
               <Scissors className="w-4 h-4 mr-2 text-zinc-400" /> Category
             </Button>
             <Button variant="outline" className="h-10 rounded-full border-slate-200 text-zinc-700 whitespace-nowrap bg-slate-50">
               <Clock className="w-4 h-4 mr-2 text-zinc-400" /> Open Now
             </Button>
             <Button variant="outline" className="h-10 rounded-full border-slate-200 text-zinc-700 whitespace-nowrap font-medium px-4">
               <Filter className="w-4 h-4 mr-2" /> More Filters
             </Button>
          </div>
          
          <div className="hidden md:flex items-center bg-slate-100 p-1 rounded-full">
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
        
        {/* 3. DISTRICT BREAKDOWN SECTION */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 mb-6">Explore by District</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {data.districts.map((dist: { name: string; slug: string; count: number; top: string }, i: number) => (
              <Link key={i} href={`/locations/${provinceSlug}/${dist.slug}`} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer hover:border-emerald-200 group block">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg text-zinc-900 group-hover:text-emerald-700 transition-colors">{dist.name}</h3>
                  <Badge variant="secondary" className="bg-slate-100 text-zinc-600 font-bold border-none">{dist.count}</Badge>
                </div>
                <div className="text-sm font-medium text-zinc-500 uppercase tracking-wider text-[11px] mb-1">Top Hubs</div>
                <div className="text-sm text-zinc-700 font-medium">{dist.top}</div>
              </Link>
            ))}
          </div>
        </section>

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
      
      {/* MOBILE BOTTOM STICKY BAR */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-3 bg-white border-t border-slate-200 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] flex gap-2 w-full pb-safe">
        <Button variant="outline" className="flex-1 rounded-xl h-12 font-bold text-zinc-700 bg-slate-50 border-slate-200">
          <Filter className="w-4 h-4 mr-2" /> Filter
        </Button>
        <Button variant="outline" className="flex-1 rounded-xl h-12 font-bold text-zinc-700 bg-slate-50 border-slate-200">
          <Map className="w-4 h-4 mr-2" /> Map
        </Button>
      </div>
    </div>
  );
}
