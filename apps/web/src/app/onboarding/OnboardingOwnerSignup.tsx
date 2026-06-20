"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/config/supabase";
import {
  completeSalonOwnerGoogleSession,
  startSalonOwnerGoogleOAuth,
} from "@/lib/salon-owner-oauth";
import { markOnboardingSalonOwnerIntent } from "@/lib/salon-owner-oauth-intent";

function GoogleIcon() {
  return (
    <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
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

export default function OnboardingOwnerSignup() {
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    markOnboardingSalonOwnerIntent();
    let cancelled = false;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (cancelled) return;

      if (!session?.access_token) {
        setCheckingSession(false);
        return;
      }

      setLoading(true);
      const result = await completeSalonOwnerGoogleSession(session);
      if (cancelled) return;

      if (!result.ok) {
        alert(result.error || "Could not open your salon dashboard. Please try again.");
        setLoading(false);
      }

      setCheckingSession(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleGoogleSignup = async () => {
    setLoading(true);
    const result = await startSalonOwnerGoogleOAuth();
    if (!result.ok) {
      alert(result.error || "Google sign-in failed.");
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
        <p className="text-sm text-zinc-500">Opening your salon dashboard…</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 text-center">
      <div className="space-y-3">
        <h3 className="text-2xl font-extrabold text-zinc-900">Start with Google</h3>
        <p className="text-zinc-600 max-w-xl mx-auto leading-relaxed">
          Sign in with Google to open your salon owner dashboard. Complete operational details, business information,
          and bank verification documents, then submit for your Trimma agent to review before bookings go live.
        </p>
      </div>

      <Button
        type="button"
        disabled={loading}
        onClick={handleGoogleSignup}
        className="h-14 w-full max-w-md mx-auto rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-base shadow-lg"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <GoogleIcon />
            Continue with Google — Salon Dashboard
          </>
        )}
      </Button>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left max-w-2xl mx-auto">
        {[
          { step: "1", title: "Operational details", body: "Services, staff, hours, photos — submit for booking approval." },
          { step: "2", title: "Business & bank info", body: "Legal details, settlement account, NIC/BR documents." },
          { step: "3", title: "Agent & admin review", body: "Your Trimma agent enables bookings and sends your salon to admin for final verification." },
        ].map((item) => (
          <div key={item.step} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-black uppercase tracking-wider text-brand-pink mb-2">Step {item.step}</div>
            <p className="font-bold text-zinc-900 text-sm mb-1">{item.title}</p>
            <p className="text-xs text-zinc-500 leading-relaxed">{item.body}</p>
          </div>
        ))}
      </div>

      <p className="text-xs text-zinc-500">
        Already invited by a Trimma agent? Use the same Google email from your invitation.{" "}
        <Link
          href="/login?redirectTo=/dashboard/profile&intent=salon-owner"
          className="font-semibold text-zinc-800 underline"
        >
          Salon owner sign in
        </Link>
      </p>
    </div>
  );
}
