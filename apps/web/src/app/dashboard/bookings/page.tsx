"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Search, Calendar, Loader2, AlertCircle, Eye, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { sendWhatsAppCancellationNotification, sendWhatsAppNoShowNotification } from "@/app/actions/whatsapp";
import { sendBookingCancelledEmail, sendBookingNoShowEmail } from "@/app/actions/email-settings";
import { sendBookingReviewRequests } from "@/app/actions/review-notifications";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { fetchSalonBookingsPage } from "@/app/actions/salon-dashboard-data";
import { rescheduleOwnerBooking, rejectOwnerRescheduleRequest, sendOwnerBookingReminder, updateOwnerBooking } from "@/app/actions/salon-operations";
import { markBookingNotificationsReadForOwner } from "@/app/actions/salon-notifications";
import { withTimeout } from "@/lib/promise-timeout";
import { resolveStaffMemberFromBooking, getBookingServiceDisplayName } from "@/lib/staff-allocation";
import { matchesBookingStatusTab, type BookingStatusTab } from "@/lib/booking-owner-queue";
import { toast } from "sonner";
import { DashboardModal } from "../../../components/dashboard/DashboardModal";
import { AddBookingModal } from "../../../components/modals/AddBookingModal";

import { ChevronDown } from "lucide-react";

const BOOKING_STATUS_TABS: { key: BookingStatusTab; label: string }[] = [
  { key: "confirmed", label: "Confirmed" },
  { key: "rescheduled", label: "Rescheduled" },
  { key: "canceled", label: "Cancelled" },
];

// Context-Aware Action Menu — portaled so it is not clipped by the table card
const ActionMenu = ({ booking, onAction, processingId }: { booking: any, onAction: (id: string, action: string) => void, processingId: string | null }) => {
  const handleFire = (action: string) => {
    onAction(booking.id, action);
  };

  const isProcessing = processingId === booking.id;
  const status = (booking.status || 'pending').toLowerCase();
  const paymentStatus = (booking.payment_status || 'unpaid').toLowerCase();
  const isTerminal = ['completed', 'canceled', 'cancelled', 'no_show'].includes(status);

  const lifecycleActions: { key: string; label: string; color: string; hoverBg: string }[] = [];

  if (status === 'confirmed' || status === 'pending') {
    lifecycleActions.push({ key: 'in_progress', label: 'Start Service', color: 'text-indigo-700', hoverBg: 'hover:bg-indigo-50' });
  }
  if (status === 'in_progress') {
    lifecycleActions.push({ key: 'complete', label: 'Complete Service', color: 'text-emerald-700', hoverBg: 'hover:bg-emerald-50' });
  }

  if (!isTerminal) {
    lifecycleActions.push({ key: 'reschedule', label: 'Reschedule', color: 'text-blue-700', hoverBg: 'hover:bg-blue-50' });
    lifecycleActions.push({ key: 'no_show', label: 'Mark No-Show', color: 'text-amber-700', hoverBg: 'hover:bg-amber-50' });
    lifecycleActions.push({ key: 'cancel', label: 'Cancel Booking', color: 'text-rose-600', hoverBg: 'hover:bg-rose-50' });
  }

  const paymentActions: { key: string; label: string; color: string; hoverBg: string }[] = [];

  if (paymentStatus === 'unpaid') {
    paymentActions.push({ key: 'reservation_paid', label: 'Mark Reserved Comm.', color: 'text-amber-700', hoverBg: 'hover:bg-amber-50' });
  }
  if (paymentStatus === 'unpaid' || paymentStatus === 'reservation_paid') {
    paymentActions.push({ key: 'mark_paid', label: 'Mark Fully Paid', color: 'text-emerald-700', hoverBg: 'hover:bg-emerald-50' });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={isProcessing}
        className="inline-flex h-7 items-center justify-center gap-1 rounded-md border border-zinc-200 bg-white px-2 text-[10px] font-bold text-zinc-700 hover:bg-slate-50 hover:text-zinc-900 disabled:pointer-events-none disabled:opacity-50 outline-none"
      >
        {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
        Action
        <ChevronDown className="w-3 h-3 opacity-70" />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        side="bottom"
        sideOffset={6}
        className="z-[250] w-52 min-w-52 border border-slate-200 bg-white p-1 shadow-xl rounded-xl"
      >
        <DropdownMenuItem
          onClick={() => handleFire('view')}
          className="text-xs font-bold text-zinc-700 cursor-pointer"
        >
          <Eye className="w-3 h-3" />
          View Booking
        </DropdownMenuItem>

        {!isTerminal && (
          <DropdownMenuItem
            onClick={() => handleFire('send_reminder')}
            className="text-xs font-bold text-violet-700 cursor-pointer hover:bg-violet-50"
          >
            <Bell className="w-3 h-3" />
            Send Reminder
          </DropdownMenuItem>
        )}

        {lifecycleActions.length > 0 && (
          <>
            <DropdownMenuSeparator className="bg-slate-100" />
            <DropdownMenuLabel className="px-3 py-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              Booking Status
            </DropdownMenuLabel>
            {lifecycleActions.map((a) => (
              <DropdownMenuItem
                key={a.key}
                onClick={() => handleFire(a.key)}
                className={`text-xs font-bold cursor-pointer ${a.color} ${a.hoverBg}`}
              >
                {a.label}
              </DropdownMenuItem>
            ))}
          </>
        )}

        {paymentActions.length > 0 && !['paid', 'refunded'].includes(paymentStatus) && (
          <>
            <DropdownMenuSeparator className="bg-slate-100" />
            <DropdownMenuLabel className="px-3 py-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
              Payment
            </DropdownMenuLabel>
            {paymentActions.map((a) => (
              <DropdownMenuItem
                key={a.key}
                onClick={() => handleFire(a.key)}
                className={`text-xs font-bold cursor-pointer ${a.color} ${a.hoverBg}`}
              >
                {a.label}
              </DropdownMenuItem>
            ))}
          </>
        )}

        {isTerminal && lifecycleActions.length === 0 && (
          <>
            <DropdownMenuSeparator className="bg-slate-100" />
            <DropdownMenuLabel className="px-3 py-2 text-[10px] font-bold text-zinc-400 italic">
              No further actions available
            </DropdownMenuLabel>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


export default function DashboardBookings() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [reschedulingBooking, setReschedulingBooking] = useState<any | null>(null);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("12:00");
  const tabParam = searchParams.get("tab") as BookingStatusTab | "pending" | null;
  const statusTab: BookingStatusTab =
    tabParam === "pending" || !tabParam
      ? "confirmed"
      : BOOKING_STATUS_TABS.some((t) => t.key === tabParam)
        ? tabParam
        : "confirmed";
  const skipTabRefetch = useRef(true);
  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false);
  const [walkInSlot, setWalkInSlot] = useState<{ date: string; time: string } | null>(null);

  function openWalkInBookingModal() {
    const now = new Date();
    const minutes = now.getMinutes();
    now.setMinutes(Math.ceil(minutes / 15) * 15, 0, 0);
    const date = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
    ].join("-");
    const time = [
      String(now.getHours()).padStart(2, "0"),
      String(now.getMinutes()).padStart(2, "0"),
    ].join(":");
    setWalkInSlot({ date, time });
    setIsWalkInModalOpen(true);
  }

  async function fetchBookings(options?: { silent?: boolean }) {
    try {
      if (!options?.silent) {
        setLoading(true);
      }
      const result = await withTimeout(fetchSalonBookingsPage(), 20000, "Loading timed out.");
      if (result.success === false) throw new Error(result.error);
      setBookings(result.bookings || []);
    } catch (err) {
      console.error("Failed to fetch bookings:", err);
      toast.error(err instanceof Error ? err.message : "Failed to load bookings.");
    } finally {
      if (!options?.silent) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    if (tabParam === "pending") {
      router.replace("/dashboard/bookings?tab=confirmed", { scroll: false });
    }
  }, [tabParam, router]);

  useEffect(() => {
    void Promise.resolve().then(() => {
      void fetchBookings();
    });

    const handleRefresh = () => {
      void fetchBookings({ silent: true });
    };
    window.addEventListener("trimma:dashboard-refresh", handleRefresh);

    const interval = window.setInterval(() => {
      void fetchBookings({ silent: true });
    }, 45000);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void fetchBookings({ silent: true });
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("trimma:dashboard-refresh", handleRefresh);
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  useEffect(() => {
    if (skipTabRefetch.current) {
      skipTabRefetch.current = false;
      return;
    }
    void fetchBookings({ silent: true });
  }, [tabParam]);

  const handleStatusTabChange = (tab: BookingStatusTab) => {
    router.replace(`/dashboard/bookings?tab=${tab}`, { scroll: false });
  };

  const handleBookingLifecycleAction = async (bookingId: string, action: string) => {
    if (action === 'view') {
      router.push(`/dashboard/bookings/${bookingId}`);
      return;
    }
    if (action === 'reschedule') {
      const booking = bookings.find((b) => b.id === bookingId);
      if (!booking) {
        toast.error("Booking not found.");
        return;
      }
      setReschedulingBooking(booking);
      setNewDate(booking.booking_date || "");
      const timeValue = (booking.booking_time || "12:00:00").slice(0, 5);
      setNewTime(timeValue);
      return;
    }
    setProcessingId(bookingId);
    try {
      if (action === 'send_reminder') {
        const booking = bookings.find((b) => b.id === bookingId);
        if (!booking?.booking_no) {
          throw new Error("Booking reference is missing.");
        }
        const reminderResult = await sendOwnerBookingReminder(bookingId);
        if (reminderResult.success === false) {
          throw new Error(reminderResult.error);
        }
        const sentLabels = reminderResult.sent.map((ch) => {
          if (ch === "whatsapp") return "WhatsApp";
          if (ch === "email") return "Email";
          if (ch === "telegram") return "Telegram";
          return ch;
        });
        toast.success(`Reminder sent via ${sentLabels.join(", ")}.`);
        if (reminderResult.skipped.length > 0) {
          const skippedDetails = reminderResult.skipped
            .map((row) => {
              const label =
                row.channel === "whatsapp"
                  ? "WhatsApp"
                  : row.channel === "email"
                    ? "Email"
                    : row.channel === "telegram"
                      ? "Telegram"
                      : row.channel;
              return `${label}: ${row.error}`;
            })
            .join(" · ");
          toast.message(`Skipped — ${skippedDetails}`);
        }
        if (reminderResult.failed.length > 0) {
          const failedLabels = reminderResult.failed
            .map((row) => `${row.channel}: ${row.error}`)
            .join(" · ");
          toast.message(`Some channels were unavailable: ${failedLabels}`);
        }
        setProcessingId(null);
        return;
      }

      let updatePayload: any = {};
      const booking = bookings.find(b => b.id === bookingId);
      const bookingNo = booking?.booking_no;
      
      switch (action) {
        case 'in_progress': 
          updatePayload.status = 'in_progress'; 
          break;
        case 'complete': 
          updatePayload.status = 'completed'; 
          break;
        case 'no_show': 
          updatePayload.status = 'no_show'; 
          if (bookingNo) {
            await sendWhatsAppNoShowNotification(bookingNo);
            await sendBookingNoShowEmail(bookingNo);
          }
          void markBookingNotificationsReadForOwner(bookingId);
          break;
        case 'cancel': 
          updatePayload.status = 'canceled'; 
          if (bookingNo) {
            await sendWhatsAppCancellationNotification(bookingNo);
            await sendBookingCancelledEmail(bookingNo);
          }
          void markBookingNotificationsReadForOwner(bookingId);
          break;
        case 'reservation_paid': 
          updatePayload.payment_status = 'reservation_paid'; 
          break;
        case 'mark_paid': 
          updatePayload.payment_status = 'paid'; 
          break;
        default:
          toast.error("Unknown action: " + action);
          setProcessingId(null);
          return;
      }

      const result = await updateOwnerBooking(bookingId, updatePayload);
      if (result.success === false) throw new Error(result.error);

      if (action === "complete" && bookingNo) {
        void sendBookingReviewRequests(bookingNo);
      }

      toast.success(`Booking successfully updated!`);
      await fetchBookings(); // Refresh UI
    } catch (e: any) {
      toast.error("Failed to update booking: " + e.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleActionReschedule = async (bookingId: string, status: "approved" | "rejected") => {
    if (status === "approved") {
      const booking = bookings.find((b) => b.id === bookingId);
      if (!booking) {
        toast.error("Booking not found.");
        return;
      }
      setReschedulingBooking(booking);
      setNewDate(booking.requested_booking_date || booking.booking_date || "");
      setNewTime(
        (booking.requested_booking_time || booking.booking_time || "12:00:00").slice(0, 5)
      );
      toast.info("Choose the new date and time, then confirm to approve the reschedule request.");
      return;
    }

    setProcessingId(bookingId);
    try {
      const result = await rejectOwnerRescheduleRequest(bookingId);
      if (result.success === false) throw new Error(result.error);
      toast.success("Reschedule request declined.");
      await fetchBookings();
    } catch (e: any) {
      toast.error("Failed to decline request: " + e.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRescheduleSave = async () => {
    if (!reschedulingBooking || !newDate || !newTime) return;
    setProcessingId(reschedulingBooking.id);
    try {
      const formattedTime = newTime.length === 5 ? `${newTime}:00` : newTime;
      const result = await rescheduleOwnerBooking(reschedulingBooking.id, newDate, formattedTime);
      if (result.success === false) throw new Error(result.error);

      toast.success("Appointment successfully rescheduled!");
      setReschedulingBooking(null);
      await fetchBookings();
    } catch (e: any) {
      toast.error("Failed to reschedule: " + e.message);
    } finally {
      setProcessingId(null);
    }
  };

  const searchedBookings = bookings.filter(b =>
    (b.customer_email || 'Walk-in Customer').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (b.booking_no || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredBookings = useMemo(
    () =>
      [...searchedBookings]
        .filter((b) => matchesBookingStatusTab(b, statusTab))
        .sort((a, b) => {
          const dateA = a.booking_date || "";
          const dateB = b.booking_date || "";
          if (dateA !== dateB) return dateA.localeCompare(dateB);
          const timeA = (a.booking_time || "").slice(0, 8);
          const timeB = (b.booking_time || "").slice(0, 8);
          return timeA.localeCompare(timeB);
        }),
    [searchedBookings, statusTab]
  );

  const tabCounts = BOOKING_STATUS_TABS.reduce(
    (acc, tab) => {
      acc[tab.key] = searchedBookings.filter((b) => matchesBookingStatusTab(b, tab.key)).length;
      return acc;
    },
    {} as Record<BookingStatusTab, number>
  );

  const pendingRequests = useMemo(
    () =>
      bookings.filter(
        (b) =>
          b.reschedule_requested === true &&
          b.reschedule_status !== "approved" &&
          b.reschedule_status !== "rejected"
      ),
    [bookings]
  );

  const renderStatusBadge = (status: string) => {
    const s = (status || 'pending').toLowerCase();
    const badgeClass = "border-none px-1.5 py-0 text-[8px] font-extrabold uppercase tracking-wide shadow-xs";
    if (s === 'pending') return <Badge className={`bg-amber-50 text-amber-600 ${badgeClass}`}>Pending</Badge>;
    if (s === 'confirmed') return <Badge className={`bg-emerald-50 text-emerald-600 ${badgeClass}`}>Confirmed</Badge>;
    if (s === 'in_progress') return <Badge className={`bg-indigo-50 text-indigo-600 ${badgeClass}`}>In Progress</Badge>;
    if (s === 'completed') return <Badge className={`bg-zinc-100 text-zinc-700 ${badgeClass}`}>Completed</Badge>;
    if (s === 'canceled') return <Badge className={`bg-rose-50 text-rose-600 ${badgeClass}`}>Cancelled</Badge>;
    if (s === 'no_show') return <Badge className={`bg-orange-50 text-orange-600 ${badgeClass}`}>No Show</Badge>;
    if (s === 'rescheduled') return <Badge className={`bg-blue-50 text-blue-600 ${badgeClass}`}>Rescheduled</Badge>;
    return <Badge className={`bg-zinc-100 text-zinc-500 ${badgeClass}`}>{s}</Badge>;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6">
      
      {/* Page Title & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Bookings</h1>
          <p className="text-sm text-zinc-500">Manage your salon appointments and operational lifecycle.</p>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
            <Input 
              placeholder="Search by ID or email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9.5 h-10 rounded-xl"
            />
          </div>
          <Button
            type="button"
            variant="dark"
            onClick={openWalkInBookingModal}
            className="h-10 rounded-xl font-bold text-xs shrink-0 px-4"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Walking Customer Booking
          </Button>
        </div>
      </div>

      {/* Premium Reschedule Requests Alert Banner */}
      {pendingRequests.length > 0 && (
        <div className="bg-amber-50/50 border border-amber-100/70 rounded-2xl p-5 space-y-4 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-2 text-amber-800 font-extrabold text-sm uppercase tracking-wider">
            <AlertCircle className="w-5 h-5 text-amber-600 animate-pulse shrink-0" />
            <span>Rescheduling Requests ({pendingRequests.length})</span>
          </div>
          <div className="space-y-2.5">
            {pendingRequests.map(req => (
              <div key={req.id} className="bg-white border border-amber-100/50 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-xs">
                <div>
                  <div className="font-extrabold text-zinc-900 text-sm">{req.customer_email || 'Walk-in Customer'}</div>
                  <div className="text-[11px] text-zinc-400 mt-1 font-medium">
                    Booking No: <span className="font-bold text-zinc-700">{req.booking_no}</span> &bull;{" "}
                    Current:{" "}
                    <span className="font-bold text-zinc-700">
                      {req.booking_date} at {(req.booking_time || "").slice(0, 5)}
                    </span>
                    {req.requested_booking_date ? (
                      <>
                        {" "}
                        &bull; Requested:{" "}
                        <span className="font-bold text-amber-700">
                          {req.requested_booking_date} at{" "}
                          {(req.requested_booking_time || "").slice(0, 5)}
                        </span>
                      </>
                    ) : null}
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <Button size="sm" disabled={processingId === req.id} onClick={() => handleActionReschedule(req.id, 'approved')} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 h-8 rounded-lg">Approve & Reschedule</Button>
                  <Button size="sm" variant="outline" disabled={processingId === req.id} onClick={() => handleActionReschedule(req.id, 'rejected')} className="border-rose-100 text-rose-600 hover:bg-rose-50 text-xs font-bold px-3 py-1.5 h-8 rounded-lg">Decline</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          {BOOKING_STATUS_TABS.map((tab) => {
            const active = statusTab === tab.key;
            const count = tabCounts[tab.key] || 0;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleStatusTabChange(tab.key)}
                className={`h-10 px-4 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 ${
                  active
                    ? tab.key === "confirmed"
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                      : tab.key === "rescheduled"
                        ? "bg-brand text-black border-brand shadow-sm"
                        : "bg-rose-600 text-white border-rose-600 shadow-sm"
                    : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50"
                }`}
              >
                {tab.label}
                <span
                  className={`min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-black flex items-center justify-center ${
                    active ? "bg-black/15 text-inherit" : "bg-zinc-100 text-zinc-500"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bookings List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs min-h-[400px]">
        {loading ? (
           <div className="flex flex-col items-center justify-center h-[400px]">
             <Loader2 className="w-8 h-8 animate-spin text-zinc-400 mb-4" />
             <p className="text-zinc-500 font-bold text-sm">Loading bookings...</p>
           </div>
        ) : filteredBookings.length === 0 ? (
           <div className="flex flex-col items-center justify-center text-center p-8 h-[400px]">
             <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mb-4">
               <Calendar className="w-8 h-8 text-slate-400" />
             </div>
             <h3 className="text-base font-bold text-zinc-900">No {BOOKING_STATUS_TABS.find((t) => t.key === statusTab)?.label.toLowerCase()} bookings</h3>
             <p className="text-sm text-zinc-500 mt-1">Try another tab or adjust your search.</p>
           </div>
        ) : (
          <div className="overflow-visible rounded-b-2xl">
            <table className="w-full table-fixed text-left">
              <colgroup>
                <col className="w-[12%]" />
                <col className="w-[14%]" />
                <col className="w-[20%]" />
                <col className="w-[22%]" />
                <col className="w-[12%]" />
                <col className="w-[10%]" />
              </colgroup>
              <thead>
                <tr className="bg-zinc-50/50 text-[9px] font-bold text-zinc-400 uppercase tracking-wide border-b border-zinc-200">
                  <th className="px-2 py-2">Booking</th>
                  <th className="px-2 py-2">Customer</th>
                  <th className="px-2 py-2">Service</th>
                  <th className="px-2 py-2">Amount</th>
                  <th className="px-2 py-2">Status</th>
                  <th className="px-2 py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredBookings.map((b) => {
                  const amount = parseFloat(b.amount || "0");
                  const deposit = amount * 0.2;
                  const platAmt = amount * 0.1;
                  const salonAmt = amount * 0.1;

                  return (
                  <tr key={b.id} className="hover:bg-zinc-50/60 transition-colors">
                    
                    {/* ID & Date */}
                    <td className="px-2 py-2 align-top">
                      <div className="text-[11px] font-mono font-extrabold text-zinc-900 leading-tight break-all">{b.booking_no}</div>
                      <div className="text-[10px] font-bold text-zinc-500 mt-0.5 leading-tight">{b.booking_date}</div>
                      <div className="text-[10px] font-semibold text-zinc-400 leading-tight">{(b.booking_time || "").slice(0, 5)}</div>
                    </td>
                    
                    {/* Customer */}
                    <td className="px-2 py-2 align-top">
                      <div className="font-bold text-zinc-900 text-[11px] leading-snug break-all">{b.customer_email || 'Walk-in'}</div>
                    </td>

                    {/* Service & Staff */}
                    <td className="px-2 py-2 align-top">
                      <div className="font-bold text-zinc-800 text-[11px] leading-snug line-clamp-2">{getBookingServiceDisplayName(b) || 'Standard Service'}</div>
                      <div className="text-[10px] text-zinc-400 font-medium mt-0.5 leading-tight">
                        <span className="font-bold text-zinc-600">{resolveStaffMemberFromBooking(b)?.name || 'Unassigned'}</span>
                      </div>
                    </td>
                    
                    {/* Financials */}
                    <td className="px-2 py-2 align-top">
                      <div className="text-[11px] font-black text-zinc-900 leading-tight">LKR {amount.toLocaleString()}</div>
                      <div className="flex flex-wrap items-center gap-1 mt-0.5">
                        <span className="text-[9px] text-zinc-500 font-bold uppercase">
                          Dep {deposit.toLocaleString()}
                        </span>
                        {b.reservation_fee_paid ? (
                          <Badge className="bg-emerald-50 text-emerald-600 border-none px-1 py-0 text-[7px] font-black uppercase">Paid</Badge>
                        ) : (
                          <Badge className="bg-rose-50 text-rose-600 border-none px-1 py-0 text-[7px] font-black uppercase">Unpaid</Badge>
                        )}
                      </div>
                      {b.reservation_fee_paid && (
                        <div className="text-[9px] font-bold mt-0.5 leading-tight">
                          <span className="text-emerald-700">Salon {salonAmt.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                          <span className="text-zinc-300"> · </span>
                          <span className="text-amber-700">Plat {platAmt.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                        </div>
                      )}
                      {(b.payment_status === 'reservation_paid' || b.payment_status === 'paid' || b.payment_status === 'refunded') && (
                        <div className="text-[9px] font-bold text-zinc-400 mt-0.5 capitalize leading-tight">
                          <span className={b.payment_status === 'paid' ? 'text-emerald-600' : b.payment_status === 'reservation_paid' ? 'text-amber-600' : 'text-rose-600'}>
                            {b.payment_status === 'reservation_paid' ? 'Bal: Reserved' : `Bal: ${b.payment_status}`}
                          </span>
                        </div>
                      )}
                    </td>
                    
                    {/* Status */}
                    <td className="px-2 py-2 align-top">
                      <div className="flex flex-col gap-1">
                        {renderStatusBadge(b.status)}
                        
                        {b.reschedule_requested && (
                          <Badge className="bg-rose-50 text-rose-600 border-none w-fit text-[8px] font-black uppercase tracking-wide px-1.5 py-0">
                            Reschedule
                          </Badge>
                        )}
                        {b.reschedule_status === 'approved' && (
                          <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-100 w-fit text-[8px] font-bold uppercase tracking-wide px-1.5 py-0">
                            Rescheduled
                          </Badge>
                        )}
                      </div>
                    </td>
                    
                    {/* Actions */}
                    <td className="px-2 py-2 text-right align-top">
                      <div className="flex items-start justify-end">
                        <ActionMenu booking={b} onAction={handleBookingLifecycleAction} processingId={processingId} />
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <DashboardModal
        open={Boolean(reschedulingBooking)}
        onClose={() => setReschedulingBooking(null)}
        size="sm"
        title={
          <span className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-600 shrink-0" />
            Reschedule Appointment
          </span>
        }
        description={
          reschedulingBooking ? (
            <>
              Updating schedule for booking reference{" "}
              <strong>{reschedulingBooking.booking_no}</strong>.
              {reschedulingBooking.requested_booking_date ? (
                <>
                  {" "}
                  Customer requested{" "}
                  <strong>
                    {reschedulingBooking.requested_booking_date} at{" "}
                    {(reschedulingBooking.requested_booking_time || "").slice(0, 5)}
                  </strong>
                  .
                </>
              ) : null}
            </>
          ) : null
        }
        footer={
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setReschedulingBooking(null)}
              className="border-slate-200 text-zinc-700 hover:bg-slate-50 font-bold rounded-xl h-10 px-4 text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleRescheduleSave}
              disabled={!reschedulingBooking || processingId === reschedulingBooking.id || !newDate || !newTime}
              className="bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-xl h-10 px-5 flex items-center gap-1.5 text-xs"
            >
              {reschedulingBooking && processingId === reschedulingBooking.id ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                </>
              ) : (
                "Confirm Reschedule"
              )}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
              New Appointment Date
            </label>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-full h-11 px-4 border border-slate-200 focus:border-zinc-950 rounded-xl text-sm focus:outline-none"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
              New Appointment Time
            </label>
            <input
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="w-full h-11 px-4 border border-slate-200 focus:border-zinc-950 rounded-xl text-sm focus:outline-none"
              required
            />
          </div>
        </div>
      </DashboardModal>

      <AddBookingModal
        isOpen={isWalkInModalOpen}
        onClose={() => setIsWalkInModalOpen(false)}
        selectedSlot={walkInSlot}
        salonId=""
        onSuccess={() => {
          setIsWalkInModalOpen(false);
          void fetchBookings({ silent: true });
          toast.success("Walk-in booking saved.");
        }}
      />
    </div>
  );
}
