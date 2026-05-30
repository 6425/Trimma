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
  // In a real Supabase App Router setup, you would use createServerClient from @supabase/ssr here.
  // For this generic setup, we check for a session token cookie.
  const sessionCookie = req.cookies.get('sb-access-token') || req.cookies.get('supabase-auth-token');
  const roleCookie = req.cookies.get('user-role'); // Assume the user role is stored in a cookie upon login

  if (!sessionCookie) {
    if (pathname === "/admin/login") {
      return NextResponse.next();
    }
    let loginPath = "/login";
    if (pathname.startsWith("/admin")) {
      loginPath = "/admin/login";
    }

    const loginUrl = new URL(loginPath, req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/admin/login" && roleCookie?.value === "admin") {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  if (pathname === "/login" && roleCookie?.value === "salon_owner") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // 4. Role Validation (RBAC)
  const userRole = (roleCookie?.value as UserRole) || null;
  
  if (!hasPermission(userRole, pathname)) {
    if (pathname.startsWith("/admin")) {
      const loginUrl = new URL("/admin/login", req.url);
      loginUrl.searchParams.set("redirect", pathname);
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
