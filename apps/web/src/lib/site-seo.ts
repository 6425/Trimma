/** Exact public paths under otherwise-private prefixes (e.g. partner login). */
export const INDEXABLE_PUBLIC_EXACT_PATHS = ["/agent/login"] as const;

/** Category slugs used when DB fetch fails or for sitemap completeness. */
export const KNOWN_CATEGORY_SLUGS = [
  "barber-salon",
  "beauty-parlours",
  "bridal-beauty",
  "kids-family",
  "mens-grooming",
  "nail-studio",
  "skincare-clinics",
  "spa-and-wellness",
  "spa-wellness",
  "tattoo-studio",
  "yoga-studio",
] as const;

/** Routes that must never appear in the public sitemap or search index. */
export const PRIVATE_ROUTE_PREFIXES = [
  "/admin",
  "/agent",
  "/regional-head",
  "/dashboard",
  "/customer",
  "/checkout",
  "/auth",
  "/api",
  "/unauthorized",
] as const;

/** Auth and account flows — block from crawlers, omit from sitemap. */
export const NOINDEX_PUBLIC_PREFIXES = [
  "/login",
  "/signup",
  "/register",
  "/forgot-password",
  "/reset-password",
] as const;

/** Marketing and discovery pages safe to index. */
export const STATIC_INDEXABLE_PAGES = [
  "/",
  "/about",
  "/contact",
  "/pricing",
  "/deals",
  "/categories",
  "/styles",
  "/features",
  "/locations",
  "/onboarding",
  "/privacy-policy",
  "/terms",
  "/cookies",
  "/careers",
  "/data-deletion",
  "/customer-help",
  "/cancellation-help",
  "/safety",
  "/agent/login",
] as const;

export function slugToLabel(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export function isIndexablePublicExactPath(pathname: string): boolean {
  return (INDEXABLE_PUBLIC_EXACT_PATHS as readonly string[]).includes(pathname);
}

export function isPrivateRoute(pathname: string): boolean {
  if (isIndexablePublicExactPath(pathname)) return false;

  return PRIVATE_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function isNoindexRoute(pathname: string): boolean {
  if (isIndexablePublicExactPath(pathname)) return false;
  if (isPrivateRoute(pathname)) return true;

  return NOINDEX_PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function getRobotsAllowPaths(): string[] {
  return [
    "/",
    "/category/",
    "/categories",
    "/salons/",
    "/locations/",
    ...INDEXABLE_PUBLIC_EXACT_PATHS,
    ...STATIC_INDEXABLE_PAGES.filter((path) => path !== "/"),
  ];
}

export function getRobotsDisallowPaths(): string[] {
  return [
    ...PRIVATE_ROUTE_PREFIXES.map((prefix) => `${prefix}/`),
    ...NOINDEX_PUBLIC_PREFIXES.map((prefix) => `${prefix}`),
  ];
}
