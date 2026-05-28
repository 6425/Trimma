import { supabase } from "@/config/supabase";

function readAccessTokenCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)sb-access-token=([^;]+)/);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

/** Resolve a bearer token for server actions (session storage first, middleware cookie fallback). */
export async function getTrimmaAccessToken(): Promise<string | null> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (!sessionError && sessionData.session?.access_token) {
    return sessionData.session.access_token;
  }

  const cookieToken = readAccessTokenCookie();
  if (cookieToken) {
    const { data: userData, error: userError } = await supabase.auth.getUser(cookieToken);
    if (!userError && userData.user) {
      return cookieToken;
    }
  }

  try {
    const { data: refreshData } = await supabase.auth.refreshSession();
    if (refreshData.session?.access_token) {
      return refreshData.session.access_token;
    }
  } catch {
    // Ignore refresh failures; caller handles missing token.
  }

  return null;
}
