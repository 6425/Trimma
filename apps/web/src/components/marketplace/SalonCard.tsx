"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Star, MapPin, CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SalonFavoriteButton } from "./SalonFavoriteButton";
import { VerifiedSalonBadge, isSalonVerified } from "./VerifiedSalonBadge";

export interface SalonCardInternalProps {
  key?: string;
  salon: {
    id: string;
    slug?: string;
    name: string;
    image: string;
    status: string;
    rating: number;
    reviews: number;
    city: string;
    categories: string[];
    nextAvailable: string;
    priceFrom: number;
    isVerified?: boolean;
  };
}

const FALLBACK_SALON_IMAGE =
  "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&auto=format&fit=crop&q=75";

function toOriginalSupabaseUrl(url: string): string | null {
  const match = url.match(
    /^(https:\/\/[^/]+\.supabase\.co)\/storage\/v1\/render\/image\/public\/([^?]+)/i
  );
  if (!match) return null;
  return `${match[1]}/storage/v1/object/public/${match[2]}`;
}

export function SalonCard(props: SalonCardInternalProps) {
  const { salon } = props;
  const linkTarget = `/salons/${salon.slug || salon.id}`;
  const isVerified = isSalonVerified(salon.isVerified);
  const originalImage = salon.image || FALLBACK_SALON_IMAGE;
  const [imageSrc, setImageSrc] = useState(originalImage);

  return (
    <div className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl transition-all group flex flex-col relative">
      <div className="relative w-full aspect-[4/3] overflow-hidden bg-slate-100">
        <Image
          src={imageSrc}
          alt={salon.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover object-center group-hover:scale-[1.02] transition-transform duration-500"
          onError={() => {
            const original = toOriginalSupabaseUrl(imageSrc);
            if (original && imageSrc.includes("/render/image/")) {
              setImageSrc(original);
              return;
            }
            if (imageSrc !== FALLBACK_SALON_IMAGE) {
              setImageSrc(FALLBACK_SALON_IMAGE);
            }
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/40 to-transparent pointer-events-none" />

        {!isVerified && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center z-10">
            <Badge className="bg-rose-500/90 hover:bg-rose-500 text-white border-rose-400 font-black text-xs uppercase tracking-widest px-4 py-1.5 shadow-xl">
              Not Verified
            </Badge>
          </div>
        )}

        <SalonFavoriteButton salonId={salon.id} salonName={salon.name} />
        <div className="absolute top-4 left-4 z-20 flex flex-wrap gap-2 max-w-[calc(100%-4rem)]">
          {isVerified && <VerifiedSalonBadge size="xs" />}
          {salon.status === "Open Now" && (
            <div className="px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm">
              Open Now
            </div>
          )}
        </div>
      </div>
      <div className="p-[var(--trimma-card-padding)] flex flex-col flex-1 trimma-surface-light">
        <div className="flex justify-between items-start mb-2">
           <h3 className="font-bold text-xl text-zinc-900 line-clamp-1 group-hover:text-brand-pink transition-colors">
             <Link href={linkTarget}>{salon.name}</Link>
           </h3>
        </div>
        <div className="flex items-center gap-3 text-sm font-medium text-zinc-500 mb-4">
          <div className="flex items-center text-zinc-900">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400 mr-1" /> {salon.rating} <span className="text-zinc-500 ml-1 font-normal">({salon.reviews})</span>
          </div>
          <span className="text-slate-300">•</span>
          <div className="flex items-center">
            <MapPin className="w-4 h-4 mr-1 text-zinc-400" /> {salon.city}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {salon.categories.map(cat => (
            <Badge key={cat} variant="secondary" className="bg-slate-100 text-zinc-600 font-medium hover:bg-slate-200 border-none shadow-none">{cat}</Badge>
          ))}
        </div>

        <div className="mt-auto">
          <div className="flex items-center gap-2 text-sm font-medium text-amber-700 bg-amber-50 px-3 py-2 rounded-lg mb-4 border border-amber-100">
            <CalendarDays className="w-4 h-4" /> Next available: {salon.nextAvailable}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
             <div className="font-medium text-zinc-500 text-sm">
               From <span className="text-lg font-bold text-zinc-900">LKR {salon.priceFrom}</span>
             </div>
             <div className="flex gap-2">
               <Link
                 href={linkTarget}
                 className="hidden sm:inline-flex items-center justify-center rounded-xl font-bold border border-slate-200 text-zinc-700 h-10 px-4 transition-colors hover:bg-slate-50"
               >
                 View
               </Link>
               {isVerified ? (
                 <Link
                   href={`${linkTarget}?action=book`}
                   className="inline-flex items-center justify-center rounded-xl px-5 sm:px-6 bg-primary-gradient hover:opacity-95 text-white font-bold shadow-md transition-colors h-10 border-none"
                 >
                   Book
                 </Link>
               ) : (
                 <div className="inline-flex items-center justify-center rounded-xl px-5 sm:px-6 bg-slate-100 text-slate-400 font-bold h-10 border-none cursor-not-allowed">
                   Book
                 </div>
               )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
