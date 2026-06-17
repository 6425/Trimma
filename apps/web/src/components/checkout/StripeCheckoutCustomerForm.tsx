"use client";

import { Loader2, Lock, ShieldCheck, CreditCard } from "lucide-react";
import { LkPhoneInput } from "@/components/ui/LkPhoneInput";
import { StripePaymentSection, StripeCheckoutLoading } from "./StripeCardPayment";

export type CheckoutCustomerDetails = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
};

type StripeCheckoutCustomerFormProps = {
  customerDetails: CheckoutCustomerDetails;
  setCustomerDetails: React.Dispatch<React.SetStateAction<CheckoutCustomerDetails>>;
  stripeLoading: boolean;
  stripeError: string | null;
  stripeEnabled: boolean;
  stripeEnvironment: string;
  stripeClientSecret: string | null;
  stripePublishableKey: string | null;
  returnUrl: string;
  amountLabel: string;
  onPaymentError?: (message: string) => void;
  onBeforePay?: () => Promise<void>;
};

export function StripeCheckoutCustomerForm({
  customerDetails,
  setCustomerDetails,
  stripeLoading,
  stripeError,
  stripeEnabled,
  stripeEnvironment,
  stripeClientSecret,
  stripePublishableKey,
  returnUrl,
  amountLabel,
  onPaymentError,
  onBeforePay,
}: StripeCheckoutCustomerFormProps) {
  if (!stripeEnabled) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        Stripe payments are temporarily disabled. Please contact support or try again later.
      </div>
    );
  }

  const stripeReady = Boolean(stripeClientSecret && stripePublishableKey && !stripeLoading);

  return (
    <div className="space-y-6">
      <section>
        <div className="mb-2 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-zinc-700" />
          <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wide">Payment details</h2>
        </div>
        <p className="text-xs text-zinc-500 mb-4">
          Card details are entered securely via Stripe. Trimma never stores your card number.
        </p>

        {stripeError ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 mb-4">
            {stripeError}
          </div>
        ) : null}

        {!stripeReady ? (
          <StripeCheckoutLoading />
        ) : (
          <StripePaymentSection
            key={stripeClientSecret}
            publishableKey={stripePublishableKey!}
            clientSecret={stripeClientSecret!}
            returnUrl={returnUrl}
            customerDetails={customerDetails}
            amountLabel={amountLabel}
            onPaymentError={onPaymentError}
            onBeforePay={onBeforePay}
          />
        )}
      </section>

      <section>
        <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wide mb-4">
          Your details (for booking)
        </h2>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="checkout-email">
            Email
          </label>
          <input
            className="checkout-input w-full rounded-md px-3 py-2.5 text-sm placeholder-gray-400"
            type="email"
            id="checkout-email"
            placeholder="john@example.com"
            value={customerDetails.email}
            onChange={(e) => setCustomerDetails({ ...customerDetails, email: e.target.value })}
            required
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
          <div className="rounded-md shadow-sm">
            <input
              className="checkout-input input-group-top w-full rounded-t-md px-3 py-2.5 text-sm placeholder-gray-400"
              type="text"
              placeholder="First name"
              value={customerDetails.firstName}
              onChange={(e) => setCustomerDetails({ ...customerDetails, firstName: e.target.value })}
              required
            />
            <input
              className="checkout-input input-group-bottom w-full rounded-b-md px-3 py-2.5 text-sm placeholder-gray-400"
              type="text"
              placeholder="Last name"
              value={customerDetails.lastName}
              onChange={(e) => setCustomerDetails({ ...customerDetails, lastName: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="checkout-phone">
            Phone number
          </label>
          <LkPhoneInput
            id="checkout-phone"
            value={customerDetails.phone}
            onChange={(phone) => setCustomerDetails({ ...customerDetails, phone })}
            required
          />
        </div>

        <div className="mb-2">
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="checkout-country">
            Country or region
          </label>
          <select
            className="checkout-input w-full rounded-md px-3 py-2.5 text-sm text-gray-700 bg-white"
            id="checkout-country"
            value={customerDetails.country}
            onChange={(e) => setCustomerDetails({ ...customerDetails, country: e.target.value })}
            required
          >
            <option value="LK">Sri Lanka</option>
            <option value="US">United States</option>
            <option value="GB">United Kingdom</option>
            <option value="IN">India</option>
          </select>
        </div>
      </section>

      <div className="flex flex-col items-center gap-3 text-xs text-gray-500 font-medium pt-2">
        <div className="flex items-center gap-2">
          <Lock className="w-3.5 h-3.5 shrink-0" />
          <span>Payments are secure and encrypted via Stripe</span>
        </div>
        <div className="flex items-center text-[10px] text-gray-400">
          <ShieldCheck className="w-3 h-3 mr-1" />
          {stripeEnvironment === "live" ? "Live" : "Test"} mode
          {stripeLoading && (
            <>
              <Loader2 className="w-3 h-3 ml-2 animate-spin" />
              <span className="ml-1">Preparing checkout…</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
