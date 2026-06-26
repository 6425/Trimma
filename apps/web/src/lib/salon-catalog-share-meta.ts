import type { Metadata } from "next";
import type { PublicSalonService } from "@/app/actions/public-salon-page";
import type { SalonPromotionPackage } from "@/lib/deals";
import {
  getDiscountedServicePrice,
  isServiceDiscountActive,
} from "@/lib/service-discount";

export type CatalogShareMeta = {
  title: string;
  description: string;
  imageUrl?: string;
  canonicalUrl: string;
  priceLabel?: string;
};

function readAppOrigin(origin?: string): string {
  return (origin || process.env.NEXT_PUBLIC_APP_URL || "https://www.trimma.io").replace(/\/$/, "");
}

function toAbsoluteAssetUrl(value: unknown, origin: string): string | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined;
  const trimmed = value.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `${origin}${trimmed.startsWith("/") ? trimmed : `/${trimmed}`}`;
}

function truncateText(value: string, max = 200): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trim()}…`;
}

function formatLkr(amount: number): string {
  return `Rs. ${Math.round(amount).toLocaleString("en-LK")}`;
}

function salonFallbackImage(salon: Record<string, unknown>, origin: string): string | undefined {
  return (
    toAbsoluteAssetUrl(salon.logo_url, origin) ||
    toAbsoluteAssetUrl(salon.hero_url, origin) ||
    toAbsoluteAssetUrl(salon.cover_url, origin) ||
    undefined
  );
}

export function resolveCatalogShareMeta(input: {
  salon: Record<string, unknown>;
  services: PublicSalonService[];
  promotionPackages: SalonPromotionPackage[];
  serviceId?: string | null;
  promoId?: string | null;
  origin?: string;
}): CatalogShareMeta | null {
  const origin = readAppOrigin(input.origin);
  const slug =
    typeof input.salon.slug === "string" && input.salon.slug.trim()
      ? input.salon.slug.trim()
      : String(input.salon.id || "");

  if (input.serviceId) {
    const service = input.services.find((row) => row.id === input.serviceId);
    if (!service) return null;

    const hasDiscount = isServiceDiscountActive(service);
    const price = hasDiscount ? getDiscountedServicePrice(service) : Number(service.price) || 0;
    const priceLabel = hasDiscount
      ? `${formatLkr(price)} (was ${formatLkr(Number(service.price) || 0)})`
      : formatLkr(price);

    const descriptionParts = [
      service.description?.trim(),
      priceLabel,
      service.duration ? `${service.duration} min` : null,
    ].filter(Boolean);

    const canonicalUrl = `${readAppOrigin(input.origin)}/salons/${slug}/share/service/${encodeURIComponent(service.id)}`;

    return {
      title: service.name,
      description: truncateText(
        descriptionParts.length > 0 ? descriptionParts.join(" · ") : `${service.name} — ${priceLabel}`
      ),
      imageUrl: toAbsoluteAssetUrl(service.image_url, origin) || salonFallbackImage(input.salon, origin),
      canonicalUrl,
      priceLabel,
    };
  }

  if (input.promoId) {
    const promotion = input.promotionPackages.find((row) => row.id === input.promoId);
    if (!promotion) return null;

    const hasDiscount = promotion.original_price > promotion.package_price;
    const priceLabel = hasDiscount
      ? `${formatLkr(promotion.package_price)} (was ${formatLkr(promotion.original_price)})`
      : formatLkr(promotion.package_price);

    const descriptionParts = [
      promotion.description?.trim(),
      priceLabel,
      promotion.included_services.length > 0
        ? `Includes: ${promotion.included_services.slice(0, 5).join(", ")}`
        : null,
    ].filter(Boolean);

    const canonicalUrl = `${readAppOrigin(input.origin)}/salons/${slug}/share/promo/${encodeURIComponent(promotion.id)}`;

    return {
      title: promotion.name,
      description: truncateText(
        descriptionParts.length > 0 ? descriptionParts.join(" · ") : `${promotion.name} — ${priceLabel}`
      ),
      imageUrl:
        toAbsoluteAssetUrl(promotion.image_url, origin) || salonFallbackImage(input.salon, origin),
      canonicalUrl,
      priceLabel,
    };
  }

  return null;
}

export function buildSalonPageMetadata(input: {
  salon: Record<string, unknown>;
  services: PublicSalonService[];
  promotionPackages: SalonPromotionPackage[];
  serviceId?: string | null;
  promoId?: string | null;
  origin?: string;
}): Metadata {
  const shareMeta = resolveCatalogShareMeta(input);
  const salonName = String(input.salon.name || "Salon");

  if (!shareMeta) {
    const description =
      typeof input.salon.description === "string" && input.salon.description.trim()
        ? truncateText(input.salon.description)
        : `Book appointments at ${salonName} on Trimma.`;
    const origin = readAppOrigin(input.origin);
    const imageUrl = salonFallbackImage(input.salon, origin);

    return {
      title: `${salonName} | Trimma`,
      description,
      openGraph: {
        title: `${salonName} | Trimma`,
        description,
        images: imageUrl ? [{ url: imageUrl, alt: salonName }] : undefined,
        type: "website",
      },
    };
  }

  return {
    title: shareMeta.priceLabel ? `${shareMeta.title} — ${shareMeta.priceLabel}` : shareMeta.title,
    description: shareMeta.description,
    alternates: { canonical: shareMeta.canonicalUrl },
    openGraph: {
      title: shareMeta.priceLabel ? `${shareMeta.title} — ${shareMeta.priceLabel}` : shareMeta.title,
      description: shareMeta.description,
      url: shareMeta.canonicalUrl,
      siteName: "Trimma",
      type: "website",
      images: shareMeta.imageUrl
        ? [{ url: shareMeta.imageUrl, alt: shareMeta.title, width: 1200, height: 630 }]
        : undefined,
    },
    twitter: {
      card: shareMeta.imageUrl ? "summary_large_image" : "summary",
      title: shareMeta.priceLabel ? `${shareMeta.title} — ${shareMeta.priceLabel}` : shareMeta.title,
      description: shareMeta.description,
      images: shareMeta.imageUrl ? [shareMeta.imageUrl] : undefined,
    },
  };
}
