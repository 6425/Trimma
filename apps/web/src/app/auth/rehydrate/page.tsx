"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/config/supabase";
import { sanitizeNextPath } from "@/lib/auth-routes";
import { redirectAfterAuth, setTrimmaMiddlewareCookies } from "@/lib/trimma-role";

function RehydrateContent() {
  const searchParams = useSearchParams();
  const nextPath =
    sanitizeNextPath(
      searchParams.get("next") ||
        searchParams.get("redirectTo") ||
        searchParams.get("redirect")
    ) || "/";
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function rehydrate() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          redirectAfterAuth(`/login?redirect=${encodeURIComponent(nextPath)}`);
          return;
        }

        const res = await fetch("/api/auth/session", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error("Could not refresh your secure session.");
        }

        const sessionData = (await res.json()) as { role?: string };
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (currentSession?.access_token && sessionData.role) {
          setTrimmaMiddlewareCookies(currentSession.access_token, sessionData.role);
        }

        if (!cancelled) {
          redirectAfterAuth(nextPath);
        }
      } catch (err) {
        if (!cancelled) {
          setErrorMessage(err instanceof Error ? err.message : "Session refresh failed.");
          window.setTimeout(
            () => redirectAfterAuth(`/login?redirect=${encodeURIComponent(nextPath)}`),
            2000
          );
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
