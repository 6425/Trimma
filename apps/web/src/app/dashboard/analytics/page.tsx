"use client";

import React from "react";
import { BarChart3, TrendingUp, Sparkles, DollarSign, Calendar, Users, Award, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AnalyticsPage() {
  const chartData = [
    { month: "Jan", revenue: 45000, height: "h-24", bookings: 120 },
    { month: "Feb", revenue: 58000, height: "h-32", bookings: 142 },
    { month: "Mar", revenue: 72000, height: "h-40", bookings: 184 },
    { month: "Apr", revenue: 95000, height: "h-48", bookings: 210 },
    { month: "May", revenue: 125000, height: "h-60", bookings: 288 }
  ];

  const stylistSales = [
    { name: "Dilshan Fernando", role: "Master Barber", services: 114, total: "LKR 148,000" },
    { name: "Ruvini Jayasekara", role: "Nail Artist", services: 82, total: "LKR 92,000" },
    { name: "Nimesh Perera", role: "Hair Stylist", services: 56, total: "LKR 78,000" }
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-zinc-950 text-white flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-[#D81E5B]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Reports & Analytics</h1>
            <p className="text-xs text-zinc-500">Track visual metrics, sales performance, stylist hours, and conversion tracking.</p>
          </div>
        </div>
      </div>

      {/* Analytics Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Gross Sales Revenue</span>
          <h3 className="text-xl font-black text-[#D81E5B] mt-1">LKR 388,500</h3>
          <span className="text-[9px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mt-2 inline-block">+14.2% MoM</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Appointments Completed</span>
          <h3 className="text-xl font-black text-[#1A1C29] mt-1">944 Bookings</h3>
          <span className="text-[9px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mt-2 inline-block">98.2% fulfillment</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Stylist Occupancy</span>
          <h3 className="text-xl font-black text-[#1A1C29] mt-1">82.4% Hours</h3>
          <span className="text-[9px] font-semibold text-[#D81E5B] bg-rose-50 px-2 py-0.5 rounded-full mt-2 inline-block">Optimal busy rate</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Average Order Value</span>
          <h3 className="text-xl font-black text-zinc-800 mt-1">LKR 4,120</h3>
          <span className="text-[9px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mt-2 inline-block">+4% basket size</span>
        </div>
      </div>

      {/* Revenue growth Chart Mock */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b pb-4">
            <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#D81E5B]" />
              Gross Monthly Sales Growth (2026)
            </h3>
            <span className="text-[9px] font-extrabold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-wider">LKR Currency</span>
          </div>

          {/* Chart Display */}
          <div className="flex items-end justify-between h-72 pt-8 px-4 relative">
            {chartData.map((data, idx) => (
              <div key={idx} className="flex flex-col items-center gap-3 w-1/6 group cursor-pointer">
                {/* Tooltip value */}
                <span className="text-[9px] font-extrabold text-[#D81E5B] opacity-0 group-hover:opacity-100 transition-opacity bg-rose-50 border border-rose-100 px-2 py-0.5 rounded shadow-sm">
                  LKR {(data.revenue / 1000).toFixed(0)}k
                </span>
                {/* Bar */}
                <div className={`w-12 bg-zinc-900 group-hover:bg-[#D81E5B] rounded-t-xl transition-all duration-300 relative overflow-hidden shadow-inner ${data.height}`}>
                   <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>
                {/* Month label */}
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{data.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Stylists Performance List */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <h3 className="text-sm font-bold text-zinc-900 border-b pb-4 flex items-center gap-2">
            <Award className="w-4 h-4 text-[#D81E5B]" />
            Top Stylists Performance
          </h3>

          <div className="space-y-4">
            {stylistSales.map((stylist, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                <div>
                  <h4 className="font-bold text-xs text-zinc-800">{stylist.name}</h4>
                  <p className="text-[9px] text-zinc-400 mt-0.5">{stylist.role} • {stylist.services} cuts</p>
                </div>
                <div className="text-right">
                  <div className="text-xs font-black text-[#D81E5B]">{stylist.total}</div>
                  <span className="text-[8px] text-zinc-400 block mt-0.5">Sales Volume</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
