import type { TrimmaUserRole } from "@/lib/auth-routes";

export type EstablishedTrimmaSession = {
  role: TrimmaUserRole;
  userId: string;
};

/**
 * Exchange a Supabase access token for HttpOnly Trimma session cookies,
 * including the signed trimma-session used by middleware RBAC.
 */
export async function establishTrimmaSession(
  accessToken: string
): Promise<EstablishedTrimmaSession | { error: string }> {
  const token = accessToken?.trim();
  if (!token) {
    return { error: "Access token is required." };
  }

  const response = await fetch("/api/auth/session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
    body: JSON.stringify({ accessToken: token }),
  });

  const payload = (await response.json().catch(() => null)) as
    | { role?: TrimmaUserRole; userId?: string; error?: string }
    | null;

  if (!response.ok || !payload?.role || !payload?.userId) {
    return { error: payload?.error || "Failed to establish secure session." };
  }

  return { role: payload.role, userId: payload.userId };
}
