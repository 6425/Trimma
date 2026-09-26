import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { normalizePublicImageUrl } from "@/lib/public-image-url";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ salonId: string }>;
};

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140 Safari/537.36",
  Referer: "https://www.google.com/",
};

function isAllowedGoogleImageUrl(value: string): boolean {
  try {
    const host = new URL(value).hostname.toLowerCase();
    return (
      host === "googleusercontent.com" ||
      host.endsWith(".googleusercontent.com") ||
      host === "ggpht.com" ||
      host.endsWith(".ggpht.com") ||
      host === "streetviewpixels-pa.googleapis.com"
    );
  } catch {
    return false;
  }
}

async function fetchGoogleImage(value: string): Promise<Response | null> {
  if (!isAllowedGoogleImageUrl(value)) return null;

  const response = await fetch(value, {
    headers: BROWSER_HEADERS,
    redirect: "follow",
    cache: "no-store",
  });
  const contentType = response.headers.get("content-type") || "";
  if (!response.ok || !contentType.startsWith("image/")) return null;

  const body = await response.arrayBuffer();
  if (!body.byteLength || body.byteLength > 15 * 1024 * 1024) return null;

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000",
      "Content-Length": String(body.byteLength),
    },
  });
}

async function findCurrentGoogleBusinessImage(placeId: string): Promise<string | null> {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(placeId)}&query_place_id=${encodeURIComponent(placeId)}`;
  const response = await fetch(mapsUrl, {
    headers: BROWSER_HEADERS,
    redirect: "follow",
    cache: "no-store",
  });
  if (!response.ok) return null;

  const html = (await response.text())
    .replaceAll("\\u003d", "=")
    .replaceAll("\\u0026", "&")
    .replaceAll("\\/", "/");
  const matches = Array.from(
    html.matchAll(/https:\/\/lh3\.googleusercontent\.com\/[A-Za-z0-9_?&=./:%-]+/g),
    (match) => match[0]
  );
  return (
    matches.find(
      (url) => !url.includes("/a-/") && !url.includes("ogw/default-user")
    ) || null
  );
}

export async function GET(_request: Request, context: RouteContext) {
  const { salonId } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(salonId)) {
    return new Response("Invalid listing", { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { data: salon, error } = await supabase
    .from("salons")
    .select("hero_url,cover_url,hero_image,featured_images,place_id")
    .eq("id", salonId)
    .maybeSingle();
  if (error || !salon) return new Response("Listing image not found", { status: 404 });

  const featured = Array.isArray(salon.featured_images)
    ? salon.featured_images.find((value) => typeof value === "string" && value.trim())
    : null;
  const savedImage = normalizePublicImageUrl(
    salon.hero_url || salon.cover_url || salon.hero_image || featured
  );
  if (savedImage) {
    const savedResponse = await fetchGoogleImage(savedImage);
    if (savedResponse) return savedResponse;
  }

  const placeId = typeof salon.place_id === "string" ? salon.place_id.trim() : "";
  if (placeId) {
    const currentImage = await findCurrentGoogleBusinessImage(placeId);
    if (currentImage) {
      const currentResponse = await fetchGoogleImage(currentImage);
      if (currentResponse) return currentResponse;
    }
  }

  return new Response("Listing image unavailable", { status: 404 });
}
