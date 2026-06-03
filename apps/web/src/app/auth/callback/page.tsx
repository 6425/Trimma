"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../../../config/supabase";
import { sanitizeNextPath } from "@/lib/auth-routes";
import { resolveAuthenticatedDestination } from "@/lib/post-auth";
import { redirectAfterAuth, setTrimmaMiddlewareCookies } from "@/lib/trimma-role";
import type { TrimmaUserRole } from "@/lib/auth-routes";

function AuthCallbackContent() {
  const searchParams = useSearchParams();
  const nextPath = sanitizeNextPath(
    searchParams.get("next") ||
      searchParams.get("redirectTo") ||
      searchParams.get("redirect")
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

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
        const { data: { session } } = await supabase.auth.getSession();
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
          window.setTimeout(() => redirectAfterAuth("/login"), 2000);
          return;
        }

        let onboardingStatus: string | null = null;

        try {
          const linkRes = await fetch("/api/auth/link-owner", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
            credentials: "include",
          });

          if (linkRes.ok) {
            const linkData = await linkRes.json();
            onboardingStatus = linkData.onboardingStatus ?? null;
          }
        } catch (err) {
          console.error("Owner link step failed:", err);
        }

        let role: TrimmaUserRole = "customer";

        const sessionRes = await fetch("/api/auth/session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          credentials: "include",
        });

        if (sessionRes.ok) {
          const sessionData = (await sessionRes.json()) as { role?: TrimmaUserRole };
          if (sessionData.role) {
            role = sessionData.role;
          }
        } else {
          console.warn("Session API failed; continuing with default customer role.");
        }

        setTrimmaMiddlewareCookies(session.access_token, role);

        const destination = resolveAuthenticatedDestination({
          role,
          nextPath,
          onboardingStatus,
        });

        redirectAfterAuth(destination);
      } catch (err) {
        console.error("Auth callback failed:", err);
        if (!cancelled) {
          setErrorMessage(err instanceof Error ? err.message : "Authentication failed.");
          window.setTimeout(() => redirectAfterAuth("/login"), 2000);
        }
      }
    }

    void completeAuth();

    return () => {
      cancelled = true;
    };
  }, [nextPath]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative z-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-zinc-200 border-t-zinc-900 animate-spin"></div>
        <div className="text-zinc-500 font-medium animate-pulse">
          {errorMessage || "Authenticating workspace..."}
        </div>
      </div>
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 text-zinc-500">
          Loading…
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
