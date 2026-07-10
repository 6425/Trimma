"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Star, MapPin, CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SalonFavoriteButton } from "./SalonFavoriteButton";
import { VerifiedSalonBadge, isSalonVerified } from "./VerifiedSalonBadge";

export type SalonListRowData = {
  id: string;
  slug?: string;
  name: string;
  image: string;
  status: string;
  rating: number;
  reviews: number;
  city: string;
  location?: string;
  categories: string[];
  nextAvailable: string;
  priceFrom: number;
  popularService?: string;
  featured?: boolean;
  isVerified?: boolean;
};

type SalonListRowProps = {
  salon: SalonListRowData;
  priority?: boolean;
};

const FALLBACK_SALON_IMAGE =
  "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&auto=format&fit=crop&q=75";

function toOriginalSupabaseUrl(url: string): string | null {
  const match = url.match(
    /^(https:\/\/[^/]+\.supabase\.co)\/storage\/v1\/render\/image\/public\/([^?]+)/i
  );
  if (!match) return null;
  return `${match[1]}/storage/v1/object/public/${match[2]}`;
}

export function SalonListRow({ salon, priority = false }: SalonListRowProps) {
  const linkTarget = `/salons/${salon.slug || salon.id}`;
  const isVerified = isSalonVerified(salon.isVerified);
  const locationLabel = salon.location || salon.city;
  const originalImage = salon.image || FALLBACK_SALON_IMAGE;
  const [imageSrc, setImageSrc] = useState(originalImage);

  return (
    <article className="trimma-marketplace-card group flex flex-col md:flex-row gap-0 md:gap-4 bg-white border border-slate-200/80 rounded-2xl overflow-hidden hover:border-brand/40 hover:shadow-lg hover:shadow-brand/5 transition-all">
      <div className="relative w-full md:w-[280px] lg:w-[300px] shrink-0 aspect-[4/3] overflow-hidden bg-slate-100">
        <Image
          src={imageSrc}
          alt={salon.name}
          fill
          sizes="(max-width: 768px) 100vw, 300px"
          priority={priority}
          loading={priority ? "eager" : "lazy"}
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
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/30 to-transparent pointer-events-none" />
        <SalonFavoriteButton
          salonId={salon.id}
          salonName={salon.name}
          className="absolute top-3 right-3 z-10"
        />
        {salon.featured && (
          <Badge className="absolute top-3 left-3 z-10 bg-brand hover:bg-brand text-black border-none text-[10px] font-black uppercase tracking-wide">
            Featured
          </Badge>
        )}
      </div>

      <div className="flex-1 p-4 md:py-5 md:pr-2 flex flex-col min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
          <h2 className="text-lg md:text-xl font-bold text-[#1A1C29] group-hover:text-brand transition-colors leading-snug">
            <Link href={linkTarget}>{salon.name}</Link>
          </h2>
          {isVerified && <VerifiedSalonBadge />}
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm mb-2">
          {salon.reviews > 0 && salon.rating > 0 ? (
            <span className="inline-flex items-center gap-1.5 font-bold text-zinc-900">
              <span className="inline-flex items-center justify-center min-w-[30px] h-7 px-2 rounded-lg bg-zinc-900 text-brand text-sm font-black">
                {salon.rating.toFixed(1)}
              </span>
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="text-zinc-600 font-semibold">
                {salon.rating >= 4.5 ? "Excellent" : salon.rating >= 4 ? "Very good" : "Good"}
              </span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 font-semibold text-zinc-500">
              <span className="inline-flex items-center justify-center h-7 px-2.5 rounded-lg bg-slate-100 text-zinc-600 text-xs font-bold uppercase tracking-wide">
                New
              </span>
              <span>No reviews yet</span>
            </span>
          )}
          {salon.reviews > 0 && (
            <span className="text-zinc-500">
              {salon.reviews} {salon.reviews === 1 ? "review" : "reviews"}
            </span>
          )}
          <span className="text-slate-300 hidden sm:inline">·</span>
          <span className="inline-flex items-center text-zinc-600">
            <MapPin className="w-3.5 h-3.5 mr-1 text-brand/80 shrink-0" />
            {locationLabel}
          </span>
        </div>

        {salon.popularService && (
          <p className="text-sm text-zinc-600 line-clamp-1 mb-2">
            Popular: <span className="font-semibold text-zinc-800">{salon.popularService}</span>
          </p>
        )}

        <div className="flex flex-wrap gap-1.5 mb-3">
          {salon.categories.slice(0, 4).map((cat) => (
            <Badge
              key={cat}
              variant="secondary"
              className="text-[10px] font-semibold bg-slate-100 text-zinc-600 border-none rounded-lg px-2 py-0"
            >
              {cat}
            </Badge>
          ))}
        </div>

        <div
          className={cn(
            "mt-auto flex flex-wrap items-center gap-2 text-xs font-semibold rounded-lg px-2.5 py-1.5 w-fit border",
            salon.status === "Open Now"
              ? "text-emerald-700 bg-emerald-50/80 border-emerald-100"
              : "text-zinc-600 bg-slate-50 border-slate-200"
          )}
        >
          <CalendarDays className="w-3.5 h-3.5" />
          {salon.status === "Open Now" ? "Open now" : "Closed"} · Next slot {salon.nextAvailable}
        </div>
      </div>

      <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-3 p-4 md:p-5 md:pl-0 md:w-[190px] shrink-0 border-t md:border-t-0 md:border-l border-slate-100">
        <div className="text-right">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">From</p>
          <p className="text-xl font-black text-[#1A1C29] leading-tight">
            LKR {salon.priceFrom.toLocaleString()}
          </p>
          <p className="text-[10px] text-zinc-400 mt-0.5">Pay balance at salon</p>
        </div>
        <div className="flex flex-col gap-2 w-full md:w-auto">
          <Link
            href={linkTarget}
            className={cn(
              buttonVariants({ variant: "outline", size: "default" }),
              "h-10 rounded-xl border-slate-200 text-zinc-700 font-bold text-xs hover:border-brand/40 hover:text-brand"
            )}
          >
            View salon
          </Link>
          {isVerified ? (
            <Link
              href={`${linkTarget}?action=book`}
              className={cn(
                buttonVariants({ variant: "default", size: "default" }),
                "h-10 rounded-xl bg-primary-gradient hover:opacity-95 text-white font-bold text-xs border-none shadow-md shadow-brand/20"
              )}
            >
              Book now
            </Link>
          ) : (
            <Button disabled className="h-10 rounded-xl bg-slate-100 text-slate-400 font-bold text-xs">
              Book now
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
