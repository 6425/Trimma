"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Check, Scissors, Users, GitBranch, ShieldCheck, HelpCircle, Loader2, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/config/supabase";
import {
  DEFAULT_SUBSCRIPTION_PLANS,
  getAnnualSavingsPercent,
  getAnnualTotal,
  getDisplayMonthlyPrice,
  getIntroMonthlyPrice,
  getListMonthlyPrice,
  formatLkr,
  INTRO_DISCOUNT_PERCENT,
} from "@/lib/subscription-pricing";

export default function PricingPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAnnual, setIsAnnual] = useState(false);

  useEffect(() => {
    async function loadPlans() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("subscription_plans")
          .select("*")
          .order("monthly_price");

        if (error) throw error;
        setPlans(data && data.length > 0 ? data : DEFAULT_SUBSCRIPTION_PLANS);
      } catch (err) {
        console.error("Failed to fetch pricing tiers, using defaults:", err);
        setPlans(DEFAULT_SUBSCRIPTION_PLANS);
      } finally {
        setLoading(false);
      }
    }
    loadPlans();
  }, []);

  const maxAnnualSavings = useMemo(() => {
    return plans.reduce((max, plan) => {
      const savings = getAnnualSavingsPercent(plan);
      return savings > max ? savings : max;
    }, 0);
  }, [plans]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24 selection:bg-rose-500 selection:text-white">
      <section className="bg-zinc-950 text-white pt-28 pb-36 text-center px-4 relative overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-rose-500/10 rounded-full blur-[120px] -translate-y-1/2"></div>
        <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[120px] -translate-y-1/2"></div>
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]"></div>

        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase mb-6 text-zinc-400">
            <Scissors className="w-3.5 h-3.5 text-rose-500 animate-spin-slow" /> Introduction Pricing — {INTRO_DISCOUNT_PERCENT}% Off Monthly
          </div>
          <h1 className="text-4xl md:text-7xl font-extrabold tracking-tight mb-6 bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent">
            Choose the Perfect Plan for <br className="hidden md:inline" /> Your Salon&apos;s Growth
          </h1>
          <p className="text-lg md:text-xl text-zinc-400 font-medium max-w-2xl mx-auto mb-10 leading-relaxed">
            Introduction rates apply to monthly billing. Annual plans use a lower monthly equivalent billed once per year.
          </p>

          <div className="flex items-center justify-center gap-4 mt-4">
            <span className={`text-sm font-bold transition-colors ${!isAnnual ? "text-white" : "text-zinc-500"}`}>
              Billed Monthly
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className="w-16 h-8 bg-zinc-800 rounded-full p-1 relative flex items-center transition-all duration-300 focus:outline-none"
              aria-label="Toggle annual billing"
            >
              <div
                className={`w-6 h-6 bg-rose-500 rounded-full shadow-md transform transition-transform duration-300 ${
                  isAnnual ? "translate-x-8" : "translate-x-0"
                }`}
              />
            </button>
            <div className="flex items-center gap-1.5">
              <span className={`text-sm font-bold transition-colors ${isAnnual ? "text-rose-400" : "text-zinc-500"}`}>
                Billed Annually
              </span>
              {maxAnnualSavings > 0 && (
                <Badge className="bg-rose-500/10 text-rose-400 border border-rose-500/20 font-extrabold text-[10px] uppercase px-2 py-0.5 tracking-wider">
                  Save up to {maxAnnualSavings}%
                </Badge>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 -mt-20 relative z-20">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
            <Loader2 className="w-10 h-10 animate-spin text-rose-500 mb-4" />
            <p className="text-sm font-semibold tracking-wide">Syncing pricing tiers dynamically...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {plans.map((plan) => {
              const flags = plan.feature_flags || {};
              const features = flags.features || [];
              const catLimit = flags.allowed_categories_limit;

              const listMonthly = getListMonthlyPrice(plan);
              const introMonthly = getIntroMonthlyPrice(plan);
              const displayMonthly = getDisplayMonthlyPrice(plan, isAnnual ? "annual" : "monthly");
              const annualTotal = getAnnualTotal(plan);
              const isFree = listMonthly === 0 && introMonthly === 0;
              const isPro = plan.name.toLowerCase() === "pro";
              const checkoutHref = isFree
                ? "/signup"
                : `/checkout/subscription?plan=${encodeURIComponent(plan.name.toLowerCase())}&cycle=${isAnnual ? "annual" : "monthly"}`;

              return (
                <div
                  key={plan.id}
                  className={`bg-white rounded-3xl p-8 shadow-xl border flex flex-col relative transition-all duration-300 hover:scale-[1.02] ${
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

                    {!isFree && !isAnnual && listMonthly > introMonthly && (
                      <p className={`text-sm line-through mt-3 ${isPro ? "text-zinc-500" : "text-zinc-400"}`}>
                        {formatLkr(listMonthly)}/mo
                      </p>
                    )}

                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-3xl font-black">
                        {isFree ? "Free" : formatLkr(displayMonthly)}
                      </span>
                      {!isFree && (
                        <span className={`text-xs font-semibold ${isPro ? "text-zinc-500" : "text-zinc-400"}`}>/month</span>
                      )}
                    </div>

                    {!isFree && !isAnnual && (
                      <Badge className="mt-2 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-bold text-[9px] uppercase tracking-wider">
                        Intro price — {INTRO_DISCOUNT_PERCENT}% off
                      </Badge>
                    )}

                    {!isFree && isAnnual && (
                      <p className={`text-xs mt-2 font-semibold ${isPro ? "text-zinc-400" : "text-zinc-500"}`}>
                        {formatLkr(annualTotal, 2)} billed annually
                      </p>
                    )}

                    <p className={`text-xs mt-2 font-medium leading-relaxed ${isPro ? "text-zinc-400" : "text-zinc-500"}`}>
                      {isFree
                        ? "Perfect option for independent stylers starting out."
                        : isAnnual
                          ? `${formatLkr(displayMonthly)}/mo equivalent when paid yearly.`
                          : `Introduction monthly rate. Standard rate ${formatLkr(listMonthly)}/mo.`}
                    </p>
                  </div>

                  <div
                    className={`grid grid-cols-2 gap-3 mb-6 p-4 rounded-2xl text-[11px] font-bold ${
                      isPro ? "bg-white/5 text-zinc-300" : "bg-slate-50 text-zinc-600"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Users className={`w-3.5 h-3.5 ${isPro ? "text-rose-400" : "text-zinc-400"}`} />
                      <span>Staff: {plan.max_staff}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Scissors className={`w-3.5 h-3.5 ${isPro ? "text-rose-400" : "text-zinc-400"}`} />
                      <span>Services: {plan.max_services >= 9999 ? "Unlimited" : plan.max_services}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ImageIcon className={`w-3.5 h-3.5 ${isPro ? "text-rose-400" : "text-zinc-400"}`} />
                      <span>Images: {plan.max_images}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <GitBranch className={`w-3.5 h-3.5 ${isPro ? "text-rose-400" : "text-zinc-400"}`} />
                      <span>Branches: {plan.max_branches === 0 ? "None" : plan.max_branches}</span>
                    </div>
                  </div>

                  <div className="space-y-3 flex-1 mb-8">
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
        )}
      </section>

      <section className="max-w-4xl mx-auto px-4 mt-24">
        <div className="text-center mb-12">
          <Badge className="bg-rose-50 text-rose-600 border border-rose-100 uppercase tracking-widest font-black text-[10px] mb-3 px-3 py-1">
            FAQ
          </Badge>
          <h2 className="text-3xl font-extrabold text-[#1A1C29]">Platform Pricing Questions</h2>
          <p className="text-sm text-zinc-500 mt-2">Everything you need to know about introduction pricing and annual billing.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100">
            <h4 className="font-bold text-sm text-[#1A1C29] flex items-center gap-2 mb-2">
              <HelpCircle className="w-4 h-4 text-rose-500" />
              How does introduction pricing work?
            </h4>
            <p className="text-xs font-semibold text-zinc-500 leading-relaxed">
              Monthly plans show a {INTRO_DISCOUNT_PERCENT}% discounted introduction rate (e.g. Starter LKR 3,750 instead of LKR 5,000). Annual plans are billed as a single yearly total based on a lower monthly equivalent.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100">
            <h4 className="font-bold text-sm text-[#1A1C29] flex items-center gap-2 mb-2">
              <HelpCircle className="w-4 h-4 text-rose-500" />
              What are Service Category Limits?
            </h4>
            <p className="text-xs font-semibold text-zinc-500 leading-relaxed">
              To keep Trimma search highly optimized, tiers restrict the number of different global category directories your salon can list in. Pro and Elite tiers allow unlimited categories.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100">
            <h4 className="font-bold text-sm text-[#1A1C29] flex items-center gap-2 mb-2">
              <HelpCircle className="w-4 h-4 text-rose-500" />
              Is there a lock-in contract?
            </h4>
            <p className="text-xs font-semibold text-zinc-500 leading-relaxed">
              No contracts. Trimma is pay-as-you-go. Cancel online at any time with zero termination fees.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100">
            <h4 className="font-bold text-sm text-[#1A1C29] flex items-center gap-2 mb-2">
              <HelpCircle className="w-4 h-4 text-rose-500" />
              Do the prices include taxes?
            </h4>
            <p className="text-xs font-semibold text-zinc-500 leading-relaxed">
              All prices shown on this page are inclusive of platform services and VAT, ensuring complete billing transparency.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
