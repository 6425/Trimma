"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { Suspense } from "react";
import { Button } from "@/components/ui/button";
import Logo from "../../components/Logo";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/config/supabase";
import { normalizeEmail } from "@/lib/normalize-email";
import { sanitizeNextPath } from "@/lib/auth-routes";

const LOGIN_HERO_IMAGE =
  "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?q=80&w=2400&auto=format&fit=crop";

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const invitedEmail = normalizeEmail(searchParams.get("email"));
  const redirectTo = sanitizeNextPath(
    searchParams.get("redirectTo") ||
      searchParams.get("redirect") ||
      searchParams.get("next")
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = normalizeEmail((document.getElementById("email") as HTMLInputElement).value);
    const password = (document.getElementById("password") as HTMLInputElement).value;

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Error signing in:", error.message);
      alert("Error signing in: " + error.message);
      return;
    }

    const callbackPath = redirectTo
      ? `/auth/callback?next=${encodeURIComponent(redirectTo)}`
      : "/auth/callback";
    router.push(callbackPath);
  };

  const handleGoogleLogin = async () => {
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
      console.error("Error with Google login:", error.message);
      alert("Google sign-in failed: " + error.message);
    }
  };

  return (
    <div className="min-h-[100dvh] grid grid-cols-1 lg:grid-cols-2">
      {/* Left Panel */}
      <div className="relative flex flex-col items-center justify-center px-6 py-12 sm:px-10 sm:py-16 lg:px-14 lg:py-20 min-h-[42vh] sm:min-h-[48vh] lg:min-h-[100dvh] overflow-hidden">
        <div className="absolute inset-0 bg-[#F5B700]" aria-hidden="true">
          <img
            src={LOGIN_HERO_IMAGE}
            alt=""
            className="h-full w-full object-cover object-center grayscale opacity-40 mix-blend-multiply scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#F5B700]/60 via-[#F5B700]/70 to-[#F5B700]/90" />
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
          <p className="mt-6 max-w-md text-sm font-medium leading-relaxed text-black/80 sm:text-base sm:leading-relaxed">
            Don't let your clients feel this way. Streamline your bookings and eliminate walk-in chaos with Trimma.
          </p>
        </div>
      </div>

      {/* Right — login form (logic unchanged, dark theme colors only) */}
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#121212] p-6 sm:p-8 lg:p-12 trimma-dark-context">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center md:text-left">
            <h2 className="text-2xl font-bold tracking-tight text-white">Welcome back</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Sign in for customers, salon owners, and agents. Use email/password or Google.
            </p>
          </div>

          {invitedEmail ? (
            <div className="rounded-xl border border-[#F5B700]/30 bg-[#F5B700]/10 px-4 py-3 text-sm text-[#F5B700]">
              You were invited as a salon owner. Sign in with Google using{" "}
              <span className="font-semibold">{invitedEmail}</span>.
            </div>
          ) : null}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-zinc-300">
                  Email address
                </Label>
                <Input
                  id="email"
                  type="email"
                  defaultValue={invitedEmail}
                  placeholder="owner@salon.com"
                  required
                  className="h-11 border-zinc-700 bg-[#1a1a1a] text-white placeholder:text-zinc-500 focus-visible:border-[#F5B700] focus-visible:ring-[#F5B700]/30"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-zinc-300">
                    Password
                  </Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  className="h-11 border-zinc-700 bg-[#1a1a1a] text-white placeholder:text-zinc-500 focus-visible:border-[#F5B700] focus-visible:ring-[#F5B700]/30"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="h-11 w-full rounded-md bg-[#F5B700] text-black hover:bg-[#FFC947] hover:text-black"
            >
              Sign in
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-[#121212] px-2 text-zinc-500">Or continue with</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="h-11 w-full border-zinc-700 bg-[#1a1a1a] text-white hover:bg-[#252525] hover:text-white"
              onClick={handleGoogleLogin}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
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
              Google
            </Button>
          </form>

          <div className="text-center text-sm text-zinc-400">
            <p>
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="font-medium text-[#F5B700] hover:text-[#FFC947] hover:underline">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
