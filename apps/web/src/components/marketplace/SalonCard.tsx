"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Star, MapPin, CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
    <div className="bg-white rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl transition-all group flex flex-col relative h-full">
      <div className="relative w-full aspect-[4/3] overflow-hidden bg-slate-100">
        <Image
          src={imageSrc}
          alt={salon.name}
          fill
          sizes="(max-width: 1024px) 50vw, (max-width: 1200px) 33vw, 25vw"
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
            <Badge className="bg-rose-500/90 hover:bg-rose-500 text-white border-rose-400 font-black text-[9px] sm:text-xs uppercase tracking-widest px-2 py-1 sm:px-4 sm:py-1.5 shadow-xl">
              Not Verified
            </Badge>
          </div>
        )}

        <SalonFavoriteButton
          salonId={salon.id}
          salonName={salon.name}
          className="!top-2 !right-2 !p-1.5 sm:!top-4 sm:!right-4 sm:!p-2 [&_svg]:!w-4 [&_svg]:!h-4 sm:[&_svg]:!w-5 sm:[&_svg]:!h-5"
        />
        <div className="absolute top-2 left-2 sm:top-4 sm:left-4 z-20 flex flex-wrap gap-1 sm:gap-2 max-w-[calc(100%-2.5rem)] sm:max-w-[calc(100%-4rem)]">
          {isVerified && <VerifiedSalonBadge size="xs" className="hidden sm:inline-flex" />}
          {salon.status === "Open Now" && (
            <div className="px-1.5 py-0.5 sm:px-3 sm:py-1 bg-emerald-500 text-white text-[9px] sm:text-xs font-bold rounded-md sm:rounded-lg shadow-sm">
              Open
            </div>
          )}
        </div>
      </div>
      <div className="p-2.5 sm:p-[var(--trimma-card-padding)] flex flex-col flex-1 trimma-surface-light min-w-0">
        <div className="flex justify-between items-start mb-1 sm:mb-2 gap-1">
          <h3 className="font-bold text-sm sm:text-xl text-zinc-900 line-clamp-2 sm:line-clamp-1 group-hover:text-brand-pink transition-colors leading-snug">
            <Link href={linkTarget}>{salon.name}</Link>
          </h3>
          {isVerified && (
            <VerifiedSalonBadge size="xs" className="sm:hidden shrink-0 scale-90 origin-top-right" />
          )}
        </div>
        <div className="flex items-center gap-1.5 sm:gap-3 text-[11px] sm:text-sm font-medium text-zinc-500 mb-2 sm:mb-4 min-w-0">
          <div className="flex items-center text-zinc-900 shrink-0">
            <Star className="w-3 h-3 sm:w-4 sm:h-4 text-amber-400 fill-amber-400 mr-0.5 sm:mr-1" />
            {salon.rating}
            <span className="text-zinc-500 ml-0.5 sm:ml-1 font-normal hidden sm:inline">
              ({salon.reviews})
            </span>
          </div>
          <span className="text-slate-300 shrink-0">•</span>
          <div className="flex items-center min-w-0 truncate">
            <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-1 text-zinc-400 shrink-0" />
            <span className="truncate">{salon.city}</span>
          </div>
        </div>

        <div className="hidden sm:flex flex-wrap gap-2 mb-6">
          {salon.categories.map((cat) => (
            <Badge
              key={cat}
              variant="secondary"
              className="bg-slate-100 text-zinc-600 font-medium hover:bg-slate-200 border-none shadow-none"
            >
              {cat}
            </Badge>
          ))}
        </div>

        <div className="mt-auto">
          <div className="hidden sm:flex items-center gap-2 text-sm font-medium text-amber-700 bg-amber-50 px-3 py-2 rounded-lg mb-4 border border-amber-100">
            <CalendarDays className="w-4 h-4 shrink-0" /> Next available: {salon.nextAvailable}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pt-2 sm:pt-4 border-t border-slate-100">
            <div className="font-medium text-zinc-500 text-[11px] sm:text-sm">
              From{" "}
              <span className="text-sm sm:text-lg font-bold text-zinc-900">
                LKR {salon.priceFrom.toLocaleString()}
              </span>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Link
                href={linkTarget}
                className="hidden sm:inline-flex items-center justify-center rounded-xl font-bold border border-slate-200 text-zinc-700 h-10 px-4 transition-colors hover:bg-slate-50"
              >
                View
              </Link>
              {isVerified ? (
                <Link
                  href={`${linkTarget}?action=book`}
                  className="inline-flex flex-1 sm:flex-none items-center justify-center rounded-xl px-3 sm:px-6 min-h-11 sm:min-h-10 bg-primary-gradient hover:opacity-95 text-white text-xs sm:text-sm font-bold shadow-md transition-colors border-none"
                >
                  Book
                </Link>
              ) : (
                <div className="inline-flex flex-1 sm:flex-none items-center justify-center rounded-xl px-3 sm:px-6 min-h-11 sm:min-h-10 bg-slate-100 text-slate-400 text-xs sm:text-sm font-bold border-none cursor-not-allowed">
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
