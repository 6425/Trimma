import {
  clearSalonOwnerOAuthIntent,
  persistSalonOwnerOAuthIntent,
} from "@/lib/salon-owner-oauth-intent";
import type { Session } from "@supabase/supabase-js";
import type { TrimmaUserRole } from "@/lib/auth-routes";
import { supabase } from "@/config/supabase";
import { completeOAuthLogin } from "@/app/actions/login-session";
import { resolveAuthenticatedDestination } from "@/lib/post-auth";
import { redirectAfterAuth, setTrimmaMiddlewareCookies } from "@/lib/trimma-role";

export const SALON_OWNER_LOGIN_REDIRECT = "/dashboard/profile";

export function buildSalonOwnerOAuthRedirectUrl(origin: string = window.location.origin): string {
  const params = new URLSearchParams({
    next: SALON_OWNER_LOGIN_REDIRECT,
    intent: "salon-owner",
  });
  return `${origin}/auth/callback?${params.toString()}`;
}

export function resolveSalonOwnerOAuthRole(
  role: TrimmaUserRole,
  salonOwnerIntent = true
): TrimmaUserRole {
  if (!salonOwnerIntent) return role;
  if (role === "admin" || role === "agent" || role === "regional_head") return role;
  return "salon_owner";
}

/** Complete Google session for salon-owner onboarding (existing or fresh sign-in). */
export async function completeSalonOwnerGoogleSession(session: Session): Promise<{
  ok: boolean;
  error?: string;
}> {
  const result = await completeOAuthLogin(session.access_token, { salonOwnerIntent: true });

  if (!result.success) {
    return { ok: false, error: result.error || "Could not complete salon owner sign-in." };
  }

  if (result.role === "admin") {
    await supabase.auth.signOut();
    return { ok: false, error: "Admins must sign in at /admin/login with email and password." };
  }

  if (result.role === "agent" || result.role === "regional_head") {
    await supabase.auth.signOut();
    return {
      ok: false,
      error: "Agents and Regional Heads must sign in at /agent/login with email and password.",
    };
  }

  const role = resolveSalonOwnerOAuthRole(result.role, true);
  clearSalonOwnerOAuthIntent();
  setTrimmaMiddlewareCookies(session.access_token, role);
  redirectAfterAuth(
    resolveAuthenticatedDestination({
      role,
      nextPath: SALON_OWNER_LOGIN_REDIRECT,
      salonOwnerIntent: true,
    })
  );

  return { ok: true };
}

export async function startSalonOwnerGoogleOAuth(): Promise<{ ok: boolean; error?: string }> {
  persistSalonOwnerOAuthIntent(SALON_OWNER_LOGIN_REDIRECT);
  const redirectTo = buildSalonOwnerOAuthRedirectUrl();

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
    },
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
