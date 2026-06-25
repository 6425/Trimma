"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, Scissors, Users, ShieldCheck, HelpCircle, Image as ImageIcon, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  getAnnualSavingsPercent,
  getAnnualTotal,
  getDisplayMonthlyPrice,
  getIntroMonthlyPrice,
  getListMonthlyPrice,
  formatLkr,
  formatPromotionPackageLimit,
  getDiscountPercentage,
} from "@/lib/subscription-pricing";
import {
  buildPricingPageFaqs,
  getPlanPricingCopy,
  getStrikethroughMonthlyPrice,
} from "@/lib/subscription-pricing-copy";
import type { PublicSubscriptionPlan } from "../actions/subscription-plans";

type PricingContentProps = {
  initialPlans: PublicSubscriptionPlan[];
  loadError?: string | null;
};

export function PricingContent({ initialPlans, loadError }: PricingContentProps) {
  const [isAnnual, setIsAnnual] = useState(false);
  const plans = initialPlans;

  const maxAnnualSavings = useMemo(() => {
    return plans.reduce((max, plan) => {
      const savings = getAnnualSavingsPercent(plan);
      return savings > max ? savings : max;
    }, 0);
  }, [plans]);

  const pricingFaqs = useMemo(() => buildPricingPageFaqs(plans), [plans]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24 selection:bg-rose-500 selection:text-white">
      <section className="page-hero-shell text-zinc-900 pt-28 pb-36 text-center px-4 relative overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-white/20 rounded-full blur-[120px] -translate-y-1/2"></div>
        <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-white/15 rounded-full blur-[120px] -translate-y-1/2"></div>

        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="hero-badge hero-eyebrow inline-flex items-center gap-2 px-4 py-1.5 mb-6">
            <Scissors className="w-3.5 h-3.5 animate-spin-slow" /> Introductory Discounts Available Now
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-6 text-zinc-900">
            Choose the Perfect Plan for <br className="hidden md:inline" /> Your Salon&apos;s Growth
          </h2>
          <p className="text-lg md:text-xl text-zinc-700 font-medium max-w-2xl mx-auto mb-10 leading-relaxed">
            Introduction rates apply to monthly billing. Annual plans use a lower monthly equivalent billed once per year.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
            <Button
              type="button"
              variant="dark"
              onClick={() => setIsAnnual(false)}
              className={cn(
                "rounded-full h-11 px-5 text-sm font-bold",
                !isAnnual && "ring-2 ring-[#ffc800] ring-offset-2 ring-offset-[#ffc800]/30"
              )}
            >
              Billed Monthly
            </Button>
            <Button
              type="button"
              variant="dark"
              onClick={() => setIsAnnual(true)}
              className={cn(
                "rounded-full h-11 px-5 text-sm font-bold gap-2",
                isAnnual && "ring-2 ring-[#ffc800] ring-offset-2 ring-offset-[#ffc800]/30"
              )}
            >
              <span>Billed Annually</span>
              {maxAnnualSavings > 0 ? (
                <span className="text-[10px] font-extrabold uppercase tracking-wider">
                  Save up to {maxAnnualSavings}%
                </span>
              ) : null}
            </Button>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 -mt-20 relative z-20">
        {loadError && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Showing default pricing — live plans could not be loaded ({loadError}).
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {plans.map((plan) => {
            const flags = plan.feature_flags || {};
            const features = flags.features || [];
            const catLimit = flags.allowed_categories_limit ?? 0;
            const maxServices = plan.max_services ?? 0;

            const displayMonthly = getDisplayMonthlyPrice(plan, isAnnual ? "annual" : "monthly");
            const discountPercent = getDiscountPercentage(plan);
            const annualTotal = getAnnualTotal(plan);
            const isFree = getListMonthlyPrice(plan) === 0 && getIntroMonthlyPrice(plan) === 0;
            const strikethroughMonthly = !isAnnual ? getStrikethroughMonthlyPrice(plan) : null;
            const pricingDescription = getPlanPricingCopy(
              plan,
              isAnnual ? "annual" : "monthly"
            );
            const isPro = plan.name.toLowerCase() === "pro";
            const checkoutHref = isFree
              ? "/signup"
              : `/checkout/subscription?plan=${encodeURIComponent(plan.name.toLowerCase())}&cycle=${isAnnual ? "annual" : "monthly"}`;

            return (
              <div
                key={plan.id}
                className={`bg-white rounded-3xl p-7 sm:p-8 shadow-xl border flex flex-col relative transition-all duration-300 hover:scale-[1.02] min-h-[520px] ${
                  isPro
                    ? "border-zinc-900 bg-zinc-950 text-white shadow-rose-950/20"
                    : "border-slate-100 hover:border-rose-100 bg-white text-zinc-900"
                }`}
              >
                {isPro && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-rose-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-500/30">
                    Most Popular
                  </div>
                )}

                <div className="mb-6">
                  <h3 className={`text-xl font-bold uppercase tracking-widest ${isPro ? "text-rose-400" : "text-zinc-800"}`}>
                    {plan.name} Tier
                  </h3>

                  {strikethroughMonthly ? (
                    <p className={`text-sm line-through mt-3 ${isPro ? "text-zinc-500" : "text-zinc-400"}`}>
                      {strikethroughMonthly}
                    </p>
                  ) : null}

                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-3xl font-black">
                      {isFree ? "Free" : formatLkr(displayMonthly)}
                    </span>
                    <span className={`text-xs font-semibold ${isPro ? "text-zinc-500" : "text-zinc-400"}`}>/month</span>
                  </div>

                  {!isFree && !isAnnual && discountPercent > 0 && (
                    <Badge className="mt-2 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-bold text-[9px] uppercase tracking-wider">
                      Intro price — {discountPercent}% off
                    </Badge>
                  )}

                  {isFree && !isAnnual && (
                    <Badge className="mt-2 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-bold text-[9px] uppercase tracking-wider">
                      Standard value — 100% off
                    </Badge>
                  )}

                  {!isFree && isAnnual && (
                    <p className={`text-xs mt-2 font-semibold ${isPro ? "text-zinc-400" : "text-zinc-500"}`}>
                      {formatLkr(annualTotal, 2)} billed annually
                    </p>
                  )}

                  <p className={`text-xs mt-2 font-medium leading-relaxed ${isPro ? "text-zinc-400" : "text-zinc-500"}`}>
                    {pricingDescription}
                  </p>
                </div>

                <div
                  className={`mb-6 rounded-2xl px-3.5 py-3 space-y-2.5 text-[11px] font-normal ${
                    isPro ? "bg-white/5" : "bg-slate-50"
                  }`}
                >
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
                    <div key={label} className="flex items-center gap-2 leading-none">
                      <Icon
                        className={`w-3.5 h-3.5 shrink-0 ${isPro ? "text-rose-400" : "text-zinc-400"}`}
                      />
                      <span
                        className={`whitespace-nowrap ${isPro ? "text-zinc-400" : "text-zinc-600"}`}
                      >
                        {label}:{" "}
                        <span className={isPro ? "text-zinc-200" : "text-zinc-800"}>{value}</span>
                      </span>
                    </div>
                  ))}
                </div>

                <div className="space-y-3.5 flex-1 mb-8 px-1">
                  <div className={`flex items-center gap-2 text-xs font-extrabold ${isPro ? "text-zinc-300" : "text-zinc-700"}`}>
                    <ShieldCheck className="w-4 h-4 text-rose-500" />
                    <span>Categories: {catLimit >= 999 ? "All Categories" : `${catLimit} Allowed`}</span>
                  </div>
                  <div className="h-px bg-zinc-100 my-2 opacity-10"></div>
                  {features.map((feature: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs">
                      <Check className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <span className={`font-medium ${isPro ? "text-zinc-300" : "text-zinc-600"}`}>{feature}</span>
                    </div>
                  ))}
                </div>

                <Link href={checkoutHref} className="block w-full">
                  <Button
                    className={`w-full h-12 rounded-xl font-bold text-xs tracking-wider uppercase transition-transform active:scale-95 shadow-md ${
                      isPro
                        ? "bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20"
                        : "bg-zinc-900 hover:bg-zinc-800 text-white shadow-zinc-900/10"
                    }`}
                  >
                    {isFree ? "Register Free Account" : isAnnual ? "Subscribe Annually" : "Subscribe Monthly"}
                  </Button>
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 mt-24">
        <div className="text-center mb-12">
          <Badge className="bg-rose-50 text-rose-600 border border-rose-100 uppercase tracking-widest font-black text-[10px] mb-3 px-3 py-1">
            FAQ
          </Badge>
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#1A1C29] mb-4">Platform Pricing Questions</h2>
          <p className="text-zinc-500">Everything you need to know about introduction pricing and annual billing.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pricingFaqs.map((faq) => (
            <div key={faq.q} className="bg-white p-6 rounded-2xl border border-slate-100">
              <h4 className="font-bold text-sm text-[#1A1C29] flex items-center gap-2 mb-2">
                <HelpCircle className="w-4 h-4 text-rose-500" />
                {faq.q}
              </h4>
              <p className="text-sm text-zinc-500 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
