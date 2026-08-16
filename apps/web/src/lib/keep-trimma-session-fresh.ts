let lastSyncedToken: string | null = null;
let inFlight: Promise<void> | null = null;

/**
 * Re-mint HttpOnly Trimma cookies from a live Supabase access token.
 * Dedupes identical tokens so login + TOKEN_REFRESHED + layout mount can all call it.
 */
export async function refreshTrimmaSecureCookies(
  accessToken: string | null | undefined
): Promise<void> {
  const token = accessToken?.trim();
  if (!token || token === lastSyncedToken) return;
  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      const { establishTrimmaSession } = await import("@/lib/establish-trimma-session");
      const result = await establishTrimmaSession(token);
      if ("error" in result) return;
      // A failed role lookup returns "customer" and would kick an admin out.
      if (
        result.role === "customer" &&
        typeof window !== "undefined" &&
        window.location.pathname.startsWith("/admin")
      ) {
        return;
      }
      lastSyncedToken = token;
    } catch {
      // Next refresh or navigation can retry.
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}
