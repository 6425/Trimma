"use client";

import React, { useState, useEffect } from "react";
import {
  CreditCard,
  Sparkles,
  FileText,
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
  type SalonSubscriptionTerm,
} from "@/app/actions/salon-dashboard-data";
import { activateFreeSubscriptionPlan } from "@/app/actions/free-subscription";
import { withTimeout } from "@/lib/promise-timeout";
import {
  DEFAULT_SUBSCRIPTION_PLANS,
  formatLkr,
  formatPromotionPackageLimit,
} from "@/lib/subscription-pricing";
import { getPlanPricingCopy } from "@/lib/subscription-pricing-copy";
import type { PublicSubscriptionPlan } from "@/app/actions/subscription-plans";
import { toast } from "sonner";

function formatAccessDate(value: string | null | undefined): string {
  if (!value) return "Activates when selected";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return date.toLocaleDateString("en-LK", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function BillingPage() {
  const [activePlan, setActivePlan] = useState<any>(null);
  const [availablePlans, setAvailablePlans] = useState<PublicSubscriptionPlan[]>(
    DEFAULT_SUBSCRIPTION_PLANS as PublicSubscriptionPlan[]
  );
  const [plansLoadError, setPlansLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<SalonBillingInvoiceRow[]>([]);
  const [subscriptionTerm, setSubscriptionTerm] = useState<SalonSubscriptionTerm | null>(null);
  const [activatingPlanId, setActivatingPlanId] = useState<string | null>(null);

  const fetchBillingData = async (showPageLoader = true) => {
    try {
      if (showPageLoader) setLoading(true);
      const result = await withTimeout(fetchSalonBillingPage(), 20000, "Loading timed out.");
      if (result.success === false) return;
      setActivePlan(result.activePlan ?? null);
      if (result.availablePlans?.length) setAvailablePlans(result.availablePlans);
      setInvoices(result.invoices ?? []);
      setSubscriptionTerm(result.subscriptionTerm ?? null);
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

  const handleSelectPlan = async (plan: PublicSubscriptionPlan) => {
    if (activatingPlanId) return;

    try {
      setActivatingPlanId(plan.id);
      const result = await withTimeout(
        activateFreeSubscriptionPlan(plan.id),
        20000,
        "Package activation timed out. Please try again."
      );

      if (result.success === false) {
        toast.error(result.error);
        return;
      }

      toast.success(`${plan.name} activated for the current 365-day free-access term.`);
      await fetchBillingData(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not activate this package.");
    } finally {
      setActivatingPlanId(null);
    }
  };

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
              Select the package that fits your salon. Every package is LKR 0 for 365 days.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-800">
          No card · No subscription charge
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

          <div className="relative z-10 bg-black/10 rounded-2xl p-4 border border-black/10 text-left sm:text-right min-w-0 w-full sm:min-w-[220px] sm:w-auto">
            <span className="text-[10px] font-bold text-black/60 uppercase block">
              {subscriptionTerm?.requiresRenewal ? "Renewal Required" : "Free Access Ends"}
            </span>
            <div className="text-base font-extrabold mt-0.5 text-black">
              {formatAccessDate(subscriptionTerm?.endDate)}
            </div>
            <div className="text-xs text-black/80 mt-1">
              {subscriptionTerm?.requiresRenewal
                ? "No automatic charge — renewal needs your approval"
                : subscriptionTerm
                  ? `${subscriptionTerm.daysRemaining} days remaining · LKR 0`
                  : "365 days · LKR 0"}
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
            const isActive =
              activePlan &&
              ((activePlan.id && activePlan.id === plan.id) ||
                activePlan.name?.toLowerCase() === plan.name.toLowerCase());
            const pricingDescription = getPlanPricingCopy(plan, "monthly");
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
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-xl font-black text-zinc-900">
                        {formatLkr(0)}
                      </span>
                      <span className="text-zinc-500 text-xs font-semibold">/365 days</span>
                    </div>
                    <p className="text-[10px] text-emerald-700 font-bold mt-1 uppercase tracking-wide">
                      Free access · No payment
                    </p>
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
                ) : (
                  <Button
                    type="button"
                    variant="dark"
                    disabled={Boolean(activatingPlanId) || subscriptionTerm?.requiresRenewal}
                    onClick={() => void handleSelectPlan(plan)}
                    className="w-full rounded-xl font-bold text-xs h-10"
                  >
                    {activatingPlanId === plan.id ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Activating…
                      </>
                    ) : subscriptionTerm?.requiresRenewal ? (
                      "Renewal Required"
                    ) : (
                      `Choose ${plan.name} Free`
                    )}
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
                    No subscription charges. Free package activations do not create invoices or
                    payment receipts.
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
