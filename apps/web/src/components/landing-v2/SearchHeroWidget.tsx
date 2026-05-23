"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Calendar, Clock } from "lucide-react";
import Image from "next/image";

export function SearchHeroWidget() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // In the future, date and time can be passed as well.
    router.push(`/salons?q=${encodeURIComponent(query)}&l=${encodeURIComponent(location)}`);
  };

  return (
    <section className="relative pt-12 pb-24 bg-[#0B0B0B]">
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

      <div className="relative z-10 max-w-7xl mx-auto px-4">
        <div className="max-w-3xl mx-auto mb-10 text-white text-center flex flex-col items-center">
          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-4 leading-tight !text-white hover:!text-[#febb02] transition-colors duration-300 cursor-default">
            Find. Book. Glow.
          </h1>
          <p className="text-xl md:text-2xl font-medium !text-white/90 max-w-2xl drop-shadow-md">
            The easiest way to discover salons, beauty treatments, and grooming services across Sri Lanka. Book instantly and manage appointments effortlessly.
          </p>
        </div>

        {/* The Search Widget */}
        <form 
          onSubmit={handleSearch} 
          className="bg-[#febb02] p-1.5 rounded-lg flex flex-col md:flex-row gap-1 shadow-xl max-w-5xl mx-auto"
        >
          {/* Location */}
          <div className="flex-1 bg-white flex items-center px-4 h-14 rounded-md border-2 border-transparent focus-within:border-blue-500 transition-colors">
            <MapPin className="w-5 h-5 text-zinc-400 mr-3 shrink-0" />
            <input 
              type="text" 
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Where are you? (e.g. Colombo)" 
              className="w-full h-full outline-none text-zinc-900 font-medium placeholder:text-zinc-500 placeholder:font-normal truncate"
            />
          </div>

          {/* Service */}
          <div className="flex-1 bg-white flex items-center px-4 h-14 rounded-md border-2 border-transparent focus-within:border-blue-500 transition-colors">
            <Search className="w-5 h-5 text-zinc-400 mr-3 shrink-0" />
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="What are you looking for?" 
              className="w-full h-full outline-none text-zinc-900 font-medium placeholder:text-zinc-500 placeholder:font-normal truncate"
            />
          </div>

          {/* Date */}
          <div className="flex-1 bg-white flex items-center px-4 h-14 rounded-md border-2 border-transparent focus-within:border-blue-500 transition-colors">
            <Calendar className="w-5 h-5 text-zinc-400 mr-3 shrink-0" />
            <input 
              type="date" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full h-full outline-none text-zinc-900 font-medium text-sm cursor-pointer"
            />
          </div>

          {/* Search Button */}
          <button 
            type="submit"
            className="bg-[#006CE4] hover:bg-[#0057b8] text-white font-bold h-14 px-8 rounded-md transition-colors text-xl md:w-auto w-full"
          >
            Search
          </button>
        </form>
      </div>
    </section>
  );
}
