"use client";

import Link from "next/link";
import { Building2 } from "lucide-react";
import Image from "next/image";

export function B2BCTA() {
  return (
    <section className="py-20 bg-zinc-950">
      <div className="max-w-7xl mx-auto px-8 lg:px-12 flex flex-col md:flex-row items-center gap-12">
        <div className="flex-1 text-white">
          <div className="w-16 h-16 bg-zinc-800 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-black/50">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-4">
            Power your salon with Trimma.
          </h2>
          <p className="text-xl text-zinc-300 mb-8 max-w-lg">
            Join thousands of salons using The Salon Engine to manage appointments, process payments, and fill empty seats.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link 
              href="/onboarding"
              className="bg-white text-zinc-900 hover:bg-zinc-100 font-bold px-8 py-3.5 rounded-md text-center transition-colors"
            >
              List Your Salon
            </Link>
            <Link 
              href="/pricing"
              className="bg-brand-pink text-black hover:bg-brand-hover font-bold px-8 py-3.5 rounded-md text-center transition-colors"
            >
              View Pricing
            </Link>
          </div>
        </div>
        <div className="flex-1 relative w-full mt-10 md:mt-0">
          <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden shadow-2xl group hover:scale-[1.02] transition-transform duration-500 border border-white/10">
            <Image 
              src="/assets/dashboard_mockup.jpg" 
              alt="Trimma Dashboard Mockup" 
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover object-center"
            />
            {/* Optional glare effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          </div>
        </div>
      </div>
    </section>
  );
}
