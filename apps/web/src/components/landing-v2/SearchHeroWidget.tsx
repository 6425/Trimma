"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Search, MapPin, Calendar, Scissors, Sparkles, Flower2, Hand, Droplets, Smile, Star } from "lucide-react";
import { getLandingCategories, type LandingCategory } from "@/app/actions/landing-data";

// Helper to map category slugs to Lucide icons
const getCategoryIcon = (slug: string) => {
  const mapping: Record<string, any> = {
    "hair": Scissors,
    "barber-salon": Scissors,
    "barbers": Scissors,
    "nails": Sparkles,
    "nail-studio": Sparkles,
    "facial": Droplets,
    "skin": Droplets,
    "skincare-clinics": Droplets,
    "spa": Flower2,
    "spa-wellness": Flower2,
    "massage": Hand,
    "beauty-parlours": Smile,
  };
  return mapping[slug.toLowerCase()] || Star;
};

export function SearchHeroWidget() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [categories, setCategories] = useState<LandingCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getLandingCategories().then((data) => {
      if (!cancelled) {
        // Take only the top 5 categories for the quick links
        setCategories(data.slice(0, 5));
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/?q=${encodeURIComponent(query)}&l=${encodeURIComponent(location)}`);
  };

  return (
    <>
      <section className="relative pt-10 sm:pt-12 pb-20 sm:pb-24 bg-[#0B0B0B]">
        {/* Background Hero Image */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <Image 
            src="https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=2940&fm=webp&fit=crop" 
            alt="Salon Background" 
            fill
            priority
            className="object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#0B0B0B] via-[#0B0B0B]/90 to-[#F5B700]/40" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-white text-center flex flex-col items-center px-1">
            <h1 className="mb-4 sm:mb-6 !text-white hover:!text-[#F5B700] transition-colors duration-300 cursor-default">
              Sri Lanka&apos;s Beauty & Wellness Marketplace
            </h1>
            <p className="text-base sm:text-xl md:text-2xl font-medium !text-white/90 max-w-3xl drop-shadow-md leading-relaxed mb-4">
              Book salon, spa, barber, nail, skincare, and wellness appointments instantly — all from one trusted platform.
            </p>
            <p className="text-lg sm:text-2xl font-bold !text-[#F5B700] drop-shadow-md mb-8 sm:mb-10">
              Find Your Perfect Beauty Experience Today
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center">
              <Link
                href="/"
                className="bg-[#F5B700] hover:bg-[#E6AC00] active:bg-[#CC9B00] text-black font-bold min-h-[56px] h-14 px-8 rounded-xl transition-colors text-lg flex items-center justify-center shadow-lg hover:scale-105 transform duration-200"
              >
                Book Now
              </Link>
              <Link
                href="/signup"
                className="bg-white/10 hover:bg-white/20 active:bg-white/30 backdrop-blur-sm border border-white/30 text-white font-bold min-h-[56px] h-14 px-8 rounded-xl transition-all text-lg flex items-center justify-center shadow-lg hover:scale-105 transform duration-200"
              >
                List Your Business
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* The Search Widget & Categories - Uses negative margin to exactly 50% overlap */}
      <div className="relative z-20 px-4 sm:px-6 flex flex-col items-center -mt-36 md:-mt-10 mb-8 sm:mb-12">
        <form
          onSubmit={handleSearch}
          className="bg-[#F5B700] p-3 sm:p-2.5 md:p-1.5 rounded-2xl md:rounded-lg shadow-2xl w-full max-w-5xl flex flex-col md:flex-row gap-3 md:gap-1.5 border-[4px] border-white dark:border-[#0B0B0B]"
        >
          {/* Location */}
          <div className="flex-1 bg-white flex items-center gap-3 px-4 min-h-[52px] h-14 rounded-xl md:rounded-md border-2 border-transparent focus-within:border-[#F5B700] transition-colors shadow-sm md:shadow-none">
            <MapPin className="w-5 h-5 text-zinc-400 shrink-0" aria-hidden="true" />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Where are you? (e.g. Colombo)"
              className="w-full min-w-0 h-full outline-none text-base text-zinc-900 font-medium placeholder:text-zinc-500 placeholder:font-normal bg-transparent"
            />
          </div>

          {/* Service */}
          <div className="flex-1 bg-white flex items-center gap-3 px-4 min-h-[52px] h-14 rounded-xl md:rounded-md border-2 border-transparent focus-within:border-[#F5B700] transition-colors shadow-sm md:shadow-none">
            <Search className="w-5 h-5 text-zinc-400 shrink-0" aria-hidden="true" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="What are you looking for?"
              className="w-full min-w-0 h-full outline-none text-base text-zinc-900 font-medium placeholder:text-zinc-500 placeholder:font-normal bg-transparent"
            />
          </div>

          {/* Date */}
          <div className="flex-1 bg-white flex items-center gap-3 px-4 min-h-[52px] h-14 rounded-xl md:rounded-md border-2 border-transparent focus-within:border-[#F5B700] transition-colors shadow-sm md:shadow-none">
            <Calendar className="w-5 h-5 text-zinc-400 shrink-0" aria-hidden="true" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full min-w-0 h-full outline-none text-base text-zinc-900 font-medium cursor-pointer appearance-none bg-transparent"
            />
          </div>

          {/* Search Button */}
          <button
            type="submit"
            className="bg-[#F5B700] hover:bg-[#E6AC00] active:bg-[#CC9B00] text-black font-bold min-h-[52px] h-14 px-8 rounded-xl md:rounded-md transition-colors text-lg md:text-xl w-full md:w-auto md:min-w-[148px] shrink-0 shadow-sm md:shadow-none touch-manipulation"
          >
            Search
          </button>
        </form>

        {/* Categories */}
        {!loading && categories.length > 0 && (
          <div className="mt-8 flex flex-wrap justify-center gap-6 sm:gap-10">
            {categories.map((cat) => {
              const Icon = getCategoryIcon(cat.slug);
              return (
                <Link 
                  href={`/?q=${encodeURIComponent(cat.name)}`} 
                  key={cat.id} 
                  className="group flex flex-col items-center gap-2 cursor-pointer transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-2xl bg-white shadow-md flex items-center justify-center border-2 border-transparent group-hover:border-[#F5B700] group-hover:bg-zinc-50 group-hover:scale-110 group-hover:-translate-y-1 transition-all duration-300">
                    <Icon className="w-5 h-5 text-zinc-600 group-hover:text-[#F5B700] transition-colors duration-300" />
                  </div>
                  <span className="text-sm font-bold text-zinc-700 group-hover:text-[#F5B700] transition-colors duration-300 drop-shadow-sm">
                    {cat.name}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
