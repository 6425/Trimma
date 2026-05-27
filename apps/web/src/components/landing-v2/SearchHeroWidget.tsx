"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Calendar } from "lucide-react";
import Image from "next/image";

export function SearchHeroWidget() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // In the future, date and time can be passed as well.
    router.push(`/salons?q=${encodeURIComponent(query)}&l=${encodeURIComponent(location)}`);
  };

  return (
    <section className="relative pt-10 sm:pt-12 pb-16 sm:pb-24 bg-[#0B0B0B]">
      {/* Background Hero Image - We use a subtle overlay to match the Booking style */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <Image 
          src="https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=2940&fm=webp&fit=crop" 
          alt="Salon Background" 
          fill
          priority
          className="object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0B0B0B] via-[#0B0B0B]/90 to-[#febb02]/40" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="max-w-3xl mx-auto mb-8 sm:mb-10 text-white text-center flex flex-col items-center px-1">
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight mb-3 sm:mb-4 leading-tight !text-white hover:!text-[#febb02] transition-colors duration-300 cursor-default">
            Find. Book. Glow.
          </h1>
          <p className="text-base sm:text-xl md:text-2xl font-medium !text-white/90 max-w-2xl drop-shadow-md leading-relaxed">
            The easiest way to discover salons, beauty treatments, and grooming services across Sri Lanka. Book instantly and manage appointments effortlessly.
          </p>
        </div>

        {/* The Search Widget */}
        <form
          onSubmit={handleSearch}
          className="bg-[#febb02] p-3 sm:p-2.5 md:p-1.5 rounded-2xl md:rounded-lg shadow-xl max-w-5xl mx-auto flex flex-col md:flex-row gap-3 md:gap-1.5"
        >
          {/* Location */}
          <div className="flex-1 bg-white flex items-center gap-3 px-4 min-h-[52px] h-14 rounded-xl md:rounded-md border-2 border-transparent focus-within:border-[#006CE4] transition-colors shadow-sm md:shadow-none">
            <MapPin className="w-5 h-5 text-zinc-400 shrink-0" aria-hidden="true" />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Where are you? (e.g. Colombo)"
              className="w-full min-w-0 h-full outline-none text-base text-zinc-900 font-medium placeholder:text-zinc-500 placeholder:font-normal"
            />
          </div>

          {/* Service */}
          <div className="flex-1 bg-white flex items-center gap-3 px-4 min-h-[52px] h-14 rounded-xl md:rounded-md border-2 border-transparent focus-within:border-[#006CE4] transition-colors shadow-sm md:shadow-none">
            <Search className="w-5 h-5 text-zinc-400 shrink-0" aria-hidden="true" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="What are you looking for?"
              className="w-full min-w-0 h-full outline-none text-base text-zinc-900 font-medium placeholder:text-zinc-500 placeholder:font-normal"
            />
          </div>

          {/* Date */}
          <div className="flex-1 bg-white flex items-center gap-3 px-4 min-h-[52px] h-14 rounded-xl md:rounded-md border-2 border-transparent focus-within:border-[#006CE4] transition-colors shadow-sm md:shadow-none">
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
            className="bg-[#006CE4] hover:bg-[#0057b8] active:bg-[#004a9e] text-white font-bold min-h-[52px] h-14 px-8 rounded-xl md:rounded-md transition-colors text-lg md:text-xl w-full md:w-auto md:min-w-[148px] shrink-0 shadow-sm md:shadow-none touch-manipulation"
          >
            Search
          </button>
        </form>
      </div>
    </section>
  );
}
