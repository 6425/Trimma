"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Star, Phone, MapPin, Globe, Facebook, Instagram } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { buildSalonClaimLoginUrl } from "@/lib/salon-public-listing";
import { buildSalonPublicPath } from "@/lib/salon-public-path";
import type { BusinessListingCardData } from "@/lib/business-listing-mapper";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=600&auto=format&fit=crop";

function normalizeListingImageUrl(value: string | null | undefined): string {
  const trimmed = value?.trim();
  if (!trimmed) return FALLBACK_IMAGE;
  if (trimmed.startsWith("/")) return trimmed;

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:"
      ? parsed.toString()
      : FALLBACK_IMAGE;
  } catch {
    return FALLBACK_IMAGE;
  }
}

function toOriginalSupabaseUrl(url: string): string | null {
  const match = url.match(
    /^(https:\/\/[^/]+\.supabase\.co)\/storage\/v1\/render\/image\/public\/([^?]+)/i
  );
  if (!match) return null;
  return `${match[1]}/storage/v1/object/public/${match[2]}`;
}

function ResilientBusinessListingImage({
  source,
  alt,
  priority,
}: {
  source: string;
  alt: string;
  priority: boolean;
}) {
  const [imageSrc, setImageSrc] = useState(source);

  return (
    <Image
      src={imageSrc}
      alt={alt}
      fill
      priority={priority}
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
      className="object-cover transition-transform duration-500 hover:scale-[1.03]"
      onError={() => {
        const original = toOriginalSupabaseUrl(imageSrc);
        if (original && imageSrc.includes("/render/image/")) {
          setImageSrc(original);
          return;
        }
        if (imageSrc !== FALLBACK_IMAGE) setImageSrc(FALLBACK_IMAGE);
      }}
    />
  );
}

type Props = {
  listing: BusinessListingCardData;
  priority?: boolean;
  /** Always show the Featured Batch mark on this card (used in the Featured Beauty Business row). */
  featuredBatch?: boolean;
};

export function BusinessListingCard({ listing, priority = false, featuredBatch = false }: Props) {
  const claimUrl = buildSalonClaimLoginUrl(listing.id);
  const profileUrl = buildSalonPublicPath(listing);
  const showFeaturedBatch = featuredBatch || listing.isFeatured;
  const imageUrl = normalizeListingImageUrl(listing.image);

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-lg">
      <Link href={profileUrl} className="relative block aspect-[4/3] overflow-hidden bg-slate-100">
        <ResilientBusinessListingImage
          key={imageUrl}
          source={imageUrl}
          alt={listing.name}
          priority={priority}
        />
        {showFeaturedBatch ? (
          <span className="absolute left-2 top-2 z-10 rounded-md bg-[#ffde5a] px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-black shadow-sm">
            Featured
          </span>
        ) : null}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-3 pt-10">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#ffde5a]">
            {listing.isClaimable ? "Claim your business" : listing.isBookable ? "Book online" : "Lead listing"}
          </p>
          <p className="text-xs font-medium text-white/90 line-clamp-1">{listing.category}</p>
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h2 className="text-base font-extrabold leading-snug text-[#1A1C29] line-clamp-2">
            <Link href={profileUrl} className="hover:text-brand transition-colors">
              {listing.name}
            </Link>
          </h2>
          <p className="mt-1 flex items-start gap-1 text-xs font-medium text-zinc-500">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span className="line-clamp-2">
              {[listing.city, listing.district, listing.province].filter(Boolean).join(" · ") ||
                listing.location}
            </span>
          </p>
        </div>

        {listing.phone ? (
          <a
            href={`tel:${listing.phone.replace(/\s+/g, "")}`}
            className="flex items-center gap-2 text-sm font-semibold text-zinc-800 hover:text-brand"
          >
            <Phone className="h-4 w-4 shrink-0 text-zinc-500" />
            <span className="break-all">{listing.phone}</span>
          </a>
        ) : (
          <p className="flex items-center gap-2 text-sm text-zinc-400">
            <Phone className="h-4 w-4 shrink-0" />
            Contact not listed
          </p>
        )}

        <div className="flex items-center gap-2">
          {listing.reviews > 0 && listing.rating > 0 ? (
            <>
              <span className="inline-flex items-center gap-1 rounded-lg bg-zinc-900 px-2 py-1 text-sm font-black text-[#ffde5a]">
                {listing.rating.toFixed(1)}
              </span>
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="text-xs font-semibold text-zinc-600">
                {listing.reviews} Google {listing.reviews === 1 ? "review" : "reviews"}
              </span>
            </>
          ) : (
            <span className="text-xs font-semibold text-zinc-500">No reviews yet</span>
          )}
        </div>

        {(listing.website || listing.mapUrl || listing.facebookUrl || listing.instagramUrl) && (
          <div className="flex flex-wrap items-center gap-2">
            {listing.website && (
              <a
                href={listing.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-zinc-700 hover:border-brand/40 hover:text-brand"
                aria-label="Website"
              >
                <Globe className="h-4 w-4" />
              </a>
            )}
            {listing.mapUrl && (
              <a
                href={listing.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-zinc-700 hover:border-brand/40 hover:text-brand"
                aria-label="Google Maps"
              >
                <MapPin className="h-4 w-4" />
              </a>
            )}
            {listing.facebookUrl && (
              <a
                href={listing.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-zinc-700 hover:border-brand/40 hover:text-brand"
                aria-label="Facebook"
              >
                <Facebook className="h-4 w-4" />
              </a>
            )}
            {listing.instagramUrl && (
              <a
                href={listing.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-zinc-700 hover:border-brand/40 hover:text-brand"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
            )}
          </div>
        )}

        <div className="mt-auto pt-2">
          {listing.isClaimable ? (
            <Link
              href={claimUrl}
              className={buttonVariants({
                variant: "default",
                className: "h-11 min-h-11 w-full rounded-xl font-bold",
              })}
            >
              Claim your business
            </Link>
          ) : (
            <Link
              href={profileUrl}
              className={buttonVariants({
                variant: "outline",
                className: "h-11 min-h-11 w-full rounded-xl font-bold",
              })}
            >
              View profile
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
