"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Search, Calendar, Loader2, AlertCircle, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { sendWhatsAppCancellationNotification, sendWhatsAppNoShowNotification } from "@/app/actions/whatsapp";
import { sendBookingCancelledEmail, sendBookingNoShowEmail } from "@/app/actions/email-settings";
import { sendBookingReviewRequests } from "@/app/actions/review-notifications";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { fetchSalonBookingsPage } from "@/app/actions/salon-dashboard-data";
import { confirmOwnerBooking, rescheduleOwnerBooking, updateOwnerBooking } from "@/app/actions/salon-operations";
import { markBookingNotificationsReadForOwner } from "@/app/actions/salon-notifications";
import { withTimeout } from "@/lib/promise-timeout";
import { toast } from "sonner";

import { ChevronDown } from "lucide-react";

type BookingStatusTab = "pending" | "confirmed" | "rescheduled" | "canceled";

const BOOKING_STATUS_TABS: { key: BookingStatusTab; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "confirmed", label: "Confirmed" },
  { key: "rescheduled", label: "Rescheduled" },
  { key: "canceled", label: "Cancelled" },
];

function matchesBookingTab(booking: any, tab: BookingStatusTab) {
  const status = (booking.status || "pending").toLowerCase();
  if (tab === "pending") return status === "pending";
  if (tab === "confirmed") return status === "confirmed" || status === "in_progress" || status === "completed";
  if (tab === "rescheduled") {
    return (
      status === "rescheduled" ||
      booking.reschedule_requested === true ||
      booking.reschedule_status === "approved" ||
      booking.reschedule_status === "pending_salon"
    );
  }
  if (tab === "canceled") return status === "canceled" || status === "no_show";
  return true;
}

// Context-Aware Action Menu — only shows valid actions based on current booking status
const ActionMenu = ({ booking, onAction, processingId }: { booking: any, onAction: (id: string, action: string) => void, processingId: string | null }) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuRef]);

  const handleFire = (action: string) => {
    setOpen(false);
    onAction(booking.id, action);
  };

  const isProcessing = processingId === booking.id;
  const status = (booking.status || 'pending').toLowerCase();
  const paymentStatus = (booking.payment_status || 'unpaid').toLowerCase();
  const isTerminal = ['completed', 'canceled', 'cancelled', 'no_show'].includes(status);

  // Build context-aware lifecycle actions based on current status
  const lifecycleActions: { key: string; label: string; color: string; hoverBg: string }[] = [];

  if (status === 'pending') {
    lifecycleActions.push({ key: 'confirm', label: 'Confirm Booking', color: 'text-emerald-700', hoverBg: 'hover:bg-emerald-50' });
    lifecycleActions.push({ key: 'reschedule', label: 'Reschedule', color: 'text-blue-700', hoverBg: 'hover:bg-blue-50' });
  }
  if (status === 'confirmed') {
    lifecycleActions.push({ key: 'in_progress', label: 'Start Service', color: 'text-indigo-700', hoverBg: 'hover:bg-indigo-50' });
    lifecycleActions.push({ key: 'reschedule', label: 'Reschedule', color: 'text-blue-700', hoverBg: 'hover:bg-blue-50' });
  }
  if (status === 'in_progress') {
    lifecycleActions.push({ key: 'complete', label: 'Complete Service', color: 'text-emerald-700', hoverBg: 'hover:bg-emerald-50' });
  }

  if (!isTerminal) {
    lifecycleActions.push({ key: 'no_show', label: 'Mark No-Show', color: 'text-amber-700', hoverBg: 'hover:bg-amber-50' });
    lifecycleActions.push({ key: 'cancel', label: 'Cancel Booking', color: 'text-rose-600', hoverBg: 'hover:bg-rose-50' });
  }

  // Build context-aware payment actions
  const paymentActions: { key: string; label: string; color: string; hoverBg: string }[] = [];

  if (paymentStatus === 'unpaid') {
    paymentActions.push({ key: 'reservation_paid', label: 'Mark Reserved Comm.', color: 'text-amber-700', hoverBg: 'hover:bg-amber-50' });
  }
  if (paymentStatus === 'unpaid' || paymentStatus === 'reservation_paid') {
    paymentActions.push({ key: 'mark_paid', label: 'Mark Fully Paid', color: 'text-emerald-700', hoverBg: 'hover:bg-emerald-50' });
  }

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <div className="flex items-center justify-end">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setOpen(!open)} 
          className="h-8 text-xs font-bold px-3 border-zinc-200 text-zinc-700 hover:text-zinc-900 hover:bg-slate-50 shrink-0"
          disabled={isProcessing}
        >
          {isProcessing ? <Loader2 className="w-3 h-3 animate-spin mr-1.5" /> : null}
          Action <ChevronDown className="w-3 h-3 ml-1.5 opacity-70" />
        </Button>
      </div>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden transform opacity-100 scale-100 transition-all duration-200 origin-top-right">
          <div className="py-1 flex flex-col">
            {/* Always available: View */}
            <button onClick={() => handleFire('view')} className="w-full flex items-center px-4 py-2 text-xs hover:bg-slate-50 text-zinc-700 font-bold transition-colors">
              <Eye className="w-3 h-3 mr-2" /> View Booking
            </button>

            {/* Lifecycle actions — only if not terminal */}
            {lifecycleActions.length > 0 && (
              <>
                <div className="h-px bg-slate-100 my-1 mx-2" />
                <div className="px-3 py-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Booking Status</div>
                {lifecycleActions.map((a) => (
                  <button key={a.key} onClick={() => handleFire(a.key)} className={`w-full text-left px-4 py-2 text-xs ${a.hoverBg} ${a.color} font-bold transition-colors`}>
                    {a.label}
                  </button>
                ))}
              </>
            )}

            {/* Payment actions — show unless fully paid/refunded */}
            {paymentActions.length > 0 && !['paid', 'refunded'].includes(paymentStatus) && (
              <>
                <div className="h-px bg-slate-100 my-1 mx-2" />
                <div className="px-3 py-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Payment</div>
                {paymentActions.map((a) => (
                  <button key={a.key} onClick={() => handleFire(a.key)} className={`w-full text-left px-4 py-2 text-xs ${a.hoverBg} ${a.color} font-bold transition-colors`}>
                    {a.label}
                  </button>
                ))}
              </>
            )}

            {/* Terminal state indicator */}
            {isTerminal && lifecycleActions.length === 0 && (
              <>
                <div className="h-px bg-slate-100 my-1 mx-2" />
                <div className="px-3 py-2 text-[10px] font-bold text-zinc-400 italic">No further actions available</div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
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
  const tabParam = searchParams.get("tab") as BookingStatusTab | null;
  const statusTab: BookingStatusTab =
    tabParam && BOOKING_STATUS_TABS.some((t) => t.key === tabParam) ? tabParam : "pending";

  async function fetchBookings() {
    try {
      setLoading(true);
      const result = await withTimeout(fetchSalonBookingsPage(), 20000, "Loading timed out.");
      if (result.success === false) throw new Error(result.error);
      setBookings(result.bookings || []);
    } catch (err) {
      console.error("Failed to fetch bookings:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void Promise.resolve().then(() => {
      fetchBookings();
    });
  }, []);

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
      let updatePayload: any = {};
      const booking = bookings.find(b => b.id === bookingId);
      const bookingNo = booking?.booking_no;
      
      switch (action) {
        case 'confirm': {
          const confirmResult = await confirmOwnerBooking(bookingId);
          if (confirmResult.success === false) throw new Error(confirmResult.error);
          toast.success(`Booking successfully confirmed!`);
          await fetchBookings();
          setProcessingId(null);
          return;
        }
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

  const handleActionReschedule = async (_bookingId: string, _status: 'approved' | 'rejected') => {
    toast.info("Reschedule requests are not enabled on this schema yet.");
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

  const filteredBookings = searchedBookings.filter((b) => matchesBookingTab(b, statusTab));

  const tabCounts = BOOKING_STATUS_TABS.reduce(
    (acc, tab) => {
      acc[tab.key] = searchedBookings.filter((b) => matchesBookingTab(b, tab.key)).length;
      return acc;
    },
    {} as Record<BookingStatusTab, number>
  );

  const pendingRequests: any[] = [];

  const renderStatusBadge = (status: string) => {
    const s = (status || 'pending').toLowerCase();
    if (s === 'pending') return <Badge className="bg-amber-50 text-amber-600 border-none px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider shadow-xs">Pending</Badge>;
    if (s === 'confirmed') return <Badge className="bg-emerald-50 text-emerald-600 border-none px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider shadow-xs">Confirmed</Badge>;
    if (s === 'in_progress') return <Badge className="bg-indigo-50 text-indigo-600 border-none px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider shadow-xs">In Progress</Badge>;
    if (s === 'completed') return <Badge className="bg-zinc-100 text-zinc-700 border-none px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider shadow-xs">Completed</Badge>;
    if (s === 'canceled') return <Badge className="bg-rose-50 text-rose-600 border-none px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider shadow-xs">Cancelled</Badge>;
    if (s === 'no_show') return <Badge className="bg-orange-50 text-orange-600 border-none px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider shadow-xs">No Show</Badge>;
    if (s === 'rescheduled') return <Badge className="bg-blue-50 text-blue-600 border-none px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider shadow-xs">Rescheduled</Badge>;
    return <Badge className="bg-zinc-100 text-zinc-500 border-none px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider shadow-xs">{s}</Badge>;
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
          <Button className="h-10 bg-zinc-900 text-white hover:bg-zinc-800 rounded-xl font-bold text-xs shrink-0 px-4">
            <Plus className="w-4 h-4 mr-1.5" /> New Booking
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
                    Booking No: <span className="font-bold text-zinc-700">{req.booking_no}</span> &bull; 
                    Slot: <span className="font-bold text-zinc-700">{req.booking_date} at {req.booking_time}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <Button size="sm" disabled={processingId === req.id} onClick={() => handleActionReschedule(req.id, 'approved')} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 h-8 rounded-lg">Approve</Button>
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
                    ? tab.key === "pending"
                      ? "bg-amber-500 text-zinc-900 border-amber-500 shadow-sm"
                      : tab.key === "confirmed"
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
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs min-h-[400px]">
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
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead>
                <tr className="bg-zinc-50/50 text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-200">
                  <th className="px-6 py-4">Booking ID & Date</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Service & Staff</th>
                  <th className="px-6 py-4">Financials</th>
                  <th className="px-6 py-4">Lifecycle Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-zinc-50/60 transition-colors">
                    
                    {/* ID & Date */}
                    <td className="px-6 py-4">
                      <div className="text-sm font-mono font-extrabold text-zinc-900">{b.booking_no}</div>
                      <div className="text-xs font-bold text-zinc-500 mt-1">{b.booking_date}</div>
                      <div className="text-[11px] font-semibold text-zinc-400">{b.booking_time}</div>
                    </td>
                    
                    {/* Customer */}
                    <td className="px-6 py-4">
                      <div className="font-extrabold text-zinc-900 text-sm">{b.customer_email || 'Walk-in'}</div>
                    </td>

                    {/* Service & Staff */}
                    <td className="px-6 py-4">
                      <div className="font-bold text-zinc-800 text-sm">{b.services?.name || 'Standard Service'}</div>
                      <div className="text-[11px] text-zinc-400 font-medium mt-1">
                        Staff: <span className="font-bold text-zinc-600">{b.staff?.name || 'Unassigned'}</span>
                      </div>
                    </td>
                    
                    {/* Financials */}
                    <td className="px-6 py-4">
                      <div className="text-sm font-black text-zinc-900">LKR {parseFloat(b.amount || "0").toLocaleString()}</div>
                      <div className="flex flex-col gap-1 mt-1.5">
                        <div className="flex items-center gap-1.5">
                          <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                            Dep: LKR {(parseFloat(b.amount || "0") * 0.2).toLocaleString()}
                          </div>
                          {b.reservation_fee_paid ? (
                            <Badge className="bg-emerald-50 text-emerald-600 border-none px-1.5 py-0 text-[8px] font-black uppercase">Paid</Badge>
                          ) : (
                            <Badge className="bg-rose-50 text-rose-600 border-none px-1.5 py-0 text-[8px] font-black uppercase">Unpaid</Badge>
                          )}
                        </div>
                        {b.reservation_fee_paid && (() => {
                          const amt = parseFloat(b.amount || "0");
                          // Strictly calculate as 10% each as per new rules, ignoring legacy DB splits
                          const platAmt = amt * 0.10;
                          const salonAmt = amt * 0.10;
                          
                          return (
                            <div className="bg-amber-50/50 border border-amber-100 rounded flex flex-col p-1.5 mt-0.5">
                              <div className="flex justify-between text-[9px] font-bold">
                                <span className="text-amber-700/70">Platform Fee (10%):</span>
                                <span className="text-amber-700">- LKR {platAmt.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                              </div>
                              <div className="flex justify-between text-[10px] font-black mt-0.5 border-t border-amber-100/50 pt-0.5">
                                <span className="text-emerald-700">Salon Commission (10%):</span>
                                <span className="text-emerald-700">LKR {salonAmt.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                      {(b.payment_status === 'reservation_paid' || b.payment_status === 'paid' || b.payment_status === 'refunded') && (
                        <div className="text-[10px] font-bold text-zinc-400 mt-1.5 capitalize border-t border-slate-100 pt-1">
                          Balance: <span className={b.payment_status === 'paid' ? 'text-emerald-600' : b.payment_status === 'reservation_paid' ? 'text-amber-600' : 'text-rose-600'}>
                            {b.payment_status === 'reservation_paid' ? 'Reserved Comm. Paid' : b.payment_status}
                          </span>
                        </div>
                      )}
                    </td>
                    
                    {/* Status */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        {renderStatusBadge(b.status)}
                        
                        {b.reschedule_requested && (
                          <Badge className="bg-rose-50 text-rose-600 border-none animate-pulse w-fit text-[9px] font-black uppercase tracking-wider px-2 py-0.5">
                            Reschedule Req
                          </Badge>
                        )}
                        {b.reschedule_status === 'approved' && (
                          <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-100 w-fit text-[9px] font-bold uppercase tracking-wider px-2 py-0.5">
                            Rescheduled
                          </Badge>
                        )}
                      </div>
                    </td>
                    
                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <ActionMenu booking={b} onAction={handleBookingLifecycleAction} processingId={processingId} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {reschedulingBooking && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-slate-200 shadow-2xl space-y-6 mx-4 relative text-left">
            <div>
              <h3 className="text-lg font-black text-zinc-900 tracking-tight flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600" />
                Reschedule Appointment
              </h3>
              <p className="text-xs text-zinc-500 mt-1 font-medium">
                Updating schedule for booking reference{" "}
                <strong>{reschedulingBooking.booking_no}</strong>.
              </p>
            </div>

            <div className="space-y-4 pt-2">
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

            <div className="flex items-center gap-3 pt-4 border-t border-slate-100 justify-end">
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
                disabled={processingId === reschedulingBooking.id || !newDate || !newTime}
                className="bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-xl h-10 px-5 flex items-center gap-1.5 text-xs"
              >
                {processingId === reschedulingBooking.id ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                  </>
                ) : (
                  "Confirm Reschedule"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
