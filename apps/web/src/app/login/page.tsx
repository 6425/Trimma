/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React, { Suspense, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import Logo from "../../components/Logo";
import { supabase } from "@/config/supabase";
import { normalizeEmail } from "@/lib/normalize-email";
import { sanitizeNextPath } from "@/lib/auth-routes";
import {
  setTrimmaMiddlewareCookies,
  redirectAfterAuth,
  resolveTrimmaUserRole,
} from "@/lib/trimma-role";
import { resolveAuthenticatedDestination } from "@/lib/post-auth";
import { completeOAuthLogin } from "@/app/actions/login-session";
import type { Session } from "@supabase/supabase-js";
import type { TrimmaUserRole } from "@/lib/auth-routes";

const LOGIN_HERO_IMAGE =
  "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?q=80&w=2400&auto=format&fit=crop";

function GoogleIcon() {
  return (
    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[100dvh] flex items-center justify-center bg-[#121212] text-zinc-400">
          Loading…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const [loading, setLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const searchParams = useSearchParams();
  const invitedEmail = normalizeEmail(searchParams.get("email"));
  const redirectTo = sanitizeNextPath(
    searchParams.get("redirectTo") ||
      searchParams.get("redirect") ||
      searchParams.get("next")
  );

  const completeGoogleSession = useCallback(
    async (session: Session, isCancelled: () => boolean) => {
      try {
        const result = await completeOAuthLogin(session.access_token);
        if (isCancelled()) return;

        if (result.success) {
          if (result.role === "admin") {
            await supabase.auth.signOut();
            alert("Admins must sign in at /admin/login with email and password.");
            setIsCheckingSession(false);
            return;
          }
          if (result.role === "agent" || result.role === "regional_head") {
            await supabase.auth.signOut();
            alert("Agents and Regional Heads must sign in at /agent/login with email and password.");
            setIsCheckingSession(false);
            return;
          }

          setTrimmaMiddlewareCookies(session.access_token, result.role);
          redirectAfterAuth(
            resolveAuthenticatedDestination({
              role: result.role,
              nextPath: redirectTo,
              onboardingStatus: result.onboardingStatus,
            })
          );
          return;
        }
      } catch (err) {
        console.warn("OAuth completion unavailable; using client fallback.", err);
      }

      let role: TrimmaUserRole | null =
        (await resolveTrimmaUserRole(session.user.id, session.user.email)) ?? "customer";

      if (isCancelled()) return;

      if (role === "admin") {
        await supabase.auth.signOut();
        alert("Admins must sign in at /admin/login.");
        setIsCheckingSession(false);
        return;
      }
      if (role === "agent" || role === "regional_head") {
        await supabase.auth.signOut();
        alert("Agents and Regional Heads must sign in at /agent/login.");
        setIsCheckingSession(false);
        return;
      }

      setTrimmaMiddlewareCookies(session.access_token, role);
      redirectAfterAuth(resolveAuthenticatedDestination({ role, nextPath: redirectTo }));
    },
    [redirectTo]
  );

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (session?.user?.email && invitedEmail && normalizeEmail(session.user.email) !== invitedEmail) {
        await supabase.auth.signOut();
        if (!cancelled) setIsCheckingSession(false);
        return;
      }

      if (error || !session?.access_token || cancelled) {
        if (!cancelled) setIsCheckingSession(false);
        return;
      }

      await completeGoogleSession(session, () => cancelled);
    });
    return () => {
      cancelled = true;
    };
  }, [completeGoogleSession, invitedEmail]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    const oauthRedirect = redirectTo
      ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`
      : `${window.location.origin}/auth/callback`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: oauthRedirect,
        queryParams: invitedEmail ? { login_hint: invitedEmail } : undefined,
      },
    });

    if (error) {
      setLoading(false);
      alert("Google sign-in failed: " + error.message);
    }
  };

  if (isCheckingSession) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[#121212] text-zinc-400">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 border-4 border-[#F5B700] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-semibold text-white/70">Authenticating...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col lg:flex-row bg-[#121212]">
      <div className="relative flex flex-col items-center justify-center px-6 py-12 sm:px-10 sm:py-16 lg:px-14 lg:py-20 min-h-[42vh] sm:min-h-[48vh] lg:h-[100dvh] lg:w-1/2 lg:fixed lg:top-0 lg:left-0 overflow-hidden">
        <div className="absolute inset-0 bg-[#F5B700]" aria-hidden="true">
          <img
            src={LOGIN_HERO_IMAGE}
            alt=""
            className="h-full w-full object-cover object-center grayscale opacity-15 mix-blend-multiply scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#F5B700]/40 via-[#F5B700]/70 to-[#F5B700]/95" />
        </div>

        <Link
          href="/"
          className="absolute left-6 top-6 z-20 hover:opacity-90 transition-opacity sm:left-10 sm:top-8 lg:left-14 lg:top-10"
        >
          <Logo iconSize={40} />
        </Link>

        <div className="relative z-10 flex w-full max-w-xl flex-col items-center text-center pt-14 sm:pt-16 lg:pt-0">
          <h1 className="font-heading text-[1.65rem] font-bold leading-[1.25] tracking-tight text-black sm:text-3xl lg:text-[2.15rem] xl:text-[2.45rem]">
            “Tired of wasting your entire Holiday morning waiting in line?”
          </h1>
          <p className="mt-6 max-w-md text-sm font-bold leading-relaxed text-black/80 sm:text-base sm:leading-relaxed">
            Don&apos;t let your clients feel this way. Streamline your bookings and eliminate walk-in chaos with Trimma.
          </p>
        </div>
      </div>

      <div className="flex flex-1 lg:ml-[50%] min-h-[100dvh] items-center justify-center bg-[#121212] p-6 sm:p-8 lg:p-12 trimma-dark-context">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center md:text-left">
            <h2 className="text-2xl font-bold tracking-tight text-white">Welcome back</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Sign in with Google to book appointments as a customer or manage your salon as an owner.
            </p>
          </div>

          {invitedEmail ? (
            <div className="rounded-xl border border-[#F5B700]/30 bg-[#F5B700]/10 px-4 py-3 text-sm text-[#F5B700]">
              You were invited as a salon owner. Sign in with Google using{" "}
              <span className="font-semibold">{invitedEmail}</span>.
            </div>
          ) : null}

          <div className="space-y-4">
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              className="h-12 w-full border-zinc-700 bg-[#1a1a1a] text-white hover:bg-[#252525] hover:text-white font-semibold"
              onClick={handleGoogleLogin}
            >
              <GoogleIcon />
              Continue with Google
            </Button>

            <p className="text-xs text-zinc-500 text-center leading-relaxed">
              For customers booking beauty &amp; wellness services, and salon owners managing their Trimma dashboard.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-[#1a1a1a] px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Partner portal</p>
            <p className="text-sm text-zinc-400 mt-2">
              Trimma Agent or Regional Head?{" "}
              <Link href="/agent/login" className="font-medium text-[#F5B700] hover:text-[#FFC947] hover:underline">
                Partner sign in
              </Link>
            </p>
          </div>

          <p className="text-center text-sm text-zinc-400">
            New to Trimma?{" "}
            <Link href="/signup" className="font-medium text-[#F5B700] hover:text-[#FFC947] hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
