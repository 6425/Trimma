"use client";

import Link from "next/link";
import { Tag } from "lucide-react";

export function OffersSection() {
  const scrollToDeals = () => {
    document.getElementById("deals-discount")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-8 lg:px-12">
        <h2 className="text-2xl font-bold text-zinc-900 mb-1">Offers</h2>
        <p className="text-zinc-500 mb-6">Promotions, deals, and special discounts for you.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={scrollToDeals}
            className="text-left bg-white border border-zinc-200 rounded-lg p-6 shadow-sm flex flex-col sm:flex-row gap-6 relative overflow-hidden hover:border-blue-200 hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex-1 z-10">
              <h3 className="text-xl font-bold text-zinc-900 mb-2">New User Discount!</h3>
              <p className="text-zinc-600 mb-6 max-w-sm">Save 15% on your first booking through Trimma.</p>
              <span className="inline-block bg-[#006CE4] group-hover:bg-[#0057b8] text-white font-bold px-4 py-2 rounded-md text-sm transition-colors">
                Grab deal
              </span>
            </div>
            <div className="hidden sm:block absolute right-0 top-0 bottom-0 w-1/3 bg-blue-50/50 rounded-l-[100px] border-l border-blue-100" />
            <div className="hidden sm:flex items-center justify-center absolute right-12 top-1/2 -translate-y-1/2 z-10">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                <Tag className="w-8 h-8 text-[#006CE4]" />
              </div>
            </div>
          </button>

          <Link
            href="/deals"
            className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-lg p-6 shadow-sm flex flex-col sm:flex-row gap-6 relative overflow-hidden hover:border-emerald-200 hover:shadow-md transition-all"
          >
            <div className="flex-1 z-10">
              <h3 className="text-xl font-bold text-zinc-900 mb-2">Weekend Glow-Up</h3>
              <p className="text-zinc-600 mb-6 max-w-sm">Flash sales on manicures and pedicures this Saturday.</p>
              <span className="inline-block bg-[#006CE4] hover:bg-[#0057b8] text-white font-bold px-4 py-2 rounded-md text-sm transition-colors">
                Explore deals
              </span>
            </div>
            <div className="hidden sm:flex items-center justify-center absolute right-12 top-1/2 -translate-y-1/2 z-10">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                <span className="text-3xl">💅</span>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
