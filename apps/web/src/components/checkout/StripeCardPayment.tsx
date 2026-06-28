"use client";

import { memo, useMemo, useState } from "react";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getStripePromise } from "@/lib/stripe-js-client";
import type { CheckoutCustomerDetails } from "./StripeCheckoutCustomerForm";

const ACCEPTED_CARD_BRANDS = [
  { src: "/payments/visa.svg", alt: "Visa" },
  { src: "/payments/mastercard.svg", alt: "Mastercard" },
  { src: "/payments/amex.svg", alt: "American Express" },
] as const;

function AcceptedCardBrands() {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-3">
      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mr-1">
        Accepted
      </span>
      {ACCEPTED_CARD_BRANDS.map((brand) => (
        <img
          key={brand.alt}
          src={brand.src}
          alt={brand.alt}
          className="h-6 w-auto object-contain"
        />
      ))}
    </div>
  );
}

type StripePaymentFieldsProps = {
  onPaymentError?: (message: string) => void;
};

function StripePaymentFields({ onPaymentError }: StripePaymentFieldsProps) {
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  return (
    <div className="trimma-stripe-payment-shell relative min-h-[280px] w-full">
      {!ready && !loadError ? (
        <div
          className="absolute inset-0 z-0 flex flex-col items-center justify-center gap-2 rounded-lg bg-white text-sm text-zinc-500"
          aria-live="polite"
        >
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading card form…
        </div>
      ) : null}

      {loadError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          {loadError}
        </div>
      ) : (
        <div className={ready ? "relative z-10 w-full" : "relative z-10 w-full opacity-0 pointer-events-none"}>
          <PaymentElement
            onReady={() => setReady(true)}
            onLoadError={(event) => {
              const message =
                event.error?.message || "Could not load the secure card form. Please refresh and try again.";
              setLoadError(message);
              onPaymentError?.(message);
            }}
            options={{
              layout: "tabs",
              wallets: {
                applePay: "never",
                googlePay: "never",
                link: "never",
              },
            }}
          />
        </div>
      )}
    </div>
  );
}

type StripePayButtonProps = {
  returnUrl: string;
  customerDetails: CheckoutCustomerDetails;
  amountLabel: string;
  disabled?: boolean;
  onPaymentError?: (message: string) => void;
  onBeforePay?: () => Promise<void>;
};

function StripePayButton({
  returnUrl,
  customerDetails,
  amountLabel,
  disabled,
  onPaymentError,
  onBeforePay,
}: StripePayButtonProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handlePay = async () => {
    if (!stripe || !elements) return;

    const name = `${customerDetails.firstName} ${customerDetails.lastName}`.trim();
    if (!customerDetails.email?.trim() || !name) {
      const message = "Enter your name and email before paying.";
      setLocalError(message);
      onPaymentError?.(message);
      return;
    }
    if (!customerDetails.phone?.trim()) {
      const message = "Enter your phone number before paying (used for booking alerts).";
      setLocalError(message);
      onPaymentError?.(message);
      return;
    }

    setProcessing(true);
    setLocalError(null);

    try {
      if (onBeforePay) {
        await onBeforePay();
      }

      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: returnUrl,
        },
      });

      if (error) {
        const message = error.message || "Payment failed.";
        setLocalError(message);
        onPaymentError?.(message);
        setProcessing(false);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Payment failed.";
      setLocalError(message);
      onPaymentError?.(message);
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-3">
      {localError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          {localError}
        </div>
      ) : null}
      <Button
        type="button"
        disabled={disabled || processing || !stripe || !elements}
        onClick={() => void handlePay()}
        className="w-full h-12 rounded-xl bg-zinc-900 text-white font-bold hover:bg-zinc-800 shadow-md"
      >
        {processing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing…
          </>
        ) : (
          <>
            <Lock className="w-4 h-4 mr-2" />
            Pay {amountLabel}
          </>
        )}
      </Button>
    </div>
  );
}

type StripeCardCheckoutProps = {
  publishableKey: string;
  clientSecret: string;
  returnUrl: string;
  customerDetails: CheckoutCustomerDetails;
  amountLabel: string;
  customerForm: React.ReactNode;
  onPaymentError?: (message: string) => void;
  onBeforePay?: () => Promise<void>;
};

const StripeCardCheckout = memo(function StripeCardCheckout({
  publishableKey,
  clientSecret,
  returnUrl,
  customerDetails,
  amountLabel,
  customerForm,
  onPaymentError,
  onBeforePay,
}: StripeCardCheckoutProps) {
  const stripePromise = useMemo(() => getStripePromise(publishableKey), [publishableKey]);
  const elementsOptions = useMemo(
    () => ({
      clientSecret,
      appearance: { theme: "stripe" as const },
      loader: "auto" as const,
    }),
    [clientSecret]
  );

  if (!publishableKey || !clientSecret) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        Stripe checkout is not ready. Check payment gateway settings.
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={elementsOptions}>
      <div className="space-y-8">
        <section>
          <AcceptedCardBrands />
          <div className="rounded-xl border border-slate-200 bg-white p-4 overflow-visible">
            <StripePaymentFields onPaymentError={onPaymentError} />
          </div>
          <p className="mt-2 text-[11px] text-zinc-500">
            Visa, Mastercard, and American Express are accepted through Stripe.
          </p>
        </section>

        {customerForm}

        <StripePayButton
          returnUrl={returnUrl}
          customerDetails={customerDetails}
          amountLabel={amountLabel}
          onPaymentError={onPaymentError}
          onBeforePay={onBeforePay}
        />
      </div>
    </Elements>
  );
});

export { StripeCardCheckout };

export function StripeCheckoutLoading() {
  return (
    <div className="trimma-stripe-payment-shell flex min-h-[280px] flex-col items-center justify-center gap-2 py-10 text-sm text-zinc-500">
      <Loader2 className="w-5 h-5 animate-spin" />
      Loading secure card form…
    </div>
  );
}
