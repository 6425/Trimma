import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define roles and permissions inline to avoid module resolution issues in Edge Runtime
type UserRole = 'admin' | 'salon_owner' | 'agent' | 'customer';

const RolePermissions: Record<UserRole, { canAccess: (r: string) => boolean }> = {
  admin: {
    canAccess: (route: string) => true, // Admins can access everything
  },
  salon_owner: {
    canAccess: (route: string) => route.startsWith('/dashboard') || route.startsWith('/salon') || route.startsWith('/appointments') || route.startsWith('/staff'),
  },
  agent: {
    canAccess: (route: string) => route.startsWith('/agent') || route.startsWith('/leads') || route.startsWith('/dashboard'),
  },
  customer: {
    canAccess: (route: string) => route.startsWith('/profile') || route.startsWith('/bookings') || route.startsWith('/customer'),
  }
};

function readRoleCookie(value: string | undefined): UserRole | null {
  if (!value) return null;
  try {
    const decoded = decodeURIComponent(value).toLowerCase();
    if (decoded === "superadmin" || decoded === "regional_admin") return "admin";
    if (decoded === "admin" || decoded === "salon_owner" || decoded === "agent" || decoded === "customer") {
      return decoded;
    }
    return null;
  } catch {
    return null;
  }
}

const hasPermission = (userRole: UserRole | null | undefined, route: string): boolean => {
  if (!userRole) return false;
  return RolePermissions[userRole]?.canAccess(route) || false;
};

// Define public routes that do not require authentication
const publicRoutes = ['/', '/login', '/signup', '/register', '/forgot-password', '/reset-password', '/about', '/contact', '/pricing', '/deals', '/categories', '/styles', '/unauthorized', '/onboarding', '/privacy-policy', '/terms', '/cookies', '/careers', '/data-deletion'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Skip middleware for static files, api routes, Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') || 
    pathname.startsWith('/public') ||
    pathname.startsWith('/auth')
  ) {
    return NextResponse.next();
  }

  // Reassemble session cookie early (used for admin login redirect below)
  let chunkedToken = "";
  for (let i = 0; i < 5; i++) {
    const chunk = req.cookies.get(`sb-access-token.${i}`);
    if (chunk?.value) {
      chunkedToken += chunk.value;
    }
  }

  const sessionCookie = chunkedToken
    ? { value: chunkedToken }
    : req.cookies.get("sb-access-token") || req.cookies.get("supabase-auth-token");
  const roleCookie = req.cookies.get("user-role");

  // Admin login: always reachable; password-only (no Google)
  if (pathname === "/admin/login") {
    const userRole = readRoleCookie(roleCookie?.value);
    if (sessionCookie && userRole === "admin") {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    return NextResponse.next();
  }

  // 2. Allow public routes (exact match or ending in login/signup)
  if (
    publicRoutes.includes(pathname) || 
    pathname.endsWith('/login') || 
    pathname.endsWith('/signup') ||
    pathname.startsWith('/salons') ||
    pathname.startsWith('/locations') ||
    pathname.startsWith('/category') ||
    pathname.startsWith('/categories') ||
    pathname.startsWith('/deals') ||
    pathname.startsWith('/checkout')
  ) {
    return NextResponse.next();
  }

  // 3. Check Authentication
  if (!sessionCookie) {
    let loginPath = "/login";
    if (pathname.startsWith("/admin")) {
      loginPath = "/admin/login";
    }

    const loginUrl = new URL(loginPath, req.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/login" && readRoleCookie(roleCookie?.value) === "salon_owner") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // 4. Role Validation (RBAC)
  const userRole = readRoleCookie(roleCookie?.value);

  // Agent routes: any signed-in user may load the shell; server actions enforce agent/admin role.
  if (pathname.startsWith("/agent")) {
    return NextResponse.next();
  }

  if (!hasPermission(userRole, pathname)) {
    if (pathname.startsWith("/admin")) {
      const loginUrl = new URL("/admin/login", req.url);
      loginUrl.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  // Allow access
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
