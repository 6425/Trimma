import { createSupabaseAdminClient } from "@/config/supabase-admin";
import type { TrimmaUserRole } from "@/lib/auth-routes";
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

export async function requireAgentFromCookies(): Promise<
  AgentAuthContext | { error: string; role?: TrimmaUserRole | null }
> {
  const accessToken = await getSalonAccessTokenFromCookies();
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
    if (role !== "agent" && role !== "admin") {
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
