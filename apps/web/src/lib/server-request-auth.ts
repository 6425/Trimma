import type { NextRequest } from "next/server";
import { getAccessTokenFromRequest } from "@/lib/auth/cookies";
import { verifyAccessToken } from "@/lib/auth/verify-access-token";
import { assertPlatformAdmin } from "@/lib/platform-admin";
import { resolveTrimmaUserRoleServer } from "@/lib/trimma-role-server";
import type { TrimmaUserRole } from "@/lib/auth-routes";

export type RequestSession = {
  accessToken: string;
  userId: string;
  email: string | null;
  role: TrimmaUserRole;
};

export async function getRequestSession(request: NextRequest | Request): Promise<RequestSession | null> {
  const accessToken = getAccessTokenFromRequest(request);
  const verified = await verifyAccessToken(accessToken);
  if (!verified) return null;

  const role = (await resolveTrimmaUserRoleServer(verified.userId, verified.email)) || "customer";
  return {
    accessToken: verified.accessToken,
    userId: verified.userId,
    email: verified.email,
    role,
  };
}

export async function requireRequestRoles(
  request: NextRequest | Request,
  allowedRoles: TrimmaUserRole[]
): Promise<RequestSession | { error: string; status: number }> {
  const session = await getRequestSession(request);
  if (!session) {
    return { error: "Authentication required.", status: 401 };
  }
  if (!allowedRoles.includes(session.role)) {
    return { error: "You do not have permission for this action.", status: 403 };
  }
  return session;
}

export async function requirePlatformAdminFromRequest(
  request: NextRequest | Request
): Promise<{ accessToken: string; email: string | null } | { error: string; status: number }> {
  const accessToken = getAccessTokenFromRequest(request);
  if (!accessToken) {
    return { error: "Authentication required.", status: 401 };
  }

  try {
    await assertPlatformAdmin(accessToken);
    const verified = await verifyAccessToken(accessToken);
    return { accessToken, email: verified?.email ?? null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Admin access required.";
    return { error: message, status: 403 };
  }
}
