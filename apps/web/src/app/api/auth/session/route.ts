import { NextRequest, NextResponse } from "next/server";
import type { TrimmaUserRole } from "@/lib/auth-routes";
import { SIGNED_SESSION_COOKIE } from "@/lib/auth/cookies";
import { applySessionCookies } from "@/lib/auth/session-cookies";
import { verifySignedSessionCookie } from "@/lib/auth/signed-role";
import { verifyAccessToken } from "@/lib/auth/verify-access-token";
import { resolveTrimmaUserRoleServer } from "@/lib/trimma-role-server";

/** Read the signed HttpOnly trimma-session (used by client gates after password login). */
export async function GET(request: NextRequest) {
  const signedSession = request.cookies.get(SIGNED_SESSION_COOKIE)?.value;
  const payload = await verifySignedSessionCookie(signedSession);
  if (!payload) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  return NextResponse.json({
    success: true,
    role: payload.role,
    userId: payload.userId,
  });
}

function getBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const bearer = getBearerToken(request);
    const body = bearer ? null : await request.json().catch(() => null);
    const accessToken = bearer || (body?.accessToken as string | undefined) || null;

    if (!accessToken) {
      return NextResponse.json({ error: "Access token is required." }, { status: 400 });
    }

    const verified = await verifyAccessToken(accessToken);
    if (!verified) {
      return NextResponse.json({ error: "Invalid or expired session." }, { status: 401 });
    }

    let role: TrimmaUserRole | null = await resolveTrimmaUserRoleServer(
      verified.userId,
      verified.email
    );

    if (!role) {
      role = "customer";
    }

    const response = NextResponse.json({
      success: true,
      role,
      userId: verified.userId,
    });

    await applySessionCookies(response, accessToken, role, verified.userId);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Session setup failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
