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

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-white text-zinc-500">Loading…</div>}>
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
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="hidden md:flex bg-zinc-900 text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-20">
          <img
            src="https://images.unsplash.com/photo-1522337660859-02fbefca4702?q=80&w=2938&auto=format&fit=crop"
            className="w-full h-full object-cover"
            alt="bg"
          />
        </div>
        <div className="relative z-10">
          <Link href="/" className="hover:opacity-90 transition-opacity">
            <Logo showTagline={true} inverse={true} />
          </Link>
        </div>
        <div className="relative z-10 max-w-md">
          <h1 className="text-4xl font-semibold tracking-tight mb-4 leading-tight">
            The operating system for modern salons.
          </h1>
          <p className="text-zinc-400">Manage bookings, staff, and payments seamlessly with Trimma.</p>
        </div>
      </div>

      <div className="flex items-center justify-center p-8 bg-white text-zinc-900">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center md:text-left">
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Welcome back</h2>
            <p className="text-sm text-zinc-500 mt-2">
              Sign in for customers, salon owners, and agents. Use email/password or Google.
            </p>
          </div>

          {invitedEmail ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              You were invited as a salon owner. Sign in with Google using{" "}
              <span className="font-semibold">{invitedEmail}</span>.
            </div>
          ) : null}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-zinc-900">
                  Email address
                </Label>
                <Input
                  id="email"
                  type="email"
                  defaultValue={invitedEmail}
                  placeholder="owner@salon.com"
                  required
                  className="h-11 bg-white text-zinc-900 border-zinc-200 placeholder:text-zinc-400 focus-visible:ring-zinc-900 focus-visible:border-zinc-900"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-zinc-900">
                    Password
                  </Label>
                  <a href="#" className="text-xs text-zinc-500 hover:text-zinc-900">
                    Forgot password?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  className="h-11 bg-white text-zinc-900 border-zinc-200 placeholder:text-zinc-400 focus-visible:ring-zinc-900 focus-visible:border-zinc-900"
                />
              </div>
            </div>

            <Button type="submit" className="w-full h-11 bg-zinc-900 hover:bg-zinc-800 text-white rounded-md">
              Sign in
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-zinc-500">Or continue with</span>
              </div>
            </div>

            <Button type="button" variant="outline" className="w-full h-11 border-zinc-200" onClick={handleGoogleLogin}>
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
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

          <div className="text-center text-sm text-zinc-500 space-y-2">
            <p>
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-zinc-900 font-medium hover:underline">
                Create an account
              </Link>
            </p>
            <p>
              Platform admin?{" "}
              <Link href="/admin/login" className="text-zinc-900 font-medium hover:underline">
                Admin login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
