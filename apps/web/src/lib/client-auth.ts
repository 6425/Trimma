import { supabase } from "@/config/supabase";
import { withTimeout } from "@/lib/promise-timeout";

function readAccessTokenCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)sb-access-token=([^;]+)/);
  if (!match?.[1]) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

/** Resolve a bearer token for legacy client flows (prefer server cookie auth in server actions). */
export async function getTrimmaAccessToken(): Promise<string | null> {
  const cookieToken = readAccessTokenCookie();
  if (cookieToken) {
    return cookieToken;
  }

  try {
    const { data: sessionData, error: sessionError } = await withTimeout(
      supabase.auth.getSession(),
      4000,
      "Session lookup timed out"
    );
    if (!sessionError && sessionData.session?.access_token) {
      return sessionData.session.access_token;
    }
  } catch {
    // Stale client session; admin cookie is the source of truth on /admin routes.
  }

  return null;
}
