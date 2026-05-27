"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../../config/supabase";
import { resolveAuthenticatedDestination } from "@/lib/post-auth";
import { resolveTrimmaUserRole, setTrimmaMiddlewareCookies } from "@/lib/trimma-role";
import type { TrimmaUserRole } from "@/lib/auth-routes";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath =
    searchParams.get("next") ||
    searchParams.get("redirectTo") ||
    searchParams.get("redirect");

  useEffect(() => {
    let isProcessing = false;
    let completed = false;

    const processAuth = async (session: {
      access_token: string;
      user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> };
    }) => {
      if (isProcessing || completed) return;
      isProcessing = true;

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

      let role: TrimmaUserRole | null = await resolveTrimmaUserRole(
        session.user.id,
        session.user.email
      );

      if (!role) {
        role = "customer";
      }

      setTrimmaMiddlewareCookies(session.access_token, role);
      completed = true;

      router.push(
        resolveAuthenticatedDestination({
          role,
          nextPath,
          onboardingStatus,
        })
      );
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        void processAuth(session);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        void processAuth(session);
      }
    });

    const timeout = setTimeout(() => {
      if (!completed) {
        router.push("/login");
      }
    }, 15000);

    return () => {
      authListener.subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [router, nextPath]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative z-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-zinc-200 border-t-zinc-900 animate-spin"></div>
        <div className="text-zinc-500 font-medium animate-pulse">Authenticating workspace...</div>
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
