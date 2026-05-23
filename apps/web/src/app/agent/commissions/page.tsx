// apps/web/src/app/agent/commissions/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { History, Calendar, FileText, ArrowRight, TrendingUp, Sparkles, Loader2, Activity, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/config/supabase";
import { useRouter } from "next/navigation";

interface ReferredBooking {
  id: string;
  salon_id: string;
  salon_name: string;
  booking_date: string;
  status: string;
  amount: number;
  customer_email: string;
  agent_cut: number;
  platform_cut: number;
  salon_cut: number;
}

export default function AgentCommissions() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [agentEmail, setAgentEmail] = useState("");
  const [referredSalons, setReferredSalons] = useState<any[]>([]);
  const [bookings, setBookings] = useState<ReferredBooking[]>([]);
  const [filter, setFilter] = useState<string>("all"); // 'all' | 'completed' | 'pending' | 'cancelled'
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null);

  const [stats, setStats] = useState({
    totalReferredGross: 0,
    totalAgentEarned: 0,
    salonsCount: 0,
    bookingsCount: 0
  });

  useEffect(() => {
    async function loadCommissionData() {
      try {
        setLoading(true);

        // 1. Get currently authenticated Agent session
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          router.replace("/login?redirectTo=/agent/commissions");
          return;
        }

        const email = user.email || "";
        setAgentEmail(email);

        // 2. Fetch converted leads assigned to this agent (which represent onboarded salons)
        const { data: convertedLeads, error: leadsErr } = await supabase
          .from("salon_leads")
          .select("*")
          .eq("assign_to", email)
          .eq("status", "converted");

        if (leadsErr) throw leadsErr;

        const salonsList = convertedLeads || [];
        setReferredSalons(salonsList);

        if (salonsList.length === 0) {
          setLoading(false);
          return;
        }

        // 3. Resolve the matching salon records in public.salons table
        const salonNames = salonsList.map((l) => l.name);
        const { data: salonsData, error: salonsErr } = await supabase
          .from("salons")
          .select("id, name")
          .in("name", salonNames);

        if (salonsErr) throw salonsErr;

        if (!salonsData || salonsData.length === 0) {
          setLoading(false);
          return;
        }

        const salonIds = salonsData.map((s) => s.id);
        const salonIdToNameMap = salonsData.reduce((acc: any, s: any) => {
          acc[s.id] = s.name;
          return acc;
        }, {});

        // 4. Fetch bookings for these salons
        const { data: bookingsData, error: bookingsErr } = await supabase
          .from("bookings")
          .select(`
            id,
            salon_id,
            booking_date,
            status,
            amount,
            customer_email
          `)
          .in("salon_id", salonIds)
          .order("booking_date", { ascending: false });

        if (bookingsErr) throw bookingsErr;

        // Map database bookings to ReferredBooking structure
        const mappedBookings: ReferredBooking[] = (bookingsData || []).map((b: any) => {
          const amount = parseFloat(b.amount || 0);
          return {
            id: b.id,
            salon_id: b.salon_id,
            salon_name: salonIdToNameMap[b.salon_id] || "Referred Salon",
            booking_date: b.booking_date,
            status: b.status,
            amount: amount,
            customer_email: b.customer_email || "customer@trimma.io",
            agent_cut: amount * 0.1,
            platform_cut: amount * 0.1,
            salon_cut: amount * 0.8
          };
        });

        setBookings(mappedBookings);

        // 5. Calculate stats aggregates based on confirmed/completed bookings
        let gross = 0;
        let earned = 0;
        let settledCount = 0;

        mappedBookings.forEach((b) => {
          if (b.status === "completed" || b.status === "confirmed") {
            gross += b.amount;
            earned += b.agent_cut;
            settledCount += 1;
          }
        });

        setStats({
          totalReferredGross: gross,
          totalAgentEarned: earned,
          salonsCount: salonsList.length,
          bookingsCount: mappedBookings.length
        });

      } catch (err) {
        console.error("Failed to load agent commission data", err);
      } finally {
        setLoading(false);
      }
    }
    loadCommissionData();
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
        <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
        <p className="text-zinc-500 font-medium">Reconciling referral commissions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto p-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 text-[10px] font-bold tracking-wider bg-emerald-500/10 text-emerald-600 uppercase rounded-full">Referral Ledger</span>
            <span className="flex items-center gap-1 text-[10px] font-semibold text-zinc-400">
              <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" /> 10% Referrer Split Active
            </span>
          </div>
          <h1 className="text-3xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">Commissions Ledger</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-0.5">Track booking commissions referred through your converted salons.</p>
        </div>
        <div className="flex gap-2">
          <Button className="bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-750 font-bold rounded-2xl shadow-sm h-11 px-5 flex items-center gap-2 text-xs transition-all">
            <FileText className="w-4 h-4" /> Export Report
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Salons */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/5 rounded-3xl p-5 shadow-sm space-y-3 relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Active Referrals</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-650 dark:text-indigo-400">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-50">{stats.salonsCount} Salons</h3>
            <p className="text-[10px] text-zinc-500">Converted from leads</p>
          </div>
        </div>

        {/* Referred Bookings */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/5 rounded-3xl p-5 shadow-sm space-y-3 relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Referred Bookings</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-50">{stats.bookingsCount} bookings</h3>
            <p className="text-[10px] text-zinc-500">Across referred salons</p>
          </div>
        </div>

        {/* Total Referred Gross */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/5 rounded-3xl p-5 shadow-sm space-y-3 relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Referred Gross Volume</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-50">{formatLKR(stats.totalReferredGross)}</h3>
            <p className="text-[10px] text-zinc-500">Total transacted volume</p>
          </div>
        </div>

        {/* Agent Commissions Earned */}
        <div className="bg-gradient-to-br from-emerald-650 to-teal-800 rounded-3xl p-5 shadow-xl text-white space-y-3 relative overflow-hidden group hover:-translate-y-0.5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Referrer Commissions</span>
            <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white">
              🤝
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-black text-white">{formatLKR(stats.totalAgentEarned)}</h3>
            <p className="text-[10px] text-white/60">Estimated earned (10% split)</p>
          </div>
        </div>
      </div>

      {/* Main Ledger Card */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-5">
          <div>
            <h2 className="font-bold text-lg text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <History className="w-5 h-5 text-zinc-400" /> Referred Bookings Split Ledger
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">Click any booking to review the platform, salon, and agent split breakdowns.</p>
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

        {/* Ledger Rows */}
        <div className="space-y-3">
          {filteredBookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-400 space-y-2">
              <Calendar className="w-8 h-8 text-zinc-300" />
              <p className="text-sm font-medium">No referred bookings found matching this filter.</p>
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
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center font-black text-[#1A1C29] dark:text-zinc-200 text-xs shrink-0">
                        🏢
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-zinc-900 dark:text-zinc-150 text-sm">
                            {booking.salon_name}
                          </span>
                          <span className={`px-2 py-0.5 border text-[10px] font-bold rounded-full ${getStatusStyle(booking.status)}`}>
                            {booking.status}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5 animate-in">
                          {booking.customer_email} • Booking Date: {formatDate(booking.booking_date)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-none pt-3 md:pt-0">
                      <div className="text-left md:text-right">
                        <span className="text-sm font-black text-emerald-600 dark:text-emerald-405 block">
                          +{formatLKR(booking.agent_cut)}
                        </span>
                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">My 10% Cut (Gross: {formatLKR(booking.amount)})</p>
                      </div>
                      <div className="text-zinc-400 dark:text-zinc-600">
                        <ArrowRight className={`w-4 h-4 transform transition-transform ${isExpanded ? "rotate-90 text-emerald-500" : ""}`} />
                      </div>
                    </div>
                  </div>

                  {/* Expanded Split Breakdown */}
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
                            <span className="text-[10px] font-bold text-brand uppercase tracking-wider">💼 Platform Cut (10%)</span>
                            <h5 className="text-lg font-black text-brand mt-1">{formatLKR(booking.amount * 0.1)}</h5>
                          </div>
                        </div>

                        {/* Agent Cut (Highlighted) */}
                        <div className="bg-emerald-500/10 dark:bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/30 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">🤝 Agent Cut (10%)</span>
                            <h5 className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1">{formatLKR(booking.amount * 0.1)}</h5>
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
                          <div className="h-full bg-emerald-500 transition-all" style={{ width: "80%" }} />
                          <div className="h-full bg-brand transition-all" style={{ width: "10%" }} />
                          <div className="h-full bg-indigo-500 transition-all" style={{ width: "10%" }} />
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
