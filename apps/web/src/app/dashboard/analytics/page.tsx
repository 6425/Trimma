"use client";

import React, { useState, useEffect } from "react";
import { BarChart3, TrendingUp, Award, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchSalonDashboardPage } from "@/app/actions/salon-dashboard-data";
import { getBookingAmount, formatLkr, groupBookingsByMonth } from "@/lib/dashboard-stats";

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);
  const [stylistSales, setStylistSales] = useState<any[]>([]);
  const [stats, setStats] = useState({ revenue: 0, bookings: 0 });

  useEffect(() => {
    void fetchSalonDashboardPage().then((res) => {
      if (res.success && res.bookings) {
        const monthly = groupBookingsByMonth(res.bookings, 5);
        
        // Map MonthlyPoint to the expected chart format
        const maxRev = Math.max(...monthly.map(m => m.revenue), 1);
        const mappedChartData = monthly.map(m => {
          const percentage = (m.revenue / maxRev) * 100;
          let heightClass = "h-16";
          if (percentage > 80) heightClass = "h-60";
          else if (percentage > 60) heightClass = "h-48";
          else if (percentage > 40) heightClass = "h-40";
          else if (percentage > 20) heightClass = "h-32";
          else heightClass = "h-24";
          
          return {
            month: m.label,
            revenue: m.revenue,
            height: heightClass,
            bookings: m.bookings
          };
        });
        setChartData(mappedChartData);

        // Aggregate Stylist Sales
        const stylistMap = new Map<string, { name: string, services: number, total: number }>();
        for (const b of res.bookings) {
          if (b.status === "cancelled") continue;
          const staffId = (b as any).staff_id || "Unassigned";
          const current = stylistMap.get(staffId) || { name: `Staff ${staffId}`, services: 0, total: 0 };
          current.services += 1;
          current.total += getBookingAmount(b);
          stylistMap.set(staffId, current);
        }
        
        // Match names if possible
        if (res.staff) {
          for (const s of res.staff) {
            const current = stylistMap.get(s.id);
            if (current) {
              current.name = s.name;
              stylistMap.set(s.id, current);
            }
          }
        }

        const sortedStylists = [...stylistMap.values()]
          .sort((a, b) => b.total - a.total)
          .slice(0, 3)
          .map(s => ({
            name: s.name.replace("Staff Unassigned", "Unassigned"),
            role: "Professional",
            services: s.services,
            total: `LKR ${formatLkr(s.total)}`
          }));
        
        setStylistSales(sortedStylists);

        setStats({
          revenue: res.bookings.reduce((sum, b) => sum + getBookingAmount(b), 0),
          bookings: res.bookings.length
        });
      }
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-brand mb-4" />
        <p className="text-zinc-500 font-medium">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-zinc-950 text-white flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-brand" />
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
          <h3 className="text-xl font-black text-brand mt-1">LKR {formatLkr(stats.revenue)}</h3>
          <span className="text-[9px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mt-2 inline-block">Actual</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Appointments Completed</span>
          <h3 className="text-xl font-black text-[#1A1C29] mt-1">{stats.bookings} Bookings</h3>
          <span className="text-[9px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mt-2 inline-block">Actual</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Stylist Occupancy</span>
          <h3 className="text-xl font-black text-[#1A1C29] mt-1">82.4% Hours</h3>
          <span className="text-[9px] font-semibold text-brand bg-rose-50 px-2 py-0.5 rounded-full mt-2 inline-block">Optimal busy rate</span>
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
              <TrendingUp className="w-4 h-4 text-brand" />
              Gross Monthly Sales Growth (2026)
            </h3>
            <span className="text-[9px] font-extrabold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-wider">LKR Currency</span>
          </div>

          {/* Chart Display */}
          <div className="flex items-end justify-between h-72 pt-8 px-4 relative">
            {chartData.map((data, idx) => (
              <div key={idx} className="flex flex-col items-center gap-3 w-1/6 group cursor-pointer">
                {/* Tooltip value */}
                <span className="text-[9px] font-extrabold text-brand opacity-0 group-hover:opacity-100 transition-opacity bg-rose-50 border border-rose-100 px-2 py-0.5 rounded shadow-sm">
                  LKR {(data.revenue / 1000).toFixed(0)}k
                </span>
                {/* Bar */}
                <div className={`w-12 bg-zinc-900 group-hover:bg-brand rounded-t-xl transition-all duration-300 relative overflow-hidden shadow-inner ${data.height}`}>
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
            <Award className="w-4 h-4 text-brand" />
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
                  <div className="text-xs font-black text-brand">{stylist.total}</div>
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
