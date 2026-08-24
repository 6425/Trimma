import {
  SALON_HERO_IMAGE_HEIGHT,
  SALON_HERO_IMAGE_WIDTH,
} from "@/lib/salon-hero-image";

function isKnownWebPageUrl(url: URL): boolean {
  const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
  const pathname = url.pathname.toLowerCase();
  const isGoogleHost = hostname === "google.com" || hostname.startsWith("google.");

  return (
    (isGoogleHost && (pathname === "/maps" || pathname.startsWith("/maps/"))) ||
    hostname === "maps.app.goo.gl" ||
    (hostname === "goo.gl" && pathname.startsWith("/maps"))
  );
}

function normalizeGoogleHostedImageSize(imageUrl: URL): string | null {
  const hostname = imageUrl.hostname.toLowerCase();
  const isGoogleImageHost =
    hostname === "googleusercontent.com" ||
    hostname.endsWith(".googleusercontent.com") ||
    hostname === "ggpht.com" ||
    hostname.endsWith(".ggpht.com");

  if (isGoogleImageHost) {
    imageUrl.pathname = imageUrl.pathname.replace(
      /=w\d+-h\d+(?:-[a-z0-9-]+)?$/i,
      `=w${SALON_HERO_IMAGE_WIDTH}-h${SALON_HERO_IMAGE_HEIGHT}-c-k-no`
    );
    return imageUrl.toString();
  }

  if (hostname === "streetviewpixels-pa.googleapis.com") {
    imageUrl.searchParams.set("w", String(SALON_HERO_IMAGE_WIDTH));
    imageUrl.searchParams.set("h", String(SALON_HERO_IMAGE_HEIGHT));
    return imageUrl.toString();
  }

  return null;
}

function extractEmbeddedGoogleImageUrl(value: string): string | null {
  let decoded: string;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    return null;
  }

  const match = decoded.match(/(?:^|!)6s(https?:\/\/[^!]+)/i);
  if (!match) return null;

  try {
    const imageUrl = new URL(match[1]);
    return normalizeGoogleHostedImageSize(imageUrl);
  } catch {
    return null;
  }
}

export function normalizePublicImageUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("/")) return trimmed;

  const embeddedGoogleImage = extractEmbeddedGoogleImageUrl(trimmed);
  if (embeddedGoogleImage) return embeddedGoogleImage;

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    if (isKnownWebPageUrl(parsed)) return null;
    const normalizedGoogleImage = normalizeGoogleHostedImageSize(parsed);
    if (normalizedGoogleImage) return normalizedGoogleImage;
    return parsed.toString();
  } catch {
    return null;
  }
}
