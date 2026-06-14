const SUPABASE_OBJECT_PATH =
  /^(https:\/\/[^/]+\.supabase\.co)\/storage\/v1\/object\/public\/(.+)$/i;

/** Listing cards display at ~300px — shrink bytes without cropping salon photos. */
export function optimizeListingImageUrl(url: string, width = 640): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;

  const supabaseMatch = trimmed.match(SUPABASE_OBJECT_PATH);
  if (supabaseMatch) {
    const [, origin, objectPath] = supabaseMatch;
    const height = Math.round(width * 0.75);
    const params = new URLSearchParams({
      width: String(width),
      height: String(height),
      resize: "cover",
      quality: "82",
    });
    return `${origin}/storage/v1/render/image/public/${objectPath}?${params.toString()}`;
  }

  if (trimmed.includes("images.unsplash.com")) {
    try {
      const parsed = new URL(trimmed);
      parsed.searchParams.set("w", String(width));
      parsed.searchParams.set("q", "80");
      parsed.searchParams.set("auto", "format");
      parsed.searchParams.set("fit", "crop");
      return parsed.toString();
    } catch {
      return trimmed;
    }
  }

  return trimmed;
}

/** Hero backgrounds need fewer pixels than full 3k sources. */
export function optimizeHeroImageUrl(url: string, width = 1280): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;

  if (trimmed.includes("images.unsplash.com")) {
    try {
      const parsed = new URL(trimmed);
      parsed.searchParams.set("w", String(width));
      parsed.searchParams.set("q", "80");
      parsed.searchParams.set("auto", "format");
      parsed.searchParams.set("fit", "crop");
      return parsed.toString();
    } catch {
      return trimmed;
    }
  }

  return trimmed;
}
