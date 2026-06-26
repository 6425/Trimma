export type SalonSocialLinks = {
  facebookUrl: string | null;
  tiktokUrl: string | null;
  youtubeUrl: string | null;
};

function normalizeSocialUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function readSalonSocialLinks(salon: Record<string, unknown> | null | undefined): SalonSocialLinks {
  const ext =
    salon?.business_info_extended &&
    typeof salon.business_info_extended === "object" &&
    !Array.isArray(salon.business_info_extended)
      ? (salon.business_info_extended as Record<string, unknown>)
      : {};

  return {
    facebookUrl: normalizeSocialUrl(ext.facebook_url),
    tiktokUrl: normalizeSocialUrl(ext.tiktok_url),
    youtubeUrl: normalizeSocialUrl(ext.youtube_url),
  };
}

export function buildSalonPublicPageUrl(salon: Record<string, unknown>, origin?: string): string {
  const base =
    (origin || process.env.NEXT_PUBLIC_APP_URL || "https://www.trimma.io").replace(/\/$/, "");
  const slug = typeof salon.slug === "string" && salon.slug.trim() ? salon.slug.trim() : String(salon.id || "");
  return `${base}/salons/${slug}`;
}

export function buildSalonCatalogShareUrl(
  salon: Record<string, unknown>,
  kind: "service" | "promo",
  id: string,
  origin?: string
): string {
  const base = readAppOrigin(origin);
  const slug =
    typeof salon.slug === "string" && salon.slug.trim() ? salon.slug.trim() : String(salon.id || "");
  const segment = kind === "service" ? "service" : "promo";
  return `${base}/salons/${slug}/share/${segment}/${encodeURIComponent(id)}`;
}

function readAppOrigin(origin?: string): string {
  return (origin || process.env.NEXT_PUBLIC_APP_URL || "https://www.trimma.io").replace(/\/$/, "");
}

export function buildFacebookShareUrl(targetUrl: string): string {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(targetUrl)}`;
}

export function openFacebookShare(targetUrl: string) {
  if (typeof window === "undefined") return;
  const shareUrl = buildFacebookShareUrl(targetUrl);
  window.open(shareUrl, "_blank", "noopener,noreferrer,width=640,height=480");
}
