"use client";

import React, { useEffect, useMemo, useState } from "react";
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

type CommissionBooking = {
  id: string;
  salon_name: string;
  booking_date: string;
  status: string;
  amount: number;
  customer_email: string;
  agent_cut: number;
  agent_percent: number;
  platform_commission: number;
};

type CommissionSubscription = {
  id: string;
  amount: number;
  status: string;
  notes: string | null;
  created_at: string;
};

function formatLKR(amount: number) {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString("en-LK", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function getWeekRange(offsetWeeks: number) {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  end.setDate(end.getDate() - offsetWeeks * 7);

  const start = new Date(end);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - 6);

  return { start, end, startMs: start.getTime(), endMs: end.getTime() };
}

function isSettledBooking(status: string) {
  const s = status?.toLowerCase();
  return s === "completed" || s === "confirmed";
}

export default function AgentCommissions() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [offsetWeeks, setOffsetWeeks] = useState(0);
  const [bookingAgentPct, setBookingAgentPct] = useState(20);
  const [subscriptionAgentPct, setSubscriptionAgentPct] = useState(20);
  const [bookings, setBookings] = useState<CommissionBooking[]>([]);
  const [subscriptions, setSubscriptions] = useState<CommissionSubscription[]>([]);
  const [referredSalonCount, setReferredSalonCount] = useState(0);
  const [allTimeBookingGross, setAllTimeBookingGross] = useState(0);

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        const result = await tryAgentData(getAgentCommissionsData, fetchAgentCommissionsClient, {
          clientFirst: false,
        });
        if (!result.success) {
          if (result.error?.includes("Not authenticated")) {
            router.replace("/login?redirectTo=/agent/commissions");
          }
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
    })();
  }, [router]);

  const week = useMemo(() => getWeekRange(offsetWeeks), [offsetWeeks]);

  const weekLabel =
    offsetWeeks === 0
      ? "This Week"
      : `${offsetWeeks} week${offsetWeeks > 1 ? "s" : ""} ago`;

  const weekRangeLabel = `${formatDate(week.start.toISOString())} – ${formatDate(week.end.toISOString())}`;

  const weeklyBookings = useMemo(
    () =>
      bookings.filter((b) => {
        if (!b.booking_date) return false;
        const t = new Date(b.booking_date).getTime();
        return t >= week.startMs && t <= week.endMs;
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
    (sum, b) => (isSettledBooking(b.status) ? sum + b.amount : sum),
    0
  );
  const weeklyBookingEarned = weeklyBookings.reduce(
    (sum, b) => (isSettledBooking(b.status) ? sum + b.agent_cut : sum),
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
              Referral Ledger
            </span>
            <span className="flex items-center gap-1 text-[10px] font-semibold text-zinc-400">
              <Sparkles className="w-3 h-3 text-amber-500" />
              Booking {bookingAgentPct}% · Subscription {subscriptionAgentPct}%
            </span>
          </div>
          <h1 className="text-3xl font-black text-zinc-900 tracking-tight">Commissions Ledger</h1>
          <p className="text-zinc-500 text-sm mt-0.5">
            Weekly booking and subscription commissions from your referred salons.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1">
          <button
            type="button"
            onClick={() => setOffsetWeeks((w) => w + 1)}
            className="p-2 rounded-lg hover:bg-slate-100 text-zinc-600"
            aria-label="Previous week"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="px-3 text-center min-w-[140px]">
            <p className="text-xs font-black text-zinc-900">{weekLabel}</p>
            <p className="text-[10px] text-zinc-500">{weekRangeLabel}</p>
          </div>
          <button
            type="button"
            onClick={() => setOffsetWeeks((w) => Math.max(0, w - 1))}
            disabled={offsetWeeks === 0}
            className="p-2 rounded-lg hover:bg-slate-100 text-zinc-600 disabled:opacity-40"
            aria-label="Next week"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              Booking Commission
            </span>
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>
          <h3 className="text-2xl font-black text-zinc-900">{formatLKR(weeklyBookingEarned)}</h3>
          <p className="text-[10px] text-zinc-500 mt-1">{bookingAgentPct}% on settled bookings</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              Subscription Commission
            </span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <h3 className="text-2xl font-black text-zinc-900">{formatLKR(weeklySubsEarned)}</h3>
          <p className="text-[10px] text-zinc-500 mt-1">{subscriptionAgentPct}% referral rewards</p>
        </div>

        <div className="bg-[#1A1C29] rounded-2xl p-5 shadow-sm text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">
              Total This Week
            </span>
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <h3 className="text-2xl font-black text-emerald-400">{formatLKR(weeklyTotal)}</h3>
          <p className="text-[10px] text-white/60 mt-1">Booking + subscription combined</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              All-Time Booking Volume
            </span>
            <Building2 className="w-4 h-4 text-amber-600" />
          </div>
          <h3 className="text-2xl font-black text-zinc-900">{formatLKR(allTimeBookingGross)}</h3>
          <p className="text-[10px] text-zinc-500 mt-1">{referredSalonCount} referred salons</p>
        </div>
      </div>

      {/* Weekly summary grid */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-bold text-zinc-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-zinc-400" />
            Weekly Commission Grid — {weekLabel}
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">{weekRangeLabel}</p>
          <p className="text-[11px] text-zinc-400 mt-1">
            Customer booking total = sum of completed/confirmed booking amounts this week. Your commission = {bookingAgentPct}% of the platform fee on each booking (not {bookingAgentPct}% of the booking value).
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-zinc-50 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                <th className="text-left px-5 py-3">Commission Type</th>
                <th className="text-center px-4 py-3">Your Rate</th>
                <th className="text-right px-4 py-3">Customer Booking Total</th>
                <th className="text-right px-4 py-3">Your Commission</th>
                <th className="text-center px-4 py-3">Items</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="px-5 py-4 font-bold text-zinc-900">Booking Commission</td>
                <td className="px-4 py-4 text-center">
                  <Badge className="bg-emerald-50 text-emerald-700 border-none font-bold">
                    {bookingAgentPct}%
                  </Badge>
                </td>
                <td className="px-4 py-4 text-right font-semibold text-zinc-700">
                  {formatLKR(weeklyBookingGross)}
                </td>
                <td className="px-4 py-4 text-right font-black text-emerald-600">
                  {formatLKR(weeklyBookingEarned)}
                </td>
                <td className="px-4 py-4 text-center text-zinc-600">{weeklyBookings.length}</td>
              </tr>
              <tr>
                <td className="px-5 py-4 font-bold text-zinc-900">Subscription Commission</td>
                <td className="px-4 py-4 text-center">
                  <Badge className="bg-indigo-50 text-indigo-700 border-none font-bold">
                    {subscriptionAgentPct}%
                  </Badge>
                </td>
                <td className="px-4 py-4 text-right font-semibold text-zinc-700">—</td>
                <td className="px-4 py-4 text-right font-black text-indigo-600">
                  {formatLKR(weeklySubsEarned)}
                </td>
                <td className="px-4 py-4 text-center text-zinc-600">{weeklySubscriptions.length}</td>
              </tr>
              <tr className="bg-zinc-50/80">
                <td className="px-5 py-4 font-black text-zinc-900" colSpan={3}>
                  Week Total
                </td>
                <td className="px-4 py-4 text-right font-black text-zinc-900">
                  {formatLKR(weeklyTotal)}
                </td>
                <td className="px-4 py-4 text-center font-bold text-zinc-600">
                  {weeklyBookings.length + weeklySubscriptions.length}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booking rows */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-zinc-900 flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-600" />
            Booking Commissions ({bookingAgentPct}%)
          </h3>
          {weeklyBookings.length === 0 ? (
            <p className="text-sm text-zinc-500 py-8 text-center">No bookings this week.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {weeklyBookings.map((b) => (
                <div
                  key={b.id}
                  className="grid grid-cols-[1fr_auto] gap-3 items-center border border-slate-100 rounded-xl p-3 hover:border-slate-200 transition-colors"
                >
                  <div>
                    <p className="font-bold text-sm text-zinc-900">{b.salon_name}</p>
                    <p className="text-[11px] text-zinc-500">
                      {formatDate(b.booking_date)} · {b.customer_email}
                    </p>
                    <Badge variant="outline" className="mt-1 text-[9px] font-bold uppercase">
                      {b.status}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-emerald-600">+{formatLKR(b.agent_cut)}</p>
                    <p className="text-[10px] text-zinc-400">
                      {b.agent_percent}% of platform fee {formatLKR(b.platform_commission)}
                    </p>
                    <p className="text-[9px] text-zinc-300">Booking value {formatLKR(b.amount)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Subscription rows */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-zinc-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            Subscription Commissions ({subscriptionAgentPct}%)
          </h3>
          {weeklySubscriptions.length === 0 ? (
            <p className="text-sm text-zinc-500 py-8 text-center">No subscription rewards this week.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {weeklySubscriptions.map((s) => (
                <div
                  key={s.id}
                  className="grid grid-cols-[1fr_auto] gap-3 items-center border border-slate-100 rounded-xl p-3 hover:border-slate-200 transition-colors"
                >
                  <div>
                    <p className="font-bold text-sm text-zinc-900">Salon conversion reward</p>
                    <p className="text-[11px] text-zinc-500">{formatDate(s.created_at)}</p>
                    {s.notes ? (
                      <p className="text-[10px] text-zinc-400 mt-1 line-clamp-2">{s.notes}</p>
                    ) : null}
                    <Badge variant="outline" className="mt-1 text-[9px] font-bold uppercase">
                      {s.status}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-indigo-600">+{formatLKR(s.amount)}</p>
                    <p className="text-[10px] text-zinc-400">{subscriptionAgentPct}% tier</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
