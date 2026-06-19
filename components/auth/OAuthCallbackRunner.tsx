"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/config/supabase";
import { sanitizeNextPath } from "@/lib/auth-routes";
import { resolveAuthenticatedDestination } from "@/lib/post-auth";
import { redirectAfterAuth, setTrimmaMiddlewareCookies } from "@/lib/trimma-role";
import { completeOAuthLogin } from "@/app/actions/login-session";
import {
  clearSalonOwnerOAuthIntent,
  readSalonOwnerOAuthIntent,
} from "@/lib/salon-owner-oauth-intent";
import { resolveSalonOwnerOAuthRole } from "@/lib/salon-owner-oauth";

type OAuthCallbackRunnerProps = {
  forcedSalonOwner?: boolean;
  defaultNextPath?: string;
};

function OAuthCallbackRunner({
  forcedSalonOwner = false,
  defaultNextPath = "/dashboard/profile",
}: OAuthCallbackRunnerProps) {
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const storedIntent = readSalonOwnerOAuthIntent();
    const salonOwnerIntent =
      forcedSalonOwner ||
      searchParams.get("intent") === "salon-owner" ||
      storedIntent.salonOwnerIntent;
    const nextPath = sanitizeNextPath(
      searchParams.get("next") ||
        searchParams.get("redirectTo") ||
        searchParams.get("redirect") ||
        storedIntent.nextPath ||
        defaultNextPath
    );

    async function waitForSession(maxAttempts = 20): Promise<Session | null> {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");

      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          throw new Error(error.message);
        }
        if (data.session) {
          window.history.replaceState(null, "", window.location.pathname + window.location.hash);
          return data.session;
        }
      }

      for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session) {
          return session;
        }
        await new Promise((resolve) => setTimeout(resolve, 250));
      }

      return null;
    }

    async function completeAuth() {
      try {
        const session = await waitForSession();
        if (cancelled) return;

        if (!session) {
          setErrorMessage("Sign-in could not be completed. Please try again.");
          const loginPath = salonOwnerIntent
            ? `/login?redirectTo=${encodeURIComponent(nextPath || defaultNextPath)}&intent=salon-owner`
            : "/login";
          window.setTimeout(() => redirectAfterAuth(loginPath), 2000);
          return;
        }

        const result = await completeOAuthLogin(session.access_token, { salonOwnerIntent });
        if (cancelled) return;

        if (result.success) {
          if (result.role === "admin") {
            await supabase.auth.signOut();
            setErrorMessage("Admins must sign in at /admin/login with email and password.");
            window.setTimeout(() => redirectAfterAuth("/admin/login"), 2500);
            return;
          }
          if (result.role === "agent" || result.role === "regional_head") {
            await supabase.auth.signOut();
            setErrorMessage("Agents and Regional Heads must sign in at /agent/login with email and password.");
            window.setTimeout(() => redirectAfterAuth("/agent/login"), 2500);
            return;
          }

          const role = salonOwnerIntent
            ? resolveSalonOwnerOAuthRole(result.role, true)
            : result.role;

          clearSalonOwnerOAuthIntent();
          setTrimmaMiddlewareCookies(session.access_token, role);

          redirectAfterAuth(
            resolveAuthenticatedDestination({
              role,
              nextPath,
              onboardingStatus: result.onboardingStatus,
              salonOwnerIntent,
            })
          );
          return;
        }

        console.error("OAuth completion failed:", result.error);
        setErrorMessage(result.error || "Could not complete sign-in. Please try again.");
        const loginPath = salonOwnerIntent
          ? `/login?redirectTo=${encodeURIComponent(nextPath || defaultNextPath)}&intent=salon-owner`
          : nextPath
            ? `/login?redirectTo=${encodeURIComponent(nextPath)}`
            : "/login";
        window.setTimeout(() => redirectAfterAuth(loginPath), 2000);
      } catch (err) {
        console.error("Auth callback failed:", err);
        if (!cancelled) {
          setErrorMessage(err instanceof Error ? err.message : "Authentication failed.");
          const loginPath = salonOwnerIntent
            ? `/login?redirectTo=${encodeURIComponent(nextPath || defaultNextPath)}&intent=salon-owner`
            : "/login";
          window.setTimeout(() => redirectAfterAuth(loginPath), 2000);
        }
      }
    }

    void completeAuth();

    return () => {
      cancelled = true;
    };
  }, [defaultNextPath, forcedSalonOwner, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative z-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-zinc-200 border-t-zinc-900 animate-spin" />
        <div className="text-zinc-500 font-medium animate-pulse">
          {errorMessage || "Authenticating workspace..."}
        </div>
      </div>
    </div>
  );
}

export function OAuthCallbackPage({
  forcedSalonOwner = false,
  defaultNextPath,
}: OAuthCallbackRunnerProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 text-zinc-500">
          Loading…
        </div>
      }
    >
      <OAuthCallbackRunner forcedSalonOwner={forcedSalonOwner} defaultNextPath={defaultNextPath} />
    </Suspense>
  );
}
