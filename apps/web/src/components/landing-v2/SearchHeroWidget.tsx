"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Search, MapPin, Calendar } from "lucide-react";

export function SearchHeroWidget() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/salons?q=${encodeURIComponent(query)}&l=${encodeURIComponent(location)}`);
  };

  return (
    <section className="relative pt-10 sm:pt-12 pb-24 sm:pb-32 bg-[#0B0B0B] mb-12 sm:mb-16">
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
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight mb-4 sm:mb-6 leading-tight !text-white hover:!text-[#F5B700] transition-colors duration-300 cursor-default">
            Sri Lanka's Beauty & Wellness Marketplace
          </h1>
          <p className="text-base sm:text-xl md:text-2xl font-medium !text-white/90 max-w-3xl drop-shadow-md leading-relaxed mb-4">
            Book salon, spa, barber, nail, skincare, and wellness appointments instantly — all from one trusted platform.
          </p>
          <p className="text-lg sm:text-2xl font-bold !text-[#F5B700] drop-shadow-md mb-8 sm:mb-10">
            Find Your Perfect Beauty Experience Today
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center">
            <Link
              href="/salons"
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

      {/* The Search Widget - overlapping the bottom edge */}
      <div className="absolute bottom-0 left-0 right-0 w-full translate-y-1/2 z-20 px-4 sm:px-6">
        <form
          onSubmit={handleSearch}
          className="bg-[#F5B700] p-3 sm:p-2.5 md:p-1.5 rounded-2xl md:rounded-lg shadow-2xl max-w-5xl mx-auto flex flex-col md:flex-row gap-3 md:gap-1.5 border-[4px] border-white dark:border-[#0B0B0B]"
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
      </div>
    </section>
  );
}
