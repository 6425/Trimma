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

export function normalizePublicImageUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("/")) return trimmed;

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    if (isKnownWebPageUrl(parsed)) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}
