const SUPABASE_OBJECT_PATH =
  /^(https:\/\/[^/]+\.supabase\.co)\/storage\/v1\/object\/public\/(.+)$/i;

/** Resize remote listing/hero images to reduce bytes and speed up LCP. */
export function optimizeListingImageUrl(url: string, width = 600): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;

  const supabaseMatch = trimmed.match(SUPABASE_OBJECT_PATH);
  if (supabaseMatch) {
    const [, origin, objectPath] = supabaseMatch;
    const params = new URLSearchParams({
      width: String(width),
      quality: "75",
      resize: "cover",
    });
    return `${origin}/storage/v1/render/image/public/${objectPath}?${params.toString()}`;
  }

  if (trimmed.includes("images.unsplash.com")) {
    try {
      const parsed = new URL(trimmed);
      parsed.searchParams.set("w", String(width));
      parsed.searchParams.set("q", "75");
      parsed.searchParams.set("auto", "format");
      parsed.searchParams.set("fit", "crop");
      return parsed.toString();
    } catch {
      return trimmed;
    }
  }

  return trimmed;
}

/** Hero backgrounds need more pixels but not full 3k sources. */
export function optimizeHeroImageUrl(url: string, width = 1280): string {
  return optimizeListingImageUrl(url, width);
}
