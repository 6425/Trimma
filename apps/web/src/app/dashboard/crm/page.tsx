"use client";

import React, { useState, useEffect } from "react";
import { MessageSquare, Sparkles, Star, Cake, Award, BellRing, ArrowRight, UserCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchSalonDashboardPage } from "@/app/actions/salon-dashboard-data";

export default function CRMPage() {
  const [loading, setLoading] = useState(true);
  const [clientTiers, setClientTiers] = useState({ royal: 0, elite: 0, premium: 0 });
  const [recentNotes, setRecentNotes] = useState<any[]>([]);

  useEffect(() => {
    void fetchSalonDashboardPage().then((res) => {
      if (res.success && res.bookings) {
        // Calculate visits per customer email
        const visitCounts: Record<string, number> = {};
        res.bookings.forEach((b: any) => {
          if (b.status === "cancelled") return;
          const email = b.customer_email || "Unknown";
          if (email !== "Unknown") {
            visitCounts[email] = (visitCounts[email] || 0) + 1;
          }
        });
        
        let royal = 0, elite = 0, premium = 0;
        Object.values(visitCounts).forEach(count => {
          if (count >= 10) royal++;
          else if (count >= 5) elite++;
          else if (count >= 2) premium++;
        });
        
        setClientTiers({ royal, elite, premium });

        // Generate some basic notes from recent bookings if no actual notes table exists
        const notes = res.bookings.slice(0, 3).map((b: any) => ({
          client: b.customer_email || "Walk-in Customer",
          note: `Booked service. Amount: LKR ${b.amount}. Status: ${b.status}`,
          date: new Date(b.created_at).toLocaleDateString()
        }));
        setRecentNotes(notes);
      }
      setLoading(false);
    });
  }, []);

  const loyaltyPrograms = [
    { name: "Birthday Reward Spa", trigger: "Client's Birthday", benefit: "Free Hair Spa Therapy", active: true },
    { name: "First-Time Winback Deal", trigger: "Lapsed > 60 Days", benefit: "LKR 500 discount coupon", active: true },
    { name: "Referral Bonus Points", trigger: "Referred Friend Booked", benefit: "500 Loyalty points ($5 value)", active: true }
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-brand mb-4" />
        <p className="text-zinc-500 font-medium">Loading CRM data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 text-zinc-900 flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-brand" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight">CRM & Relationship Center</h1>
            <p className="text-xs text-zinc-500">Automate customer retention, custom loyalty rules, and stylist CRM notes.</p>
          </div>
        </div>
        
        <Button className="h-10 rounded-xl bg-brand hover:bg-brand-hover text-black font-bold text-xs flex items-center gap-1.5 shadow-md shadow-brand/20">
          <Award className="w-3.5 h-3.5" /> Setup Loyalty Rule
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Automated Loyalty Campaigns */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            <h3 className="text-sm font-bold text-zinc-900 border-b pb-3 flex items-center gap-2">
              <Star className="w-4 h-4 text-brand" />
              Automated Retention & Loyalty Rules
            </h3>

            <div className="space-y-4">
              {loyaltyPrograms.map((prog, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0">
                      {idx === 0 ? <Cake className="w-5 h-5" /> : idx === 1 ? <BellRing className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-zinc-800">{prog.name}</h4>
                      <p className="text-[10px] text-zinc-400 mt-0.5">Trigger: {prog.trigger} • Benefit: {prog.benefit}</p>
                    </div>
                  </div>

                  <span className="bg-emerald-50 text-emerald-600 font-extrabold text-[8px] tracking-wider uppercase px-2.5 py-1 rounded-full">
                    Active
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* CRM Stylist Notes */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            <h3 className="text-sm font-bold text-zinc-900 border-b pb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand" />
              Stylist Care & Service Notes
            </h3>

            <div className="space-y-4">
              {recentNotes.map((note, idx) => (
                <div key={idx} className="p-4 bg-zinc-50/50 rounded-2xl border border-zinc-100">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-xs text-zinc-800">{note.client}</span>
                    <span className="text-[9px] text-zinc-400 font-semibold">{note.date}</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-2 leading-relaxed font-sans">{note.note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Customer Tiers Metrics */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 text-zinc-900 p-6 rounded-3xl shadow-sm relative overflow-hidden">
            <Award className="absolute -right-6 -bottom-6 w-32 h-32 text-zinc-100 rotate-12" />
            
            <div className="relative z-10 space-y-6">
              <div>
                <span className="inline-flex bg-zinc-100 text-zinc-600 px-3.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider mb-2">
                  Client Retention
                </span>
                <h3 className="text-base font-bold text-zinc-900">VIP Loyalty Tiers</h3>
                <p className="text-zinc-500 text-[10px] mt-1.5 leading-relaxed">
                  Automatically categorize your client base by lifetime spend to deliver exclusive seasonal discount cards.
                </p>
              </div>

              <div className="space-y-3.5 pt-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-600 font-medium">👑 Royal Diamond (10+ visits)</span>
                  <span className="font-black text-brand">{clientTiers.royal} clients</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-600 font-medium">⭐ Elite Platinum (5+ visits)</span>
                  <span className="font-black text-amber-500">{clientTiers.elite} clients</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-600 font-medium">💅 Premium Gold (2+ visits)</span>
                  <span className="font-black text-emerald-400">{clientTiers.premium} clients</span>
                </div>
              </div>

              <Button className="w-full bg-white text-zinc-900 hover:bg-zinc-100 font-bold h-11 rounded-xl text-xs flex items-center justify-center gap-1.5">
                View Member Rules <ArrowRight className="w-4 h-4 text-brand" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
