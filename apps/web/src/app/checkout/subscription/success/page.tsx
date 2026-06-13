"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";

function SubscriptionSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId =
    searchParams.get("payment_intent") || searchParams.get("session_id");
  const [loading, setLoading] = useState(Boolean(sessionId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    void Promise.resolve().then(async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/checkout/stripe/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || "Failed to finalize subscription.");
        }

        router.replace(
          `/dashboard/billing?payment_success=true&sub_order=${encodeURIComponent(result.orderId || "")}&plan=${encodeURIComponent(result.planName || "")}`
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to finalize subscription.");
        setLoading(false);
      }
    });
  }, [sessionId, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f9fafb] p-6 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-900 mb-4" />
        <p className="text-sm text-zinc-500 font-medium">Confirming your Stripe payment…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f9fafb] p-6 text-center">
        <p className="text-lg font-semibold text-zinc-900 mb-2">Payment received, activation pending</p>
        <p className="text-sm text-zinc-500 mb-6 max-w-md">{error}</p>
        <Link href="/dashboard/billing" className="text-sm font-bold text-zinc-900 underline">
          Back to billing
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f9fafb] p-6 font-sans">
      <div className="w-full max-w-md bg-white border border-slate-100 rounded-[32px] shadow-xl p-8 text-center space-y-4">
        <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
        <p className="text-sm text-zinc-500">Redirecting to billing…</p>
      </div>
    </div>
  );
}

export default function SubscriptionCheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#f9fafb]">
          <Loader2 className="w-8 h-8 animate-spin text-zinc-900" />
        </div>
      }
    >
      <SubscriptionSuccessContent />
    </Suspense>
  );
}
