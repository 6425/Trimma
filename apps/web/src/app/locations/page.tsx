/* eslint-disable @next/next/no-img-element */
"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import * as Icons from "lucide-react";
import { Search, MapPin, ChevronRight, ChevronLeft, Sparkles, Navigation2, Star } from "lucide-react";
import { supabase } from "@/config/supabase";
import { buildLocationSearchHref, SRI_LANKA_PROVINCES } from "@/lib/sri-lanka-locations";
import { ProvinceNavLinks } from "../../components/locations/ProvinceNavLinks";
import { FindBookGlowCta } from "../../components/marketplace/FindBookGlowCta";

const provinces = SRI_LANKA_PROVINCES.map((province) => ({
  id: province.slug,
  name: province.name,
  salonCount: 0,
  categories: province.districts.map((d) => d.name).slice(0, 3),
  image: province.image,
}));

export default function LocationsHubPage() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    void Promise.resolve().then(() => {
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
      fetchCategories();
    });
  }, []);

  const renderIcon = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName] || Icons.Sparkles;
    return <IconComponent className="w-5 h-5 text-brand-pink" />;
  };

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollAmount = clientWidth * 0.75;
      scrollRef.current.scrollTo({
        left: direction === "left" ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: "smooth"
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans relative overflow-hidden">
      {/* ── Hero — full background image, copy on left 50% (landing style) ── */}
      <section className="page-hero-shell home-hero home-hero-split relative min-h-[500px]">
        <img
          src="/assets/locations-hero.webp"
          alt=""
          width={1920}
          height={500}
          decoding="async"
          fetchPriority="high"
          className="home-hero-bg-image absolute inset-0 w-full h-full object-cover pointer-events-none"
        />
        <div className="home-hero-left-overlay absolute inset-0 hidden lg:block pointer-events-none" aria-hidden="true" />
        <div className="home-hero-mobile-overlay lg:hidden absolute inset-0 pointer-events-none" aria-hidden="true" />

        <div className="container relative z-10 mx-auto max-w-7xl">
          <div className="home-hero-content-col home-hero-content hero-ink text-left w-full lg:w-1/2 flex flex-col justify-between p-[3%]">
            <div className="home-hero-top">
              <div className="hero-badge hero-eyebrow inline-flex items-center gap-2 px-4 py-1.5 mb-6">
                <Sparkles className="w-3.5 h-3.5" />
                Islandwide Discovery Hub
              </div>

              <h1 className="home-hero-title text-3xl sm:text-4xl md:text-5xl xl:text-5xl font-black tracking-tight">
                <span className="home-hero-title-line">Find Your Next</span>
                <span className="home-hero-title-accent underline decoration-[#ffde5a] decoration-4 underline-offset-4">
                  Salon
                </span>
              </h1>

              <p className="text-sm sm:text-base md:text-lg font-medium max-w-lg leading-relaxed">
                Discover the highest-rated beauty salons, barbers, and premium Ayurvedic spas across the scenic provinces of Sri Lanka.
              </p>
            </div>

            <div className="home-hero-middle">
              <div className="trimma-hero-search bg-white p-2 rounded-2xl shadow-xl flex flex-col sm:flex-row gap-2 border border-slate-100 w-full">
                <div className="flex-1 flex items-center px-4 bg-zinc-50 rounded-xl min-w-0">
                  <Search className="w-5 h-5 text-brand-pink mr-3 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Haircut, color, spa..."
                    className="w-full h-12 bg-transparent text-zinc-900 placeholder:text-zinc-400 outline-none text-sm font-semibold min-w-0"
                  />
                </div>
                <div className="flex-1 flex items-center px-4 bg-zinc-50 rounded-xl min-w-0">
                  <MapPin className="w-5 h-5 text-brand-pink mr-3 shrink-0" />
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full h-12 bg-transparent text-zinc-900 outline-none appearance-none cursor-pointer text-sm font-bold min-w-0"
                  >
                    <option value="" className="text-zinc-900">Any District</option>
                    {SRI_LANKA_PROVINCES.map((province) => (
                      <optgroup key={province.slug} label={province.name}>
                        {province.districts.map((district) => (
                          <option key={district.slug} value={district.slug} className="text-zinc-900">
                            {district.name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
                <Link
                  href={`/?q=${encodeURIComponent(searchQuery)}&l=${encodeURIComponent(selectedLocation)}`}
                  className="h-12 px-8 rounded-xl hero-btn-primary hero-btn-compact font-bold border-none shadow-md flex items-center justify-center text-sm w-full sm:w-auto shrink-0"
                >
                  Search
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Province Submenu Bar */}
      <div className="sticky top-20 z-30 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 shadow-sm py-3 transition-all duration-300">
        <div className="container mx-auto px-4 max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto hide-scrollbar">
            <span className="text-xs font-extrabold text-zinc-400 uppercase tracking-wider mr-2 shrink-0">Provinces:</span>
            <ProvinceNavLinks />
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

      {/* 2. HORIZONTAL SCROLL PROVINCES HUB */}
      <section className="relative z-20 mt-16 md:mt-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8 md:mb-12">
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
              <MapPin className="w-7 h-7 text-brand" /> Explore by Province
            </h2>
            <p className="text-zinc-400 text-xs md:text-sm mt-1.5 font-medium">Swipe or use controls to browse active local regions.</p>
          </div>
          
          {/* Scroll Control Arrows */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => scroll("left")} 
              className="w-11 h-11 rounded-full border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center shadow-sm text-zinc-600 transition-all hover:border-zinc-300 active:scale-95"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={() => scroll("right")} 
              className="w-11 h-11 rounded-full border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center shadow-sm text-zinc-600 transition-all hover:border-zinc-300 active:scale-95"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Horizontal scroll scroller */}
        <div 
          ref={scrollRef}
          className="flex gap-8 overflow-x-auto pb-10 pt-2 snap-x snap-mandatory scroll-smooth hide-scrollbar -mx-4 px-4"
        >
          {provinces.map((province) => (
            <Link 
              key={province.id} 
              href={buildLocationSearchHref(province.name)}
              className="w-[290px] md:w-[calc((100%-64px)/3)] shrink-0 snap-start bg-white rounded-3xl overflow-hidden border border-slate-200 hover:border-zinc-300 shadow-sm hover:shadow-xl transition-all duration-500 transform hover:-translate-y-2 group flex flex-col justify-between"
            >
              <div className="relative h-56 overflow-hidden bg-slate-100 shrink-0">
                <img 
                  src={province.image} 
                  alt={province.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/85 via-zinc-950/20 to-transparent flex flex-col justify-end p-6 text-white">
                  <div className="flex items-center gap-2 mb-1.5">
                    <MapPin className="w-5 h-5 text-brand" />
                    <h3 className="text-xl font-black tracking-tight">{province.name}</h3>
                  </div>
                  <p className="text-brand font-bold text-sm">{province.salonCount} Active Partners</p>
                </div>
              </div>
              
              <div className="p-6 flex flex-col justify-between flex-grow min-h-[180px]">
                <div>
                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">Top Hub Offerings</div>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {province.categories.map(cat => (
                      <span key={cat} className="px-2.5 py-1 bg-slate-50 text-zinc-600 rounded-lg text-xs font-semibold border border-slate-100">
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between text-zinc-900 font-bold group-hover:text-brand transition-colors pt-4 border-t border-slate-100 mt-auto">
                   Explore Region <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. PREMIUM ADVANTAGE BLOCK */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-24 md:mt-36 mb-16 md:mb-24">
         <div className="bg-white rounded-3xl p-10 md:p-14 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-8 md:gap-12 text-center md:text-left">
            <div className="w-20 h-20 rounded-2xl bg-brand/10 text-brand flex items-center justify-center shrink-0 shadow-sm">
               <Navigation2 className="w-10 h-10 animate-pulse" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight text-zinc-900 mb-3">Find Salons Near You Instantly</h2>
              <p className="text-zinc-500 max-w-2xl text-sm md:text-base font-medium leading-relaxed">
                Our region-based discovery engine connects you with the finest beauty professionals in your area. No matter where you are in Sri Lanka, premium grooming and wellness experiences are just a tap away.
              </p>
            </div>
         </div>
      </section>

      <FindBookGlowCta />
    </div>
  );
}
