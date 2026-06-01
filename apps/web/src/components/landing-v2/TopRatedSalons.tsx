"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import Image from "next/image";

export function TopRatedSalons() {
  const salons = [
    {
      name: "The Glamour Lounge",
      rating: 4.9,
      reviews: 1204,
      badge: "Excellent",
      quote: "Best haircut I've ever had!",
      img: "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?q=80&w=400&fm=webp&fit=crop",
      slug: "glamour-lounge"
    },
    {
      name: "Fade Factory Barbers",
      rating: 4.8,
      reviews: 890,
      badge: "Superb",
      quote: "Fast, clean, and great vibe.",
      img: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?q=80&w=400&fm=webp&fit=crop",
      slug: "fade-factory"
    },
    {
      name: "Serenity Spa & Nails",
      rating: 4.9,
      reviews: 500,
      badge: "Exceptional",
      quote: "A truly relaxing experience.",
      img: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?q=80&w=400&fm=webp&fit=crop",
      slug: "serenity-spa"
    },
    {
      name: "Trimma Elite Studio",
      rating: 4.9,
      reviews: 39,
      badge: "Exceptional",
      quote: "Incredible attention to detail.",
      img: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=400&fm=webp&fit=crop",
      slug: "trimma-elite-studio"
    }
  ];

  return (
    <section className="py-10 bg-white">
      <div className="max-w-7xl mx-auto px-8 lg:px-12">
        <h2 className="mb-1">Salons our users love</h2>
        <p className="text-zinc-500 mb-6">Explore highly-rated salons highly recommended by our community.</p>
        
        <div className="flex md:grid overflow-x-auto md:overflow-visible gap-4 lg:gap-6 pb-4 hide-scrollbar snap-x md:grid-cols-2 lg:grid-cols-4">
          {salons.map((salon, i) => (
            <Link 
              key={i}
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
                <div className="flex items-center text-sm font-bold bg-[#F5B700] text-black px-1.5 py-0.5 rounded-sm">
                  {salon.rating}
                </div>
                <span className="text-sm font-bold text-zinc-900">{salon.badge}</span>
                <span className="text-xs text-zinc-500">{salon.reviews} reviews</span>
              </div>
              
              <p className="text-sm text-zinc-700 italic">&ldquo;{salon.quote}&rdquo;</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
