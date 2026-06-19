export const SALON_OWNER_OAUTH_INTENT_KEY = "trimma-oauth-intent";
export const SALON_OWNER_OAUTH_NEXT_KEY = "trimma-oauth-next";

export function persistSalonOwnerOAuthIntent(nextPath = "/dashboard/profile") {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(SALON_OWNER_OAUTH_INTENT_KEY, "salon-owner");
  sessionStorage.setItem(SALON_OWNER_OAUTH_NEXT_KEY, nextPath);
}

export function readSalonOwnerOAuthIntent(): {
  salonOwnerIntent: boolean;
  nextPath: string | null;
} {
  if (typeof window === "undefined") {
    return { salonOwnerIntent: false, nextPath: null };
  }

  return {
    salonOwnerIntent: sessionStorage.getItem(SALON_OWNER_OAUTH_INTENT_KEY) === "salon-owner",
    nextPath: sessionStorage.getItem(SALON_OWNER_OAUTH_NEXT_KEY),
  };
}

export function clearSalonOwnerOAuthIntent() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(SALON_OWNER_OAUTH_INTENT_KEY);
  sessionStorage.removeItem(SALON_OWNER_OAUTH_NEXT_KEY);
}
