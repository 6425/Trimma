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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchSalonBillingPage } from "@/app/actions/salon-dashboard-data";
import { withTimeout } from "@/lib/promise-timeout";
import {
  DEFAULT_SUBSCRIPTION_PLANS,
  formatLkr,
  formatPromotionPackageLimit,
  getCheckoutAmount,
  getDisplayMonthlyPrice,
  getIntroMonthlyPrice,
  getListMonthlyPrice,
} from "@/lib/subscription-pricing";

const TIER_ORDER: Record<string, number> = {
  free: 0,
  starter: 1,
  pro: 2,
  elite: 3,
};

function getTierRank(name?: string | null): number {
  if (!name) return 0;
  return TIER_ORDER[name.toLowerCase()] ?? 0;
}

function buildCheckoutHref(planName: string, cycle: "monthly" | "annual"): string {
  return `/checkout/subscription?plan=${encodeURIComponent(planName.toLowerCase())}&cycle=${cycle}`;
}

export default function BillingPage() {
  const [activePlan, setActivePlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");

  const plans = DEFAULT_SUBSCRIPTION_PLANS;

  const mockInvoices = [
    { invoiceNo: "TRM-INV-001", date: "May 01, 2026", planName: "Starter Monthly", amount: "LKR 3,750", status: "Paid" },
    { invoiceNo: "TRM-INV-002", date: "Apr 01, 2026", planName: "Starter Monthly", amount: "LKR 3,750", status: "Paid" },
    { invoiceNo: "TRM-INV-003", date: "Mar 01, 2026", planName: "Starter Monthly", amount: "LKR 3,750", status: "Paid" },
  ];

  const fetchActivePlan = async () => {
    try {
      setLoading(true);
      const result = await withTimeout(fetchSalonBillingPage(), 20000, "Loading timed out.");
      if (result.success === false) return;
      if (result.activePlan) setActivePlan(result.activePlan);
    } catch (err: any) {
      console.warn("Failed to load active plan details:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(() => fetchActivePlan());
  }, []);

  const activeTierRank = getTierRank(activePlan?.name);

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
          <div className="w-12 h-12 rounded-xl bg-zinc-950 text-white flex items-center justify-center">
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
          <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 space-y-2">
            <span className="inline-flex bg-white/10 text-white px-3.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider mb-1">
              Active Membership Tier
            </span>
            <h2 className="text-2xl font-black">{activePlan.name} Plan</h2>
            <p className="text-white/70 text-xs">
              Supports up to {activePlan.max_staff} staff,{" "}
              {activePlan.max_services >= 9999 ? "unlimited" : activePlan.max_services} services,{" "}
              {activePlan.max_images} images, and{" "}
              {formatPromotionPackageLimit(activePlan.max_promotion_packages)} discounts & promotions.
            </p>
          </div>

          <div className="relative z-10 bg-white/10 rounded-2xl p-4 border border-white/10 text-right min-w-[200px]">
            <span className="text-[10px] font-bold text-white/60 uppercase block">Next Invoice Date</span>
            <div className="text-base font-extrabold mt-0.5">June 01, 2026</div>
            <div className="text-xs text-white/80 mt-1">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-5">
          {plans.map((plan) => {
            const planRank = getTierRank(plan.name);
            const isActive = activePlan && activePlan.name.toLowerCase() === plan.name.toLowerCase();
            const isFree = plan.name.toLowerCase() === "free";
            const canUpgrade = !isActive && !isFree && planRank > activeTierRank;
            const displayMonthly = getDisplayMonthlyPrice(plan, billingCycle);
            const checkoutAmount = getCheckoutAmount(plan, billingCycle);
            const listMonthly = getListMonthlyPrice(plan);
            const introMonthly = getIntroMonthlyPrice(plan);
            const checkoutHref = buildCheckoutHref(plan.name, billingCycle);

            return (
              <div
                key={plan.name}
                className={`rounded-3xl p-6 sm:p-7 border flex flex-col justify-between gap-6 relative min-h-[420px] ${
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

                <div className="space-y-5 pt-2">
                  <div className="pr-14">
                    <h4 className="font-extrabold text-sm text-zinc-800">{plan.name}</h4>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-xl font-black text-zinc-900">
                        {isFree ? "Free" : formatLkr(displayMonthly)}
                      </span>
                      {!isFree && <span className="text-zinc-400 text-xs font-semibold">/month</span>}
                    </div>
                    {!isFree && billingCycle === "monthly" && listMonthly > introMonthly && (
                      <p className="text-[10px] text-zinc-400 line-through mt-1">
                        {formatLkr(listMonthly)}/mo standard
                      </p>
                    )}
                    {!isFree && billingCycle === "annual" && (
                      <p className="text-[10px] text-zinc-500 mt-1 font-semibold">
                        {formatLkr(checkoutAmount, 2)} billed annually
                      </p>
                    )}
                  </div>

                  <div className="rounded-2xl bg-zinc-50 border border-zinc-100 px-3.5 py-3 space-y-2.5">
                    {[
                      { icon: Users, label: "Staff", value: plan.max_staff },
                      {
                        icon: Scissors,
                        label: "Services",
                        value: plan.max_services >= 9999 ? "Unlimited" : plan.max_services,
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
              {mockInvoices.map((inv) => (
                <tr
                  key={inv.invoiceNo}
                  className="hover:bg-zinc-50/50 transition-colors text-xs font-semibold text-zinc-600"
                >
                  <td className="px-6 py-4 font-bold text-zinc-800">{inv.invoiceNo}</td>
                  <td className="px-6 py-4">{inv.date}</td>
                  <td className="px-6 py-4">{inv.planName}</td>
                  <td className="px-6 py-4 text-zinc-800 font-bold">{inv.amount}</td>
                  <td className="px-6 py-4 text-right">
                    <span className="bg-emerald-50 text-emerald-600 font-extrabold text-[8px] tracking-wider uppercase px-2.5 py-1 rounded-full border border-emerald-100">
                      {inv.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
