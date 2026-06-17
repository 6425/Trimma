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
          payment_method_data: {
            billing_details: {
              name,
              email: customerDetails.email.trim(),
              phone: customerDetails.phone.trim(),
              address: {
                line1: customerDetails.address || undefined,
                city: customerDetails.city || undefined,
                country: customerDetails.country || undefined,
              },
            },
          },
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

type StripePaymentSectionProps = {
  publishableKey: string;
  clientSecret: string;
  returnUrl: string;
  customerDetails: CheckoutCustomerDetails;
  amountLabel: string;
  onPaymentError?: (message: string) => void;
  onBeforePay?: () => Promise<void>;
};

const StripePaymentSection = memo(function StripePaymentSection({
  publishableKey,
  clientSecret,
  returnUrl,
  customerDetails,
  amountLabel,
  onPaymentError,
  onBeforePay,
}: StripePaymentSectionProps) {
  const stripePromise = useMemo(() => getStripePromise(publishableKey), [publishableKey]);
  const elementsOptions = useMemo(
    () => ({
      clientSecret,
      appearance: { theme: "stripe" as const },
      loader: "auto" as const,
    }),
    [clientSecret]
  );

  return (
    <Elements stripe={stripePromise} options={elementsOptions}>
      <div className="space-y-4">
        <AcceptedCardBrands />
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <PaymentElement
            options={{
              layout: "accordion",
              wallets: {
                applePay: "never",
                googlePay: "never",
              },
              fields: {
                billingDetails: "never",
              },
            }}
          />
        </div>
        <p className="text-[11px] text-zinc-500">
          Visa, Mastercard, and American Express are accepted through Stripe.
        </p>
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

type StripeCardCheckoutProps = {
  publishableKey: string;
  clientSecret: string;
  returnUrl: string;
  customerDetails: CheckoutCustomerDetails;
  amountLabel: string;
  onPaymentError?: (message: string) => void;
  onBeforePay?: () => Promise<void>;
};

/** @deprecated Use StripePaymentSection — kept for compatibility */
export function StripeCardCheckout(props: StripeCardCheckoutProps) {
  return <StripePaymentSection {...props} />;
}

export { StripePaymentSection };

export function StripeCheckoutLoading() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-sm text-zinc-500">
      <Loader2 className="w-4 h-4 animate-spin" />
      Loading secure card form…
    </div>
  );
}
