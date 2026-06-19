export const SALON_OWNER_OAUTH_INTENT_KEY = "trimma-oauth-intent";
export const SALON_OWNER_OAUTH_NEXT_KEY = "trimma-oauth-next";
export const SALON_OWNER_ONBOARDING_FLAG_KEY = "trimma-onboarding-salon-owner";

export function markOnboardingSalonOwnerIntent(nextPath = "/dashboard/profile") {
  if (typeof window === "undefined") return;
  localStorage.setItem(SALON_OWNER_ONBOARDING_FLAG_KEY, nextPath);
  persistSalonOwnerOAuthIntent(nextPath);
}

export function persistSalonOwnerOAuthIntent(nextPath = "/dashboard/profile") {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(SALON_OWNER_OAUTH_INTENT_KEY, "salon-owner");
  sessionStorage.setItem(SALON_OWNER_OAUTH_NEXT_KEY, nextPath);
  localStorage.setItem(SALON_OWNER_ONBOARDING_FLAG_KEY, nextPath);
}

export function readSalonOwnerOAuthIntent(): {
  salonOwnerIntent: boolean;
  nextPath: string | null;
} {
  if (typeof window === "undefined") {
    return { salonOwnerIntent: false, nextPath: null };
  }

  const onboardingFlag = localStorage.getItem(SALON_OWNER_ONBOARDING_FLAG_KEY);
  const sessionIntent = sessionStorage.getItem(SALON_OWNER_OAUTH_INTENT_KEY) === "salon-owner";

  return {
    salonOwnerIntent: sessionIntent || Boolean(onboardingFlag),
    nextPath:
      sessionStorage.getItem(SALON_OWNER_OAUTH_NEXT_KEY) ||
      onboardingFlag ||
      null,
  };
}

export function clearSalonOwnerOAuthIntent() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(SALON_OWNER_OAUTH_INTENT_KEY);
  sessionStorage.removeItem(SALON_OWNER_OAUTH_NEXT_KEY);
  localStorage.removeItem(SALON_OWNER_ONBOARDING_FLAG_KEY);
}
