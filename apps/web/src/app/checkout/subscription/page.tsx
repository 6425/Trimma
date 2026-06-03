"use client";

import React, { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchSubscriptionCheckoutPage } from "@/app/actions/subscription-checkout-data";
import { withTimeout } from "@/lib/promise-timeout";
import {
  validateCardPayment,
  type CardPaymentDetails,
  type CardType,
} from "@/lib/card-payment";
import { CheckoutCustomerForm } from "../../../components/checkout/CheckoutCustomerForm";
import { CheckoutStyles } from "../../../components/checkout/CheckoutStyles";
import {
  getAnnualMonthlyRate,
  getAnnualTotal,
  getCheckoutAmount,
  getDisplayMonthlyPrice,
  getIntroMonthlyPrice,
  getListMonthlyPrice,
  formatLkr,
  formatPromotionPackageLimit,
} from "@/lib/subscription-pricing";
import {
  ArrowLeft,
  Image as ImageIcon,
  Loader2,
  Scissors,
  Tag,
  Users,
} from "lucide-react";

function SubscriptionCheckoutForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planParam = (searchParams.get("plan") || "pro").toLowerCase();
  const cycleParam = searchParams.get("cycle") === "annual" ? "annual" : "monthly";

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [planDetails, setPlanDetails] = useState<any>(null);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">(cycleParam);
  const [payhereEnabled, setPayhereEnabled] = useState(true);
  const [payhereEnvironment, setPayhereEnvironment] = useState("sandbox");
  const [cardType, setCardType] = useState<CardType>("visa");
  const [cardDetails, setCardDetails] = useState<CardPaymentDetails>({
    cardholderName: "",
    cardNumber: "",
    expiry: "",
    cvv: "",
  });
  const [customerDetails, setCustomerDetails] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "Trimma Platform",
    city: "Colombo",
    country: "LK",
  });

  useEffect(() => {
    let cancelled = false;

    void Promise.resolve().then(async () => {
      try {
        setLoading(true);
        setLoadError(null);

        const result = await withTimeout(
          fetchSubscriptionCheckoutPage(planParam),
          20000,
          "Checkout load timed out. Please refresh."
        );

        if (cancelled) return;

        setPlanDetails(result.planDetails);
        setPayhereEnabled(result.payhereEnabled);
        setPayhereEnvironment(result.payhereEnvironment);

        if (result.customerPrefill) {
          const fullName = `${result.customerPrefill.firstName} ${result.customerPrefill.lastName}`.trim();
          setCustomerDetails((prev) => ({
            ...prev,
            firstName: result.customerPrefill!.firstName || prev.firstName,
            lastName: result.customerPrefill!.lastName || prev.lastName,
            email: result.customerPrefill!.email || prev.email,
            phone: result.customerPrefill!.phone || prev.phone,
          }));
          setCardDetails((prev) => ({
            ...prev,
            cardholderName: fullName || prev.cardholderName,
          }));
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : "Failed to load checkout.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [planParam]);

  const chargeAmount = planDetails ? getCheckoutAmount(planDetails, billingCycle) : 0;
  const displayMonthly = planDetails ? getDisplayMonthlyPrice(planDetails, billingCycle) : 0;
  const annualTotal = planDetails ? getAnnualTotal(planDetails) : 0;
  const listMonthly = planDetails ? getListMonthlyPrice(planDetails) : 0;
  const introMonthly = planDetails ? getIntroMonthlyPrice(planDetails) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payhereEnabled || !planDetails) return;

    const cardError = validateCardPayment(cardType, cardDetails);
    if (cardError) {
      alert(cardError);
      return;
    }

    setProcessing(true);

    try {
      const response = await fetch("/api/checkout/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planName: planDetails.name,
          billingCycle,
          chargeAmount,
          customer: customerDetails,
          card: {
            cardType,
            cardNumber: cardDetails.cardNumber,
            expiry: cardDetails.expiry,
            cvv: cardDetails.cvv,
            cardholderName: cardDetails.cardholderName,
          },
          payhereEnvironment,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Subscription checkout failed.");
      }

      router.push(
        `/dashboard/billing?payment_success=true&sub_order=${encodeURIComponent(result.orderId)}&plan=${encodeURIComponent(result.planName)}`
      );
    } catch (error) {
      console.error("Subscription checkout failed:", error);
      alert(error instanceof Error ? error.message : "Payment failed. Please check your card details and try again.");
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f9fafb]">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-900" />
      </div>
    );
  }

  if (loadError || !planDetails) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f9fafb] p-6 text-center gap-4">
        <p className="text-lg font-semibold text-zinc-900">Could not load subscription checkout</p>
        <p className="text-sm text-zinc-500">{loadError || "Plan details unavailable."}</p>
        <Link href="/dashboard/billing" className="text-sm font-bold text-zinc-900 underline">
          Back to billing
        </Link>
      </div>
    );
  }

  if (chargeAmount <= 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f9fafb] p-6 text-center">
        <p className="text-lg font-semibold text-zinc-900 mb-2">This plan is free</p>
        <p className="text-sm text-zinc-500 mb-6">No payment is required for the Free tier.</p>
        <Link href="/dashboard/billing" className="text-sm font-bold text-zinc-900 underline">
          Back to billing
        </Link>
      </div>
    );
  }

  const formattedAmount = formatLkr(chargeAmount, 2);
  const monthlyEquivalent = formatLkr(displayMonthly);

  return (
    <>
      <CheckoutStyles />

      <div className="min-h-screen flex flex-col lg:flex-row font-sans text-gray-800 antialiased bg-white">
        <div className="w-full lg:w-1/2 bg-[#F5B700] flex flex-col items-center justify-center p-6 lg:p-16 border-b lg:border-b-0 lg:border-r border-[#E5A800] text-zinc-950">
          <div className="w-full max-w-md">
            <Link
              href="/dashboard/billing"
              className="text-sm font-semibold text-zinc-900 hover:text-zinc-950 mb-6 inline-flex items-center transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Trimma
            </Link>

            <h1 className="text-2xl lg:text-3xl font-bold text-zinc-950 tracking-tight mb-6">
              Subscription Plan
            </h1>

            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mr-4 shadow-sm overflow-hidden">
                <Image src="/logo.svg" alt="Trimma" width={32} height={32} className="object-contain" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-zinc-950">Trimma</h2>
                <p className="text-zinc-900 text-sm font-medium">Trimma Subscription</p>
              </div>
            </div>

            <div className="mt-8 mb-6 flex items-end gap-2">
              <span className="text-4xl font-bold text-zinc-950">
                {billingCycle === "annual" ? monthlyEquivalent : formatLkr(introMonthly)}
              </span>
              <span className="text-zinc-900 font-semibold pb-1">/month</span>
            </div>

            {billingCycle === "monthly" && listMonthly > introMonthly && (
              <p className="text-sm text-zinc-800 line-through mb-4 font-medium">
                {formatLkr(listMonthly)}/mo standard rate
              </p>
            )}

            {billingCycle === "annual" && (
              <p className="text-sm font-semibold text-zinc-900 mb-4">
                {formatLkr(annualTotal, 2)} billed once per year
              </p>
            )}

            <div className="inline-flex rounded-lg border border-zinc-900/15 bg-white p-1 mb-8 shadow-sm">
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${
                  billingCycle === "monthly"
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-700 hover:text-zinc-950"
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle("annual")}
                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${
                  billingCycle === "annual"
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-700 hover:text-zinc-950"
                }`}
              >
                Annual
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-900 font-semibold">
                  Trimma {planDetails.name} Plan ({billingCycle === "annual" ? "Annual" : "Monthly Intro"})
                </span>
                <span className="text-zinc-950 font-bold">{formattedAmount}</span>
              </div>

              {billingCycle === "annual" && (
                <div className="flex justify-between text-xs text-zinc-800 font-medium">
                  <span>Monthly equivalent</span>
                  <span>{monthlyEquivalent}/mo ({formatLkr(getAnnualMonthlyRate(planDetails))} × 12)</span>
                </div>
              )}

              <div className="rounded-2xl border border-zinc-900/10 bg-white px-3.5 py-3 shadow-sm space-y-2.5 text-[11px] font-normal text-zinc-900">
                {[
                  { icon: Users, label: "Staff", value: planDetails.max_staff },
                  {
                    icon: Scissors,
                    label: "Services",
                    value:
                      planDetails.max_services >= 9999 ? "Unlimited" : planDetails.max_services,
                  },
                  { icon: ImageIcon, label: "Images", value: planDetails.max_images },
                  {
                    icon: Tag,
                    label: "Discounts & Promotions",
                    value: formatPromotionPackageLimit(planDetails.max_promotion_packages),
                  },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-2 leading-none">
                    <Icon className="w-3.5 h-3.5 shrink-0 text-zinc-500" />
                    <span className="whitespace-nowrap text-zinc-600">
                      {label}: <span className="text-zinc-900">{value}</span>
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-zinc-900/20 pt-4 flex justify-between text-sm">
                <span className="text-zinc-900 font-semibold">Subtotal</span>
                <span className="text-zinc-950 font-bold">{formattedAmount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-900 font-semibold">Tax</span>
                <span className="text-zinc-950 font-bold">LKR 0.00</span>
              </div>
            </div>

            <div className="border-t border-zinc-900/20 mt-6 pt-4 flex justify-between items-center">
              <span className="text-base font-bold text-zinc-950">Total due today</span>
              <span className="text-xl font-black text-zinc-950">{formattedAmount}</span>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-1/2 bg-white flex flex-col items-center justify-center p-6 lg:p-16">
          <div className="w-full max-w-md">
            <CheckoutCustomerForm
              customerDetails={customerDetails}
              setCustomerDetails={setCustomerDetails}
              processing={processing}
              payhereEnabled={payhereEnabled}
              payhereEnvironment={payhereEnvironment}
              submitLabel={`Subscribe — ${formattedAmount}`}
              onSubmit={handleSubmit}
              paymentMode="inline"
              cardType={cardType}
              setCardType={setCardType}
              cardDetails={cardDetails}
              setCardDetails={setCardDetails}
            />
          </div>
        </div>
      </div>
    </>
  );
}

export default function SubscriptionCheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#f9fafb]">
          <Loader2 className="w-8 h-8 animate-spin text-zinc-900" />
        </div>
      }
    >
      <SubscriptionCheckoutForm />
    </Suspense>
  );
}
