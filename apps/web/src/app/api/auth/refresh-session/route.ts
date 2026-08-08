import { NextRequest, NextResponse } from "next/server";
import {
  canAccessTrimmaRoute,
  resolvePostAuthRedirect,
  sanitizeNextPath,
} from "@/lib/auth-routes";
import { resolveSessionRoleForUser } from "@/lib/auth/resolve-session-role";
import { applySessionCookies } from "@/lib/auth/session-cookies";
import { verifyAccessToken } from "@/lib/auth/verify-access-token";
import { reassembleAccessTokenCookie } from "@/lib/middleware-auth";

function safeRedirectPath(value: string | null): string | null {
  const safe = sanitizeNextPath(value);
  if (!safe) return null;
  if (safe.startsWith("/api/") || safe.startsWith("/unauthorized")) return null;
  return safe;
}

/** Re-read DB role, re-mint trimma-session, and redirect (middleware recovery path). */
export async function GET(request: NextRequest) {
  const fromPath = safeRedirectPath(request.nextUrl.searchParams.get("from"));
  const accessToken = reassembleAccessTokenCookie(request);

  if (!accessToken) {
    const loginUrl = new URL("/login", request.url);
    if (fromPath) loginUrl.searchParams.set("redirectTo", fromPath);
    return NextResponse.redirect(loginUrl);
  }

  const verified = await verifyAccessToken(accessToken);
  if (!verified) {
    const loginUrl = new URL("/login", request.url);
    if (fromPath) loginUrl.searchParams.set("redirectTo", fromPath);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const role = await resolveSessionRoleForUser(
      verified.userId,
      verified.email,
      verified.userMetadata
    );

    const destination =
      fromPath && canAccessTrimmaRoute(role, fromPath)
        ? fromPath
        : resolvePostAuthRedirect(role, fromPath);

    const response = NextResponse.redirect(new URL(destination, request.url));
    await applySessionCookies(response, accessToken, role, verified.userId);
    return response;
  } catch (error) {
    console.error("Session refresh failed:", error);
    const unauthorizedUrl = new URL("/unauthorized", request.url);
    if (fromPath) unauthorizedUrl.searchParams.set("from", fromPath);
    return NextResponse.redirect(unauthorizedUrl);
  }
}
