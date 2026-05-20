"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Check, 
  Scissors, 
  Users, 
  Scissors as ScissorsIcon, 
  Image as ImageIcon, 
  GitBranch, 
  ShieldCheck, 
  Zap, 
  HelpCircle,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/config/supabase";
import { toast } from "sonner";

export default function PricingPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAnnual, setIsAnnual] = useState(false);

  // Fallback defaults in case Supabase table is empty or offline
  const defaultPlans = [
    {
      id: "f0000000-0000-0000-0000-000000000001",
      name: "Free",
      monthly_price: 0,
      annual_price: 0,
      max_staff: 2,
      max_services: 6,
      max_images: 3,
      max_branches: 0,
      feature_flags: {
        allowed_categories_limit: 2,
        features: [
          "Staff Management", 
          "FB/WA Integration", 
          "Free Gmail Integration", 
          "Free Google Business Page", 
          "Performance Insights", 
          "Salon Dashboard with QR"
        ]
      }
    },
    {
      id: "f0000000-0000-0000-0000-000000000002",
      name: "Starter",
      monthly_price: 3500,
      annual_price: 35000,
      max_staff: 5,
      max_services: 12,
      max_images: 6,
      max_branches: 2,
      feature_flags: {
        allowed_categories_limit: 5,
        features: [
          "Staff Management", 
          "FB/WA Integration", 
          "Free Gmail Integration", 
          "Free Google Business Page", 
          "Performance Insights", 
          "Salon Dashboard with QR",
          "Advanced SEO Optimization"
        ]
      }
    },
    {
      id: "f0000000-0000-0000-0000-000000000003",
      name: "Pro",
      monthly_price: 7500,
      annual_price: 75000,
      max_staff: 10,
      max_services: 20,
      max_images: 12,
      max_branches: 3,
      feature_flags: {
        allowed_categories_limit: 999,
        features: [
          "Staff Management", 
          "FB/WA Integration", 
          "Free Gmail Integration", 
          "Free Google Business Page", 
          "Performance Insights", 
          "Salon Dashboard with QR",
          "Advanced SEO Optimization",
          "Dedicated Priority Support",
          "Multi-location Syncing"
        ]
      }
    },
    {
      id: "f0000000-0000-0000-0000-000000000004",
      name: "Elite",
      monthly_price: 15000,
      annual_price: 150000,
      max_staff: 30,
      max_services: 9999,
      max_images: 30,
      max_branches: 15,
      feature_flags: {
        allowed_categories_limit: 999,
        features: [
          "Staff Management", 
          "FB/WA Integration", 
          "Free Gmail Integration", 
          "Free Google Business Page", 
          "Performance Insights", 
          "Salon Dashboard with QR",
          "Advanced SEO Optimization",
          "Dedicated Priority Support",
          "Multi-location Syncing",
          "White-label Client Apps",
          "24/7 Phone Concierge"
        ]
      }
    }
  ];

  useEffect(() => {
    async function loadPlans() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("subscription_plans")
          .select("*")
          .order("monthly_price");

        if (error) throw error;

        if (data && data.length > 0) {
          setPlans(data);
        } else {
          setPlans(defaultPlans);
        }
      } catch (err) {
        console.error("Failed to fetch custom tiers, using high-end defaults:", err);
        setPlans(defaultPlans);
      } finally {
        setLoading(false);
      }
    }
    loadPlans();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24 selection:bg-rose-500 selection:text-white">
      {/* HERO SECTION */}
      <section className="bg-zinc-950 text-white pt-28 pb-36 text-center px-4 relative overflow-hidden">
        {/* Ambient premium lights */}
        <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-rose-500/10 rounded-full blur-[120px] -translate-y-1/2"></div>
        <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[120px] -translate-y-1/2"></div>
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]"></div>

        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase mb-6 text-zinc-400">
            <Scissors className="w-3.5 h-3.5 text-rose-500 animate-spin-slow" /> Flexible SaaS Subscription Tiers
          </div>
          <h1 className="text-4xl md:text-7xl font-extrabold tracking-tight mb-6 bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent">
            Choose the Perfect Plan for <br className="hidden md:inline" /> Your Salon's Growth
          </h1>
          <p className="text-lg md:text-xl text-zinc-400 font-medium max-w-2xl mx-auto mb-10 leading-relaxed">
            Configure, manage and attract more clients. Upgrade, downgrade, or cancel at any time with complete price transparency.
          </p>

          {/* Billing Toggle Selector */}
          <div className="flex items-center justify-center gap-4 mt-4">
            <span className={`text-sm font-bold transition-colors ${!isAnnual ? "text-white" : "text-zinc-500"}`}>Billed Monthly</span>
            <button 
              onClick={() => setIsAnnual(!isAnnual)}
              className="w-16 h-8 bg-zinc-800 rounded-full p-1 relative flex items-center transition-all duration-300 focus:outline-none"
            >
              <div 
                className={`w-6 h-6 bg-rose-500 rounded-full shadow-md transform transition-transform duration-300 ${
                  isAnnual ? "translate-x-8" : "translate-x-0"
                }`}
              />
            </button>
            <div className="flex items-center gap-1.5">
              <span className={`text-sm font-bold transition-colors ${isAnnual ? "text-rose-400" : "text-zinc-500"}`}>Billed Annually</span>
              <Badge className="bg-rose-500/10 text-rose-400 border border-rose-500/20 font-extrabold text-[10px] uppercase px-2 py-0.5 tracking-wider">Save ~16%</Badge>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING CARDS */}
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

              // Calculate Billed Price
              const price = isAnnual 
                ? (plan.annual_price ? plan.annual_price / 12 : plan.monthly_price * 0.84)
                : plan.monthly_price;

              const isPro = plan.name.toLowerCase() === "pro";
              const isFree = plan.monthly_price === 0;

              return (
                <div 
                  key={plan.id}
                  className={`bg-white rounded-3xl p-8 shadow-xl border flex flex-col relative transition-all duration-300 hover:scale-[1.02] ${
                    isPro 
                      ? "border-zinc-900 bg-zinc-950 text-white shadow-rose-950/20" 
                      : "border-slate-100 hover:border-rose-100 bg-white text-zinc-900"
                  }`}
                >
                  {/* Decorative "Popular" badge */}
                  {isPro && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-rose-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-500/30">
                      Most Popular
                    </div>
                  )}

                  {/* Header Title */}
                  <div className="mb-6">
                    <h3 className={`text-xl font-bold uppercase tracking-widest ${isPro ? "text-rose-400" : "text-zinc-800"}`}>
                      {plan.name} Tier
                    </h3>
                    <div className="flex items-baseline gap-1 mt-3">
                      <span className="text-3xl font-black">
                        {isFree ? "Free" : `LKR ${Math.round(price).toLocaleString()}`}
                      </span>
                      {!isFree && (
                        <span className={`text-xs font-semibold ${isPro ? "text-zinc-500" : "text-zinc-400"}`}>/month</span>
                      )}
                    </div>
                    <p className={`text-xs mt-2 font-medium leading-relaxed ${isPro ? "text-zinc-400" : "text-zinc-500"}`}>
                      {isFree 
                        ? "Perfect option for independent stylers starting out." 
                        : `Advanced operational power billed ${isAnnual ? "annually" : "monthly"}.`}
                    </p>
                  </div>

                  {/* Resource & Operational Limits Grid */}
                  <div className={`grid grid-cols-2 gap-3 mb-6 p-4 rounded-2xl text-[11px] font-bold ${
                    isPro ? "bg-white/5 text-zinc-300" : "bg-slate-50 text-zinc-600"
                  }`}>
                    <div className="flex items-center gap-2">
                      <Users className={`w-3.5 h-3.5 ${isPro ? "text-rose-400" : "text-zinc-400"}`} />
                      <span>Staff: {plan.max_staff}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ScissorsIcon className={`w-3.5 h-3.5 ${isPro ? "text-rose-400" : "text-zinc-400"}`} />
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

                  {/* Features List */}
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

                  {/* CTA Actions */}
                  <Link href="/dashboard/billing" className="block w-full">
                    <Button 
                      className={`w-full h-12 rounded-xl font-bold text-xs tracking-wider uppercase transition-transform active:scale-95 shadow-md ${
                        isPro 
                          ? "bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20" 
                          : "bg-zinc-900 hover:bg-zinc-800 text-white shadow-zinc-900/10"
                      }`}
                    >
                      {isFree ? "Register Free Account" : "Upgrade Professional"}
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* FAQ SECTION */}
      <section className="max-w-4xl mx-auto px-4 mt-24">
        <div className="text-center mb-12">
          <Badge className="bg-rose-50 text-rose-600 border border-rose-100 uppercase tracking-widest font-black text-[10px] mb-3 px-3 py-1">FAQ</Badge>
          <h2 className="text-3xl font-extrabold text-[#1A1C29]">Platform Pricing Questions</h2>
          <p className="text-sm text-zinc-500 mt-2">Everything you need to know about categories, billing models, and limits.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100">
            <h4 className="font-bold text-sm text-[#1A1C29] flex items-center gap-2 mb-2">
              <HelpCircle className="w-4 h-4 text-rose-500" />
              Can I upgrade or downgrade my tier?
            </h4>
            <p className="text-xs font-semibold text-zinc-500 leading-relaxed">
              Yes, absolutely! You can modify your plan instantly inside your Salon Dashboard settings. Any payments already processed will be prorated gracefully.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100">
            <h4 className="font-bold text-sm text-[#1A1C29] flex items-center gap-2 mb-2">
              <HelpCircle className="w-4 h-4 text-rose-500" />
              What are Service Category Limits?
            </h4>
            <p className="text-xs font-semibold text-zinc-500 leading-relaxed">
              To keep Trimma search highly-optimized, tiers restrict the number of different global category directories your salon can list in. Pro and Elite tiers allow unlimited categories.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100">
            <h4 className="font-bold text-sm text-[#1A1C29] flex items-center gap-2 mb-2">
              <HelpCircle className="w-4 h-4 text-rose-500" />
              Is there a lock-in contract?
            </h4>
            <p className="text-xs font-semibold text-zinc-500 leading-relaxed">
              No contracts. Trimma is a pay-as-you-go platform. If you sign up for monthly billing, you can cancel online at any time with zero termination fees.
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
