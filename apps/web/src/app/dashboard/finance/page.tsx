// apps/web/src/app/dashboard/finance/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { DollarSign, History, Calendar, FileText, ArrowDownRight, Activity, Loader2, ArrowRight, TrendingUp, Sparkles, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/config/supabase";
import { useRouter } from "next/navigation";

interface BookingSplit {
  entity_type: "platform" | "salon" | "agent";
  amount: number;
  description: string;
}

interface BookingWithSplits {
  id: string;
  booking_no: string;
  booking_date: string;
  booking_time: string;
  amount: number;
  status: string;
  customer_email: string;
  created_at: string;
  splits: BookingSplit[];
}

export default function FinanceDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [salon, setSalon] = useState<any>(null);
  const [bookings, setBookings] = useState<BookingWithSplits[]>([]);
  const [filter, setFilter] = useState<string>("all"); // 'all' | 'completed' | 'pending' | 'cancelled'
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null);

  const [stats, setStats] = useState({
    grossRevenue: 0,
    platformComm: 0,
    agentComm: 0,
    netYield: 0,
    completedCount: 0
  });

  useEffect(() => {
    async function loadFinanceData() {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
        
        // 1. Resolve Salon ID dynamically from active user session
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.replace("/login?redirectTo=/dashboard/finance");
          return;
        }

        const { data: salonData } = await supabase
          .from("salons")
          .select("*")
          .eq("owner_email", session.user.email)
          .maybeSingle();

        if (!salonData) {
          setLoading(false);
          return;
        }

        setSalon(salonData);

        // 2. Fetch bookings
        const bookingsRes = await fetch(`${API_URL}/salons/${salonData.id}/bookings`);
        if (bookingsRes.ok) {
          const bookingsData = await bookingsRes.json();
          
          // Sort bookings by creation date descending
          bookingsData.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          
          // 3. Resolve splits for each booking dynamically
          const resolvedBookings = bookingsData.map((b: any) => {
            const amount = parseFloat(b.amount || 0);
            
            // Standard 80/10/10 split
            const splits: BookingSplit[] = [
              { entity_type: "salon", amount: amount * 0.8, description: "Salon Net Yield (80%)" },
              { entity_type: "platform", amount: amount * 0.1, description: "Platform Fee (10%)" },
              { entity_type: "agent", amount: amount * 0.1, description: "Agent Commission (10%)" }
            ];

            return {
              ...b,
              splits
            };
          });

          setBookings(resolvedBookings);

          // 4. Calculate aggregates (based on completed/confirmed bookings)
          let gross = 0;
          let platform = 0;
          let agent = 0;
          let net = 0;
          let completed = 0;

          resolvedBookings.forEach((b: BookingWithSplits) => {
            if (b.status === "completed" || b.status === "confirmed") {
              const amt = parseFloat(b.amount as any || 0);
              gross += amt;
              platform += amt * 0.1;
              agent += amt * 0.1;
              net += amt * 0.8;
              completed += 1;
            }
          });

          setStats({
            grossRevenue: gross,
            platformComm: platform,
            agentComm: agent,
            netYield: net,
            completedCount: completed
          });
        }
      } catch (err) {
        console.error("Failed to load finance data", err);
      } finally {
        setLoading(false);
      }
    }
    loadFinanceData();
  }, [router]);

  const formatLKR = (amount: number) => {
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      });
    } catch (e) {
      return dateStr;
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20";
      case "confirmed":
        return "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20";
      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20";
      default:
        return "bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20";
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (filter === "all") return true;
    if (filter === "completed") return b.status === "completed" || b.status === "confirmed";
    return b.status === filter;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#D81E5B]" />
        <p className="text-zinc-500 font-medium">Reconciling financial ledgers...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto p-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 text-[10px] font-bold tracking-wider bg-brand-primary/10 text-[#D81E5B] uppercase rounded-full">Sprint 5 Ledger</span>
            <span className="flex items-center gap-1 text-[10px] font-semibold text-zinc-400">
              <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" /> Direct Splits Enabled
            </span>
          </div>
          <h1 className="text-3xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">Finance &amp; Revenue</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-0.5">Real-time ledger audit showing gross bookings, platform fee deductions, and referrer splits.</p>
        </div>
        <div className="flex gap-2">
          <Button className="bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-750 font-bold rounded-2xl shadow-sm h-11 px-5 flex items-center gap-2 text-xs transition-all">
            <FileText className="w-4 h-4" /> Export Ledger
          </Button>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Revenue */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/5 rounded-3xl p-5 shadow-sm space-y-3 relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Gross Bookings</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-50">{formatLKR(stats.grossRevenue)}</h3>
            <p className="text-[10px] text-zinc-500">From {stats.completedCount} successful bookings</p>
          </div>
        </div>

        {/* Salon Share */}
        <div className="bg-gradient-to-br from-[#1A1C29] to-[#2D3142] rounded-3xl p-5 shadow-xl text-white space-y-3 relative overflow-hidden group hover:-translate-y-0.5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Salon Net Yield (80%)</span>
            <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white">
              🏢
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-black text-white">{formatLKR(stats.netYield)}</h3>
            <p className="text-[10px] text-white/60">Calculated salon net share</p>
          </div>
        </div>

        {/* Platform Share */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/5 rounded-3xl p-5 shadow-sm space-y-3 relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Platform Fee (10%)</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center text-[#D81E5B]">
              💼
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-50">{formatLKR(stats.platformComm)}</h3>
            <p className="text-[10px] text-zinc-500">Base engine fee applied</p>
          </div>
        </div>

        {/* Agent Share */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/5 rounded-3xl p-5 shadow-sm space-y-3 relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Agent Commission (10%)</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-450">
              🤝
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-50">{formatLKR(stats.agentComm)}</h3>
            <p className="text-[10px] text-zinc-500">Referrer acquisition payouts</p>
          </div>
        </div>
      </div>

      {/* Main Ledger Section */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-5">
          <div>
            <h2 className="font-bold text-lg text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <Activity className="w-5 h-5 text-zinc-400" /> Bookings Ledger &amp; Breakdown
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">Click any booking row to review the platform, salon, and agent split breakdowns.</p>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-zinc-800 p-1.5 rounded-2xl">
            <Button
              onClick={() => setFilter("all")}
              className={`h-8 px-3 text-xs font-bold rounded-xl transition-all shadow-none border-none ${
                filter === "all"
                  ? "bg-white dark:bg-zinc-700 text-zinc-950 dark:text-white"
                  : "bg-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-900"
              }`}
            >
              All
            </Button>
            <Button
              onClick={() => setFilter("completed")}
              className={`h-8 px-3 text-xs font-bold rounded-xl transition-all shadow-none border-none ${
                filter === "completed"
                  ? "bg-white dark:bg-zinc-700 text-zinc-950 dark:text-white"
                  : "bg-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-900"
              }`}
            >
              Settled
            </Button>
            <Button
              onClick={() => setFilter("pending")}
              className={`h-8 px-3 text-xs font-bold rounded-xl transition-all shadow-none border-none ${
                filter === "pending"
                  ? "bg-white dark:bg-zinc-700 text-zinc-950 dark:text-white"
                  : "bg-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-900"
              }`}
            >
              Pending
            </Button>
            <Button
              onClick={() => setFilter("cancelled")}
              className={`h-8 px-3 text-xs font-bold rounded-xl transition-all shadow-none border-none ${
                filter === "cancelled"
                  ? "bg-white dark:bg-zinc-700 text-zinc-950 dark:text-white"
                  : "bg-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-900"
              }`}
            >
              Cancelled
            </Button>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="space-y-3">
          {filteredBookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-400 space-y-2">
              <Calendar className="w-8 h-8 text-zinc-300" />
              <p className="text-sm font-medium">No bookings found matching the filter.</p>
            </div>
          ) : (
            filteredBookings.map((booking) => {
              const isExpanded = expandedBooking === booking.id;
              return (
                <div
                  key={booking.id}
                  className={`border rounded-2xl transition-all ${
                    isExpanded
                      ? "border-slate-300 dark:border-white/20 bg-slate-50/50 dark:bg-zinc-800/10"
                      : "border-slate-100 dark:border-white/5 hover:border-slate-200 dark:hover:border-white/10"
                  }`}
                >
                  {/* Row Summary */}
                  <div
                    onClick={() => setExpandedBooking(isExpanded ? null : booking.id)}
                    className="flex flex-col md:flex-row md:items-center justify-between p-4 cursor-pointer select-none gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center font-black text-[#1A1C29] dark:text-zinc-200 text-xs">
                        {booking.booking_no?.substring(4) || "BK"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-zinc-900 dark:text-zinc-150 text-sm">
                            {booking.booking_no || "TRM-000000"}
                          </span>
                          <span className={`px-2 py-0.5 border text-[10px] font-bold rounded-full ${getStatusStyle(booking.status)}`}>
                            {booking.status}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                          {booking.customer_email} • {formatDate(booking.booking_date)} at {booking.booking_time}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-none pt-3 md:pt-0">
                      <div className="text-left md:text-right">
                        <span className="text-sm font-black text-zinc-900 dark:text-zinc-100">
                          {formatLKR(booking.amount)}
                        </span>
                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">Gross Amount</p>
                      </div>
                      <div className="text-zinc-400 dark:text-zinc-600">
                        <ArrowRight className={`w-4 h-4 transform transition-transform ${isExpanded ? "rotate-90 text-[#D81E5B]" : ""}`} />
                      </div>
                    </div>
                  </div>

                  {/* Expanded Breakdown */}
                  {isExpanded && (
                    <div className="border-t border-slate-150 dark:border-white/5 p-5 bg-white dark:bg-zinc-950 rounded-b-2xl space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Commission Split Breakdown</h4>
                        {booking.status !== "completed" && booking.status !== "confirmed" && (
                          <span className="text-[10px] text-rose-500 font-semibold bg-rose-50 dark:bg-rose-500/10 px-2 py-0.5 rounded-md">
                            * Splits are simulated for pending/cancelled bookings
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Salon Share */}
                        <div className="bg-[#EAFDF8]/50 dark:bg-[#EAFDF8]/5 p-4 rounded-xl border border-[#EAFDF8] dark:border-emerald-500/10 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-bold text-[#00A878] uppercase tracking-wider">🏢 Salon Share (80%)</span>
                            <h5 className="text-lg font-black text-[#00A878] mt-1">{formatLKR(booking.amount * 0.8)}</h5>
                          </div>
                        </div>

                        {/* Platform Cut */}
                        <div className="bg-[#FDF2F4]/50 dark:bg-[#FDF2F4]/5 p-4 rounded-xl border border-[#FDF2F4] dark:border-rose-500/10 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-bold text-[#D81E5B] uppercase tracking-wider">💼 Platform Cut (10%)</span>
                            <h5 className="text-lg font-black text-[#D81E5B] mt-1">{formatLKR(booking.amount * 0.1)}</h5>
                          </div>
                        </div>

                        {/* Agent Cut */}
                        <div className="bg-[#EEF2FF]/50 dark:bg-[#EEF2FF]/5 p-4 rounded-xl border border-[#EEF2FF] dark:border-indigo-500/10 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-bold text-[#4F46E5] uppercase tracking-wider">🤝 Agent Cut (10%)</span>
                            <h5 className="text-lg font-black text-[#4F46E5] mt-1">{formatLKR(booking.amount * 0.1)}</h5>
                          </div>
                        </div>
                      </div>

                      {/* Split Ratio Bar Visualizer */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold px-0.5">
                          <span>Salon Share (80%)</span>
                          <span>Platform (10%)</span>
                          <span>Agent (10%)</span>
                        </div>
                        <div className="h-2.5 w-full flex rounded-full overflow-hidden bg-slate-100 dark:bg-zinc-800">
                          <div className="h-full bg-emerald-500 dark:bg-emerald-600 transition-all" style={{ width: "80%" }} />
                          <div className="h-full bg-[#D81E5B] transition-all" style={{ width: "10%" }} />
                          <div className="h-full bg-indigo-500 dark:bg-indigo-650 transition-all" style={{ width: "10%" }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
