const DEV_FALLBACK = "trimma-dev-session-secret-change-me";

export function getSessionSecret(): string {
  const secret =
    process.env.TRIMMA_SESSION_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 48) ||
    (process.env.NODE_ENV === "production" ? "" : DEV_FALLBACK);

  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error(
      "TRIMMA_SESSION_SECRET is required in production for secure session cookies."
    );
  }

  return secret || DEV_FALLBACK;
}
