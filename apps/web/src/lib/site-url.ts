const DEFAULT_SITE_URL = "https://trimma.io";

export function getSiteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.VERCEL_URL?.trim() ||
    DEFAULT_SITE_URL;

  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return canonicalizePublicOrigin(raw.replace(/\/$/, ""));
  }

  return canonicalizePublicOrigin(`https://${raw.replace(/\/$/, "")}`);
}

function canonicalizePublicOrigin(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "www.trimma.io") return "https://trimma.io";
    const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL?.replace(/^https?:\/\//, "").replace(/\/$/, "");
    if (
      parsed.hostname === "beta.trimma.io" &&
      productionHost &&
      productionHost !== "beta.trimma.io" &&
      !productionHost.includes("beta.")
    ) {
      return `https://${productionHost}`;
    }
    return url;
  } catch {
    return url;
  }
}

export function absoluteUrl(path: string): string {
  const base = getSiteUrl();
  if (!path || path === "/") return `${base}/`;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
