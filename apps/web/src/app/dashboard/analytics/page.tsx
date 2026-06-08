"use client";

import React, { useState, useEffect } from "react";
import { BarChart3, TrendingUp, Award, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchSalonDashboardPage } from "@/app/actions/salon-dashboard-data";
import { getBookingAmount, formatLkr, groupBookingsByDay } from "@/lib/dashboard-stats";

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);
  const [stylistSales, setStylistSales] = useState<any[]>([]);
  const [stats, setStats] = useState({ revenue: 0, bookings: 0, aov: 0, utilization: 0 });
  const [timeframe, setTimeframe] = useState("Last 30 Days");
  const [offsetWeeks, setOffsetWeeks] = useState(0);
  const [allBookings, setAllBookings] = useState<any[]>([]);
  const [allStaff, setAllStaff] = useState<any[]>([]);

  useEffect(() => {
    if (allBookings.length > 0) {
      const daily = groupBookingsByDay(allBookings, 7, offsetWeeks);
      
      const maxRev = Math.max(...daily.map(m => m.revenue), 1);
      const mappedChartData = daily.map(m => {
        const percentage = (m.revenue / maxRev) * 100;
        let heightClass = "h-16";
        if (percentage > 80) heightClass = "h-60";
        else if (percentage > 60) heightClass = "h-48";
        else if (percentage > 40) heightClass = "h-40";
        else if (percentage > 20) heightClass = "h-32";
        else heightClass = "h-24";
        
        return {
          label: m.label,
          revenue: m.revenue,
          height: heightClass,
          bookings: m.bookings
        };
      });
      setChartData(mappedChartData);

      // Determine the start and end dates for the currently selected week (7 days)
      const endDateObj = new Date();
      endDateObj.setHours(0, 0, 0, 0);
      endDateObj.setDate(endDateObj.getDate() - (offsetWeeks * 7));
      
      const startDateObj = new Date(endDateObj);
      startDateObj.setDate(startDateObj.getDate() - 6); // 7 day window including end date

      const startMs = startDateObj.getTime();
      const endMs = endDateObj.getTime() + 86400000; // include the whole end day

      // Filter bookings for the selected 7-day timeframe
      const timeframeBookings = allBookings.filter(b => {
        if (!b.booking_date) return false;
        const d = new Date(b.booking_date).getTime();
        return d >= startMs && d < endMs;
      });

      // Aggregate Stylist Sales (All Operation Staff) for this week
      const stylistMap = new Map<string, { name: string, bookings: number, total: number, utilization: number }>();
      
      // Initialize with all operation staff first so even those with 0 bookings show up
      if (allStaff.length > 0) {
        for (const s of allStaff) {
          stylistMap.set(s.id, { name: s.name, bookings: 0, total: 0, utilization: 0 });
        }
      }

      for (const b of timeframeBookings) {
        if (b.status === "cancelled") continue;
        const staffId = (b as any).staff_id;
        if (!staffId) continue; // Skip unassigned
        
        const current = stylistMap.get(staffId) || { name: `Staff ${staffId}`, bookings: 0, total: 0, utilization: 0 };
        current.bookings += 1;
        current.total += Number(b.amount || 0);
        stylistMap.set(staffId, current);
      }

      const sortedStylists = [...stylistMap.values()]
        .sort((a, b) => b.bookings - a.bookings)
        .slice(0, 5) // Show top 5
        .map(s => {
          const availableSlotsPerStaffWeekly = 7 * 8; // approx 56 slots a week
          const utilPercent = availableSlotsPerStaffWeekly > 0 ? Math.round((s.bookings / availableSlotsPerStaffWeekly) * 100) : 0;
          return {
            name: s.name,
            role: "Operation Staff",
            bookings: s.bookings,
            utilization: utilPercent,
            total: `LKR ${formatLkr(s.total)}`
          };
        });
      
      setStylistSales(sortedStylists);

    }
  }, [offsetWeeks, allBookings, allStaff]);

  useEffect(() => {
    void fetchSalonDashboardPage().then((res) => {
      if (res.success && res.bookings) {
        setAllBookings(res.bookings);
        if (res.staff) setAllStaff(res.staff);

        const totalRevenue = res.bookings.reduce((sum, b) => sum + Number(b.amount || 0), 0);
        const totalBookings = res.bookings.length;
        
        // Average Order Value = total revenue / number of executed bookings
        const executedBookingsCount = res.bookings.filter((b: any) => b.status === "completed" || b.status === "confirmed" || b.status === "in_progress").length;
        const aov = executedBookingsCount > 0 ? totalRevenue / executedBookingsCount : 0;
        
        // Staff utilization = used slots / available slots
        const usedSlots = executedBookingsCount;
        const totalStaffCount = res.staff ? res.staff.length : 1;
        // Assume roughly 30 days, 8 slots per day per staff for availability calculation
        const availableSlots = totalStaffCount * 30 * 8; 
        const utilization = availableSlots > 0 ? Math.round((usedSlots / availableSlots) * 100) : 0;

        setStats({
          revenue: totalRevenue,
          bookings: executedBookingsCount,
          aov: aov,
          utilization: utilization
        });
        setTimeframe("Last 30 Days");
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
          <span className="text-[9px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mt-2 inline-block">{timeframe}</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Appointments Completed</span>
          <h3 className="text-xl font-black text-[#1A1C29] mt-1">{stats.bookings} Bookings</h3>
          <span className="text-[9px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mt-2 inline-block">{timeframe}</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Staff Utilization</span>
          <h3 className="text-xl font-black text-[#1A1C29] mt-1">{stats.utilization}%</h3>
          <span className="text-[9px] font-semibold text-brand bg-rose-50 px-2 py-0.5 rounded-full mt-2 inline-block">Used / Available Slots</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Average Order Value</span>
          <h3 className="text-xl font-black text-zinc-800 mt-1">LKR {formatLkr(stats.aov)}</h3>
          <span className="text-[9px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mt-2 inline-block">Revenue / Booking</span>
        </div>
      </div>

      {/* Revenue growth Chart Mock */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b pb-4">
            <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brand" />
              Gross Daily Sales Growth {offsetWeeks === 0 ? "(Last 7 Days)" : `(${offsetWeeks} Week${offsetWeeks > 1 ? 's' : ''} Ago)`}
            </h3>
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-0.5">
                <button
                  onClick={() => setOffsetWeeks(prev => prev + 1)}
                  className="px-2 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-md transition-colors"
                >
                  &lt; Previous
                </button>
                <div className="w-px h-4 bg-slate-300 mx-1"></div>
                <button
                  onClick={() => setOffsetWeeks(prev => Math.max(0, prev - 1))}
                  disabled={offsetWeeks === 0}
                  className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${offsetWeeks === 0 ? 'text-slate-400 cursor-not-allowed' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'}`}
                >
                  Next &gt;
                </button>
              </div>
            </div>
          </div>

          {/* Chart Display */}
          <div className="flex items-end justify-between h-72 pt-8 px-4 relative mt-4">
            {chartData.map((data, idx) => (
              <div key={idx} className="flex flex-col items-center gap-2 w-1/7 group cursor-pointer h-full justify-end">
                {/* Persistent Data Labels */}
                <div className="flex flex-col items-center text-center pb-1">
                  <span className="text-[10px] font-black text-zinc-800 leading-tight">LKR {formatLkr(data.revenue)}</span>
                  <span className="text-[9px] font-bold text-zinc-400">{data.bookings} Bookings</span>
                </div>
                {/* Bar */}
                <div className={`w-12 bg-zinc-900 group-hover:bg-brand rounded-t-xl transition-all duration-300 relative overflow-hidden shadow-inner ${data.height}`}>
                   <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>
                {/* Day label */}
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{data.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Stylists Performance List */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <h3 className="text-sm font-bold text-zinc-900 border-b pb-4 flex items-center gap-2">
            <Award className="w-4 h-4 text-brand" />
            Top Stylists Performance {offsetWeeks === 0 ? "(This Week)" : `(${offsetWeeks} Week${offsetWeeks > 1 ? 's' : ''} Ago)`}
          </h3>

          <div className="space-y-4">
            {stylistSales.map((stylist, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                <div>
                  <h4 className="font-bold text-xs text-zinc-800">{stylist.name}</h4>
                  <p className="text-[9px] text-zinc-400 mt-0.5">{stylist.role} • {stylist.bookings} Bookings Catered</p>
                </div>
                <div className="text-right">
                  <div className="text-xs font-black text-brand">{stylist.utilization}%</div>
                  <span className="text-[8px] text-zinc-400 block mt-0.5">Utilization</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
