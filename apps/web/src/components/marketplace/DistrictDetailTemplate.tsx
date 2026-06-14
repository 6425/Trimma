/* eslint-disable @next/next/no-img-element */
import { useState, useEffect } from "react";
import Link from "next/link";
import * as Icons from "lucide-react";
import { MapPin, Star, Scissors, Filter, Map, Clock, ChevronRight, Search, Store, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SalonCard } from "./SalonCard";
import { supabase } from "@/config/supabase";
import { ProvinceNavLinks } from "../locations/ProvinceNavLinks";
import { slugifyLocation } from "@/lib/sri-lanka-locations";
import { 
  FeaturedSalonsSection, 
  PopularSalonsSection, 
  DiscountsOffersSection, 
  WhyTrimmaSection, 
  SalonOnboardingCTA 
} from "./MarketplaceSections";

export interface DistrictData {
  id: string;
  name: string;
  province: string;
  provinceSlug?: string;
  description: string;
  salonCount: number;
  avgRating: number;
  image: string;
  popularCategories: string[];
  cities: { name: string; slug?: string; count: number; top: string }[];
  trendingServices: string[];
  insights: {
    avgPrice: string;
    busiestDays: string;
    peakHours: string;
    topCategory: string;
  };
  salons: any[];
}

interface DistrictDetailTemplateProps {
  data: DistrictData;
  loading?: boolean;
}

export function DistrictDetailTemplate({ data, loading = false }: DistrictDetailTemplateProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mapView, setMapView] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
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

    fetchCategories();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const renderIcon = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName] || Icons.Sparkles;
    return <IconComponent className="w-5 h-5 text-brand-pink" />;
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24 md:pb-0 relative">
      {/* 1. DISTRICT HERO SECTION */}
      <section className="page-hero-shell py-14 md:py-20">
        <div className="absolute inset-0 z-0">
           <img src={data.image} alt={data.name} className="page-hero-image" />
           <div className="absolute inset-0 page-hero-overlay"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-2 text-zinc-600 text-xs font-semibold uppercase tracking-wider mb-6">
            <Link href="/" className="hover:text-zinc-900 transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/locations" className="hover:text-zinc-900 transition-colors">Locations</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href={`/locations/${data.provinceSlug || data.province.toLowerCase().replace(" province", "").replace(/\s+/g, "-")}`} className="hover:text-zinc-900 transition-colors">{data.province}</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-zinc-800">{data.name}</span>
          </div>
          
          <div className="max-w-3xl">
             <Badge variant="hero" className="px-3 py-1 mb-4">
               <Sparkles className="w-3.5 h-3.5 mr-1.5 animate-pulse inline" /> {data.province} • District Center
             </Badge>
             <h1 className="text-4xl md:text-6xl font-black tracking-tight text-zinc-900 mb-4 leading-tight">{data.name}</h1>
             <p className="text-base md:text-lg text-zinc-700 mb-6 font-medium leading-relaxed">
               {data.description}
             </p>
             
             <div className="flex flex-wrap items-center gap-3 text-xs font-bold mb-6">
               <div className="bg-black/10 backdrop-blur-md px-3.5 py-2 rounded-xl border border-black/10 flex items-center gap-2">
                 <Store className="w-4 h-4 text-zinc-900" />
                 <span className="text-zinc-900">{data.salonCount} Active Salons</span>
               </div>
               <div className="bg-black/10 backdrop-blur-md px-3.5 py-2 rounded-xl border border-black/10 flex items-center gap-2">
                 <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                 <span className="text-zinc-900">{data.avgRating} Avg Rating</span>
               </div>
               <div className="bg-black/10 backdrop-blur-md px-3.5 py-2 rounded-xl border border-black/10 flex items-center gap-2">
                 <Scissors className="w-4 h-4 text-zinc-900" />
                 <span className="text-zinc-900">{data.popularCategories.join(" • ")}</span>
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
                    {data.cities.map((city) => (
                      <option key={city.slug || city.name} value={city.slug || slugifyLocation(city.name)} className="text-zinc-900">
                        {city.name}
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
            <ProvinceNavLinks activeProvinceSlug={data.provinceSlug} />
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
                className="snap-start shrink-0 flex flex-col items-center justify-center p-3 rounded-2xl border transition-all w-24 cursor-pointer hover:border-brand-pink/30 border-slate-100 text-zinc-600 bg-slate-50"
              >
                <div className="mb-2 text-brand-pink">
                  <Star className="w-5 h-5 fill-brand-pink" />
                </div>
                <span className="text-[10px] font-bold text-center">All</span>
             </Link>
             
             {categories.map((category, i) => (
               <Link
                 key={i}
                 href={`/category/${category.slug}`}
                 className="snap-start shrink-0 flex flex-col items-center justify-center p-3 rounded-2xl border transition-all w-24 cursor-pointer hover:border-brand-pink/30 border-slate-100 text-zinc-600 bg-slate-50"
               >
                 <div className="mb-2">{renderIcon(category.icon)}</div>
                 <span className="text-[10px] font-bold text-center leading-tight">{category.name}</span>
               </Link>
             ))}
          </div>
        </div>
      </section>

      {/* 3. QUICK FILTER BAR (Sticky) */}
      <div className={`sticky top-16 z-30 bg-white border-b border-slate-200 transition-shadow duration-300 ${isScrolled ? 'shadow-md' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4 overflow-x-auto hide-scrollbar">
          <div className="flex items-center gap-2">
             <Button variant="outline" className="h-10 rounded-full border-slate-200 text-zinc-700 whitespace-nowrap bg-slate-50">
               <MapPin className="w-4 h-4 mr-2 text-zinc-400" /> City
             </Button>
             <Button variant="outline" className="h-10 rounded-full border-slate-200 text-zinc-700 whitespace-nowrap bg-slate-50">
               <Scissors className="w-4 h-4 mr-2 text-zinc-400" /> Category
             </Button>
             <Button variant="outline" className="h-10 rounded-full border-slate-200 text-zinc-700 whitespace-nowrap bg-slate-50">
               Price Range
             </Button>
             <Button variant="outline" className="h-10 rounded-full border-slate-200 text-zinc-700 whitespace-nowrap bg-slate-50">
               <Star className="w-4 h-4 mr-2 text-amber-400 mr-1" /> 4+ Rating
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
        
        {/* 4. CITY BREAKDOWN SECTION */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Explore by City</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {data.cities.map((city, i) => (
              <Link href={`/locations/${data.provinceSlug || "western"}/${data.id}/${city.slug || slugifyLocation(city.name)}`} key={i} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer hover:border-emerald-200 group flex items-start gap-4 block">
                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-emerald-100 transition-colors">
                  <MapPin className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-zinc-900 group-hover:text-emerald-700 transition-colors mb-0.5">{city.name}</h3>
                  <div className="text-sm text-zinc-500 font-medium mb-1">{city.count} Salons</div>
                  <div className="text-xs text-zinc-400">{city.top}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {(() => {
          const mappedSalons = (data.salons || []).map((s: any) => ({
            id: s.id,
            slug: s.slug || s.id,
            name: s.name,
            image: s.image,
            logo: s.logo || `https://api.dicebear.com/7.x/initials/svg?seed=${s.slug || s.name}&backgroundColor=18181b`,
            status: s.status || "Open Now",
            rating: s.rating,
            reviews: s.reviews,
            city: s.city || 'Colombo',
            categories: s.categories || s.tags || ["Grooming"],
            nextAvailable: s.nextAvailable || "Today 4:00 PM",
            priceFrom: s.priceFrom || 1500,
            featured: s.featured,
          }));

          return (
            <>
              {/* Featured Salons Section */}
              <FeaturedSalonsSection salons={mappedSalons} contextName={data.name} />
              
              {/* Most Popular Salons Section */}
              <PopularSalonsSection salons={mappedSalons} contextName={data.name} />
              
              {/* Discounts & Offers Section */}
              <DiscountsOffersSection />
              
              {/* Why Trimma Section */}
              <WhyTrimmaSection />
              
              {/* Salon Onboarding CTA */}
              <SalonOnboardingCTA />
            </>
          );
        })()}
      </div>
      
      {/* MOBILE BOTTOM STICKY BAR */}
      <div className="md:hidden fixed bottom-16 left-0 right-0 p-3 bg-white/80 backdrop-blur-md border-t border-slate-200 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] flex justify-center gap-2 w-full pb-safe">
        <Button className="rounded-full shadow-lg h-12 font-bold text-white bg-zinc-900 px-6">
          <Filter className="w-5 h-5 mr-2" /> Filters
        </Button>
        <Button className="rounded-full shadow-lg h-12 font-bold text-white bg-zinc-900 px-6">
          <Map className="w-5 h-5 mr-2" /> Map View
        </Button>
      </div>
    </div>
  );
}
