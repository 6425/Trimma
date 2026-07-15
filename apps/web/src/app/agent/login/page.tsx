/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import React, { Suspense, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import Logo from "../../../components/Logo";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/config/supabase";
import { normalizeEmail } from "@/lib/normalize-email";
import { sanitizeNextPath } from "@/lib/auth-routes";
import {
  syncTrimmaSecureSession,
  redirectAfterAuth,
  resolveTrimmaUserRole,
} from "@/lib/trimma-role";
import { resolveAuthenticatedDestination } from "@/lib/post-auth";
import { resolveLoginRole } from "@/app/actions/login-session";
import type { Session } from "@supabase/supabase-js";
import type { TrimmaUserRole } from "@/lib/auth-routes";

const AGENT_LOGIN_HERO_IMAGE =
  "https://images.unsplash.com/photo-1556761175-b413da4baf72?q=80&w=2400&auto=format&fit=crop";

const PARTNER_ROLES: TrimmaUserRole[] = ["agent", "regional_head"];

export default function AgentLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[100dvh] flex items-center justify-center bg-[#121212] text-zinc-400">
          Loading…
        </div>
      }
    >
      <AgentLoginForm />
    </Suspense>
  );
}

function AgentLoginForm() {
  const [loading, setLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const searchParams = useSearchParams();
  const redirectTo = sanitizeNextPath(
    searchParams.get("redirectTo") ||
      searchParams.get("redirect") ||
      searchParams.get("next")
  );

  const completeSignIn = useCallback(
    async (session: Session, isCancelled: () => boolean) => {
      let role: TrimmaUserRole | null = null;

      try {
        const result = await resolveLoginRole(session.access_token);
        if (result.success) {
          role = result.role;
        }
      } catch (err) {
        console.warn("Server role resolution unavailable; using client fallback.", err);
      }

      if (!role) {
        role =
          (await resolveTrimmaUserRole(session.user.id, session.user.email)) ?? "customer";
      }

      if (isCancelled()) return;

      if (role === "admin") {
        await supabase.auth.signOut();
        alert("Admins must sign in at /admin/login with email and password.");
        setIsCheckingSession(false);
        return;
      }

      if (!PARTNER_ROLES.includes(role)) {
        await supabase.auth.signOut();
        alert("This portal is for Trimma Agents and Regional Heads only. Customers and salon owners should sign in at /login with Google.");
        setIsCheckingSession(false);
        return;
      }

      const sessionResult = await syncTrimmaSecureSession(session.access_token);
      if ("error" in sessionResult) {
        await supabase.auth.signOut();
        alert(sessionResult.error);
        setIsCheckingSession(false);
        return;
      }

      redirectAfterAuth(
        resolveAuthenticatedDestination({ role: sessionResult.role, nextPath: redirectTo })
      );
    },
    [redirectTo]
  );

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (error || !session?.access_token || cancelled) {
        if (!cancelled) setIsCheckingSession(false);
        return;
      }
      await completeSignIn(session, () => cancelled);
    });
    return () => {
      cancelled = true;
    };
  }, [completeSignIn]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const email = normalizeEmail((document.getElementById("email") as HTMLInputElement).value);
    const password = (document.getElementById("password") as HTMLInputElement).value;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setLoading(false);
      alert("Error signing in: " + error.message);
      return;
    }

    const session = data.session;
    if (!session?.access_token) {
      setLoading(false);
      alert("Sign-in succeeded but no session was returned. Please try again.");
      return;
    }

    try {
      await completeSignIn(session, () => false);
    } catch (err) {
      setLoading(false);
      console.error("Sign-in completion failed:", err);
      alert("Could not complete sign-in. Please try again.");
    }
  };

  if (isCheckingSession) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[#121212] text-zinc-400">
        <div className="flex flex-col items-center">
          <div className="w-8 h-8 border-4 border-[#FFFD40] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-semibold text-white/70">Authenticating...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col lg:flex-row bg-[#121212]">
      <div className="relative flex flex-col items-center justify-center px-6 py-12 sm:px-10 sm:py-16 lg:px-14 lg:py-20 min-h-[42vh] sm:min-h-[48vh] lg:h-[100dvh] lg:w-1/2 lg:fixed lg:top-0 lg:left-0 overflow-hidden">
        <div className="absolute inset-0 bg-[#FFFD40]" aria-hidden="true">
          <img
            src={AGENT_LOGIN_HERO_IMAGE}
            alt=""
            className="h-full w-full object-cover object-center grayscale opacity-15 mix-blend-multiply scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#FFFD40]/40 via-[#FFFD40]/70 to-[#FFFD40]/95" />
        </div>

        <Link
          href="/"
          className="absolute left-6 top-6 z-20 hover:opacity-90 transition-opacity sm:left-10 sm:top-8 lg:left-14 lg:top-10"
        >
          <Logo iconSize={40} variant="dark" />
        </Link>

        <div className="relative z-10 flex w-full max-w-xl flex-col items-center text-center pt-14 sm:pt-16 lg:pt-0">
          <h1 className="font-heading text-[1.65rem] font-bold leading-[1.25] tracking-tight text-black sm:text-3xl lg:text-[2.15rem] xl:text-[2.45rem]">
            Grow salons. Manage territories. Track commissions.
          </h1>
          <p className="mt-6 max-w-md text-sm font-bold leading-relaxed text-black/80 sm:text-base sm:leading-relaxed">
            The Trimma partner portal for field agents and regional heads — onboard salons, manage leads, and monitor performance.
          </p>
        </div>
      </div>

      <div className="flex flex-1 lg:ml-[50%] min-h-[100dvh] items-center justify-center bg-[#121212] p-6 sm:p-8 lg:p-12 trimma-dark-context">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center md:text-left">
            <h2 className="text-2xl font-bold tracking-tight text-white">Partner sign in</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Email login for Trimma Agents and Regional Heads. Use the email and password issued by your Trimma administrator.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-zinc-300">
                  Email address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="agent@trimma.io"
                  required
                  className="h-11 border-zinc-700 bg-[#1a1a1a] text-white placeholder:text-zinc-500 focus-visible:border-[#FFFD40] focus-visible:ring-[#FFFD40]/30"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-zinc-300">
                    Password
                  </Label>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-medium text-[#FFFD40] hover:text-[#FFFE73] hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  className="h-11 border-zinc-700 bg-[#1a1a1a] text-white placeholder:text-zinc-500 focus-visible:border-[#FFFD40] focus-visible:ring-[#FFFD40]/30"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="h-11 w-full rounded-md bg-[#FFFD40] text-black hover:bg-[#FFFE73] hover:text-black font-bold disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <p className="text-center text-sm text-zinc-400">
            Customer or salon owner?{" "}
            <Link href="/login" className="font-medium text-[#FFFD40] hover:text-[#FFFE73] hover:underline">
              Sign in with Google
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
