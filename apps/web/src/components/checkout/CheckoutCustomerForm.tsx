"use client";

import Image from "next/image";
import { Loader2, Lock, ShieldCheck, Smartphone } from "lucide-react";
import { PayHerePaymentSelector } from "../PayHerePaymentSelector";

export type CheckoutCustomerDetails = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
};

type CheckoutCustomerFormProps = {
  customerDetails: CheckoutCustomerDetails;
  setCustomerDetails: React.Dispatch<React.SetStateAction<CheckoutCustomerDetails>>;
  processing: boolean;
  payhereEnabled: boolean;
  payhereEnvironment: string;
  submitLabel: string;
  onSubmit: (e: React.FormEvent) => void;
};

export function CheckoutCustomerForm({
  customerDetails,
  setCustomerDetails,
  processing,
  payhereEnabled,
  payhereEnvironment,
  submitLabel,
  onSubmit,
}: CheckoutCustomerFormProps) {
  if (!payhereEnabled) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        PayHere payments are temporarily disabled. Please contact support or try again later.
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit}>
      <PayHerePaymentSelector className="mb-8" />

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
        <input
          className="checkout-input w-full rounded-md px-3 py-2.5 text-sm placeholder-gray-400"
          type="tel"
          id="checkout-phone"
          placeholder="07X XXX XXXX"
          value={customerDetails.phone}
          onChange={(e) => setCustomerDetails({ ...customerDetails, phone: e.target.value })}
          required
        />
      </div>

      <div className="mb-8">
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

      <button
        type="submit"
        disabled={processing}
        className="w-full bg-zinc-900 hover:bg-zinc-800 disabled:opacity-70 disabled:cursor-not-allowed text-white font-semibold py-3.5 px-4 rounded-md shadow-sm transition-colors text-sm flex items-center justify-center gap-2"
      >
        {processing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Redirecting to PayHere…
          </>
        ) : (
          submitLabel
        )}
      </button>

      <div className="mt-6 flex flex-col items-center gap-3 text-xs text-gray-500 font-medium">
        <div className="flex items-center gap-2">
          <Lock className="w-3.5 h-3.5 shrink-0" />
          <span>Payments are secure and encrypted via</span>
          <Image
            src="/payments/payhere-logo.png"
            alt="PayHere"
            width={500}
            height={200}
            className="h-4 w-auto max-w-[80px]"
          />
        </div>
        <div className="flex items-center text-[10px] text-gray-400">
          <ShieldCheck className="w-3 h-3 mr-1" />
          {payhereEnvironment === "live" ? "Live" : "Sandbox"} gateway
          <Smartphone className="w-3 h-3 ml-3 mr-1" />
          LKR billing
        </div>
      </div>
    </form>
  );
}
