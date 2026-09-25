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

function isKnownNonPhotoGoogleAsset(url: URL): boolean {
  const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
  const pathname = url.pathname.toLowerCase();
  return hostname === "maps.gstatic.com" && pathname.startsWith("/tactile/pane");
}

function normalizeGoogleHostedImageSize(imageUrl: URL): string | null {
  const hostname = imageUrl.hostname.toLowerCase();
  const isGoogleImageHost =
    hostname === "googleusercontent.com" ||
    hostname.endsWith(".googleusercontent.com") ||
    hostname === "ggpht.com" ||
    hostname.endsWith(".ggpht.com");

  if (isGoogleImageHost) {
    // Preserve the exact direct URL saved by the admin. Google-hosted image
    // paths can contain signed sizing tokens; rewriting them makes some valid
    // Hero image URLs fail and incorrectly triggers the stock fallback.
    return imageUrl.toString();
  }

  if (hostname === "streetviewpixels-pa.googleapis.com") {
    // Street View thumbnail URLs may also be signed. Do not mutate their
    // query string after it has been entered and verified by an admin.
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
    if (isKnownNonPhotoGoogleAsset(parsed)) return null;
    const normalizedGoogleImage = normalizeGoogleHostedImageSize(parsed);
    if (normalizedGoogleImage) return normalizedGoogleImage;
    return parsed.toString();
  } catch {
    return null;
  }
}
