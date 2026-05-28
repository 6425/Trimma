/** Read Supabase access token from middleware cookie (avoids client auth refresh hangs). */
export function getAccessTokenFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.split("; ").find((c) => c.startsWith("sb-access-token="));
  if (!match) return null;
  return decodeURIComponent(match.slice("sb-access-token=".length));
}

export function readRoleFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)user-role=([^;]+)/)?.[1];
  if (!match) return null;
  try {
    return decodeURIComponent(match);
  } catch {
    return match;
  }
}
