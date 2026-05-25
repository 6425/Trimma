"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

type PayHerePaymentSelectorProps = {
  className?: string;
};

export function PayHerePaymentSelector({ className }: PayHerePaymentSelectorProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div>
        <a
          href="https://www.payhere.lk"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block hover:opacity-90 transition-opacity"
          aria-label="PayHere — Sri Lanka payment gateway"
        >
          <Image
            src="/payments/payhere-logo.png"
            alt="PayHere"
            width={500}
            height={200}
            className="h-10 w-auto max-w-[200px]"
            priority
          />
        </a>
        <p className="text-sm text-gray-500 mt-3">
          Secure hosted checkout — cards &amp; mobile wallets
        </p>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-700 mb-3">Select payment channel</p>

        <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-3">
          <Image
            src="/payments/payhere-payment-banner.png"
            alt="PayHere accepted payment methods — Visa, Mastercard, Amex, eZ Cash, mCash, Genie, Frimi and more"
            width={494}
            height={252}
            className="w-full h-auto object-contain"
            priority
          />
        </div>
      </div>

      <p className="text-xs text-gray-500 leading-relaxed">
        Card and wallet details are entered on PayHere&apos;s PCI-compliant page. Trimma never
        stores your payment credentials.
      </p>
    </div>
  );
}
