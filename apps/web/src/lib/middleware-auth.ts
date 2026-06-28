import type { NextRequest } from "next/server";
import type { TrimmaUserRole } from "@/lib/auth-routes";
import { verifySignedSessionCookie } from "@/lib/auth/signed-role";

export type MiddlewareUserRole =
  | "admin"
  | "regional_head"
  | "salon_owner"
  | "agent"
  | "customer";

export function mapTrimmaRoleToMiddlewareRole(role: TrimmaUserRole): MiddlewareUserRole {
  if (role === "admin") return "admin";
  if (role === "regional_head") return "regional_head";
  if (role === "salon_owner") return "salon_owner";
  if (role === "agent") return "agent";
  return "customer";
}

/** Resolve role from signed HttpOnly trimma-session cookie (never trust user-role alone). */
export async function resolveVerifiedMiddlewareRole(
  request: NextRequest
): Promise<MiddlewareUserRole | null> {
  const signedSession = request.cookies.get("trimma-session")?.value;
  const payload = await verifySignedSessionCookie(signedSession);
  if (!payload) return null;
  return mapTrimmaRoleToMiddlewareRole(payload.role);
}

export function reassembleAccessTokenCookie(request: NextRequest): string | null {
  let chunkedToken = "";
  for (let i = 0; i < 5; i++) {
    const chunk = request.cookies.get(`sb-access-token.${i}`);
    if (chunk?.value) {
      chunkedToken += chunk.value;
    }
  }

  if (chunkedToken) return chunkedToken;

  return (
    request.cookies.get("sb-access-token")?.value ||
    request.cookies.get("supabase-auth-token")?.value ||
    null
  );
}
