"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  formatCardNumberInput,
  formatExpiryInput,
  type CardPaymentDetails,
  type CardType,
} from "@/lib/card-payment";

const CARD_OPTIONS: Array<{ id: CardType; label: string; hint: string }> = [
  { id: "visa", label: "Visa", hint: "Starts with 4" },
  { id: "mastercard", label: "Mastercard", hint: "51–55 range" },
  { id: "amex", label: "Amex", hint: "Starts with 34/37" },
];

type CheckoutCardPaymentSectionProps = {
  className?: string;
  cardType: CardType;
  setCardType: (value: CardType) => void;
  cardDetails: CardPaymentDetails;
  setCardDetails: React.Dispatch<React.SetStateAction<CardPaymentDetails>>;
  payhereEnvironment: string;
};

export function CheckoutCardPaymentSection({
  className,
  cardType,
  setCardType,
  cardDetails,
  setCardDetails,
  payhereEnvironment,
}: CheckoutCardPaymentSectionProps) {
  return (
    <div className={cn("space-y-5", className)}>
      <div>
        <Image
          src="/payments/payhere-logo.png"
          alt="PayHere"
          width={500}
          height={200}
          className="h-8 w-auto max-w-[160px]"
          priority
        />
        <p className="text-sm text-gray-500 mt-2">
          Pay securely with your card. Details are processed through PayHere (
          {payhereEnvironment === "live" ? "Live" : "Sandbox"}).
        </p>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-700 mb-3">Select card type</p>
        <div className="grid grid-cols-3 gap-2">
          {CARD_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setCardType(option.id)}
              className={cn(
                "rounded-lg border px-3 py-3 text-left transition-colors",
                cardType === option.id
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
              )}
            >
              <span className="block text-sm font-semibold">{option.label}</span>
              <span
                className={cn(
                  "block text-[10px] mt-1",
                  cardType === option.id ? "text-zinc-300" : "text-gray-400"
                )}
              >
                {option.hint}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4 rounded-xl border border-gray-100 bg-gray-50/80 p-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="card-name">
            Name on card
          </label>
          <input
            id="card-name"
            className="checkout-input w-full rounded-md px-3 py-2.5 text-sm placeholder-gray-400"
            type="text"
            autoComplete="cc-name"
            placeholder="As printed on card"
            value={cardDetails.cardholderName}
            onChange={(e) =>
              setCardDetails((prev) => ({ ...prev, cardholderName: e.target.value }))
            }
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="card-number">
            Card number
          </label>
          <input
            id="card-number"
            className="checkout-input w-full rounded-md px-3 py-2.5 text-sm placeholder-gray-400"
            type="text"
            inputMode="numeric"
            autoComplete="cc-number"
            placeholder="1234 5678 9012 3456"
            value={cardDetails.cardNumber}
            onChange={(e) =>
              setCardDetails((prev) => ({
                ...prev,
                cardNumber: formatCardNumberInput(e.target.value),
              }))
            }
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="card-expiry">
              Expiry
            </label>
            <input
              id="card-expiry"
              className="checkout-input w-full rounded-md px-3 py-2.5 text-sm placeholder-gray-400"
              type="text"
              inputMode="numeric"
              autoComplete="cc-exp"
              placeholder="MM/YY"
              value={cardDetails.expiry}
              onChange={(e) =>
                setCardDetails((prev) => ({
                  ...prev,
                  expiry: formatExpiryInput(e.target.value),
                }))
              }
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="card-cvv">
              Security code
            </label>
            <input
              id="card-cvv"
              className="checkout-input w-full rounded-md px-3 py-2.5 text-sm placeholder-gray-400"
              type="password"
              inputMode="numeric"
              autoComplete="cc-csc"
              placeholder={cardType === "amex" ? "4 digits" : "3 digits"}
              maxLength={cardType === "amex" ? 4 : 3}
              value={cardDetails.cvv}
              onChange={(e) =>
                setCardDetails((prev) => ({
                  ...prev,
                  cvv: e.target.value.replace(/\D/g, "").slice(0, cardType === "amex" ? 4 : 3),
                }))
              }
              required
            />
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-500 leading-relaxed">
        Trimma does not store your full card number. Payment is authorized when you complete this
        checkout.
      </p>
    </div>
  );
}
