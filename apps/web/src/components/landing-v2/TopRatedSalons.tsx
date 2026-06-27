"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { getTopRatedSalons, type LandingTopSalon } from "@/app/actions/landing-data";

export function TopRatedSalons() {
  const [salons, setSalons] = useState<LandingTopSalon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getTopRatedSalons(4).then((data) => {
      if (!cancelled) {
        setSalons(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <section className="py-10 bg-white">
        <div className="max-w-7xl mx-auto px-8 lg:px-12 flex items-center justify-center py-12 text-zinc-500">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Loading top salons…
        </div>
      </section>
    );
  }

  if (salons.length === 0) {
    return null;
  }

  return (
    <section className="py-10 bg-white">
      <div className="max-w-7xl mx-auto px-8 lg:px-12">
        <h2 className="mb-1">Salons Our Users Love</h2>
        <p className="text-zinc-500 mb-6">Explore highly-rated salons recommended by our community.</p>

        <div className="flex md:grid overflow-x-auto md:overflow-visible gap-4 lg:gap-6 pb-4 hide-scrollbar snap-x md:grid-cols-2 lg:grid-cols-4">
          {salons.map((salon) => (
            <Link
              key={salon.slug}
              href={`/salons/${salon.slug}`}
              className="snap-start shrink-0 md:shrink group flex flex-col w-[260px] md:w-auto"
            >
              <div className="relative aspect-[4/3] rounded-lg overflow-hidden mb-3 shadow-sm border border-zinc-100">
                <Image
                  src={salon.img}
                  alt={salon.name}
                  fill
                  sizes="(max-width: 640px) 240px, 280px"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <h3 className="font-bold text-zinc-900 group-hover:underline">{salon.name}</h3>

              <div className="flex items-center gap-2 mt-1 mb-2">
                {salon.rating > 0 ? (
                  <>
                    <div className="flex items-center text-sm font-bold bg-[#ffc800] text-black px-1.5 py-0.5 rounded-sm">
                      {salon.rating}
                    </div>
                    <span className="text-sm font-bold text-zinc-900">{salon.badge}</span>
                  </>
                ) : (
                  <span className="text-sm font-bold text-zinc-700">Verified partner</span>
                )}
                {salon.reviews > 0 ? (
                  <span className="text-xs text-zinc-500">
                    {salon.reviews} {salon.reviews === 1 ? "review" : "reviews"}
                  </span>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
