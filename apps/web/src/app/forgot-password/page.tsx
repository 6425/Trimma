"use client";

import Link from "next/link";
import React, { useState } from "react";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Logo from "../../components/Logo";
import { normalizeEmail } from "@/lib/normalize-email";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const normalized = normalizeEmail(email);
    if (!normalized) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/auth/request-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalized }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not send reset email.");
      }

      setSuccessMessage(result.message || "Check your inbox for a password reset link.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#121212] p-6 sm:p-8 trimma-dark-context">
      <div className="w-full max-w-sm space-y-8">
        <Link href="/" className="inline-block hover:opacity-90 transition-opacity">
          <Logo inverse iconSize={36} />
        </Link>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Reset your password</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Enter the email address for your Trimma account. We&apos;ll send a reset link for
            email/password accounts. Google-only accounts cannot use this flow.
          </p>
        </div>

        {successMessage ? (
          <div className="space-y-6">
            <div className="rounded-xl border border-[#F5B700]/30 bg-[#F5B700]/10 px-4 py-4 text-sm text-[#F5B700]">
              {successMessage}
            </div>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm font-medium text-[#F5B700] hover:text-[#FFC947]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-zinc-300">
                Email address
              </Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="owner@salon.com"
                  required
                  autoComplete="email"
                  className="h-11 border-zinc-700 bg-[#1a1a1a] pl-10 text-white placeholder:text-zinc-500 focus-visible:border-[#F5B700] focus-visible:ring-[#F5B700]/30"
                />
              </div>
            </div>

            {error ? (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            ) : null}

            <Button
              type="submit"
              disabled={loading}
              className="h-11 w-full rounded-md bg-[#F5B700] text-black hover:bg-[#FFC947] hover:text-black"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending link…
                </>
              ) : (
                "Send reset link"
              )}
            </Button>

            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-[#F5B700]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to sign in
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
