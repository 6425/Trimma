"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/config/supabase";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Mapping of category slugs to Unsplash images (optimized by Vercel at delivery time)
const CATEGORY_IMAGES: Record<string, string> = {
  "hair": "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=400&fm=webp&fit=crop",
  "barbers": "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?q=80&w=400&fm=webp&fit=crop",
  "barber-salon": "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?q=80&w=400&fm=webp&fit=crop",
  "nails": "https://images.unsplash.com/photo-1519014816548-bf5fe059e98b?q=80&w=400&fm=webp&fit=crop",
  "nail-studio": "https://images.unsplash.com/photo-1519014816548-bf5fe059e98b?q=80&w=400&fm=webp&fit=crop",
  "spa": "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=400&fm=webp&fit=crop",
  "spa-wellness": "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=400&fm=webp&fit=crop",
  "skin": "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=400&fm=webp&fit=crop",
  "skincare-clinics": "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=400&fm=webp&fit=crop",
  "tattoo": "https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?q=80&w=400&fm=webp&fit=crop",
  "tattoo-studio": "https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?q=80&w=400&fm=webp&fit=crop",
  "bridal-beauty": "https://images.unsplash.com/photo-1509631179647-0c739a4e6dd5?q=80&w=400&fm=webp&fit=crop",
  "beauty-parlours": "https://images.unsplash.com/photo-1522337660859-02fbefca4702?q=80&w=400&fm=webp&fit=crop",
  "yoga-studio": "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=400&fm=webp&fit=crop",
  "mens-grooming": "https://images.unsplash.com/photo-1621605815971-fbc98d665033?q=80&w=400&fm=webp&fit=crop",
  "kids-family": "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=400&fm=webp&fit=crop"
};

const DEFAULT_IMG = "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=400&fm=webp&fit=crop";

export function BrowseByService() {
  const [categories, setCategories] = useState<any[]>([]);
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
      async function fetchCategories() {
      try {
      // Fetch categories
      const { data: catData, error: catError } = await supabase
      .from('categories')
      .select('id, name, slug, image_url');
      
      if (catError) throw catError;
      
      // Fetch salon counts per category to show true dynamic counts
      const { data: salonData, error: salonError } = await supabase
      .from('salons')
      .select('category');
      
      if (salonError) throw salonError;
      
      // Count salons manually by category name
      const counts: Record<string, number> = {};
      if (salonData) {
      salonData.forEach(salon => {
      if (salon.category) {
      counts[salon.category] = (counts[salon.category] || 0) + 1;
      }
      });
      }
      
      if (catData) {
      const enriched = catData.map(c => ({
      ...c,
      img: c.image_url || CATEGORY_IMAGES[c.slug] || DEFAULT_IMG,
      count: counts[c.name] || 0
      }));
      
      // Sort by count descending so most popular categories appear first
      enriched.sort((a, b) => b.count - a.count);
      setCategories(enriched);
      }
      } catch (err) {
      console.error("Error fetching categories:", err);
      } finally {
      setLoading(false);
      }
      }
      
      fetchCategories();
    });
  }, []);

  return (
    <section className="py-10 bg-white">
      <div className="max-w-7xl mx-auto px-8 lg:px-12">
        <h2 className="text-2xl font-bold text-zinc-900 mb-6">Browse by beauty service</h2>
        
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
