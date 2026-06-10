"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/config/supabase";
import { filterPublicSalons } from "@/lib/salon-list-filters";
import { ChevronLeft, ChevronRight } from "lucide-react";

const DEFAULT_IMG = "https://images.unsplash.com/photo-1625723041935-7c01b1fcb4e7?q=80&w=600&fm=webp&fit=crop";

export function TrendingLocations() {
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      const scrollAmount = direction === 'left' ? -current.offsetWidth / 2 : current.offsetWidth / 2;
      current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    void Promise.resolve().then(() => {
      async function fetchTrendingProvinces() {
      try {
      // Fetch all districts
      const { data: provData, error: provError } = await supabase
      .from('districts')
      .select('id, name, slug, image_url');
      
      if (provError) throw provError;
      
      // Fetch salons and their associated districts
      const { data: salonData, error: salonError } = await supabase
      .from('salons')
      .select('district, name');
      
      if (salonError) throw salonError;
      
      // Count salons per district name
      const counts: Record<string, number> = {};
      filterPublicSalons(salonData || []).forEach(salon => {
      if (salon.district) {
      counts[salon.district] = (counts[salon.district] || 0) + 1;
      }
      });
      
      const AGENT_DISTRICTS = ["colombo", "gampaha", "kandy", "anuradhapura"];

      if (provData) {
      const enriched = provData.map(p => ({
      ...p,
      img: p.image_url || DEFAULT_IMG,
      count: counts[p.name] || 0,
      hasAgent: AGENT_DISTRICTS.includes(p.slug)
      }));
      
      // Sort by agent available first, then salon count descending
      enriched.sort((a, b) => {
        if (a.hasAgent && !b.hasAgent) return -1;
        if (!a.hasAgent && b.hasAgent) return 1;
        return b.count - a.count;
      });
      
      // Take all districts
      setLocations(enriched);
      }
      } catch (err) {
      console.error("Error fetching trending locations:", err);
      } finally {
      setLoading(false);
      }
      }
      
      fetchTrendingProvinces();
    });
  }, []);

  return (
    <section className="py-10 bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
        <h2 className="mb-2">Trending Beauty Spots Near You</h2>
        <p className="text-zinc-500 mb-6">Most popular districts for salon bookings right now.</p>
        
        {loading ? (
          <div className="relative group">
            <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-none">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-64 w-[280px] sm:w-[320px] shrink-0 bg-zinc-100 animate-pulse rounded-lg shadow-sm"></div>
              ))}
            </div>
          </div>
        ) : (
          <div className="relative group">
            <button 
              onClick={() => scroll('left')} 
              className="absolute -left-4 top-[calc(50%-1.5rem)] -translate-y-1/2 z-10 bg-white shadow-md p-2 rounded-full hidden sm:group-hover:flex items-center justify-center hover:bg-zinc-50 transition-colors border border-zinc-100 text-zinc-700"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div ref={scrollRef} className="flex overflow-x-auto gap-4 pb-4 scrollbar-none snap-x scroll-smooth">
            {locations.map((loc, i) => (
              <Link 
                key={i}
                href={`/search?l=${loc.slug}`}
                className="snap-start shrink-0 group relative h-64 w-[280px] sm:w-[320px] rounded-lg overflow-hidden shadow-sm !text-white block"
              >
                <Image 
                  src={loc.img} 
                  alt={loc.name} 
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  priority={i < 4}
                  className="object-cover transition-transform duration-700 group-hover:scale-105 bg-zinc-200"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                
                {!loc.hasAgent && (
                  <div className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur text-zinc-900 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg">
                    Coming Soon
                  </div>
                )}

                <div className="absolute bottom-4 left-4 z-10 !text-white">
                  <h3 className="font-bold text-2xl !text-white flex items-center gap-2 drop-shadow-md">
                    {loc.name} <span className="opacity-0 group-hover:opacity-100 transition-opacity !text-white">→</span>
                  </h3>
                  <p className="!text-white text-sm drop-shadow-md font-medium">
                    {loc.count} {loc.count === 1 ? 'salon' : 'salons'}
                  </p>
                </div>
              </Link>
            ))}
            
            {locations.length === 0 && (
               <div className="w-full text-center py-12 text-zinc-500">
                 No trending locations available yet.
               </div>
            )}
            </div>
            <button 
              onClick={() => scroll('right')} 
              className="absolute -right-4 top-[calc(50%-1.5rem)] -translate-y-1/2 z-10 bg-white shadow-md p-2 rounded-full hidden sm:group-hover:flex items-center justify-center hover:bg-zinc-50 transition-colors border border-zinc-100 text-zinc-700"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
