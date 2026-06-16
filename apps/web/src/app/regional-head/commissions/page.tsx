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
  Users,
  Percent,
  Save,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { getAgentCommissionsData } from "@/app/actions/agent-commissions";
import { updateSubAgentSplitPercent, type SubAgentTeamRow } from "@/app/actions/agent-team";
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
import { toast } from "sonner";

export default function RegionalHeadCommissionsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [offsetWeeks, setOffsetWeeks] = useState(0);
  const [bookingAgentPct, setBookingAgentPct] = useState(20);
  const [subscriptionAgentPct, setSubscriptionAgentPct] = useState(20);
  const [bookings, setBookings] = useState<CommissionBookingRow[]>([]);
  const [subscriptions, setSubscriptions] = useState<CommissionSubscriptionRow[]>([]);
  const [referredSalonCount, setReferredSalonCount] = useState(0);
  const [allTimeBookingGross, setAllTimeBookingGross] = useState(0);
  const [subAgents, setSubAgents] = useState<SubAgentTeamRow[]>([]);
  const [draftSplits, setDraftSplits] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const loadCommissions = useCallback(async () => {
    setLoading(true);
    try {
      const result = await tryAgentData(getAgentCommissionsData, fetchAgentCommissionsClient, {
        clientFirst: false,
      });
      if (!result.success) {
        if (result.error?.includes("Not authenticated")) {
          router.replace("/agent/login?redirectTo=/regional-head/commissions");
        }
        return;
      }

      const isRegionalHead = Boolean((result as { isRegionalHead?: boolean }).isRegionalHead);
      if (!isRegionalHead) {
        router.replace("/agent/commissions");
        return;
      }

      setBookingAgentPct(result.bookingAgentPct);
      setSubscriptionAgentPct(result.subscriptionAgentPct);
      setBookings(result.bookings);
      setSubscriptions(result.subscriptions);
      setReferredSalonCount(result.referredSalonCount);
      setAllTimeBookingGross(result.allTimeBookingGross);
      const team = (result as { subAgents?: SubAgentTeamRow[] }).subAgents || [];
      setSubAgents(team);
      setDraftSplits(Object.fromEntries(team.map((row) => [row.id, String(row.splitPercent)])));
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void Promise.resolve().then(() => loadCommissions());
  }, [loadCommissions]);

  const handleSaveSplit = async (subAgentId: string) => {
    const raw = draftSplits[subAgentId];
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
      toast.error("Split must be between 0 and 100.");
      return;
    }

    setSavingId(subAgentId);
    try {
      const result = await updateSubAgentSplitPercent(subAgentId, parsed);
      if (!result.success) throw new Error(result.error);
      toast.success("Sub-agent commission split updated.");
      await loadCommissions();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed.");
    } finally {
      setSavingId(null);
    }
  };

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
  const weeklyHeadBooking = weeklyBookings.reduce(
    (sum, b) => (isCommissionEligibleBooking(b) ? sum + (b.head_cut ?? b.agent_cut ?? 0) : sum),
    0
  );
  const weeklySubBooking = weeklyBookings.reduce(
    (sum, b) => (isCommissionEligibleBooking(b) ? sum + (b.sub_agent_cut ?? 0) : sum),
    0
  );
  const weeklyHeadSubs = weeklySubscriptions.reduce((sum, s) => sum + (s.head_cut ?? s.amount ?? 0), 0);
  const weeklySubSubs = weeklySubscriptions.reduce((sum, s) => sum + (s.sub_agent_cut ?? 0), 0);
  const weeklyHeadTotal = weeklyHeadBooking + weeklyHeadSubs;
  const weeklySubTotal = weeklySubBooking + weeklySubSubs;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
        <p className="text-zinc-500 font-medium">Loading commission ledger...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 text-[10px] font-bold tracking-wider bg-[#f9e000]/15 text-[#8a7600] uppercase rounded-full">
              Regional Head
            </span>
            <span className="flex items-center gap-1 text-[10px] font-semibold text-zinc-400">
              <Sparkles className="w-3 h-3 text-amber-500" />
              Booking {bookingAgentPct}% · Subscription {subscriptionAgentPct}%
            </span>
          </div>
          <h1 className="text-3xl font-black text-zinc-900 tracking-tight">Commissions Ledger</h1>
          <p className="text-zinc-500 text-sm mt-0.5">
            Your regional head share and sub-agent splits on team bookings and subscriptions.
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

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="font-bold text-zinc-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#8a7600]" />
              Assigned Sub-Agents
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Set each sub-agent&apos;s share of your gross agent commission on bookings and subscriptions.
            </p>
          </div>
          <Badge className="bg-[#f9e000]/15 text-[#8a7600] border-none font-bold">
            {subAgents.length} assigned
          </Badge>
        </div>
        {subAgents.length === 0 ? (
          <p className="text-sm text-zinc-500 px-5 py-8 text-center">
            No sub-agents assigned yet. Ask an admin to create field agents under your regional head account.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 text-[10px] uppercase tracking-wider text-zinc-500 font-bold">
                <tr>
                  <th className="text-left px-4 py-3">Sub-Agent</th>
                  <th className="text-center px-4 py-3">Split % (of your commission)</th>
                  <th className="text-right px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {subAgents.map((row) => (
                  <tr key={row.id} className="border-t border-zinc-50">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-zinc-900">{row.email}</div>
                      <div className="text-xs text-zinc-500 capitalize">{row.status}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1 max-w-[140px] mx-auto">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={draftSplits[row.id] ?? String(row.splitPercent)}
                          onChange={(e) => setDraftSplits((prev) => ({ ...prev, [row.id]: e.target.value }))}
                          className="h-9 text-center font-bold"
                        />
                        <Percent className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" variant="outline" disabled={savingId === row.id} onClick={() => void handleSaveSplit(row.id)} className="font-bold">
                        {savingId === row.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-3.5 h-3.5 mr-1" />Save</>}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Regional Head Booking</span>
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>
          <h3 className="text-2xl font-black text-zinc-900">{formatCommissionLKR(weeklyHeadBooking)}</h3>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Sub-Agent Booking</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <h3 className="text-2xl font-black text-zinc-900">{formatCommissionLKR(weeklySubBooking)}</h3>
        </div>
        <div className="bg-[#1A1C29] rounded-2xl p-5 shadow-sm text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Head Total This Week</span>
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <h3 className="text-2xl font-black text-emerald-400">{formatCommissionLKR(weeklyHeadTotal)}</h3>
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
                <th className="text-left px-5 py-3">Type</th>
                <th className="text-center px-4 py-3">Rate</th>
                <th className="text-right px-4 py-3">Customer Total</th>
                <th className="text-right px-4 py-3 text-emerald-700">Regional Head</th>
                <th className="text-right px-4 py-3 text-indigo-700">Sub-Agent</th>
                <th className="text-center px-4 py-3">Items</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="px-5 py-4 font-bold text-zinc-900">Booking</td>
                <td className="px-4 py-4 text-center"><Badge className="bg-emerald-50 text-emerald-700 border-none font-bold">{bookingAgentPct}%</Badge></td>
                <td className="px-4 py-4 text-right font-semibold">{formatCommissionLKR(weeklyBookingGross)}</td>
                <td className="px-4 py-4 text-right font-black text-emerald-600">{formatCommissionLKR(weeklyHeadBooking)}</td>
                <td className="px-4 py-4 text-right font-black text-indigo-600">{formatCommissionLKR(weeklySubBooking)}</td>
                <td className="px-4 py-4 text-center">{weeklyBookings.length}</td>
              </tr>
              <tr>
                <td className="px-5 py-4 font-bold text-zinc-900">Subscription</td>
                <td className="px-4 py-4 text-center"><Badge className="bg-indigo-50 text-indigo-700 border-none font-bold">{subscriptionAgentPct}%</Badge></td>
                <td className="px-4 py-4 text-right">—</td>
                <td className="px-4 py-4 text-right font-black text-emerald-600">{formatCommissionLKR(weeklyHeadSubs)}</td>
                <td className="px-4 py-4 text-right font-black text-indigo-600">{formatCommissionLKR(weeklySubSubs)}</td>
                <td className="px-4 py-4 text-center">{weeklySubscriptions.length}</td>
              </tr>
              <tr className="bg-zinc-50/80">
                <td className="px-5 py-4 font-black" colSpan={3}>Week Total</td>
                <td className="px-4 py-4 text-right font-black text-emerald-700">{formatCommissionLKR(weeklyHeadTotal)}</td>
                <td className="px-4 py-4 text-right font-black text-indigo-700">{formatCommissionLKR(weeklySubTotal)}</td>
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
            Booking Commissions
          </h3>
          {weeklyBookings.length === 0 ? (
            <p className="text-sm text-zinc-500 py-8 text-center">No bookings this week.</p>
          ) : (
            weeklyBookings.map((b) => (
              <div key={b.id} className="border border-slate-100 rounded-xl p-3 space-y-2">
                <div>
                  <p className="font-bold text-sm">{b.salon_name}</p>
                  <p className="text-[11px] text-zinc-500">{formatCommissionDate(b.created_at || b.booking_date)} · {b.customer_email}</p>
                  {b.field_agent_email ? (
                    <p className="text-[10px] text-indigo-600 font-semibold mt-1">
                      Sub-agent: {b.field_agent_email}{b.split_percent != null ? ` · ${b.split_percent}%` : ""}
                    </p>
                  ) : null}
                </div>
                <div className="grid grid-cols-2 gap-2 border-t border-slate-50 pt-2">
                  <div className="rounded-lg bg-emerald-50 px-3 py-2">
                    <p className="text-[9px] font-bold uppercase text-emerald-700">Regional Head</p>
                    <p className="text-sm font-black text-emerald-700">{formatCommissionLKR(b.head_cut ?? b.agent_cut ?? 0)}</p>
                  </div>
                  <div className="rounded-lg bg-indigo-50 px-3 py-2">
                    <p className="text-[9px] font-bold uppercase text-indigo-700">Sub-Agent</p>
                    <p className="text-sm font-black text-indigo-700">{formatCommissionLKR(b.sub_agent_cut ?? 0)}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-zinc-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            Subscription Commissions
          </h3>
          {weeklySubscriptions.length === 0 ? (
            <p className="text-sm text-zinc-500 py-8 text-center">No subscription rewards this week.</p>
          ) : (
            weeklySubscriptions.map((s) => (
              <div key={s.id} className="border border-slate-100 rounded-xl p-3 space-y-2">
                <p className="font-bold text-sm">Salon conversion reward</p>
                <p className="text-[11px] text-zinc-500">{formatCommissionDate(s.created_at)}</p>
                <div className="grid grid-cols-2 gap-2 border-t border-slate-50 pt-2">
                  <div className="rounded-lg bg-emerald-50 px-3 py-2">
                    <p className="text-[9px] font-bold uppercase text-emerald-700">Regional Head</p>
                    <p className="text-sm font-black text-emerald-700">{formatCommissionLKR(s.head_cut ?? s.amount ?? 0)}</p>
                  </div>
                  <div className="rounded-lg bg-indigo-50 px-3 py-2">
                    <p className="text-[9px] font-bold uppercase text-indigo-700">Sub-Agent</p>
                    <p className="text-sm font-black text-indigo-700">{formatCommissionLKR(s.sub_agent_cut ?? 0)}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
