"use client";

import React, { useState, useEffect } from "react";
import { CreditCard, Sparkles, ShieldCheck, Check, DollarSign, Calendar, FileText, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/config/supabase";
import { toast } from "sonner";

export default function BillingPage() {
  const [salon, setSalon] = useState<any>(null);
  const [activePlan, setActivePlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const plans = [
    { name: "Free", price: "LKR 0", period: "/mo", staff: "2 Staff Slots", images: "3 Images Gallery", features: ["Barber Salon allowed", "Basic Booking", "Dashboard View"] },
    { name: "Starter", price: "LKR 3,500", period: "/mo", staff: "5 Staff Slots", images: "6 Images Gallery", features: ["5 Categories allowed", "FB/WA Integration", "Free Gmail Support"] },
    { name: "Pro", price: "LKR 7,500", period: "/mo", staff: "10 Staff Slots", images: "12 Images Gallery", features: ["All Categories", "20 Service Packages", "Google Business Page"] },
    { name: "Elite", price: "LKR 15,000", period: "/mo", staff: "30 Staff Slots", images: "30 Images Gallery", features: ["Any Service Packages", "15 Branches Limit", "Priority AI Coordinator"] }
  ];

  const mockInvoices = [
    { invoiceNo: "TRM-INV-001", date: "May 01, 2026", planName: "Starter Monthly", amount: "LKR 3,500", status: "Paid" },
    { invoiceNo: "TRM-INV-002", date: "Apr 01, 2026", planName: "Starter Monthly", amount: "LKR 3,500", status: "Paid" },
    { invoiceNo: "TRM-INV-003", date: "Mar 01, 2026", planName: "Starter Monthly", amount: "LKR 3,500", status: "Paid" }
  ];

  useEffect(() => {
    fetchActivePlan();
  }, []);

  const fetchActivePlan = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: salonData } = await supabase
        .from("salons")
        .select("*")
        .or(`owner_email.eq.${session.user.email},owner_gmail.eq.${session.user.email}`)
        .maybeSingle();

      if (!salonData) return;
      setSalon(salonData);

      if (salonData.subscription_plan_id) {
        const { data: planData } = await supabase
          .from("subscription_plans")
          .select("*")
          .eq("id", salonData.subscription_plan_id)
          .maybeSingle();
        setActivePlan(planData);
      }
    } catch (err: any) {
      console.warn("Failed to load active plan details:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradePlan = (planName: string) => {
    toast.success(`Redirecting to secure gateway to subscribe to ${planName} Plan! ⚡`);
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-zinc-950 text-white flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-brand" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Subscription & Billing</h1>
            <p className="text-xs text-zinc-500">Manage memberships, download payment receipts, and upgrade plan quotas.</p>
          </div>
        </div>
      </div>

      {/* Active Membership Details */}
      {activePlan && (
        <div className="bg-brand text-white p-6 rounded-3xl shadow-sm relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 space-y-2">
            <span className="inline-flex bg-white/10 text-white px-3.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider mb-1">
               Active Membership Tier
            </span>
            <h2 className="text-2xl font-black">{activePlan.name} Plan</h2>
            <p className="text-white/70 text-xs">
              Supports up to {activePlan.max_staff} stylists, {activePlan.max_images} gallery images, and full branch support.
            </p>
          </div>

          <div className="relative z-10 bg-white/10 rounded-2xl p-4 border border-white/10 text-right min-w-[200px]">
            <span className="text-[10px] font-bold text-white/60 uppercase block">Next Invoice Date</span>
            <div className="text-base font-extrabold mt-0.5">June 01, 2026</div>
            <div className="text-xs text-white/80 mt-1">LKR {parseFloat(activePlan.monthly_price).toLocaleString()} / month</div>
          </div>
        </div>
      )}

      {/* Pricing Upgrade Grid */}
      <div className="space-y-6 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <h3 className="text-sm font-bold text-zinc-900 border-b pb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-brand" />
          Available Subscription Packages
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {plans.map((p, idx) => {
            const isActive = activePlan && activePlan.name.toLowerCase() === p.name.toLowerCase();
            return (
              <div 
                key={idx} 
                className={`rounded-3xl p-5 border flex flex-col justify-between space-y-6 relative ${
                  isActive 
                  ? "border-brand bg-rose-50/10 shadow-sm" 
                  : "border-zinc-100 bg-white hover:border-zinc-200"
                }`}
              >
                {isActive && (
                  <span className="absolute top-4 right-4 bg-rose-50 text-brand font-extrabold text-[8px] tracking-wider uppercase px-2.5 py-0.5 rounded-full border border-rose-100">
                    Active Tier
                  </span>
                )}

                <div className="space-y-4 pt-4">
                  <div>
                    <h4 className="font-extrabold text-sm text-zinc-800">{p.name}</h4>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-xl font-black text-zinc-900">{p.price}</span>
                      <span className="text-zinc-400 text-xs font-semibold">{p.period}</span>
                    </div>
                  </div>

                  <ul className="space-y-2 text-[11px] font-semibold text-zinc-500">
                    <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-brand shrink-0" /> {p.staff}</li>
                    <li className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-brand shrink-0" /> {p.images}</li>
                    {p.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-zinc-400 shrink-0" /> {feat}</li>
                    ))}
                  </ul>
                </div>

                {!isActive && (
                  <Button 
                    onClick={() => handleUpgradePlan(p.name)}
                    className="w-full rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs h-10 flex items-center justify-center gap-1"
                  >
                    Upgrade Tier <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Invoice History */}
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
              {mockInvoices.map((inv, idx) => (
                <tr key={idx} className="hover:bg-zinc-50/50 transition-colors text-xs font-semibold text-zinc-600">
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
