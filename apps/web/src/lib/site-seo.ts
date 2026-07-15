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

/** Primary marketing pages — used for JSON-LD site navigation and internal linking signals. */
export const PUBLIC_SITE_NAV_LINKS = [
  {
    name: "Features",
    path: "/features",
    description: "Salon booking, dashboard, staff scheduling, deals, and analytics for Sri Lanka salons.",
  },
  {
    name: "Pricing",
    path: "/pricing",
    description: "Trimma subscription plans for salon owners — list your salon and accept online bookings.",
  },
  {
    name: "About Trimma",
    path: "/about",
    description: "Learn about Trimma, the beauty and wellness booking platform built for salons in Sri Lanka.",
  },
  {
    name: "Contact",
    path: "/contact",
    description: "Contact the Trimma team for customer support, salon partnerships, and general enquiries.",
  },
  {
    name: "Terms & Conditions",
    path: "/terms",
    description: "Trimma terms and conditions for customers, salon partners, and platform users.",
  },
  {
    name: "Privacy Policy",
    path: "/privacy-policy",
    description: "How Trimma collects, uses, and protects personal data on the salon booking platform.",
  },
  {
    name: "List Your Salon",
    path: "/onboarding",
    description: "Join Trimma and start accepting online salon bookings across Sri Lanka.",
  },
  {
    name: "Salon Locations",
    path: "/locations",
    description: "Browse salons by province, district, and city across Sri Lanka.",
  },
  {
    name: "Categories",
    path: "/categories",
    description: "Explore salon categories — barbers, spas, beauty parlours, nail studios, and more.",
  },
  {
    name: "Deals",
    path: "/deals",
    description: "Current salon deals and promotions on Trimma across Sri Lanka.",
  },
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
