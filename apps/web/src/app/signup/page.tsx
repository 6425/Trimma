/* eslint-disable @next/next/no-img-element */
"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import Logo from "../../components/Logo";
import { supabase } from "../../config/supabase";

const SIGNUP_HERO_IMAGE =
  "https://images.unsplash.com/photo-1522337660859-02fbefca4702?q=80&w=2400&auto=format&fit=crop";

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

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[100dvh] flex items-center justify-center bg-[#121212] text-zinc-400">
          Loading…
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  );
}

function SignupForm() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<"customer" | "salon">(() =>
    searchParams.get("role") === "salon_owner" ? "salon" : "customer"
  );
  const [loading, setLoading] = useState(false);

  const handleGoogleSignup = async () => {
    setLoading(true);
    const nextPath = activeTab === "salon" ? "/onboarding" : "/customer";
    const oauthRedirect = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: oauthRedirect,
      },
    });

    if (error) {
      setLoading(false);
      alert("Google sign-up failed: " + error.message);
    }
  };

  const isSalonTab = activeTab === "salon";

  return (
    <div className="min-h-[100dvh] flex flex-col lg:flex-row bg-[#121212]">
      <div className="relative flex flex-col items-center justify-center px-6 py-12 sm:px-10 sm:py-16 lg:px-14 lg:py-20 min-h-[42vh] sm:min-h-[48vh] lg:h-[100dvh] lg:w-1/2 lg:fixed lg:top-0 lg:left-0 overflow-hidden">
        <div className="absolute inset-0 bg-[#F5B700]" aria-hidden="true">
          <img
            src={SIGNUP_HERO_IMAGE}
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
            Join the premium beauty marketplace.
          </h1>
          <p className="mt-6 max-w-md text-sm font-medium leading-relaxed text-black/80 sm:text-base sm:leading-relaxed">
            {isSalonTab
              ? "Grow your business, manage staff, and get more bookings with our modern salon OS."
              : "Discover top-rated salons, manage bookings, and elevate your personal style."}
          </p>
        </div>
      </div>

      <div className="flex flex-1 lg:ml-[50%] min-h-[100dvh] items-center justify-center bg-[#121212] p-6 sm:p-8 lg:p-12 trimma-dark-context">
        <div className="w-full max-w-md space-y-8 my-8">
          <div className="text-center sm:text-left">
            <h2 className="text-2xl font-bold tracking-tight text-white">Create an account</h2>
            <p className="text-sm text-zinc-400 mt-2">Get started with Trimma today.</p>
          </div>

          <div className="bg-[#1a1a1a] p-1 rounded-xl flex border border-zinc-800">
            <button
              type="button"
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
                activeTab === "customer"
                  ? "bg-[#252525] text-white shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
              onClick={() => setActiveTab("customer")}
            >
              Customer
            </button>
            <button
              type="button"
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
                activeTab === "salon"
                  ? "bg-[#252525] text-white shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
              onClick={() => setActiveTab("salon")}
            >
              Salon Owner
            </button>
          </div>

          <div className="space-y-6">
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex flex-col items-center justify-center space-y-4 py-6 text-center">
                <div className="w-16 h-16 bg-[#1a1a1a] rounded-full flex items-center justify-center border border-zinc-800 mb-2">
                  <svg className="w-8 h-8" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-white">Sign up with Google</h3>
                <p className="text-sm text-zinc-400 max-w-xs">
                  {isSalonTab
                    ? "Create your salon owner account with Google, then complete your salon profile and go live on Trimma."
                    : "Quickly create your customer account using your Google account. No passwords to remember."}
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              disabled={loading}
              className="h-12 w-full border-zinc-700 bg-[#1a1a1a] text-white hover:bg-[#252525] hover:text-white font-semibold"
              onClick={handleGoogleSignup}
            >
              <GoogleIcon />
              {loading ? "Redirecting…" : "Continue with Google"}
            </Button>

            <p className="text-xs text-zinc-500 text-center leading-relaxed">
              {isSalonTab
                ? "For salon owners listing and managing their business on Trimma."
                : "For customers booking beauty and wellness services."}
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-[#1a1a1a] px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Partner portal</p>
            <p className="text-sm text-zinc-400 mt-2">
              Trimma Agent or Regional Head?{" "}
              <Link
                href="/agent/login"
                className="font-medium text-[#F5B700] hover:text-[#FFC947] hover:underline"
              >
                Partner portal login
              </Link>
            </p>
          </div>

          <div className="text-center text-sm text-zinc-400">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-[#F5B700] hover:text-[#FFC947] hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
