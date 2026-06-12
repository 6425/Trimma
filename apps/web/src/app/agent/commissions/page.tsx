"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  History,
  Calendar,
  TrendingUp,
  Sparkles,
  Loader2,
  Activity,
  Building2,
  Wallet,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { getAgentCommissionsData } from "@/app/actions/agent-commissions";
import { fetchAgentCommissionsClient, tryAgentData } from "@/lib/agent-client-data";
import {
  bookingWeekTimestamp,
  formatCommissionDate,
  formatCommissionLKR,
  getCommissionWeekRange,
  isCommissionEligibleBooking,
  type CommissionBookingRow,
  type CommissionSubscriptionRow,
} from "@/lib/commission-ledger-format";
import { useAgentPortal } from "@/lib/agent-portal-provider";

export default function AgentCommissions() {
  const router = useRouter();
  const { path } = useAgentPortal();
  const [loading, setLoading] = useState(true);
  const [offsetWeeks, setOffsetWeeks] = useState(0);
  const [bookingAgentPct, setBookingAgentPct] = useState(20);
  const [subscriptionAgentPct, setSubscriptionAgentPct] = useState(20);
  const [bookings, setBookings] = useState<CommissionBookingRow[]>([]);
  const [subscriptions, setSubscriptions] = useState<CommissionSubscriptionRow[]>([]);
  const [referredSalonCount, setReferredSalonCount] = useState(0);
  const [allTimeBookingGross, setAllTimeBookingGross] = useState(0);

  const loadCommissions = useCallback(async () => {
    setLoading(true);
    try {
      const result = await tryAgentData(getAgentCommissionsData, fetchAgentCommissionsClient, {
        clientFirst: false,
      });
      if (!result.success) {
        if (result.error?.includes("Not authenticated")) {
          router.replace(`/login?redirectTo=${path("/commissions")}`);
        }
        return;
      }

      if ((result as { isRegionalHead?: boolean }).isRegionalHead) {
        router.replace("/regional-head/commissions");
        return;
      }

      setBookingAgentPct(result.bookingAgentPct);
      setSubscriptionAgentPct(result.subscriptionAgentPct);
      setBookings(result.bookings);
      setSubscriptions(result.subscriptions);
      setReferredSalonCount(result.referredSalonCount);
      setAllTimeBookingGross(result.allTimeBookingGross);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void Promise.resolve().then(() => loadCommissions());
  }, [loadCommissions]);

  const week = useMemo(() => getCommissionWeekRange(offsetWeeks), [offsetWeeks]);
  const weekLabel = offsetWeeks === 0 ? "This Week" : `${offsetWeeks} week${offsetWeeks > 1 ? "s" : ""} ago`;
  const weekRangeLabel = `${formatCommissionDate(week.start.toISOString())} – ${formatCommissionDate(week.end.toISOString())}`;

  const weeklyBookings = useMemo(
    () =>
      bookings.filter((b) => {
        const t = bookingWeekTimestamp(b);
        return Number.isFinite(t) && t >= week.startMs && t <= week.endMs;
      }),
    [bookings, week]
  );

  const weeklySubscriptions = useMemo(
    () =>
      subscriptions.filter((s) => {
        if (!s.created_at) return false;
        const t = new Date(s.created_at).getTime();
        return t >= week.startMs && t <= week.endMs;
      }),
    [subscriptions, week]
  );

  const weeklyBookingGross = weeklyBookings.reduce(
    (sum, b) => (isCommissionEligibleBooking(b) ? sum + b.amount : sum),
    0
  );
  const weeklyBookingEarned = weeklyBookings.reduce(
    (sum, b) => (isCommissionEligibleBooking(b) ? sum + b.agent_cut : sum),
    0
  );
  const weeklySubsEarned = weeklySubscriptions.reduce((sum, s) => sum + s.amount, 0);
  const weeklyTotal = weeklyBookingEarned + weeklySubsEarned;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
        <p className="text-zinc-500 font-medium">Loading commission ledger...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto p-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 text-[10px] font-bold tracking-wider bg-emerald-500/10 text-emerald-600 uppercase rounded-full">
              Field Agent
            </span>
            <span className="flex items-center gap-1 text-[10px] font-semibold text-zinc-400">
              <Sparkles className="w-3 h-3 text-amber-500" />
              Booking {bookingAgentPct}% · Subscription {subscriptionAgentPct}%
            </span>
          </div>
          <h1 className="text-3xl font-black text-zinc-900 tracking-tight">Commissions Ledger</h1>
          <p className="text-zinc-500 text-sm mt-0.5">
            Your share of booking and subscription commissions from referred salons.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1">
          <button type="button" onClick={() => setOffsetWeeks((w) => w + 1)} className="p-2 rounded-lg hover:bg-slate-100 text-zinc-600" aria-label="Previous week">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="px-3 text-center min-w-[140px]">
            <p className="text-xs font-black text-zinc-900">{weekLabel}</p>
            <p className="text-[10px] text-zinc-500">{weekRangeLabel}</p>
          </div>
          <button type="button" onClick={() => setOffsetWeeks((w) => Math.max(0, w - 1))} disabled={offsetWeeks === 0} className="p-2 rounded-lg hover:bg-slate-100 text-zinc-600 disabled:opacity-40" aria-label="Next week">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Booking Commission</span>
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>
          <h3 className="text-2xl font-black text-zinc-900">{formatCommissionLKR(weeklyBookingEarned)}</h3>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Subscription Commission</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <h3 className="text-2xl font-black text-zinc-900">{formatCommissionLKR(weeklySubsEarned)}</h3>
        </div>
        <div className="bg-[#1A1C29] rounded-2xl p-5 shadow-sm text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Total This Week</span>
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <h3 className="text-2xl font-black text-emerald-400">{formatCommissionLKR(weeklyTotal)}</h3>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">All-Time Volume</span>
            <Building2 className="w-4 h-4 text-amber-600" />
          </div>
          <h3 className="text-2xl font-black text-zinc-900">{formatCommissionLKR(allTimeBookingGross)}</h3>
          <p className="text-[10px] text-zinc-500 mt-1">{referredSalonCount} referred salons</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-bold text-zinc-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-zinc-400" />
            Weekly Commission Grid — {weekLabel}
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">{weekRangeLabel}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-zinc-50 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                <th className="text-left px-5 py-3">Commission Type</th>
                <th className="text-center px-4 py-3">Your Rate</th>
                <th className="text-right px-4 py-3">Customer Total</th>
                <th className="text-right px-4 py-3">Your Commission</th>
                <th className="text-center px-4 py-3">Items</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="px-5 py-4 font-bold text-zinc-900">Booking Commission</td>
                <td className="px-4 py-4 text-center"><Badge className="bg-emerald-50 text-emerald-700 border-none font-bold">{bookingAgentPct}%</Badge></td>
                <td className="px-4 py-4 text-right font-semibold">{formatCommissionLKR(weeklyBookingGross)}</td>
                <td className="px-4 py-4 text-right font-black text-emerald-600">{formatCommissionLKR(weeklyBookingEarned)}</td>
                <td className="px-4 py-4 text-center">{weeklyBookings.length}</td>
              </tr>
              <tr>
                <td className="px-5 py-4 font-bold text-zinc-900">Subscription Commission</td>
                <td className="px-4 py-4 text-center"><Badge className="bg-indigo-50 text-indigo-700 border-none font-bold">{subscriptionAgentPct}%</Badge></td>
                <td className="px-4 py-4 text-right">—</td>
                <td className="px-4 py-4 text-right font-black text-indigo-600">{formatCommissionLKR(weeklySubsEarned)}</td>
                <td className="px-4 py-4 text-center">{weeklySubscriptions.length}</td>
              </tr>
              <tr className="bg-zinc-50/80">
                <td className="px-5 py-4 font-black" colSpan={3}>Week Total</td>
                <td className="px-4 py-4 text-right font-black text-zinc-900">{formatCommissionLKR(weeklyTotal)}</td>
                <td className="px-4 py-4 text-center font-bold">{weeklyBookings.length + weeklySubscriptions.length}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-zinc-900 flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-600" />
            Booking Commissions ({bookingAgentPct}%)
          </h3>
          {weeklyBookings.length === 0 ? (
            <p className="text-sm text-zinc-500 py-8 text-center">No bookings this week.</p>
          ) : (
            weeklyBookings.map((b) => (
              <div key={b.id} className="flex justify-between gap-3 border border-slate-100 rounded-xl p-3">
                <div>
                  <p className="font-bold text-sm">{b.salon_name}</p>
                  <p className="text-[11px] text-zinc-500">{formatCommissionDate(b.created_at || b.booking_date)} · {b.customer_email}</p>
                  <Badge variant="outline" className="mt-1 text-[9px] font-bold uppercase">{b.status}</Badge>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-emerald-600">+{formatCommissionLKR(b.agent_cut)}</p>
                  <p className="text-[10px] text-zinc-400">{b.agent_percent}% of platform fee</p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-zinc-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            Subscription Commissions ({subscriptionAgentPct}%)
          </h3>
          {weeklySubscriptions.length === 0 ? (
            <p className="text-sm text-zinc-500 py-8 text-center">No subscription rewards this week.</p>
          ) : (
            weeklySubscriptions.map((s) => (
              <div key={s.id} className="flex justify-between gap-3 border border-slate-100 rounded-xl p-3">
                <div>
                  <p className="font-bold text-sm">Salon conversion reward</p>
                  <p className="text-[11px] text-zinc-500">{formatCommissionDate(s.created_at)}</p>
                  <Badge variant="outline" className="mt-1 text-[9px] font-bold uppercase">{s.status}</Badge>
                </div>
                <p className="text-sm font-black text-indigo-600">+{formatCommissionLKR(s.amount)}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
