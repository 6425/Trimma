"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { Suspense, useEffect, useState } from "react";
import { ArrowLeft, Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Logo from "../../components/Logo";
import { supabase } from "@/config/supabase";
import { canUseEmailPassword, getAuthProviders } from "@/lib/auth-providers";

function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function verifyRecoverySession() {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          window.history.replaceState(null, "", "/reset-password");
        }

        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        const user = data.session?.user;
        if (!user) {
          setSessionError("Your reset link is invalid or has expired. Request a new one.");
          return;
        }

        const providers = getAuthProviders(user);
        if (providers.includes("google") && !providers.includes("email")) {
          setSessionError("This account uses Google sign-in only. Password reset is not available.");
          await supabase.auth.signOut();
          return;
        }

        if (!canUseEmailPassword(user)) {
          setSessionError("Password reset is not available for this account.");
          await supabase.auth.signOut();
        }
      } catch (err) {
        if (!cancelled) {
          setSessionError(
            err instanceof Error ? err.message : "Could not verify your reset link."
          );
        }
      } finally {
        if (!cancelled) setCheckingSession(false);
      }
    }

    void verifyRecoverySession();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (password.length < 6) {
      setSubmitError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setSubmitError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      await supabase.auth.signOut();
      setSuccess(true);
      window.setTimeout(() => router.push("/login"), 2500);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Could not update password.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#121212] text-zinc-400">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-[#ffc800]" />
        Verifying reset link…
      </div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#121212] p-6 sm:p-8 trimma-dark-context">
      <div className="w-full max-w-sm space-y-8">
        <Link href="/" className="inline-block hover:opacity-90 transition-opacity">
          <Logo inverse iconSize={36} />
        </Link>

        {sessionError ? (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Reset unavailable</h1>
              <p className="mt-2 text-sm text-zinc-400">{sessionError}</p>
            </div>
            <Link
              href="/forgot-password"
              className="inline-flex items-center gap-2 text-sm font-medium text-[#ffc800] hover:text-[#ffd633]"
            >
              Request a new reset link
            </Link>
          </div>
        ) : success ? (
          <div className="space-y-6">
            <div className="rounded-xl border border-[#ffc800]/30 bg-[#ffc800]/10 px-4 py-4 text-sm text-[#ffc800]">
              Your password has been updated. Redirecting you to sign in…
            </div>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm font-medium text-[#ffc800] hover:text-[#ffd633]"
            >
              Go to sign in now
            </Link>
          </div>
        ) : (
          <>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Choose a new password</h1>
              <p className="mt-2 text-sm text-zinc-400">
                Enter a new password for your email/password Trimma account.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-zinc-300">
                    New password
                  </Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      autoComplete="new-password"
                      className="h-11 border-zinc-700 bg-[#1a1a1a] pl-10 pr-10 text-white placeholder:text-zinc-500 focus-visible:border-[#ffc800] focus-visible:ring-[#ffc800]/30"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-zinc-300">
                    Confirm password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className="h-11 border-zinc-700 bg-[#1a1a1a] text-white placeholder:text-zinc-500 focus-visible:border-[#ffc800] focus-visible:ring-[#ffc800]/30"
                  />
                </div>
              </div>

              {submitError ? (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {submitError}
                </div>
              ) : null}

              <Button
                type="submit"
                disabled={loading}
                className="h-11 w-full rounded-md bg-[#ffc800] text-black hover:bg-[#ffd633] hover:text-black"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating…
                  </>
                ) : (
                  "Update password"
                )}
              </Button>

              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-[#ffc800]"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to sign in
              </Link>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[100dvh] items-center justify-center bg-[#121212] text-zinc-400">
          Loading…
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
