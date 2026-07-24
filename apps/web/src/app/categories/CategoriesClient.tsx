"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { LayoutGrid, Search, Sparkles, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  image_url?: string;
  img: string;
  count: number;
};

export default function CategoriesClient({
  initialCategories,
}: {
  initialCategories: CategoryRow[];
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = initialCategories.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24">
      <section className="page-hero-shell py-14 md:py-20">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=2836&auto=format&fit=crop"
            alt="Salon service categories"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 page-hero-overlay" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center w-full">
          <Badge variant="hero" className="mb-6">
            <Sparkles className="w-3.5 h-3.5 mr-1.5 animate-pulse inline" />
            Browse by Service
          </Badge>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-zinc-900 mb-4 leading-tight">
            Salon Categories
          </h1>
          <p className="text-base md:text-lg text-zinc-700 mb-8 max-w-xl mx-auto font-medium">
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

        {filtered.length === 0 ? (
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
