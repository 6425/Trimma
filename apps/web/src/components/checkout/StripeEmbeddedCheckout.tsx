"use client";

import { useState } from "react";
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { Loader2 } from "lucide-react";

type StripeEmbeddedCheckoutProps = {
  publishableKey: string;
  clientSecret: string;
};

export function StripeEmbeddedCheckoutPanel({
  publishableKey,
  clientSecret,
}: StripeEmbeddedCheckoutProps) {
  const [stripePromise] = useState<Promise<Stripe | null>>(() => loadStripe(publishableKey));

  if (!publishableKey || !clientSecret) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        Stripe checkout is not ready. Check payment gateway settings.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <EmbeddedCheckoutProvider
        stripe={stripePromise}
        options={{ clientSecret }}
      >
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}

export function StripeCheckoutLoading() {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-sm text-zinc-500">
      <Loader2 className="w-4 h-4 animate-spin" />
      Loading secure Stripe checkout…
    </div>
  );
}
