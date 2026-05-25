"use client";

import React, { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { generatePayhereHash } from "@/app/actions/payhere";
import { supabase } from "@/config/supabase";
import { submitPayhereCheckout } from "@/lib/payhere-checkout";
import { CheckoutCustomerForm } from "../../../components/checkout/CheckoutCustomerForm";
import { CheckoutStyles } from "../../../components/checkout/CheckoutStyles";
import {
  DEFAULT_SUBSCRIPTION_PLANS,
  getAnnualMonthlyRate,
  getAnnualTotal,
  getCheckoutAmount,
  getDisplayMonthlyPrice,
  getIntroMonthlyPrice,
  getListMonthlyPrice,
  formatLkr,
} from "@/lib/subscription-pricing";
import {
  ArrowLeft,
  GitBranch,
  Image as ImageIcon,
  Loader2,
  Scissors,
  Users,
} from "lucide-react";

const DEFAULT_PLANS: Record<string, (typeof DEFAULT_SUBSCRIPTION_PLANS)[number]> = Object.fromEntries(
  DEFAULT_SUBSCRIPTION_PLANS.filter((p) => p.name !== "Free").map((p) => [p.name.toLowerCase(), p])
);

function SubscriptionCheckoutForm() {
  const searchParams = useSearchParams();
  const planParam = (searchParams.get("plan") || "pro").toLowerCase();
  const cycleParam = searchParams.get("cycle") === "annual" ? "annual" : "monthly";

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [planDetails, setPlanDetails] = useState<any>(null);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">(cycleParam);
  const [payhereEnabled, setPayhereEnabled] = useState(true);
  const [payhereEnvironment, setPayhereEnvironment] = useState("sandbox");
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
    async function loadData() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const user = session.user;
          setCustomerDetails((prev) => ({
            ...prev,
            firstName: user.user_metadata?.first_name || prev.firstName,
            lastName: user.user_metadata?.last_name || prev.lastName,
            email: user.email || prev.email,
            phone: user.phone || user.user_metadata?.phone || prev.phone,
          }));
        }

        const { data: paymentSettings } = await supabase
          .from("global_payment_settings")
          .select("payhere_enabled, environment")
          .eq("id", "00000000-0000-0000-0000-000000000001")
          .maybeSingle();

        setPayhereEnabled(paymentSettings?.payhere_enabled !== false);
        setPayhereEnvironment(paymentSettings?.environment || "sandbox");

        const { data: planData } = await supabase
          .from("subscription_plans")
          .select("*")
          .ilike("name", planParam)
          .maybeSingle();

        if (planData) {
          setPlanDetails(planData);
        } else {
          setPlanDetails(DEFAULT_PLANS[planParam] || DEFAULT_PLANS.pro);
        }
      } catch (err) {
        console.error("Error loading checkout data:", err);
        setPlanDetails(DEFAULT_PLANS[planParam] || DEFAULT_PLANS.pro);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [planParam]);

  const chargeAmount = planDetails ? getCheckoutAmount(planDetails, billingCycle) : 0;
  const displayMonthly = planDetails ? getDisplayMonthlyPrice(planDetails, billingCycle) : 0;
  const annualTotal = planDetails ? getAnnualTotal(planDetails) : 0;
  const listMonthly = planDetails ? getListMonthlyPrice(planDetails) : 0;
  const introMonthly = planDetails ? getIntroMonthlyPrice(planDetails) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payhereEnabled) return;

    setProcessing(true);

    try {
      const { data: paymentSettings } = await supabase
        .from("global_payment_settings")
        .select("*")
        .eq("id", "00000000-0000-0000-0000-000000000001")
        .maybeSingle();

      const merchantId = paymentSettings?.payhere_merchant_id || "1211149";
      const merchantSecret = paymentSettings?.payhere_merchant_secret || "4a5s6d7f8g9h";
      const environment = paymentSettings?.environment || "sandbox";
      const orderId = `SUB-${Math.floor(100000 + Math.random() * 900000)}`;
      const amount = chargeAmount.toFixed(2);
      const cycleLabel = billingCycle === "annual" ? "Annual" : "Monthly";

      const secureHash = await generatePayhereHash(
        merchantId,
        orderId,
        amount,
        "LKR",
        merchantSecret
      );

      submitPayhereCheckout(
        {
          merchant_id: merchantId,
          return_url: `${window.location.origin}/dashboard/billing?payment_success=true&sub_order=${orderId}&plan=${planDetails.name}`,
          cancel_url: window.location.href,
          notify_url: "https://whxmyfjlrvyjqbmqhnzd.supabase.co/functions/v1/payhere-webhook",
          order_id: orderId,
          items: `Trimma ${planDetails.name} Plan (${cycleLabel})`,
          custom_1: `Trimma ${planDetails.name} (${cycleLabel})`,
          currency: "LKR",
          amount,
          first_name: customerDetails.firstName || "Guest",
          last_name: customerDetails.lastName || "User",
          email: customerDetails.email || "guest@trimma.com",
          phone: customerDetails.phone || "0000000000",
          address: customerDetails.address,
          city: customerDetails.city,
          country: "Sri Lanka",
          hash: secureHash,
        },
        environment
      );
    } catch (error) {
      console.error("Payment initialization failed:", error);
      alert("Failed to initialize PayHere. Please try again.");
      setProcessing(false);
    }
  };

  if (loading || !planDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f9fafb]">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-900" />
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
        {/* LEFT — Order summary */}
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

              <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-white border border-zinc-900/10 shadow-sm text-[11px] font-bold text-zinc-900">
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-zinc-900 shrink-0" />
                  <span>Staff: {planDetails.max_staff}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Scissors className="w-3.5 h-3.5 text-zinc-900 shrink-0" />
                  <span>
                    Services:{" "}
                    {planDetails.max_services >= 9999 ? "Unlimited" : planDetails.max_services}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-3.5 h-3.5 text-zinc-900 shrink-0" />
                  <span>Images: {planDetails.max_images}</span>
                </div>
                <div className="flex items-center gap-2">
                  <GitBranch className="w-3.5 h-3.5 text-zinc-900 shrink-0" />
                  <span>
                    Branches:{" "}
                    {planDetails.max_branches === 0 ? "None" : planDetails.max_branches}
                  </span>
                </div>
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

        {/* RIGHT — PayHere checkout */}
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
