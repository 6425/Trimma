/** Public salon profile path — always resolves to a loadable /salons/[slug|id] URL. */
export function buildSalonPublicPath(salon: {
  slug?: string | null;
  id?: string | null;
}): string {
  const slug = String(salon.slug || "").trim();
  if (slug) return `/salons/${encodeURIComponent(slug)}`;
  const id = String(salon.id || "").trim();
  if (id) return `/salons/${encodeURIComponent(id)}`;
  return "/";
}
