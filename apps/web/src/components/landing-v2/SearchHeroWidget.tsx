"use client";

import Link from "next/link";
import Image from "next/image";

export function SearchHeroWidget() {
  return (
    <section className="relative pt-10 sm:pt-12 pb-16 sm:pb-24 bg-[#0B0B0B]">
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
    </section>
  );
}
