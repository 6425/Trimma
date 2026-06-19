/** Routes that must never appear in the public sitemap or search index. */
export const PRIVATE_ROUTE_PREFIXES = [
  "/admin",
  "/agent",
  "/regional-head",
  "/dashboard",
  "/customer",
  "/checkout",
  "/onboarding",
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
  "/privacy-policy",
  "/terms",
  "/cookies",
  "/careers",
  "/data-deletion",
  "/customer-help",
  "/cancellation-help",
  "/safety",
] as const;

export function isPrivateRoute(pathname: string): boolean {
  return PRIVATE_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function isNoindexRoute(pathname: string): boolean {
  if (isPrivateRoute(pathname)) return true;

  return NOINDEX_PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function getRobotsDisallowPaths(): string[] {
  return [
    ...PRIVATE_ROUTE_PREFIXES.map((prefix) => `${prefix}/`),
    ...NOINDEX_PUBLIC_PREFIXES.map((prefix) => `${prefix}`),
  ];
}
