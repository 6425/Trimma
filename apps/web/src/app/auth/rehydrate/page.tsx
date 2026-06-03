"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/config/supabase";
import { sanitizeNextPath } from "@/lib/auth-routes";
import type { TrimmaUserRole } from "@/lib/auth-routes";
import { redirectAfterAuth, setTrimmaMiddlewareCookies, resolveTrimmaUserRole } from "@/lib/trimma-role";
import { resolveAuthenticatedDestination } from "@/lib/post-auth";

function RehydrateContent() {
  const searchParams = useSearchParams();
  const nextPath = sanitizeNextPath(
    searchParams.get("next") ||
      searchParams.get("redirectTo") ||
      searchParams.get("redirect")
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function rehydrate() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          // No client session at all — go to login and stop (no loop).
          const loginNext = nextPath ? `?redirectTo=${encodeURIComponent(nextPath)}` : "";
          redirectAfterAuth(`/login${loginNext}`);
          return;
        }

        let role: TrimmaUserRole | null = null;

        // Preferred path: server resolves role + sets HttpOnly cookies.
        try {
          const res = await fetch("/api/auth/session", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              "Content-Type": "application/json",
            },
            credentials: "include",
          });

          if (res.ok) {
            const data = (await res.json()) as { role?: TrimmaUserRole };
            role = data.role ?? null;
          } else {
            console.error("Session API failed:", res.status, await res.text().catch(() => ""));
          }
        } catch (apiErr) {
          console.error("Session API request failed:", apiErr);
        }

        // Fallback: resolve role client-side so a server hiccup can't lock the user out.
        if (!role) {
          role =
            (await resolveTrimmaUserRole(session.user.id, session.user.email)) ?? "customer";
        }

        // Always set the middleware cookies from the live client session.
        setTrimmaMiddlewareCookies(session.access_token, role);

        if (!cancelled) {
          const destination = resolveAuthenticatedDestination({ role, nextPath });
          redirectAfterAuth(destination);
        }
      } catch (err) {
        if (!cancelled) {
          setErrorMessage(err instanceof Error ? err.message : "Session refresh failed.");
          const loginNext = nextPath ? `?redirectTo=${encodeURIComponent(nextPath)}` : "";
          window.setTimeout(() => redirectAfterAuth(`/login${loginNext}`), 2500);
        }
      }
    }

    void rehydrate();
    return () => {
      cancelled = true;
    };
  }, [nextPath]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-zinc-200 border-t-zinc-900 animate-spin" />
        <div className="text-zinc-500 font-medium animate-pulse">
          {errorMessage || "Refreshing secure session…"}
        </div>
      </div>
    </div>
  );
}

export default function AuthRehydratePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 text-zinc-500">
          Loading…
        </div>
      }
    >
      <RehydrateContent />
    </Suspense>
  );
}
