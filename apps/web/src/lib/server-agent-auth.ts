import { createSupabaseAdminClient } from "@/config/supabase-admin";
import type { TrimmaUserRole } from "@/lib/auth-routes";
import { getAccessTokenFromRequest } from "@/lib/auth/cookies";
import { normalizeEmail } from "@/lib/normalize-email";
import { getSalonAccessTokenFromCookies } from "@/lib/server-salon-auth";
import { resolveTrimmaUserRoleServer } from "@/lib/trimma-role-server";
import { withTimeout } from "@/lib/promise-timeout";

export type AgentAuthContext = {
  accessToken: string;
  userId: string;
  email: string;
  role: TrimmaUserRole;
};

function getBearerToken(request?: Request | null): string | null {
  if (!request) return null;
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7).trim();
  return token || null;
}

async function resolveAgentAuth(
  accessToken: string | null
): Promise<AgentAuthContext | { error: string; role?: TrimmaUserRole | null }> {
  if (!accessToken) {
    return { error: "Not authenticated" };
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data: authData } = await withTimeout(
      supabase.auth.getUser(accessToken),
      12000,
      "Session verification timed out."
    );
    const user = authData.user;

    if (!user?.email) {
      return { error: "Not authenticated" };
    }

    const role = await resolveTrimmaUserRoleServer(user.id, user.email);
    if (role !== "agent" && role !== "regional_head" && role !== "admin") {
      return { error: "Unauthorized access", role: role ?? null };
    }

    return {
      accessToken,
      userId: user.id,
      email: normalizeEmail(user.email),
      role,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Authentication failed.";
    return { error: message };
  }
}

export async function requireAgentFromCookies(): Promise<
  AgentAuthContext | { error: string; role?: TrimmaUserRole | null }
> {
  const accessToken = await getSalonAccessTokenFromCookies();
  return resolveAgentAuth(accessToken);
}

/** Prefer Authorization Bearer, then request cookies, then Next cookies(). */
export async function requireAgentFromRequest(
  request: Request
): Promise<AgentAuthContext | { error: string; role?: TrimmaUserRole | null }> {
  const bearer = getBearerToken(request);
  if (bearer) {
    const viaBearer = await resolveAgentAuth(bearer);
    if (!("error" in viaBearer)) return viaBearer;
  }

  const fromRequestCookies = getAccessTokenFromRequest(request);
  if (fromRequestCookies) {
    const viaRequest = await resolveAgentAuth(fromRequestCookies);
    if (!("error" in viaRequest)) return viaRequest;
  }

  const fromStore = await getSalonAccessTokenFromCookies();
  return resolveAgentAuth(fromStore);
}
