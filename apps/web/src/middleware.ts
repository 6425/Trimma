import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isNoindexRoute } from '@/lib/site-seo';
import {
  reassembleAccessTokenCookie,
  resolveVerifiedMiddlewareRole,
  type MiddlewareUserRole,
} from '@/lib/middleware-auth';

function withRouteHeaders(pathname: string, response: NextResponse): NextResponse {
  if (isNoindexRoute(pathname)) {
    response.headers.set('Cache-Control', 'private, no-store, no-cache, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  }
  return response;
}

const RolePermissions: Record<MiddlewareUserRole, { canAccess: (route: string) => boolean }> = {
  admin: {
    canAccess: () => true,
  },
  salon_owner: {
    canAccess: (route: string) =>
      route.startsWith('/dashboard') ||
      route.startsWith('/customer') ||
      route.startsWith('/salon') ||
      route.startsWith('/appointments') ||
      route.startsWith('/staff'),
  },
  agent: {
    canAccess: (route: string) =>
      route.startsWith('/agent') ||
      route.startsWith('/leads') ||
      route.startsWith('/dashboard') ||
      route.startsWith('/customer'),
  },
  regional_head: {
    canAccess: (route: string) =>
      route.startsWith('/agent') ||
      route.startsWith('/regional-head') ||
      route.startsWith('/leads') ||
      route.startsWith('/dashboard') ||
      route.startsWith('/customer'),
  },
  customer: {
    canAccess: (route: string) =>
      route.startsWith('/profile') ||
      route.startsWith('/bookings') ||
      route.startsWith('/customer'),
  },
};

const hasPermission = (userRole: MiddlewareUserRole | null | undefined, route: string): boolean => {
  if (!userRole) return false;
  return RolePermissions[userRole]?.canAccess(route) || false;
};

const publicRoutes = ['/', '/search', '/login', '/signup', '/register', '/forgot-password', '/reset-password', '/about', '/contact', '/pricing', '/deals', '/categories', '/styles', '/unauthorized', '/onboarding', '/privacy-policy', '/terms', '/cookies', '/careers', '/data-deletion', '/customer-help', '/cancellation-help', '/safety', '/features'];

function redirectToLogin(req: NextRequest, pathname: string): NextResponse {
  let loginPath = '/login';
  if (pathname.startsWith('/admin')) {
    loginPath = '/admin/login';
  } else if (pathname.startsWith('/agent') || pathname.startsWith('/regional-head')) {
    loginPath = '/agent/login';
  }

  const loginUrl = new URL(loginPath, req.url);
  loginUrl.searchParams.set('redirectTo', pathname);
  return withRouteHeaders(pathname, NextResponse.redirect(loginUrl));
}

function canAccessAgentPortal(role: MiddlewareUserRole | null): boolean {
  return role === 'agent' || role === 'admin';
}

function canAccessRegionalHeadPortal(role: MiddlewareUserRole | null): boolean {
  return role === 'regional_head' || role === 'admin';
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname.startsWith('/public') ||
    pathname.startsWith('/auth')
  ) {
    return NextResponse.next();
  }

  const sessionCookieValue = reassembleAccessTokenCookie(req);
  const hasSession = Boolean(sessionCookieValue);
  const userRole = await resolveVerifiedMiddlewareRole(req);

  if (pathname === '/admin/login') {
    if (hasSession && userRole === 'admin') {
      return NextResponse.redirect(new URL('/admin', req.url));
    }
    return withRouteHeaders(pathname, NextResponse.next());
  }

  if (pathname === '/agent/login') {
    if (hasSession && userRole === 'regional_head') {
      return NextResponse.redirect(new URL('/regional-head', req.url));
    }
    if (hasSession && userRole === 'agent') {
      return NextResponse.redirect(new URL('/agent', req.url));
    }
    return withRouteHeaders(pathname, NextResponse.next());
  }

  if (pathname.startsWith('/facebook/callback')) {
    return withRouteHeaders(pathname, NextResponse.next());
  }

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
    return withRouteHeaders(pathname, NextResponse.next());
  }

  if (!hasSession || !userRole) {
    return redirectToLogin(req, pathname);
  }

  if (pathname === '/login') {
    if (userRole === 'salon_owner') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    if (userRole === 'agent') {
      return NextResponse.redirect(new URL('/agent', req.url));
    }
    if (userRole === 'regional_head') {
      return NextResponse.redirect(new URL('/regional-head', req.url));
    }
  }

  if (userRole === 'regional_head' && pathname.startsWith('/agent')) {
    const suffix = pathname.slice('/agent'.length);
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = `/regional-head${suffix}`;
    return NextResponse.redirect(redirectUrl);
  }

  if (pathname.startsWith('/regional-head')) {
    if (!canAccessRegionalHeadPortal(userRole)) {
      return withRouteHeaders(pathname, NextResponse.redirect(new URL('/unauthorized', req.url)));
    }
    return withRouteHeaders(pathname, NextResponse.next());
  }

  if (pathname.startsWith('/agent')) {
    if (!canAccessAgentPortal(userRole)) {
      return withRouteHeaders(pathname, NextResponse.redirect(new URL('/unauthorized', req.url)));
    }
    return withRouteHeaders(pathname, NextResponse.next());
  }

  if (pathname.startsWith('/admin') && userRole !== 'admin') {
    const loginUrl = new URL('/admin/login', req.url);
    loginUrl.searchParams.set('redirectTo', pathname);
    return withRouteHeaders(pathname, NextResponse.redirect(loginUrl));
  }

  if (!hasPermission(userRole, pathname)) {
    if (pathname.startsWith('/admin')) {
      const loginUrl = new URL('/admin/login', req.url);
      loginUrl.searchParams.set('redirectTo', pathname);
      return withRouteHeaders(pathname, NextResponse.redirect(loginUrl));
    }
    return withRouteHeaders(pathname, NextResponse.redirect(new URL('/unauthorized', req.url)));
  }

  return withRouteHeaders(pathname, NextResponse.next());
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
