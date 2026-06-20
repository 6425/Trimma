"use client";

import React from "react";
import { Sparkles, Plus, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MarketingPage() {
  const activeCampaigns = [
    { name: "Avurudu Salon Makeover Promo", channel: "WhatsApp Blast", sent: 480, opened: "94%", conversions: 54, roi: "LKR 112,000" },
    { name: "Lapsed Clients Winback Coupon", channel: "Email Newsletter", sent: 120, opened: "68%", conversions: 14, roi: "LKR 28,000" },
    { name: "Weekend Special Haircut Deal", channel: "SMS Broadcast", sent: 850, opened: "99%", conversions: 96, roi: "LKR 148,000" }
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 text-zinc-900 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-brand" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Marketing Campaigns</h1>
            <p className="text-xs text-zinc-500">Run highly-targeted bulk SMS, email, and WhatsApp promotional broadcasts to grow sales.</p>
          </div>
        </div>
        
        <Button className="h-10 rounded-xl bg-brand hover:bg-brand-hover text-black font-bold text-xs flex items-center gap-1.5 shadow-md shadow-brand/20">
          <Plus className="w-3.5 h-3.5" /> Launch Campaign
        </Button>
      </div>

      {/* Marketing Performance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Total Campaigns Run</span>
          <h3 className="text-xl font-black text-[#1A1C29] mt-1">24 Campaigns</h3>
          <span className="text-[9px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mt-2 inline-block">+4 this month</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Messages Broadcast</span>
          <h3 className="text-xl font-black text-[#1A1C29] mt-1">4,280 Clients</h3>
          <span className="text-[9px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mt-2 inline-block">92% deliverability</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Promo Conversions</span>
          <h3 className="text-xl font-black text-[#1A1C29] mt-1">164 Bookings</h3>
          <span className="text-[9px] font-semibold text-brand bg-rose-50 px-2 py-0.5 rounded-full mt-2 inline-block">3.8% Click-Through</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Generated Revenue ROI</span>
          <h3 className="text-xl font-black text-brand mt-1">LKR 288,000</h3>
          <span className="text-[9px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mt-2 inline-block">Direct attribution</span>
        </div>
      </div>

      {/* Campaigns list */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
        <h3 className="text-sm font-bold text-zinc-900 border-b pb-3 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-brand" />
          Historical Campaigns & ROI Analytics
        </h3>

        <div className="overflow-x-auto border border-zinc-100 rounded-2xl">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-50 text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-200">
                <th className="px-6 py-4">Campaign Name</th>
                <th className="px-6 py-4">Broadcast Channel</th>
                <th className="px-6 py-4">Recipients</th>
                <th className="px-6 py-4">Open/Read Rate</th>
                <th className="px-6 py-4">Total Bookings</th>
                <th className="px-6 py-4 text-right">Revenue ROI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {activeCampaigns.map((c, idx) => (
                <tr key={idx} className="hover:bg-zinc-50/50 transition-colors text-xs font-semibold text-zinc-600">
                  <td className="px-6 py-4 font-bold text-zinc-800">{c.name}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                      c.channel.includes("WhatsApp") ? "bg-emerald-50 text-emerald-600" : c.channel.includes("Email") ? "bg-purple-50 text-purple-600" : "bg-blue-50 text-blue-600"
                    }`}>
                      {c.channel}
                    </span>
                  </td>
                  <td className="px-6 py-4">{c.sent} clients</td>
                  <td className="px-6 py-4 text-zinc-800 font-bold">{c.opened}</td>
                  <td className="px-6 py-4 text-zinc-800 font-bold">{c.conversions} bookings</td>
                  <td className="px-6 py-4 text-right text-brand font-black">{c.roi}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
