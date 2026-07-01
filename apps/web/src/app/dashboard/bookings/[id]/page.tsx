"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchSalonBookingDetail } from "@/app/actions/salon-dashboard-data";
import { updateOwnerBooking, markOwnerBookingFullyPaid } from "@/app/actions/salon-operations";
import { withTimeout } from "@/lib/promise-timeout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { sendWhatsAppCancellationNotification, sendWhatsAppNoShowNotification } from "@/app/actions/whatsapp";
import { sendBookingCancelledEmail, sendBookingNoShowEmail } from "@/app/actions/email-settings";
import { resolveStaffMemberFromBooking, getBookingServiceDisplayName } from "@/lib/staff-allocation";
import { resolveBookingFinancialBreakdown } from "@/lib/booking-commission-snapshot";
import { ArrowLeft, Loader2, Calendar, Clock, User, Mail, Phone, DollarSign, Scissors, MapPin, CheckCircle2, XCircle, AlertTriangle, CreditCard, Hash, UserCheck, PlayCircle, Ban, EyeOff } from "lucide-react";

// Timeline step definition
interface TimelineStep {
  label: string;
  status: "completed" | "current" | "upcoming" | "skipped";
  icon: React.ReactNode;
}

function getTimeline(bookingStatus: string): TimelineStep[] {
  const s = (bookingStatus || "pending").toLowerCase();

  const steps: { key: string; label: string; icon: React.ReactNode }[] = [
    { key: "pending", label: "Pending", icon: <Clock className="w-4 h-4" /> },
    { key: "confirmed", label: "Confirmed", icon: <CheckCircle2 className="w-4 h-4" /> },
    { key: "checked_in", label: "Checked In", icon: <UserCheck className="w-4 h-4" /> },
    { key: "in_progress", label: "In Progress", icon: <PlayCircle className="w-4 h-4" /> },
    { key: "completed", label: "Completed", icon: <CheckCircle2 className="w-4 h-4" /> },
  ];

  const terminalStatuses = ["canceled", "cancelled", "declined", "no_show"];
  if (terminalStatuses.includes(s)) {
    return steps.map((step) => ({
      ...step,
      status: "skipped" as const,
    }));
  }

  const currentIndex = steps.findIndex((step) => step.key === s);

  return steps.map((step, i) => ({
    ...step,
    status:
      i < currentIndex
        ? ("completed" as const)
        : i === currentIndex
        ? ("current" as const)
        : ("upcoming" as const),
  }));
}

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params?.id as string;

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processingAction, setProcessingAction] = useState<string | null>(null);

  async function fetchBooking() {
    try {
      setLoading(true);
      const result = await withTimeout(fetchSalonBookingDetail(bookingId), 20000, "Loading timed out.");
      if (result.success === false) throw new Error(result.error);
      setBooking(result.booking);
    } catch (err) {
      console.error("Failed to fetch booking:", err);
      toast.error("Failed to load booking details.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void Promise.resolve().then(() => {
      if (bookingId) fetchBooking();
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  const handleAction = async (action: string) => {
    setProcessingAction(action);
    try {
      let updatePayload: any = {};

      switch (action) {
        case "check_in":
          updatePayload.status = "checked_in";
          break;
        case "start_service":
          updatePayload.status = "in_progress";
          break;
        case "complete":
          updatePayload.status = "completed";
          break;
        case "mark_paid": {
          const paidResult = await markOwnerBookingFullyPaid(bookingId);
          if (paidResult.success === false) throw new Error(paidResult.error);
          toast.success("Booking marked fully paid. Review request sent to customer.");
          await fetchBooking();
          setProcessingAction(null);
          return;
        }
        case "no_show":
          updatePayload.status = "no_show";
          break;
        case "cancel":
          updatePayload.status = "canceled";
          break;
      }

      const result = await updateOwnerBooking(bookingId, updatePayload);
      if (result.success === false) throw new Error(result.error);

      if (action === "cancel" && booking?.booking_no) {
        await sendWhatsAppCancellationNotification(booking.booking_no);
        await sendBookingCancelledEmail(booking.booking_no);
      }

      if (action === "no_show" && booking?.booking_no) {
        await sendWhatsAppNoShowNotification(booking.booking_no);
        await sendBookingNoShowEmail(booking.booking_no);
      }

      toast.success(`Booking updated to "${Object.values(updatePayload)[0]}"!`);
      await fetchBooking();
    } catch (e: any) {
      toast.error("Failed to update: " + e.message);
    } finally {
      setProcessingAction(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-zinc-400 mb-4" />
        <p className="text-zinc-500 font-bold text-sm">Loading booking details...</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <XCircle className="w-12 h-12 text-rose-300 mb-4" />
        <h2 className="text-lg font-bold text-zinc-900">Booking Not Found</h2>
        <p className="text-sm text-zinc-500 mt-1">This booking may have been deleted or does not exist.</p>
        <Button onClick={() => router.push("/dashboard/bookings")} className="mt-6 bg-zinc-900 text-white hover:bg-zinc-800 rounded-xl font-bold text-sm">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Bookings
        </Button>
      </div>
    );
  }

  const status = (booking.status || "pending").toLowerCase();
  const financials = resolveBookingFinancialBreakdown(booking);
  const timeline = getTimeline(status);

  const isTerminal = ["completed", "canceled", "cancelled", "declined", "no_show"].includes(status);

  const statusColorMap: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    checked_in: "bg-blue-50 text-blue-700 border-blue-200",
    in_progress: "bg-indigo-50 text-indigo-700 border-indigo-200",
    completed: "bg-zinc-100 text-zinc-700 border-zinc-200",
    cancelled: "bg-rose-50 text-rose-700 border-rose-200",
    declined: "bg-rose-50 text-rose-700 border-rose-200",
    no_show: "bg-orange-50 text-orange-700 border-orange-200",
  };

  const statusLabel = status.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard/bookings")}
            className="w-9 h-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-zinc-500 hover:bg-slate-50 hover:text-zinc-900 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight">
              Booking <span className="font-mono text-brand">#{booking.booking_no || "—"}</span>
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              Created {booking.created_at ? new Date(booking.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "—"}
            </p>
          </div>
        </div>

        <Badge className={`${statusColorMap[status] || "bg-zinc-100 text-zinc-700"} border px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-lg`}>
          {statusLabel}
        </Badge>
      </div>

      {/* Lifecycle Timeline */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-zinc-900 mb-5 uppercase tracking-wider">Booking Lifecycle</h3>
        <div className="flex items-center justify-between relative">
          {/* Progress bar background */}
          <div className="absolute top-4 left-0 right-0 h-0.5 bg-slate-100 z-0" />

          {timeline.map((step, i) => (
            <div key={step.label} className="flex flex-col items-center relative z-10 flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  step.status === "completed"
                    ? "bg-emerald-500 border-emerald-500 text-white"
                    : step.status === "current"
                    ? "bg-white border-brand text-brand ring-4 ring-brand/10"
                    : step.status === "skipped"
                    ? "bg-rose-50 border-rose-200 text-rose-400"
                    : "bg-slate-50 border-slate-200 text-slate-400"
                }`}
              >
                {step.icon}
              </div>
              <span
                className={`text-[10px] font-bold mt-2 text-center ${
                  step.status === "completed"
                    ? "text-emerald-600"
                    : step.status === "current"
                    ? "text-brand"
                    : "text-zinc-400"
                }`}
              >
                {step.label}
              </span>
            </div>
          ))}
        </div>

        {["cancelled", "declined", "no_show"].includes(status) && (
          <div className="mt-4 flex items-center gap-2 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-4 py-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            This booking was {statusLabel.toLowerCase()}. The lifecycle has been terminated.
          </div>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column — Booking Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Appointment Info */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-zinc-900 mb-4 uppercase tracking-wider">Appointment Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <InfoRow icon={<Calendar className="w-4 h-4" />} label="Date" value={booking.booking_date || "—"} />
              <InfoRow icon={<Clock className="w-4 h-4" />} label="Time" value={booking.booking_time || "—"} />
              <InfoRow icon={<Scissors className="w-4 h-4" />} label="Service" value={getBookingServiceDisplayName(booking) || booking.service_name || "Standard Service"} />
              <InfoRow icon={<User className="w-4 h-4" />} label="Stylist" value={resolveStaffMemberFromBooking(booking)?.name || booking.staff_name || "Unassigned"} />
              <InfoRow icon={<Hash className="w-4 h-4" />} label="Booking ID" value={booking.booking_no || booking.id?.slice(0, 8) || "—"} mono />
              <InfoRow icon={<MapPin className="w-4 h-4" />} label="Location" value="Main Salon" />
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-zinc-900 mb-4 uppercase tracking-wider">Customer Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <InfoRow icon={<User className="w-4 h-4" />} label="Name" value={booking.customer_name || "Walk-in Customer"} />
              <InfoRow icon={<Mail className="w-4 h-4" />} label="Email" value={booking.customer_email || "—"} />
              <InfoRow icon={<Phone className="w-4 h-4" />} label="Phone" value={booking.customer_phone || "—"} />
            </div>
            {booking.notes && (
              <div className="mt-4 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Customer Notes</div>
                <p className="text-sm text-zinc-700">{booking.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column — Financials & Actions */}
        <div className="space-y-6">
          {/* Financial Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-zinc-900 mb-4 uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" /> Financials
            </h3>

            <div className="space-y-3">
              <FinancialRow label="Total Service Amount" value={`LKR ${financials.serviceTotal.toLocaleString()}`} bold />
              <div className="h-px bg-slate-100" />
              <FinancialRow
                label={`Reservation Deposit (${financials.reservationDepositPercent}%)`}
                value={`LKR ${financials.reservationDeposit.toLocaleString()}`}
              />
              <div className="pl-3 space-y-2 border-l-2 border-amber-200 ml-1">
                <FinancialRow
                  label={`Platform Share (${financials.platformCommissionPercent}% of service)`}
                  value={`LKR ${financials.platformCommission.toLocaleString()}`}
                  color="text-amber-700"
                  small
                />
                <FinancialRow
                  label="Salon Upfront Share"
                  value={`LKR ${financials.salonUpfront.toLocaleString()}`}
                  color="text-emerald-700"
                  small
                />
                {financials.staffCommission > 0 && (
                  <FinancialRow
                    label="Staff Commission (internal)"
                    value={`LKR ${financials.staffCommission.toLocaleString()}`}
                    color="text-indigo-700"
                    small
                  />
                )}
              </div>
              <div className="h-px bg-slate-100" />
              <FinancialRow label="Balance Due at Salon" value={`LKR ${financials.balanceDue.toLocaleString()}`} bold />

              <div className="flex items-center gap-2 mt-2">
                <CreditCard className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Deposit Status:</span>
                {booking.reservation_fee_paid ? (
                  <Badge className="bg-emerald-50 text-emerald-600 border-none text-[9px] font-black uppercase px-2 py-0.5">Paid</Badge>
                ) : (
                  <Badge className="bg-rose-50 text-rose-600 border-none text-[9px] font-black uppercase px-2 py-0.5">Unpaid</Badge>
                )}
              </div>
              {booking.payment_status && (
                <div className="flex items-center gap-2">
                  <DollarSign className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Balance:</span>
                  <Badge className={`border-none text-[9px] font-black uppercase px-2 py-0.5 ${booking.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                    {booking.payment_status}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          {!isTerminal && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-sm font-bold text-zinc-900 mb-4 uppercase tracking-wider">Quick Actions</h3>
              <div className="space-y-2">
                {(status === "confirmed" || status === "pending") && (
                  <ActionButton label="Check-In Customer" action="check_in" color="bg-brand hover:bg-brand-hover text-black" icon={<UserCheck className="w-4 h-4" />} onClick={handleAction} processing={processingAction} />
                )}
                {status === "checked_in" && (
                  <ActionButton label="Start Service" action="start_service" color="bg-brand hover:bg-brand-hover text-black" icon={<PlayCircle className="w-4 h-4" />} onClick={handleAction} processing={processingAction} />
                )}
                {status === "in_progress" && (
                  <ActionButton label="Complete Service" action="complete" color="bg-zinc-800 hover:bg-zinc-900" icon={<CheckCircle2 className="w-4 h-4" />} onClick={handleAction} processing={processingAction} />
                )}
                {booking.payment_status !== "paid" && (
                  <ActionButton label="Mark as Paid" action="mark_paid" color="bg-emerald-500 hover:bg-emerald-600" icon={<DollarSign className="w-4 h-4" />} onClick={handleAction} processing={processingAction} />
                )}
                <div className="h-px bg-slate-100 my-2" />
                <ActionButton label="No Show" action="no_show" color="bg-amber-500 hover:bg-amber-600" icon={<EyeOff className="w-4 h-4" />} onClick={handleAction} processing={processingAction} />
                <ActionButton label="Cancel Booking" action="cancel" color="bg-rose-500 hover:bg-rose-600" icon={<Ban className="w-4 h-4" />} onClick={handleAction} processing={processingAction} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Reusable sub-components ---

function InfoRow({ icon, label, value, mono }: { icon: React.ReactNode; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-zinc-500 shrink-0">
        {icon}
      </div>
      <div>
        <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{label}</div>
        <div className={`text-sm font-bold text-zinc-900 mt-0.5 ${mono ? "font-mono" : ""}`}>{value}</div>
      </div>
    </div>
  );
}

function FinancialRow({ label, value, bold, color, small }: { label: string; value: string; bold?: boolean; color?: string; small?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className={`${small ? "text-[11px]" : "text-xs"} ${bold ? "font-black text-zinc-900" : "font-bold text-zinc-500"}`}>{label}</span>
      <span className={`${small ? "text-[11px]" : "text-sm"} font-black ${color || (bold ? "text-zinc-900" : "text-zinc-700")}`}>{value}</span>
    </div>
  );
}

function ActionButton({
  label,
  action,
  color,
  icon,
  onClick,
  processing,
}: {
  label: string;
  action: string;
  color: string;
  icon: React.ReactNode;
  onClick: (action: string) => void;
  processing: string | null;
}) {
  const isProcessing = processing === action;
  return (
    <button
      onClick={() => onClick(action)}
      disabled={!!processing}
      className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white transition-all disabled:opacity-50 ${color}`}
    >
      {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
      {label}
    </button>
  );
}
