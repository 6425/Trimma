"use client";

import React from "react";
import Link from "next/link";
import { 
  Store, Scissors, Users, CreditCard, 
  Settings, ChevronRight, ShieldCheck 
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SettingsPortalPage() {
  const settingsSections = [
    {
      title: "Salon Profile",
      description: "Manage salon details, logo, gallery images, description, and contact info.",
      icon: <Store className="w-6 h-6 text-brand" />,
      href: "/dashboard/profile",
      cta: "Configure Profile"
    },
    {
      title: "Services & Catalog",
      description: "Customize your active grooming menu, price listing, and service durations.",
      icon: <Scissors className="w-6 h-6 text-indigo-500" />,
      href: "/dashboard/services",
      cta: "Manage Services"
    },
    {
      title: "Staff & Stylists",
      description: "Set stylist schedules, service assignments, and custom working hours.",
      icon: <Users className="w-6 h-6 text-emerald-500" />,
      href: "/dashboard/staff",
      cta: "Configure Team"
    },
    {
      title: "Billing & Subscriptions",
      description: "View active salon subscription plans, upgrade limits, and billing details.",
      icon: <CreditCard className="w-6 h-6 text-amber-500" />,
      href: "/dashboard/billing",
      cta: "View Subscription"
    }
  ];

  return (
    <div className="space-y-8 max-w-4xl mx-auto p-4 font-sans">
      {/* Header */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
        <div className="w-14 h-14 bg-brand/10 rounded-2xl flex items-center justify-center shrink-0">
          <Settings className="w-7 h-7 text-brand" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-zinc-900 tracking-tight">Settings Control Center</h1>
          <p className="text-zinc-500 text-sm mt-0.5">Central hub to manage your salon storefront, pricing catalog, team schedules, and account credentials.</p>
        </div>
      </div>

      {/* Grid of Control Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {settingsSections.map((section, idx) => (
          <Link key={idx} href={section.href} className="group bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-brand/20 transition-all flex flex-col justify-between cursor-pointer">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-slate-50 group-hover:bg-slate-100 rounded-2xl flex items-center justify-center transition-colors">
                  {section.icon}
                </div>
                <ChevronRight className="w-5 h-5 text-zinc-300 group-hover:text-brand group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 mb-2 group-hover:text-brand transition-colors">{section.title}</h3>
              <p className="text-zinc-500 text-sm leading-relaxed mb-6 font-medium">
                {section.description}
              </p>
            </div>
            <Button variant="outline" className="w-full rounded-2xl border-slate-200 group-hover:border-brand group-hover:text-brand font-bold text-xs h-10 mt-auto bg-slate-50/50">
              {section.cta}
            </Button>
          </Link>
        ))}
      </div>

      {/* Security & Access Info Card */}
      <div className="bg-slate-900 text-white p-6 md:p-8 rounded-3xl border border-zinc-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0 border border-white/10">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h3 className="font-bold text-lg mb-1 tracking-tight">Security & Credentials</h3>
            <p className="text-zinc-400 text-sm max-w-xl font-medium">
              Your business operations are fully protected with end-to-end encryption. Credentials and profile integrations are securely linked to your Supabase security vault.
            </p>
          </div>
        </div>
        <Button className="rounded-2xl border border-[#f9e000]/50 bg-[#f9e000]/10 text-[#f9e000] hover:bg-[#f9e000]/20 hover:border-[#f9e000] hover:text-[#fff033] font-bold h-11 px-6 whitespace-nowrap">
          Access Vault
        </Button>
      </div>
    </div>
  );
}
