"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  FileText,
  Activity,
  Loader2,
  TrendingUp,
  Sparkles,
  Store,
  Briefcase,
  Handshake,
  CreditCard,
  Save,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { fetchAdminFinancePage } from "@/app/actions/admin-list-data";
import { saveAdminFinanceBookingRates } from "@/app/actions/admin-operations";
import { withTimeout } from "@/lib/promise-timeout";

interface BookingWithSplits {
  id: string;
  booking_no: string;
  booking_date: string;
  booking_time: string;
  amount: number;
  status: string;
  payment_status: string;
  reservation_fee_paid: boolean;
  customer_email: string;
  created_at: string;
  platform_commission_amount: number;
  salon_upfront_amount: number;
  agent_commission_amount: number;
}

interface SubscriptionLedgerRow {
  id: string;
  amount: number;
  status: string;
  notes: string | null;
  created_at: string;
  commission_category: string | null;
  agent_email: string | null;
  salon_name: string;
}

type FinanceGridRow = {
  id: string;
  reference: string;
  date: string;
  status: string;
  platformGross: number;
  salonCommission: number;
  agentBookingCommission: number;
  agentSubscriptionCommission: number;
  total: number;
  kind: "booking" | "subscription";
};

function getWeekRange(offsetWeeks: number) {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  end.setDate(end.getDate() - offsetWeeks * 7);

  const start = new Date(end);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - 6);

  return { start, end, startMs: start.getTime(), endMs: end.getTime() };
}

type BookingLedgerStatus = Pick<
  BookingWithSplits,
  "status" | "payment_status" | "reservation_fee_paid"
>;

function isReservationPaidBooking(booking: BookingLedgerStatus) {
  if (booking.reservation_fee_paid) return true;
  return booking.payment_status?.toLowerCase() === "reservation_paid";
}

function isSettledBooking(booking: BookingLedgerStatus) {
  const s = booking.status?.toLowerCase();
  if (s === "completed" || s === "confirmed") return true;
  return isReservationPaidBooking(booking);
}

function isPendingBooking(booking: BookingLedgerStatus) {
  if (isReservationPaidBooking(booking)) return false;
  const s = booking.status?.toLowerCase();
  return s === "pending" || s === "reserved" || s === "awaiting_confirmation";
}

function bookingWeekTimestamp(booking: Pick<BookingWithSplits, "created_at" | "booking_date">) {
  if (booking.created_at) return new Date(booking.created_at).getTime();
  if (booking.booking_date) return new Date(booking.booking_date).getTime();
  return NaN;
}

function isCancelledBooking(status: string) {
  const s = status?.toLowerCase();
  return s === "cancelled" || s === "canceled";
}

function isSettledLedger(status: string) {
  const s = status?.toUpperCase();
  return s === "PAID" || s === "APPROVED";
}

function isPendingLedger(status: string) {
  return status?.toUpperCase() === "PENDING";
}

export default function FinanceDashboard() {
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<BookingWithSplits[]>([]);
  const [subscriptionLedger, setSubscriptionLedger] = useState<SubscriptionLedgerRow[]>([]);
  const [statusTab, setStatusTab] = useState<"settled" | "pending">("settled");
  const [offsetWeeks, setOffsetWeeks] = useState(0);

  const [isAdmin, setIsAdmin] = useState(false);
  const [globalRates, setGlobalRates] = useState({ platform: 10, salon: 10, agent: 20 });
  const [activeCommissionId, setActiveCommissionId] = useState<string | null>(null);
  const [savingRates, setSavingRates] = useState(false);

  async function applyCommissionMaster(commissionMaster: any[] | undefined) {
    const commData = (commissionMaster || []).find(
      (c) => c.commission_type === "booking" && c.active
    );
    if (commData) {
      setActiveCommissionId(commData.id);
      setGlobalRates({
        platform: commData.platform_percentage,
        salon: commData.salon_percentage,
        agent: commData.agent_percentage || 20,
      });
    }
  }

  useEffect(() => {
    void Promise.resolve().then(() => {
      async function loadFinanceData() {
        try {
          const result = await withTimeout(
            fetchAdminFinancePage(),
            20000,
            "Loading timed out. Check Vercel env (SUPABASE_SERVICE_ROLE_KEY) and refresh."
          );

          if (result.success === false) {
            throw new Error(result.error);
          }

          const { commissionMaster, bookings: bookingsData, subscriptionLedger: ledgerData } = result;
          setIsAdmin(true);
          await applyCommissionMaster(commissionMaster);

          const resolvedBookings = (bookingsData || []).map((b: any) => ({
            ...b,
            amount: parseFloat(b.amount || 0),
            payment_status: String(b.payment_status || ""),
            reservation_fee_paid: Boolean(b.reservation_fee_paid),
            platform_commission_amount: parseFloat(b.platform_commission_amount || 0),
            salon_upfront_amount: parseFloat(b.salon_upfront_amount || 0),
            agent_commission_amount: parseFloat(b.agent_commission_amount || 0),
          }));

          setBookings(resolvedBookings);

          const resolvedLedger = (ledgerData || []).map((row: any) => {
            const salonsJoin = row.salons as { name?: string } | { name?: string }[] | null;
            const salonName = Array.isArray(salonsJoin) ? salonsJoin[0]?.name : salonsJoin?.name;
            return {
              id: row.id,
              amount: parseFloat(row.amount || 0),
              status: row.status || "PENDING",
              notes: row.notes,
              created_at: row.created_at,
              commission_category: row.commission_category,
              agent_email: row.agent_email,
              salon_name: salonName || "Referred Salon",
            };
          });
          setSubscriptionLedger(resolvedLedger);
        } catch (err: any) {
          console.error("Failed to load finance data", err);
          toast.error("Failed to load finance data: " + (err.message || "Unknown error"));
        } finally {
          setLoading(false);
        }
      }
      loadFinanceData();
    });
  }, []);

  const handleUpdateRates = async () => {
    try {
      setSavingRates(true);

      if (globalRates.platform + globalRates.salon !== 20) {
        toast.error("Platform + Salon must equal 20% for booking commission.");
        return;
      }

      const result = await saveAdminFinanceBookingRates({
        platform: globalRates.platform,
        salon: globalRates.salon,
        agent: globalRates.agent,
        previousId: activeCommissionId,
      });

      if (result.success === false) throw new Error(result.error);
      toast.success("Booking commission rates updated.");
      const refreshed = await fetchAdminFinancePage();
      if (refreshed.success) await applyCommissionMaster(refreshed.commissionMaster);
    } catch (err: any) {
      toast.error("Failed to update rates: " + err.message);
    } finally {
      setSavingRates(false);
    }
  };

  const formatLKR = (amount: number) => {
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-LK", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const week = useMemo(() => getWeekRange(offsetWeeks), [offsetWeeks]);

  const weekLabel =
    offsetWeeks === 0 ? "This Week" : `${offsetWeeks} week${offsetWeeks > 1 ? "s" : ""} ago`;
  const weekRangeLabel = `${formatDate(week.start.toISOString())} – ${formatDate(week.end.toISOString())}`;

  const gridRows = useMemo(() => {
    const rows: FinanceGridRow[] = [];

    for (const booking of bookings) {
      if (isCancelledBooking(booking.status)) continue;

      const t = bookingWeekTimestamp(booking);
      if (!Number.isFinite(t) || t < week.startMs || t > week.endMs) continue;

      const settled = isSettledBooking(booking);
      const pending = isPendingBooking(booking);
      if (statusTab === "settled" && !settled) continue;
      if (statusTab === "pending" && !pending) continue;

      // Platform & salon shares are a fixed % of the booking value, so fall back to
      // the configured rates only if a (legacy) booking is missing the stored split.
      const platformGross =
        booking.platform_commission_amount > 0
          ? booking.platform_commission_amount
          : booking.amount * (globalRates.platform / 100);
      const salonCommission =
        booking.salon_upfront_amount > 0
          ? booking.salon_upfront_amount
          : booking.amount * (globalRates.salon / 100);
      // Agent commission is a cut of the PLATFORM fee and only exists when a referring
      // agent is attributed. Use the stored value verbatim — a 0 here means "no agent",
      // so we must NOT fabricate a commission for non-referred bookings.
      const agentBookingCommission = booking.agent_commission_amount;

      rows.push({
        id: booking.id,
        reference: booking.booking_no || "TRM-000000",
        date: booking.created_at || booking.booking_date,
        status: booking.status,
        platformGross,
        salonCommission,
        agentBookingCommission,
        agentSubscriptionCommission: 0,
        total: platformGross + salonCommission + agentBookingCommission,
        kind: "booking",
      });
    }

    for (const entry of subscriptionLedger) {
      const category = (entry.commission_category || "").toLowerCase();
      // Only subscription-categorized ledger rows belong in the subscription column.
      // Base (un-patched) ledger rows are lead-conversion rewards, so they're excluded.
      if (category !== "subscription") continue;
      if (!entry.created_at) continue;

      const t = new Date(entry.created_at).getTime();
      if (t < week.startMs || t > week.endMs) continue;

      const settled = isSettledLedger(entry.status);
      const pending = isPendingLedger(entry.status);
      if (statusTab === "settled" && !settled) continue;
      if (statusTab === "pending" && !pending) continue;

      const agentSub = entry.amount;
      rows.push({
        id: entry.id,
        reference: `SUB-${entry.id.slice(0, 8).toUpperCase()}`,
        date: entry.created_at,
        status: entry.status,
        platformGross: 0,
        salonCommission: 0,
        agentBookingCommission: 0,
        agentSubscriptionCommission: agentSub,
        total: agentSub,
        kind: "subscription",
      });
    }

    rows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return rows;
  }, [bookings, subscriptionLedger, week, statusTab, globalRates]);

  const columnSums = useMemo(
    () =>
      gridRows.reduce(
        (acc, row) => ({
          platformGross: acc.platformGross + row.platformGross,
          salonCommission: acc.salonCommission + row.salonCommission,
          agentBookingCommission: acc.agentBookingCommission + row.agentBookingCommission,
          agentSubscriptionCommission:
            acc.agentSubscriptionCommission + row.agentSubscriptionCommission,
          total: acc.total + row.total,
        }),
        {
          platformGross: 0,
          salonCommission: 0,
          agentBookingCommission: 0,
          agentSubscriptionCommission: 0,
          total: 0,
        }
      ),
    [gridRows]
  );

  const stats = useMemo(
    () => ({
      grossRevenue: gridRows
        .filter((r) => r.kind === "booking")
        .reduce((sum, r) => {
          const booking = bookings.find((b) => b.id === r.id);
          return sum + (booking?.amount || 0);
        }, 0),
      platformComm: columnSums.platformGross,
      salonComm: columnSums.salonCommission,
      agentBookingComm: columnSums.agentBookingCommission,
      agentSubscriptionComm: columnSums.agentSubscriptionCommission,
      totalComm: columnSums.total,
      rowCount: gridRows.length,
    }),
    [gridRows, bookings, columnSums]
  );

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 text-[10px] font-bold tracking-wider bg-brand/10 text-brand uppercase rounded-full">
              Sprint 5 Ledger
            </span>
            <span className="flex items-center gap-1 text-[10px] font-semibold text-zinc-500">
              <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" /> Weekly commission grid
            </span>
          </div>
          <h1 className="text-3xl font-black text-zinc-900 tracking-tight">Finance &amp; Revenue</h1>
          <p className="text-zinc-500 text-sm mt-0.5">
            Per-booking commission breakdown with weekly navigation. Settled includes reservation-paid bookings; weeks use payment date.
          </p>
        </div>
        <div className="flex gap-2">
          <Button className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold rounded-2xl shadow-sm h-11 px-5 flex items-center gap-2 text-xs transition-all">
            <FileText className="w-4 h-4" /> Export Ledger
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setOffsetWeeks((w) => w + 1)}
            className="p-2 rounded-lg hover:bg-slate-100 text-zinc-600"
            aria-label="Previous week"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="px-3 text-center min-w-[160px]">
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

        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl">
          {(["settled", "pending"] as const).map((tab) => (
            <Button
              key={tab}
              onClick={() => setStatusTab(tab)}
              className={`h-8 px-4 text-xs font-bold rounded-xl transition-all shadow-none border-none capitalize ${
                statusTab === tab ? "bg-white text-zinc-950" : "bg-transparent text-zinc-500 hover:text-zinc-900"
              }`}
            >
              {tab === "settled" ? "Settled" : "Pending"}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Gross Bookings</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <h3 className="text-xl font-black text-zinc-900">{formatLKR(stats.grossRevenue)}</h3>
          <p className="text-[10px] text-zinc-500">{stats.rowCount} ledger rows this week</p>
        </div>

        <div className="bg-white border border-[#1A1C29] rounded-3xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
              Platform ({globalRates.platform}%)
            </span>
            <Briefcase className="w-4 h-4 text-zinc-900" />
          </div>
          <h3 className="text-xl font-black text-zinc-900">{formatLKR(stats.platformComm)}</h3>
          <p className="text-[10px] text-zinc-500">Gross booking commission</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
              Salon ({globalRates.salon}%)
            </span>
            <Store className="w-4 h-4 text-teal-600" />
          </div>
          <h3 className="text-xl font-black text-zinc-900">{formatLKR(stats.salonComm)}</h3>
          <p className="text-[10px] text-zinc-500">Salon reservation share</p>
        </div>

        <div className="bg-brand/5 border border-brand/20 rounded-3xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-brand uppercase tracking-widest">Agent Booking</span>
            <Handshake className="w-4 h-4 text-brand" />
          </div>
          <h3 className="text-xl font-black text-brand">{formatLKR(stats.agentBookingComm)}</h3>
          <p className="text-[10px] text-brand/70">{globalRates.agent}% referral cut</p>
        </div>

        <div className="bg-indigo-50 border border-indigo-200 rounded-3xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest">Agent Subs.</span>
            <CreditCard className="w-4 h-4 text-indigo-600" />
          </div>
          <h3 className="text-xl font-black text-indigo-700">{formatLKR(stats.agentSubscriptionComm)}</h3>
          <p className="text-[10px] text-indigo-600">Subscription referral rewards</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100">
          <h2 className="font-bold text-lg text-zinc-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-zinc-500" /> Commission Grid — {weekLabel}
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            {weekRangeLabel} · {statusTab === "settled" ? "Settled (incl. reservation paid)" : "Pending (unpaid)"} · cancellations excluded
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="bg-zinc-50 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                <th className="text-left px-5 py-3">Booking Reference</th>
                <th className="text-left px-4 py-3">Date</th>
                <th className="text-center px-4 py-3">Status</th>
                <th className="text-right px-4 py-3">Platform Gross Booking Commission</th>
                <th className="text-right px-4 py-3">Salon Commission</th>
                <th className="text-right px-4 py-3">Agent Booking Commission</th>
                <th className="text-right px-4 py-3">Agent Subscription Commission</th>
                <th className="text-right px-5 py-3">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {gridRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-14 text-center text-zinc-500">
                    <Calendar className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                    <p className="text-sm font-medium">No {statusTab} records for this week.</p>
                  </td>
                </tr>
              ) : (
                gridRows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-zinc-900">{row.reference}</span>
                        {row.kind === "subscription" ? (
                          <Badge className="bg-indigo-50 text-indigo-700 border-none text-[9px] font-bold">
                            SUB
                          </Badge>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-zinc-600 text-xs">{formatDate(row.date)}</td>
                    <td className="px-4 py-3.5 text-center">
                      <Badge variant="outline" className="text-[9px] font-bold uppercase">
                        {row.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 text-right font-semibold text-zinc-800">
                      {formatLKR(row.platformGross)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-semibold text-teal-700">
                      {formatLKR(row.salonCommission)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-semibold text-brand">
                      {formatLKR(row.agentBookingCommission)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-semibold text-indigo-700">
                      {formatLKR(row.agentSubscriptionCommission)}
                    </td>
                    <td className="px-5 py-3.5 text-right font-black text-zinc-900">
                      {formatLKR(row.total)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {gridRows.length > 0 ? (
              <tfoot>
                <tr className="bg-zinc-50 border-t-2 border-slate-200">
                  <td className="px-5 py-4 font-black text-zinc-900" colSpan={3}>
                    Week Total ({gridRows.length} rows)
                  </td>
                  <td className="px-4 py-4 text-right font-black text-zinc-900">
                    {formatLKR(columnSums.platformGross)}
                  </td>
                  <td className="px-4 py-4 text-right font-black text-teal-700">
                    {formatLKR(columnSums.salonCommission)}
                  </td>
                  <td className="px-4 py-4 text-right font-black text-brand">
                    {formatLKR(columnSums.agentBookingCommission)}
                  </td>
                  <td className="px-4 py-4 text-right font-black text-indigo-700">
                    {formatLKR(columnSums.agentSubscriptionCommission)}
                  </td>
                  <td className="px-5 py-4 text-right font-black text-zinc-900 text-base">
                    {formatLKR(columnSums.total)}
                  </td>
                </tr>
              </tfoot>
            ) : null}
          </table>
        </div>
      </div>

      {isAdmin ? (
        <div className="bg-white border border-brand/20 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <h2 className="font-bold text-lg text-zinc-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand" /> Booking Commission Rates
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Marketplace reservation split (platform + salon = 20% of service total). Subscription rates are under
                Agent Mgmt → Subscription Commission.
              </p>
            </div>
            <Button
              onClick={handleUpdateRates}
              disabled={savingRates}
              className="bg-brand hover:bg-brand/90 text-zinc-900 font-bold rounded-xl shadow-sm h-10 px-5 flex items-center gap-2 text-xs"
            >
              {savingRates ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}{" "}
              Save Booking Rates
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Platform (%)</label>
              <Input
                type="number"
                value={globalRates.platform}
                onChange={(e) =>
                  setGlobalRates({ ...globalRates, platform: parseFloat(e.target.value) || 0 })
                }
                className="font-bold text-lg h-12 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Salon (%)</label>
              <Input
                type="number"
                value={globalRates.salon}
                onChange={(e) =>
                  setGlobalRates({ ...globalRates, salon: parseFloat(e.target.value) || 0 })
                }
                className="font-bold text-lg h-12 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Agent (%)</label>
              <Input
                type="number"
                value={globalRates.agent}
                onChange={(e) =>
                  setGlobalRates({ ...globalRates, agent: parseFloat(e.target.value) || 0 })
                }
                className="font-bold text-lg h-12 rounded-xl"
              />
            </div>
          </div>
          <p className="text-xs font-semibold text-zinc-500">
            Platform + Salon must equal <span className="font-bold text-zinc-900">20%</span>. Agent % applies to
            booking referral payouts.
          </p>
        </div>
      ) : null}
    </div>
  );
}
