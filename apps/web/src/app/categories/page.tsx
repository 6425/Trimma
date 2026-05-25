"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { LayoutGrid, Search, Sparkles, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/config/supabase";

const CATEGORY_IMAGES: Record<string, string> = {
  hair: "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=600&fm=webp&fit=crop",
  barbers: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?q=80&w=600&fm=webp&fit=crop",
  "barber-salon": "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?q=80&w=600&fm=webp&fit=crop",
  nails: "https://images.unsplash.com/photo-1519014816548-bf5fe059e98b?q=80&w=600&fm=webp&fit=crop",
  "nail-studio": "https://images.unsplash.com/photo-1519014816548-bf5fe059e98b?q=80&w=600&fm=webp&fit=crop",
  spa: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=600&fm=webp&fit=crop",
  "spa-wellness": "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=600&fm=webp&fit=crop",
  skin: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=600&fm=webp&fit=crop",
  "skincare-clinics": "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=600&fm=webp&fit=crop",
  tattoo: "https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?q=80&w=600&fm=webp&fit=crop",
  "tattoo-studio": "https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?q=80&w=600&fm=webp&fit=crop",
  "bridal-beauty": "https://images.unsplash.com/photo-1509631179647-0c739a4e6dd5?q=80&w=600&fm=webp&fit=crop",
  "beauty-parlours": "https://images.unsplash.com/photo-1522337660859-02fbefca4702?q=80&w=600&fm=webp&fit=crop",
  "yoga-studio": "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=600&fm=webp&fit=crop",
  "mens-grooming": "https://images.unsplash.com/photo-1621605815971-fbc98d665033?q=80&w=600&fm=webp&fit=crop",
  "kids-family": "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=600&fm=webp&fit=crop",
};

const DEFAULT_IMG =
  "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=600&fm=webp&fit=crop";

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  image_url?: string;
  img: string;
  count: number;
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    void Promise.resolve().then(() => {
      async function fetchCategories() {
        try {
          const { data: catData, error: catError } = await supabase
            .from("categories")
            .select("id, name, slug, icon, image_url")
            .order("name");

          if (catError) throw catError;

          const { data: salonData, error: salonError } = await supabase
            .from("salons")
            .select("category");

          if (salonError) throw salonError;

          const counts: Record<string, number> = {};
          salonData?.forEach((salon) => {
            if (salon.category) {
              counts[salon.category] = (counts[salon.category] || 0) + 1;
            }
          });

          const enriched: CategoryRow[] = (catData || []).map((c) => ({
            ...c,
            img: c.image_url || CATEGORY_IMAGES[c.slug] || DEFAULT_IMG,
            count: counts[c.name] || 0,
          }));

          setCategories(enriched);
        } catch (err) {
          console.error("Failed to fetch categories:", err);
        } finally {
          setLoading(false);
        }
      }

      fetchCategories();
    });
  }, []);

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24">
      <section className="relative overflow-hidden bg-dark-gradient border-b border-white/5 py-14 md:py-20">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=2836&auto=format&fit=crop"
            alt="Salon service categories"
            className="w-full h-full object-cover opacity-15 grayscale"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center w-full">
          <Badge className="bg-brand/15 text-brand border border-brand/20 font-extrabold text-[10px] tracking-wider uppercase px-3 py-1 rounded-full mb-4">
            <Sparkles className="w-3.5 h-3.5 text-brand mr-1.5 animate-pulse inline" />
            Browse by Service
          </Badge>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-4 leading-tight">
            Salon Categories
          </h1>
          <p className="text-base md:text-lg text-zinc-300 mb-8 max-w-xl mx-auto font-medium">
            Choose a category to browse salons and book your next appointment.
          </p>

          <div className="bg-white p-2 rounded-2xl shadow-xl flex items-center px-4 max-w-xl mx-auto border border-slate-100">
            <Search className="w-5 h-5 text-brand-pink mr-3 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search categories..."
              className="w-full h-12 bg-transparent text-zinc-900 placeholder:text-zinc-400 outline-none text-sm font-medium"
            />
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 pb-16">
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-black text-zinc-900 tracking-tight">
            Browse Salons by Category
          </h2>
          <p className="text-zinc-400 text-sm mt-1.5 font-medium">
            Select a category to view salons and book appointments.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[4/3] bg-zinc-100 rounded-xl mb-3" />
                <div className="h-4 bg-zinc-100 rounded w-3/4 mb-2" />
                <div className="h-3 bg-zinc-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-zinc-500">
            <LayoutGrid className="w-10 h-10 mx-auto mb-3 text-zinc-300" />
            <p className="font-medium">No categories match your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {filtered.map((category) => (
              <Link
                key={category.id}
                href={`/category/${category.slug}`}
                className="group flex flex-col bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md hover:border-brand-pink/20 transition-all"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={category.img}
                    alt={category.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-4 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-bold text-zinc-900 group-hover:text-brand-pink transition-colors truncate">
                      {category.name}
                    </h3>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {category.count} {category.count === 1 ? "salon" : "salons"}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-brand-pink shrink-0 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
