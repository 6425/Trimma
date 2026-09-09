"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Check, Scissors, Users, ShieldCheck, HelpCircle, Image as ImageIcon, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FREE_SUBSCRIPTION_TERM_DAYS,
  formatLkr,
  formatPromotionPackageLimit,
} from "@/lib/subscription-pricing";
import {
  buildPricingPageFaqs,
  getPlanPricingCopy,
} from "@/lib/subscription-pricing-copy";
import type { PublicSubscriptionPlan } from "../actions/subscription-plans";
import { FindBookGlowCta } from "../../components/marketplace/FindBookGlowCta";

type PricingContentProps = {
  initialPlans: PublicSubscriptionPlan[];
  loadError?: string | null;
  /** When false, omit the bottom FindBookGlowCta (e.g. onboarding places it above the footer). Default true. */
  showFindBookGlowCta?: boolean;
};

export function PricingContent({
  initialPlans,
  loadError,
  showFindBookGlowCta = true,
}: PricingContentProps) {
  const plans = initialPlans;

  const pricingFaqs = useMemo(() => buildPricingPageFaqs(plans), [plans]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-rose-500 selection:text-white">
      <section className="page-hero-shell home-hero home-hero-split relative min-h-[500px]">
        <img
          src="/assets/featured-hero.webp"
          alt=""
          width={1920}
          height={500}
          decoding="async"
          fetchPriority="high"
          className="home-hero-bg-image absolute inset-0 w-full h-full object-cover pointer-events-none"
        />
        <div className="home-hero-left-overlay absolute inset-0 hidden lg:block pointer-events-none" aria-hidden="true" />
        <div className="home-hero-mobile-overlay lg:hidden absolute inset-0 pointer-events-none" aria-hidden="true" />

        <div className="container relative z-10 mx-auto max-w-7xl">
          <div className="home-hero-content-col home-hero-content hero-ink text-left w-full lg:w-1/2 flex flex-col justify-center p-[3%]">
            <div className="home-hero-top">
              <div className="hero-badge hero-eyebrow inline-flex items-center gap-2 px-4 py-1.5 mb-6">
                <Scissors className="w-3.5 h-3.5 animate-spin-slow" /> All Packages Free for One Year
              </div>

              <h1 className="home-hero-title text-3xl sm:text-4xl md:text-5xl xl:text-5xl font-black tracking-tight">
                <span className="home-hero-title-line">Choose the Perfect Plan for</span>
                <span className="home-hero-title-accent underline decoration-[#ffde5a] decoration-4 underline-offset-4">
                  Your Salon&apos;s Growth
                </span>
              </h1>

              <p className="text-sm sm:text-base md:text-lg font-medium max-w-lg leading-relaxed">
                Choose the package that fits your salon. Every tier is LKR 0 for 365 days, with no card and no subscription charge.
              </p>
            </div>

            <div className="home-hero-middle">
              <div className="flex flex-wrap items-center justify-start gap-3">
                <div className="trimma-dark-surface inline-flex min-h-11 items-center rounded-full bg-black px-5 text-sm font-bold text-white ring-2 ring-[#ffde5a] ring-offset-2 ring-offset-[#ffde5a]/30">
                  LKR 0 · {FREE_SUBSCRIPTION_TERM_DAYS} days · No card required
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 mt-10 pt-6 relative z-20">
        {loadError && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Showing safe default packages — live package details could not be loaded ({loadError}).
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {plans.map((plan) => {
            const flags = plan.feature_flags || {};
            const features = flags.features || [];
            const catLimit = flags.allowed_categories_limit ?? 0;
            const maxServices = plan.max_services ?? 0;

            const pricingDescription = getPlanPricingCopy(plan, "monthly");
            const isPro = plan.name.toLowerCase() === "pro";
            const signupHref = "/onboarding#salon-owner-signup";

            return (
              <div
                key={plan.id}
                className={`rounded-3xl p-7 sm:p-8 shadow-xl border flex flex-col relative transition-all duration-300 hover:scale-[1.02] min-h-[520px] ${
                  isPro
                    ? "trimma-dark-surface border-zinc-900 bg-zinc-950 text-white shadow-zinc-950/20"
                    : "trimma-light-context border-slate-100 hover:border-rose-100 bg-white text-zinc-900"
                }`}
              >
                {isPro && (
                  <div className="trimma-light-context absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-brand text-black px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-black/20">
                    Most Popular
                  </div>
                )}

                <div className="mb-6">
                  <h3 className={`text-xl font-bold uppercase tracking-widest ${isPro ? "text-white" : "text-zinc-800"}`}>
                    {plan.name} Tier
                  </h3>

                  <div className="flex items-baseline gap-1 mt-1">
                    <span className={`text-3xl font-black ${isPro ? "text-white" : "text-zinc-900"}`}>
                      {formatLkr(0)}
                    </span>
                    <span className={`text-xs font-semibold ${isPro ? "text-white" : "text-zinc-500"}`}>/365 days</span>
                  </div>

                  <Badge className={`mt-2 border font-bold text-[9px] uppercase tracking-wider ${isPro ? "border-white/25 bg-white/10 text-white" : "border-emerald-500/20 bg-emerald-500/10 text-emerald-700"}`}>
                    Free access · No payment
                  </Badge>

                  <p className={`text-xs mt-2 font-medium leading-relaxed ${isPro ? "text-white" : "text-zinc-500"}`}>
                    {pricingDescription}
                  </p>
                </div>

                <div
                  className={`mb-6 rounded-2xl px-3.5 py-3 space-y-2.5 text-[11px] font-normal ${
                    isPro ? "bg-white/10 text-white" : "bg-slate-50"
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
                        className={`w-3.5 h-3.5 shrink-0 ${isPro ? "text-white" : "text-zinc-400"}`}
                      />
                      <span
                        className={`whitespace-nowrap ${isPro ? "text-white" : "text-zinc-600"}`}
                      >
                        {label}:{" "}
                        <span className={isPro ? "text-white" : "text-zinc-800"}>{value}</span>
                      </span>
                    </div>
                  ))}
                </div>

                <div className="space-y-3.5 flex-1 mb-8 px-1">
                  <div className={`flex items-center gap-2 text-xs font-extrabold ${isPro ? "text-white" : "text-zinc-700"}`}>
                    <ShieldCheck className={`w-4 h-4 ${isPro ? "text-white" : "text-rose-500"}`} />
                    <span>Categories: {catLimit >= 999 ? "All Categories" : `${catLimit} Allowed`}</span>
                  </div>
                  <div className="h-px bg-zinc-100 my-2 opacity-10"></div>
                  {features.map((feature: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs">
                      <Check className={`w-4 h-4 shrink-0 mt-0.5 ${isPro ? "text-white" : "text-rose-500"}`} />
                      <span className={`font-medium ${isPro ? "text-white" : "text-zinc-600"}`}>{feature}</span>
                    </div>
                  ))}
                </div>

                <Link href={signupHref} className="block w-full">
                  <Button
                    variant={isPro ? "default" : "dark"}
                    className="w-full h-12 rounded-xl font-bold text-xs tracking-wider uppercase transition-transform active:scale-95 shadow-md"
                  >
                    Start Free
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
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#1A1C29] mb-4">Free Package Questions</h2>
          <p className="text-zinc-500">Everything you need to know about the 365-day free-access programme.</p>
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

      {showFindBookGlowCta ? (
        <div className="mt-24">
          <FindBookGlowCta />
        </div>
      ) : null}
    </div>
  );
}
