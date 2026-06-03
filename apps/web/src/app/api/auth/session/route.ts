import { NextRequest, NextResponse } from "next/server";
import type { TrimmaUserRole } from "@/lib/auth-routes";
import { applySessionCookies } from "@/lib/auth/session-cookies";
import { verifyAccessToken } from "@/lib/auth/verify-access-token";
import { resolveTrimmaUserRoleServer } from "@/lib/trimma-role-server";

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
