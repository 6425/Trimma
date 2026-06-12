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
import { toast } from "sonner";

type CommissionBooking = {
  id: string;
  salon_name: string;
  booking_date: string;
  created_at: string;
  status: string;
  payment_status: string;
  reservation_fee_paid: boolean;
  amount: number;
  customer_email: string;
  agent_cut: number;
  gross_agent_cut?: number;
  head_cut?: number;
  sub_agent_cut?: number;
  agent_percent: number;
  platform_commission: number;
  field_agent_email?: string | null;
  split_percent?: number;
};

type CommissionSubscription = {
  id: string;
  amount: number;
  gross_amount?: number;
  head_cut?: number;
  sub_agent_cut?: number;
  status: string;
  notes: string | null;
  created_at: string;
  field_agent_email?: string | null;
  split_percent?: number;
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

function isCommissionEligibleBooking(booking: Pick<
  CommissionBooking,
  "status" | "payment_status" | "reservation_fee_paid"
>) {
  const s = booking.status?.toLowerCase();
  if (s === "completed" || s === "confirmed") return true;
  if (booking.reservation_fee_paid) return true;
  if (booking.payment_status?.toLowerCase() === "reservation_paid") return true;
  return false;
}

function bookingWeekTimestamp(booking: Pick<CommissionBooking, "created_at" | "booking_date">) {
  if (booking.created_at) return new Date(booking.created_at).getTime();
  if (booking.booking_date) return new Date(booking.booking_date).getTime();
  return NaN;
}

function resolveHeadCut(booking: CommissionBooking) {
  return booking.head_cut ?? booking.agent_cut ?? 0;
}

function resolveSubCut(booking: CommissionBooking) {
  return booking.sub_agent_cut ?? 0;
}

function resolveSubCutSub(sub: CommissionSubscription) {
  return sub.sub_agent_cut ?? 0;
}

function resolveHeadCutSub(sub: CommissionSubscription) {
  return sub.head_cut ?? sub.amount ?? 0;
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
  const [isRegionalHead, setIsRegionalHead] = useState(false);
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
      setIsRegionalHead(Boolean((result as { isRegionalHead?: boolean }).isRegionalHead));
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

  const week = useMemo(() => getWeekRange(offsetWeeks), [offsetWeeks]);

  const weekLabel =
    offsetWeeks === 0
      ? "This Week"
      : `${offsetWeeks} week${offsetWeeks > 1 ? "s" : ""} ago`;

  const weekRangeLabel = `${formatDate(week.start.toISOString())} – ${formatDate(week.end.toISOString())}`;

  const weeklyBookings = useMemo(
    () =>
      bookings.filter((b) => {
        const t = bookingWeekTimestamp(b);
        if (!Number.isFinite(t)) return false;
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
    (sum, b) => (isCommissionEligibleBooking(b) ? sum + b.amount : sum),
    0
  );
  const weeklyHeadBooking = weeklyBookings.reduce(
    (sum, b) => (isCommissionEligibleBooking(b) ? sum + resolveHeadCut(b) : sum),
    0
  );
  const weeklySubBooking = weeklyBookings.reduce(
    (sum, b) => (isCommissionEligibleBooking(b) ? sum + resolveSubCut(b) : sum),
    0
  );
  const weeklyHeadSubs = weeklySubscriptions.reduce((sum, s) => sum + resolveHeadCutSub(s), 0);
  const weeklySubSubs = weeklySubscriptions.reduce((sum, s) => sum + resolveSubCutSub(s), 0);
  const weeklyHeadTotal = weeklyHeadBooking + weeklyHeadSubs;
  const weeklySubTotal = weeklySubBooking + weeklySubSubs;
  const weeklyTotal = weeklyHeadTotal + weeklySubTotal;

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
            {isRegionalHead ? (
              <span className="px-2.5 py-0.5 text-[10px] font-bold tracking-wider bg-[#F5B700]/15 text-[#9A7200] uppercase rounded-full">
                Regional Head
              </span>
            ) : null}
            <span className="flex items-center gap-1 text-[10px] font-semibold text-zinc-400">
              <Sparkles className="w-3 h-3 text-amber-500" />
              Booking {bookingAgentPct}% · Subscription {subscriptionAgentPct}%
            </span>
          </div>
          <h1 className="text-3xl font-black text-zinc-900 tracking-tight">Commissions Ledger</h1>
          <p className="text-zinc-500 text-sm mt-0.5">
            {isRegionalHead
              ? "Your regional head share and sub-agent splits on team bookings and subscriptions."
              : "Weekly booking and subscription commissions from your referred salons."}
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

      {isRegionalHead ? (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="font-bold text-zinc-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-[#9A7200]" />
                Assigned Sub-Agents
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Set each sub-agent&apos;s share of your gross agent commission on bookings and subscriptions.
              </p>
            </div>
            <Badge className="bg-[#F5B700]/15 text-[#9A7200] border-none font-bold">
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
                            onChange={(e) =>
                              setDraftSplits((prev) => ({ ...prev, [row.id]: e.target.value }))
                            }
                            className="h-9 text-center font-bold"
                          />
                          <Percent className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={savingId === row.id}
                          onClick={() => void handleSaveSplit(row.id)}
                          className="font-bold"
                        >
                          {savingId === row.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Save className="w-3.5 h-3.5 mr-1" />
                              Save
                            </>
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              {isRegionalHead ? "Regional Head (You)" : "Your"} Booking
            </span>
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>
          <h3 className="text-2xl font-black text-zinc-900">{formatLKR(weeklyHeadBooking)}</h3>
          <p className="text-[10px] text-zinc-500 mt-1">{bookingAgentPct}% when reservation is paid</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              {isRegionalHead ? "Sub-Agent Booking" : "Subscription Commission"}
            </span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <h3 className="text-2xl font-black text-zinc-900">
            {formatLKR(isRegionalHead ? weeklySubBooking : weeklyHeadSubs)}
          </h3>
          <p className="text-[10px] text-zinc-500 mt-1">
            {isRegionalHead
              ? "Team share from your gross booking commission"
              : `${subscriptionAgentPct}% referral rewards`}
          </p>
        </div>

        <div className="bg-[#1A1C29] rounded-2xl p-5 shadow-sm text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">
              Total This Week
            </span>
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <h3 className="text-2xl font-black text-emerald-400">{formatLKR(weeklyTotal)}</h3>
          <p className="text-[10px] text-white/60 mt-1">
            {isRegionalHead ? "Regional head + sub-agent combined" : "Booking + subscription combined"}
          </p>
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
                <th className="text-center px-4 py-3">Rate</th>
                <th className="text-right px-4 py-3">Customer Total</th>
                <th className="text-right px-4 py-3 text-emerald-700">
                  {isRegionalHead ? "Regional Head" : "Your"} Commission
                </th>
                <th className="text-right px-4 py-3 text-indigo-700">Sub-Agent Commission</th>
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
                  {formatLKR(weeklyHeadBooking)}
                </td>
                <td className="px-4 py-4 text-right font-black text-indigo-600">
                  {formatLKR(weeklySubBooking)}
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
                <td className="px-4 py-4 text-right font-black text-emerald-600">
                  {formatLKR(weeklyHeadSubs)}
                </td>
                <td className="px-4 py-4 text-right font-black text-indigo-600">
                  {formatLKR(weeklySubSubs)}
                </td>
                <td className="px-4 py-4 text-center text-zinc-600">{weeklySubscriptions.length}</td>
              </tr>
              <tr className="bg-zinc-50/80">
                <td className="px-5 py-4 font-black text-zinc-900" colSpan={3}>
                  Week Total
                </td>
                <td className="px-4 py-4 text-right font-black text-emerald-700">
                  {formatLKR(weeklyHeadTotal)}
                </td>
                <td className="px-4 py-4 text-right font-black text-indigo-700">
                  {formatLKR(weeklySubTotal)}
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
                  className="border border-slate-100 rounded-xl p-3 hover:border-slate-200 transition-colors space-y-2"
                >
                  <div className="flex justify-between gap-3 items-start">
                    <div>
                      <p className="font-bold text-sm text-zinc-900">{b.salon_name}</p>
                      <p className="text-[11px] text-zinc-500">
                        Paid {formatDate(b.created_at || b.booking_date)} · Appt{" "}
                        {formatDate(b.booking_date)} · {b.customer_email}
                      </p>
                      {b.field_agent_email ? (
                        <p className="text-[10px] text-indigo-600 font-semibold mt-1">
                          Sub-agent: {b.field_agent_email}
                          {b.split_percent != null ? ` · ${b.split_percent}% split` : ""}
                        </p>
                      ) : null}
                      <Badge variant="outline" className="mt-1 text-[9px] font-bold uppercase">
                        {b.status}
                      </Badge>
                    </div>
                    <p className="text-[9px] text-zinc-300 shrink-0">Gross {formatLKR(b.gross_agent_cut ?? b.agent_cut)}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-50">
                    <div className="rounded-lg bg-emerald-50 px-3 py-2">
                      <p className="text-[9px] font-bold uppercase text-emerald-700 tracking-wider">
                        Regional Head
                      </p>
                      <p className="text-sm font-black text-emerald-700">{formatLKR(resolveHeadCut(b))}</p>
                    </div>
                    <div className="rounded-lg bg-indigo-50 px-3 py-2">
                      <p className="text-[9px] font-bold uppercase text-indigo-700 tracking-wider">
                        Sub-Agent
                      </p>
                      <p className="text-sm font-black text-indigo-700">{formatLKR(resolveSubCut(b))}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
            <div className="grid grid-cols-1 gap-3">
              {weeklySubscriptions.map((s) => (
                <div
                  key={s.id}
                  className="border border-slate-100 rounded-xl p-3 hover:border-slate-200 transition-colors space-y-2"
                >
                  <div>
                    <p className="font-bold text-sm text-zinc-900">Salon conversion reward</p>
                    <p className="text-[11px] text-zinc-500">{formatDate(s.created_at)}</p>
                    {s.field_agent_email ? (
                      <p className="text-[10px] text-indigo-600 font-semibold mt-1">
                        Sub-agent: {s.field_agent_email}
                        {s.split_percent != null ? ` · ${s.split_percent}% split` : ""}
                      </p>
                    ) : null}
                    <Badge variant="outline" className="mt-1 text-[9px] font-bold uppercase">
                      {s.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-50">
                    <div className="rounded-lg bg-emerald-50 px-3 py-2">
                      <p className="text-[9px] font-bold uppercase text-emerald-700 tracking-wider">
                        Regional Head
                      </p>
                      <p className="text-sm font-black text-emerald-700">{formatLKR(resolveHeadCutSub(s))}</p>
                    </div>
                    <div className="rounded-lg bg-indigo-50 px-3 py-2">
                      <p className="text-[9px] font-bold uppercase text-indigo-700 tracking-wider">
                        Sub-Agent
                      </p>
                      <p className="text-sm font-black text-indigo-700">{formatLKR(resolveSubCutSub(s))}</p>
                    </div>
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
