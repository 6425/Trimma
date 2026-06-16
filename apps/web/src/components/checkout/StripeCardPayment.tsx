"use client";

import { useMemo, useState } from "react";
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
};

function StripePayButton({
  returnUrl,
  customerDetails,
  amountLabel,
  disabled,
  onPaymentError,
}: StripePayButtonProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handlePay = async () => {
    if (!stripe || !elements) return;

    const name = `${customerDetails.firstName} ${customerDetails.lastName}`.trim();
    if (!customerDetails.email || !name) {
      const message = "Enter your name and email before paying.";
      setLocalError(message);
      onPaymentError?.(message);
      return;
    }

    setProcessing(true);
    setLocalError(null);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: returnUrl,
        payment_method_data: {
          billing_details: {
            name,
            email: customerDetails.email,
            phone: customerDetails.phone || undefined,
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
};

export function StripeCardCheckout({
  publishableKey,
  clientSecret,
  returnUrl,
  customerDetails,
  amountLabel,
  customerForm,
  onPaymentError,
}: StripeCardCheckoutProps) {
  const stripePromise = useMemo(() => getStripePromise(publishableKey), [publishableKey]);

  if (!publishableKey || !clientSecret) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        Stripe checkout is not ready. Check payment gateway settings.
      </div>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: { theme: "stripe" },
        loader: "auto",
      }}
    >
      <div className="space-y-8">
        <section>
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
        />
      </div>
    </Elements>
  );
}

export function StripeCheckoutLoading() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-sm text-zinc-500">
      <Loader2 className="w-4 h-4 animate-spin" />
      Loading secure card form…
    </div>
  );
}
