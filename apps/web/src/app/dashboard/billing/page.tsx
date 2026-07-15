"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  CreditCard,
  Sparkles,
  FileText,
  ArrowRight,
  Loader2,
  Image as ImageIcon,
  Scissors,
  Tag,
  Users,
  ShieldCheck,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  fetchSalonBillingPage,
  type SalonBillingInvoiceRow,
} from "@/app/actions/salon-dashboard-data";
import { withTimeout } from "@/lib/promise-timeout";
import {
  DEFAULT_SUBSCRIPTION_PLANS,
  formatLkr,
  formatPromotionPackageLimit,
  getAnnualTotal,
  getCheckoutAmount,
  getDiscountPercentage,
  getDisplayMonthlyPrice,
  getIntroMonthlyPrice,
  getListMonthlyPrice,
} from "@/lib/subscription-pricing";
import {
  getPlanPricingCopy,
  getStrikethroughMonthlyPrice,
} from "@/lib/subscription-pricing-copy";
import type { PublicSubscriptionPlan } from "@/app/actions/subscription-plans";

function getPlanRank(plans: PublicSubscriptionPlan[], plan?: { id?: string; name?: string | null } | null): number {
  if (!plan) return -1;
  const idx = plans.findIndex(
    (entry) =>
      (plan.id && entry.id === plan.id) ||
      entry.name?.toLowerCase() === (plan.name || "").toLowerCase()
  );
  return idx;
}

function buildCheckoutHref(planName: string, cycle: "monthly" | "annual"): string {
  return `/checkout/subscription?plan=${encodeURIComponent(planName.toLowerCase())}&cycle=${cycle}`;
}

export default function BillingPage() {
  const [activePlan, setActivePlan] = useState<any>(null);
  const [availablePlans, setAvailablePlans] = useState<PublicSubscriptionPlan[]>(
    DEFAULT_SUBSCRIPTION_PLANS as PublicSubscriptionPlan[]
  );
  const [plansLoadError, setPlansLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [invoices, setInvoices] = useState<SalonBillingInvoiceRow[]>([]);
  const [nextInvoiceDate, setNextInvoiceDate] = useState<string | null>(null);

  const fetchBillingData = async () => {
    try {
      setLoading(true);
      const result = await withTimeout(fetchSalonBillingPage(), 20000, "Loading timed out.");
      if (result.success === false) return;
      if (result.activePlan) setActivePlan(result.activePlan);
      if (result.availablePlans?.length) setAvailablePlans(result.availablePlans);
      setInvoices(result.invoices ?? []);
      setNextInvoiceDate(result.nextInvoiceDate ?? null);
      setPlansLoadError(result.plansLoadError ?? null);
    } catch (err: any) {
      console.warn("Failed to load billing details:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(() => fetchBillingData());
  }, []);

  const activeTierRank = getPlanRank(availablePlans, activePlan);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-zinc-400 gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
        <p className="font-semibold text-xs">Syncing billing configurations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 text-zinc-900 flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-brand" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Subscription & Billing</h1>
            <p className="text-xs text-zinc-500">
              Manage memberships, download payment receipts, and upgrade plan quotas.
            </p>
          </div>
        </div>

        <div className="inline-flex rounded-lg border border-zinc-200 bg-zinc-50 p-1">
          <button
            type="button"
            onClick={() => setBillingCycle("monthly")}
            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${
              billingCycle === "monthly"
                ? "bg-zinc-900 text-white"
                : "text-zinc-600 hover:text-zinc-900"
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
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            Annual
          </button>
        </div>
      </div>

      {activePlan && (
        <div className="bg-brand text-black p-6 rounded-3xl shadow-sm relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="absolute right-0 top-0 w-64 h-64 bg-black/5 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 space-y-2">
            <span className="inline-flex bg-black/10 text-black px-3.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider mb-1">
              Active Membership Tier
            </span>
            <h2 className="text-2xl font-black text-black">{activePlan.name} Plan</h2>
            <p className="text-black/70 text-xs">
              Supports up to {activePlan.max_staff} staff,{" "}
              {activePlan.max_services >= 9999 ? "unlimited" : activePlan.max_services} services,{" "}
              {activePlan.max_images} images, and{" "}
              {formatPromotionPackageLimit(activePlan.max_promotion_packages)} discounts & promotions.
            </p>
          </div>

          <div className="relative z-10 bg-black/10 rounded-2xl p-4 border border-black/10 text-left sm:text-right min-w-0 w-full sm:min-w-[200px] sm:w-auto">
            <span className="text-[10px] font-bold text-black/60 uppercase block">Next Invoice Date</span>
            <div className="text-base font-extrabold mt-0.5 text-black">
              {nextInvoiceDate ?? "—"}
            </div>
            <div className="text-xs text-black/80 mt-1">
              {formatLkr(getDisplayMonthlyPrice(activePlan, billingCycle))} / month
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <h3 className="text-sm font-bold text-zinc-900 border-b pb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-brand" />
          Available Subscription Packages
        </h3>

        {plansLoadError && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
            Showing default packages — live plans could not be loaded ({plansLoadError}).
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-5">
          {availablePlans.map((plan) => {
            const planRank = getPlanRank(availablePlans, plan);
            const isActive =
              activePlan &&
              ((activePlan.id && activePlan.id === plan.id) ||
                activePlan.name?.toLowerCase() === plan.name.toLowerCase());
            const isFree = getListMonthlyPrice(plan) === 0 && getIntroMonthlyPrice(plan) === 0;
            const canUpgrade = !isActive && !isFree && planRank > activeTierRank;
            const displayMonthly = getDisplayMonthlyPrice(plan, billingCycle);
            const checkoutAmount = getCheckoutAmount(plan, billingCycle);
            const annualTotal = getAnnualTotal(plan);
            const discountPercent = getDiscountPercentage(plan);
            const strikethroughMonthly = billingCycle === "monthly" ? getStrikethroughMonthlyPrice(plan) : null;
            const pricingDescription = getPlanPricingCopy(plan, billingCycle);
            const checkoutHref = buildCheckoutHref(plan.name, billingCycle);
            const maxServices = plan.max_services ?? 0;
            const flags = plan.feature_flags || {};
            const features = flags.features || [];
            const catLimit = flags.allowed_categories_limit ?? 0;

            return (
              <div
                key={plan.id}
                className={`rounded-3xl p-6 sm:p-7 border flex flex-col justify-between gap-5 relative min-h-[520px] ${
                  isActive
                    ? "border-brand bg-rose-50/10 shadow-sm"
                    : "border-zinc-100 bg-white hover:border-zinc-200"
                }`}
              >
                {isActive && (
                  <span className="absolute top-5 right-5 bg-rose-50 text-brand font-extrabold text-[8px] tracking-wider uppercase px-2.5 py-1 rounded-full border border-rose-100">
                    Active Tier
                  </span>
                )}

                <div className="flex flex-col flex-1 gap-5 pt-2 min-h-0">
                  <div className="pr-14">
                    <h4 className="font-extrabold text-sm text-zinc-800 uppercase tracking-widest">{plan.name} Tier</h4>
                    {strikethroughMonthly ? (
                      <p className="text-[10px] text-zinc-400 line-through mt-2">{strikethroughMonthly}</p>
                    ) : null}
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-xl font-black text-zinc-900">
                        {isFree ? "Free" : formatLkr(displayMonthly)}
                      </span>
                      {!isFree && <span className="text-zinc-400 text-xs font-semibold">/month</span>}
                    </div>
                    {!isFree && billingCycle === "monthly" && discountPercent > 0 && (
                      <p className="text-[10px] text-emerald-600 font-bold mt-1 uppercase tracking-wide">
                        Intro price — {discountPercent}% off
                      </p>
                    )}
                    {isFree && billingCycle === "monthly" && (
                      <p className="text-[10px] text-emerald-600 font-bold mt-1 uppercase tracking-wide">
                        Standard value — 100% off
                      </p>
                    )}
                    {!isFree && billingCycle === "annual" && (
                      <p className="text-[10px] text-zinc-500 mt-1 font-semibold">
                        {formatLkr(annualTotal, 2)} billed annually
                      </p>
                    )}
                    <p className="text-xs text-zinc-500 mt-2 font-medium leading-relaxed">
                      {pricingDescription}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-zinc-50 border border-zinc-100 px-3.5 py-3 space-y-2.5">
                    {[
                      { icon: Users, label: "Staff", value: plan.max_staff },
                      {
                        icon: Scissors,
                        label: "Services",
                        value: maxServices >= 9999 ? "Unlimited" : maxServices,
                      },
                      { icon: ImageIcon, label: "Images", value: plan.max_images },
                      {
                        icon: Tag,
                        label: "Discounts & Promotions",
                        value: formatPromotionPackageLimit(plan.max_promotion_packages),
                      },
                    ].map(({ icon: Icon, label, value }) => (
                      <div
                        key={label}
                        className="flex items-center gap-2 text-[11px] font-normal leading-none"
                      >
                        <Icon className="w-3.5 h-3.5 shrink-0 text-zinc-400" />
                        <span className="whitespace-nowrap text-zinc-600">
                          {label}: <span className="text-zinc-800">{value}</span>
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2.5 px-1">
                    <div className="flex items-center gap-2 text-xs font-extrabold text-zinc-700">
                      <ShieldCheck className="w-4 h-4 text-rose-500" />
                      <span>Categories: {catLimit >= 999 ? "All Categories" : `${catLimit} Allowed`}</span>
                    </div>
                    {features.length > 0 && (
                      <>
                        <div className="h-px bg-zinc-100"></div>
                        {features.map((feature: string, idx: number) => (
                          <div key={idx} className="flex items-start gap-2.5 text-xs">
                            <Check className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                            <span className="font-medium text-zinc-600">{feature}</span>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>

                {isActive ? (
                  <Button
                    disabled
                    className="w-full rounded-xl bg-zinc-100 text-zinc-500 font-bold text-xs h-10"
                  >
                    Current Plan
                  </Button>
                ) : canUpgrade ? (
                  <Link
                    href={checkoutHref}
                    className="group/button inline-flex w-full shrink-0 items-center justify-center gap-1 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs h-10 transition-colors"
                  >
                    Upgrade Tier <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                ) : (
                  <Button
                    disabled
                    variant="outline"
                    className="w-full rounded-xl font-bold text-xs h-10 text-zinc-400"
                  >
                    {isFree ? "Free Tier" : "Included in Current Plan"}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
        <h3 className="text-sm font-bold text-zinc-900 border-b pb-3 flex items-center gap-2">
          <FileText className="w-4 h-4 text-brand" />
          Invoice & Payment Receipt History
        </h3>

        <div className="overflow-x-auto border border-zinc-100 rounded-2xl">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-50 text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-200">
                <th className="px-6 py-4">Invoice Reference</th>
                <th className="px-6 py-4">Billing Date</th>
                <th className="px-6 py-4">Subscription Plan</th>
                <th className="px-6 py-4">Gross Amount</th>
                <th className="px-6 py-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-xs text-zinc-500">
                    No subscription payments yet. Receipts appear here after you upgrade or renew a
                    paid plan.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-zinc-50/50 transition-colors text-xs font-semibold text-zinc-600"
                  >
                    <td className="px-6 py-4 font-bold text-zinc-800">{inv.invoiceNo}</td>
                    <td className="px-6 py-4">{inv.date}</td>
                    <td className="px-6 py-4">{inv.planName}</td>
                    <td className="px-6 py-4 text-zinc-800 font-bold">{inv.amount}</td>
                    <td className="px-6 py-4 text-right">
                      <span
                        className={`font-extrabold text-[8px] tracking-wider uppercase px-2.5 py-1 rounded-full border ${
                          inv.status === "Paid"
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                            : "bg-zinc-50 text-zinc-500 border-zinc-200"
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
