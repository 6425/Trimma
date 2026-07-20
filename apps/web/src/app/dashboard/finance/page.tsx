"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Calendar, FileText, ArrowRight, Activity, Loader2, TrendingUp, Sparkles, Store, Briefcase, Handshake, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchSalonFinancePage } from "@/app/actions/salon-dashboard-data";
import { withTimeout } from "@/lib/promise-timeout";
import { buildBookingIncomeRows } from "@/lib/booking-income-rows";
import { exportFinanceLedgerToExcel } from "@/lib/export-finance-ledger";
import { isCommissionEligibleBooking } from "@/lib/commission-ledger-format";
import { toast } from "sonner";
import { BookingCommissionTable } from "../../../components/dashboard/BookingCommissionTable";

interface BookingWithSplits {
  id: string;
  booking_no: string;
  booking_date: string;
  booking_time: string;
  amount: number;
  status: string;
  payment_status?: string;
  reservation_fee_paid?: boolean;
  customer_email: string;
  created_at: string;
  platform_commission_amount: number;
  salon_upfront_amount: number;
  agent_commission_amount: number;
}

export default function FinanceDashboard() {
  const [loading, setLoading] = useState(true);
  const [salon, setSalon] = useState<any>(null);
  const [bookings, setBookings] = useState<BookingWithSplits[]>([]);
  const [allStaff, setAllStaff] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [offsetWeeks, setOffsetWeeks] = useState(0);
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null);

  // Stats
  const [stats, setStats] = useState({
    grossRevenue: 0,
    platformComm: 0,
    salonComm: 0,
    agentComm: 0,
    completedCount: 0
  });

  const [globalRates, setGlobalRates] = useState({ 
    platform: 10, 
    salon: 20, 
    agent: 20 
  });

  useEffect(() => {
    void Promise.resolve().then(() => {
      async function loadFinanceData() {
      try {
      const result = await withTimeout(fetchSalonFinancePage(), 20000, "Loading timed out.");
      if (result.success === false) throw new Error(result.error);

      setSalon(result.salon);
      if (result.commissionRates) {
        setGlobalRates({
          platform: result.commissionRates.platform,
          salon: result.commissionRates.salon,
          agent: result.commissionRates.agent,
        });
      }
      const bookingsData = result.bookings || [];
      const resolvedBookings = bookingsData.map((b: any) => ({
        ...b,
        amount: parseFloat(b.amount || 0),
        platform_commission_amount: parseFloat(b.platform_commission_amount || 0),
        salon_upfront_amount: parseFloat(b.salon_upfront_amount || 0),
        agent_commission_amount: parseFloat(b.agent_commission_amount || 0),
      }));

      setBookings(resolvedBookings);
      setAllStaff(result.staff || []);
      
      // 4. Calculate aggregates
      let gross = 0;
      let platform = 0;
      let salonUpfront = 0;
      let agent = 0;
      let completed = 0;
      
      resolvedBookings.forEach((b: BookingWithSplits) => {
      if (isCommissionEligibleBooking({
        status: b.status,
        payment_status: b.payment_status || "",
        reservation_fee_paid: Boolean(b.reservation_fee_paid),
      })) {
      gross += b.amount;
      platform += b.platform_commission_amount;
      salonUpfront += b.salon_upfront_amount;
      agent += b.agent_commission_amount;
      completed += 1;
      }
      });
      
      setStats({
      grossRevenue: gross,
      platformComm: platform,
      salonComm: salonUpfront,
      agentComm: agent,
      completedCount: completed
      });
      } catch (err) {
      console.error("Failed to load finance data", err);
      } finally {
      setLoading(false);
      }
      }
      loadFinanceData();
    });
  }, []);

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
      return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch (e) {
      return dateStr;
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed": return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "confirmed": return "bg-blue-50 text-blue-700 border-blue-100";
      case "pending": return "bg-amber-50 text-amber-700 border-amber-100";
      default: return "bg-rose-50 text-rose-700 border-rose-100";
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (filter === "all") return true;
    if (filter === "completed") {
      return isCommissionEligibleBooking({
        status: b.status,
        payment_status: b.payment_status || "",
        reservation_fee_paid: Boolean(b.reservation_fee_paid),
      });
    }
    return b.status === filter;
  });

  const { rows: exportRows, totals: exportTotals } = useMemo(
    () => buildBookingIncomeRows(filteredBookings, allStaff, offsetWeeks),
    [filteredBookings, allStaff, offsetWeeks]
  );

  const weekLabel =
    offsetWeeks === 0 ? "Last 7 days" : `${offsetWeeks} week${offsetWeeks > 1 ? "s" : ""} ago`;

  const filterLabel =
    filter === "all"
      ? "All bookings"
      : filter === "completed"
        ? "Settled"
        : filter.charAt(0).toUpperCase() + filter.slice(1);

  const handleExportLedger = () => {
    if (exportRows.length === 0) {
      toast.error("No ledger rows to export for the selected period.");
      return;
    }

    try {
      exportFinanceLedgerToExcel({
        salonName: salon?.name || "Salon",
        filterLabel,
        weekLabel,
        globalRates,
        stats,
        rows: exportRows,
        totals: exportTotals,
        bookings: filteredBookings,
      });
      toast.success("Ledger exported to Excel.");
    } catch (err) {
      console.error("Failed to export ledger", err);
      toast.error(err instanceof Error ? err.message : "Could not export ledger.");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-brand" />
        <p className="text-zinc-500 font-medium">Reconciling financial ledgers...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto p-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 text-[10px] font-bold tracking-wider bg-brand/10 text-brand uppercase rounded-full">Sprint 5 Ledger</span>
            <span className="flex items-center gap-1 text-[10px] font-semibold text-zinc-400">
              <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" /> Direct Database Reads Enabled
            </span>
          </div>
          <h1 className="text-3xl font-black text-zinc-900 tracking-tight">Finance &amp; Revenue</h1>
          <p className="text-zinc-500 text-sm mt-0.5">Real-time ledger audit showing gross bookings, platform fee deductions, and referrer splits.</p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            onClick={handleExportLedger}
            className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold rounded-2xl shadow-sm h-11 px-5 flex items-center gap-2 text-xs transition-all"
          >
            <FileText className="w-4 h-4" /> Export Ledger
          </Button>
        </div>
      </div>

      {/* KPI Stats Section (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Revenue */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3 relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Gross Bookings</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-black text-zinc-900">{formatLKR(stats.grossRevenue)}</h3>
            <p className="text-[10px] text-zinc-500">{stats.completedCount} successful bookings</p>
          </div>
        </div>

        {/* Platform Share */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3 relative overflow-hidden group hover:shadow-md transition-all text-zinc-900">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Platform Fee ({globalRates.platform}%)</span>
            <div className="w-7 h-7 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-700">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-black text-zinc-900">{formatLKR(stats.platformComm)}</h3>
            <p className="text-[10px] text-zinc-500">Base engine fee applied</p>
          </div>
        </div>

        {/* Salon Upfront Reservation */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3 relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Salon Res. ({globalRates.salon}%)</span>
            <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-black text-zinc-900">{formatLKR(stats.salonComm)}</h3>
            <p className="text-[10px] text-zinc-500">Upfront online deposit</p>
          </div>
        </div>


        {/* Agent Share */}
        <div className="bg-brand/5 border border-brand/20 rounded-3xl p-5 shadow-sm space-y-3 relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-brand uppercase tracking-widest">Agent Comm.</span>
            <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-brand">
              <Handshake className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-black text-brand">{formatLKR(stats.agentComm)}</h3>
            <p className="text-[10px] text-brand/70">From Platform cut (5-20%)</p>
          </div>
        </div>
      </div>

      {/* Main Ledger Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl w-fit ml-auto">
          {['all', 'completed', 'pending', 'cancelled'].map(f => (
            <Button
              key={f}
              onClick={() => setFilter(f)}
              className={`h-8 px-3 text-xs font-bold rounded-xl transition-all shadow-none border-none capitalize ${
                filter === f ? "bg-white text-zinc-950 shadow-sm" : "bg-transparent text-zinc-500 hover:text-zinc-900"
              }`}
            >
              {f === 'completed' ? 'Settled' : f}
            </Button>
          ))}
        </div>
        
        <BookingCommissionTable
          bookings={filteredBookings}
          allStaff={allStaff}
          offsetWeeks={offsetWeeks}
          onOffsetWeeksChange={setOffsetWeeks}
        />
      </div>

    </div>
  );
}
