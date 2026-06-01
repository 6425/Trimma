"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getLandingCategories, type LandingCategory } from "@/app/actions/landing-data";

export function BrowseByService() {
  const [categories, setCategories] = useState<LandingCategory[]>([]);
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
    let cancelled = false;
    getLandingCategories().then((data) => {
      if (!cancelled) {
        setCategories(data);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  return (
    <section className="py-10 bg-white">
      <div className="max-w-7xl mx-auto px-8 lg:px-12">
        <h2 className="mb-1">Browse by beauty service</h2>
        <p className="text-zinc-500 mb-6">Find exactly what you need from our extensive range of specialized treatments.</p>
        
        {loading ? (
          <div className="relative group">
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="w-[160px] sm:w-[200px] shrink-0 animate-pulse">
                  <div className="aspect-square bg-zinc-100 rounded-lg mb-2"></div>
                  <div className="h-4 bg-zinc-100 rounded w-3/4 mb-1 mt-3"></div>
                  <div className="h-3 bg-zinc-100 rounded w-1/2"></div>
                </div>
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
            {categories.map((svc, i) => (
              <Link 
                key={i}
                href={`/category/${svc.slug}`}
                className="snap-start shrink-0 group flex flex-col w-[160px] sm:w-[200px]"
              >
                <div className="relative aspect-square rounded-lg overflow-hidden mb-2 shadow-sm border border-zinc-100">
                  <Image 
                    src={svc.img} 
                    alt={svc.name} 
                    fill
                    sizes="(max-width: 640px) 160px, 200px"
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                <h3 className="font-bold text-zinc-900 group-hover:underline text-sm sm:text-base">{svc.name}</h3>
                <p className="text-xs sm:text-sm text-zinc-500">
                  {svc.count} {svc.count === 1 ? 'salon' : 'salons'}
                </p>
              </Link>
            ))}
            
            {categories.length === 0 && (
              <div className="w-full text-center py-8 text-zinc-500 text-sm">
                No categories found.
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
