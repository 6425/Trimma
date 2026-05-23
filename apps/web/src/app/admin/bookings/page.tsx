"use client";

import React, { useState, useEffect } from "react";
import { Calendar, Search, Filter, AlertCircle, Loader2, DollarSign, Percent, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/config/supabase";
import { toast } from "sonner";
import { sendWhatsAppNotification, sendWhatsAppCancellationNotification, sendWhatsAppRescheduleNotification } from "../../actions/whatsapp";

export default function AdminBookings() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "confirmed" | "pending" | "reschedule">("all");
  const [actioningId, setActioningId] = useState<string | null>(null);

  // Rescheduling states
  const [reschedulingBooking, setReschedulingBooking] = useState<any | null>(null);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("12:00");

  useEffect(() => {
    fetchGlobalBookings();
  }, []);

  const fetchGlobalBookings = async () => {
    try {
      setLoading(true);
      // Fetch bookings and join with salons
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          salons (
            id,
            name
          )
        `)
        .order("booking_date", { ascending: false })
        .order("booking_time", { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error: any) {
      toast.error("Failed to load platform bookings: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOverrideStatus = async (bookingId: string, newStatus: 'confirmed' | 'cancelled') => {
    setActioningId(bookingId);
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status: newStatus })
        .eq("id", bookingId);

      if (error) throw error;
      toast.success(`Booking successfully marked as ${newStatus}!`);

      // Find the booking number in state to trigger live WhatsApp notification
      const targetBooking = bookings.find(b => b.id === bookingId);
      const bookingNo = targetBooking?.booking_no;
      if (bookingNo) {
        if (newStatus === "confirmed") {
          sendWhatsAppNotification(bookingNo);
        } else if (newStatus === "cancelled") {
          sendWhatsAppCancellationNotification(bookingNo);
        }
      }
      
      // Update local state
      setBookings(prev => prev.map(b => 
        b.id === bookingId ? { ...b, status: newStatus } : b
      ));
    } catch (error: any) {
      toast.error("Failed to update status: " + error.message);
    } finally {
      setActioningId(null);
    }
  };

  const handleRescheduleSave = async () => {
    if (!reschedulingBooking || !newDate || !newTime) return;
    setActioningId(reschedulingBooking.id);
    try {
      const formattedTime = newTime.length === 5 ? `${newTime}:00` : newTime;
      
      // 1. Update primary booking record
      const { error } = await supabase
        .from("bookings")
        .update({ 
          booking_date: newDate, 
          booking_time: formattedTime,
          reschedule_status: 'approved',
          reschedule_requested: false
        })
        .eq("id", reschedulingBooking.id);

      if (error) throw error;
      
      // 2. Write trace log to public.reschedule_requests for clean audit trails
      await supabase
        .from("reschedule_requests")
        .insert({
          booking_id: reschedulingBooking.id,
          requested_by: 'salon',
          status: 'approved',
          handled_by_salon: true
        });

      toast.success("Appointment successfully rescheduled! 📅");

      // 3. Dispatch Live WhatsApp Reschedule Notifier
      sendWhatsAppRescheduleNotification(reschedulingBooking.booking_no);

      // 4. Hot-reload local state
      setBookings(prev => prev.map(b => 
        b.id === reschedulingBooking.id ? { 
          ...b, 
          booking_date: newDate, 
          booking_time: formattedTime,
          reschedule_status: 'approved',
          reschedule_requested: false
        } : b
      ));

      setReschedulingBooking(null);
    } catch (err: any) {
      toast.error("Failed to reschedule: " + err.message);
    } finally {
      setActioningId(null);
    }
  };

  // Filter logic
  const filteredBookings = bookings.filter(b => {
    // 1. Search term match (customer email, booking no, or salon name)
    const matchesSearch = 
      (b.customer_email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.booking_no || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.salons?.name || "").toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    // 2. Status filter match
    if (statusFilter === "all") return true;
    if (statusFilter === "confirmed") return b.status === "confirmed";
    if (statusFilter === "pending") return b.status === "pending";
    if (statusFilter === "reschedule") return b.reschedule_requested === true;

    return true;
  });

  // Calculate high-end KPI stats
  const totalBookingsCount = bookings.length;
  const activeReschedules = bookings.filter(b => b.reschedule_requested).length;
  const totalGtv = bookings.reduce((sum, b) => sum + parseFloat(b.amount || 0), 0);
  const platformRevenue = bookings
    .filter(b => b.reservation_fee_paid)
    .reduce((sum, b) => sum + parseFloat(b.amount || 0) * 0.10, 0); // 10% Platform share of the 23% Reservation Fee

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR", minimumFractionDigits: 0 }).format(price);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1C29] tracking-tight">Platform Bookings</h1>
          <p className="text-zinc-500 text-sm mt-1">Monitor appointments, platform fees, and rescheduling compliance across all salons.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={fetchGlobalBookings} className="border-zinc-200 rounded-xl font-bold h-11">
            Refresh Data
          </Button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Total Bookings</p>
            <p className="text-2xl font-black text-zinc-900">{totalBookingsCount.toLocaleString()}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-600">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Reschedule Requests</p>
            <p className="text-2xl font-black text-rose-600">{activeReschedules.toLocaleString()}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Total Platform GTV</p>
            <p className="text-xl font-black text-brand">{formatPrice(totalGtv)}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50/50 flex items-center justify-center text-brand">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Platform Share (10%)</p>
            <p className="text-xl font-black text-emerald-600">{formatPrice(platformRevenue)}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <Percent className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by ID, customer email, or salon name..." 
            className="pl-10 h-11 bg-zinc-50 border-transparent focus:bg-white focus:border-rose-100 transition-all rounded-xl" 
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
          <Badge 
            variant="outline" 
            onClick={() => setStatusFilter("all")}
            className={`h-9 px-4 rounded-full border-zinc-200 font-bold cursor-pointer transition-all shrink-0 ${
              statusFilter === "all" ? "bg-white text-zinc-900 border-zinc-950" : "bg-white text-zinc-600 hover:bg-zinc-50"
            }`}
          >
            All Bookings
          </Badge>
          <Badge 
            variant="outline" 
            onClick={() => setStatusFilter("confirmed")}
            className={`h-9 px-4 rounded-full border-zinc-200 font-bold cursor-pointer transition-all shrink-0 ${
              statusFilter === "confirmed" ? "bg-white text-zinc-900 border-zinc-950" : "bg-white text-zinc-600 hover:bg-zinc-50"
            }`}
          >
            Confirmed
          </Badge>
          <Badge 
            variant="outline" 
            onClick={() => setStatusFilter("pending")}
            className={`h-9 px-4 rounded-full border-zinc-200 font-bold cursor-pointer transition-all shrink-0 ${
              statusFilter === "pending" ? "bg-white text-zinc-900 border-zinc-950" : "bg-white text-zinc-600 hover:bg-zinc-50"
            }`}
          >
            Pending
          </Badge>
          <Badge 
            variant="outline" 
            onClick={() => setStatusFilter("reschedule")}
            className={`h-9 px-4 rounded-full border-zinc-200 font-bold cursor-pointer transition-all shrink-0 ${
              statusFilter === "reschedule" ? "bg-rose-600 text-zinc-900 border-rose-600" : "bg-white text-zinc-600 hover:bg-zinc-50"
            }`}
          >
            Rescheduling Requests
          </Badge>
        </div>
      </div>

      {/* Bookings Data Table */}
      <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/50 text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-100">
                <th className="px-8 py-5">Booking ID</th>
                <th className="px-8 py-5">Establishment</th>
                <th className="px-8 py-5">Customer Account</th>
                <th className="px-8 py-5">Appointment Time</th>
                <th className="px-8 py-5">Financial Metrics</th>
                <th className="px-8 py-5">Status & Contract</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-8 py-24 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-brand mx-auto mb-4" />
                    <p className="text-zinc-500 font-medium">Accessing global transaction directory...</p>
                  </td>
                </tr>
              ) : filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-8 py-24 text-center text-zinc-500">
                    <Calendar className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p className="font-medium">No platform bookings found in current viewport.</p>
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-zinc-50/50 transition-colors group">
                    <td className="px-8 py-6 text-sm font-mono font-bold text-zinc-950">
                      {b.booking_no}
                    </td>
                    
                    <td className="px-8 py-6">
                      <div className="font-bold text-[#1A1C29] truncate max-w-[160px]">
                        {b.salons?.name || "Independent Provider"}
                      </div>
                      <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-tighter bg-zinc-100 px-1.5 py-0.5 rounded">
                        Salon ID: {b.salon_id?.substring(0, 8)}
                      </span>
                    </td>
                    
                    <td className="px-8 py-6 text-sm font-bold text-zinc-700">
                      {b.customer_email || "Anonymous Guest"}
                    </td>
                    
                    <td className="px-8 py-6">
                      <div className="font-extrabold text-zinc-800 text-sm">{b.booking_date}</div>
                      <div className="text-xs text-zinc-500 mt-0.5 font-semibold">{b.booking_time}</div>
                    </td>
                    
                    <td className="px-8 py-6">
                      <div className="text-sm font-black text-zinc-900">{formatPrice(b.amount)}</div>
                      <div className="text-[10px] text-zinc-500 font-bold mt-0.5">
                        Fee: {formatPrice(b.amount * 0.23)} (10% Plat / 10% Salon / 3% PayHere)
                      </div>
                    </td>
                    
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-1.5">
                        {(() => {
                          const s = (b.status || 'pending').toLowerCase();
                          if (s === 'pending') return <Badge className="bg-amber-50 text-amber-600 border-none px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider w-fit">Pending</Badge>;
                          if (s === 'confirmed') return <Badge className="bg-emerald-50 text-emerald-600 border-none px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider w-fit">Confirmed</Badge>;
                          if (s === 'in_progress') return <Badge className="bg-indigo-50 text-indigo-600 border-none px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider w-fit">In Progress</Badge>;
                          if (s === 'completed') return <Badge className="bg-zinc-100 text-zinc-700 border-none px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider w-fit">Completed</Badge>;
                          if (s === 'canceled') return <Badge className="bg-rose-50 text-rose-600 border-none px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider w-fit">Cancelled</Badge>;
                          if (s === 'no_show') return <Badge className="bg-orange-50 text-orange-600 border-none px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider w-fit">No Show</Badge>;
                          if (s === 'rescheduled') return <Badge className="bg-blue-50 text-blue-600 border-none px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider w-fit">Rescheduled</Badge>;
                          return <Badge className="bg-zinc-100 text-zinc-500 border-none px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider w-fit">{s}</Badge>;
                        })()}
                        
                        {b.reschedule_requested && (
                          <Badge className="bg-rose-50 text-rose-600 border-none animate-pulse w-fit text-[8px] font-black uppercase tracking-widest px-2 py-0.5">
                            Reschedule Pending
                          </Badge>
                        )}

                        {b.reschedule_status === 'approved' && (
                          <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-100 w-fit text-[8px] font-bold uppercase tracking-wider px-2 py-0.5">
                            Rescheduled
                          </Badge>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                         {b.status !== 'cancelled' && (
                           <Button 
                             size="sm" 
                             variant="outline"
                             disabled={actioningId === b.id}
                             onClick={() => {
                               setReschedulingBooking(b);
                               setNewDate(b.booking_date || "");
                               setNewTime(b.booking_time ? b.booking_time.substring(0, 5) : "12:00");
                             }}
                             className="border-zinc-200 text-zinc-750 hover:bg-zinc-50 text-[9px] font-bold h-7 px-2.5 rounded-lg flex items-center gap-1"
                           >
                             <Calendar className="w-3 h-3 text-zinc-500" /> Reschedule
                           </Button>
                         )}
                        {b.status === 'pending' && (
                          <Button 
                            size="sm" 
                            disabled={actioningId === b.id}
                            onClick={() => handleOverrideStatus(b.id, 'confirmed')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-zinc-900 text-[9px] font-bold h-7 px-2.5 rounded-lg"
                          >
                            Confirm
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Intelligence Dashboard Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="md:col-span-2 bg-white rounded-3xl p-8 text-zinc-900 relative overflow-hidden shadow-2xl">
            <Activity className="absolute -right-8 -bottom-8 w-48 h-48 text-zinc-900/5 rotate-12" />
            <div className="flex justify-between items-start mb-8 relative z-10">
               <div>
                  <h3 className="text-xl font-black mb-1">Financial Clearing & Settlement</h3>
                  <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest font-mono">Platform Clearing System v1.0</p>
               </div>
               <Badge className="bg-slate-100 text-zinc-900 border-none font-bold">Standard 10% commission active</Badge>
            </div>
            <div className="grid grid-cols-3 gap-8 relative z-10 text-left">
               <div>
                  <p className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest mb-1">Gross Billing</p>
                  <p className="text-2xl font-black text-rose-500">{formatPrice(totalGtv)}</p>
               </div>
               <div>
                  <p className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest mb-1">Settled Platform commission</p>
                  <p className="text-2xl font-black text-emerald-500">{formatPrice(platformRevenue)}</p>
               </div>
               <div>
                  <p className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest mb-1">Total Cleared</p>
                  <p className="text-2xl font-black text-blue-500">{formatPrice(totalGtv - platformRevenue)}</p>
               </div>
            </div>
         </div>
         <div className="bg-gradient-to-br from-rose-50 to-white rounded-3xl p-8 border border-rose-100 flex flex-col justify-center text-center">
            <div className="w-12 h-12 bg-rose-100 text-brand rounded-2xl flex items-center justify-center mx-auto mb-4 font-black">
              %
            </div>
            <p className="text-sm font-bold text-zinc-900 mb-2">Commissions Contract</p>
            <p className="text-xs text-zinc-500 leading-relaxed">The 10% platform share is automatically retained upon online reservation fee payment. Salon splits are settled natively offline.</p>
         </div>
      </div>

      {/* Sleek, Premium Glassmorphism Rescheduling Modal Overlay */}
      {reschedulingBooking && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-slate-200 shadow-2xl space-y-6 mx-4 relative text-left">
            <div>
              <h3 className="text-lg font-black text-zinc-900 tracking-tight flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600 animate-bounce" />
                Reschedule Appointment
              </h3>
              <p className="text-xs text-zinc-500 mt-1 font-medium">
                Updating schedule for booking reference <strong>{reschedulingBooking.booking_no}</strong>.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              {/* SELECT NEW DATE */}
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

              {/* SELECT NEW TIME */}
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

            {/* ACTION BUTTONS */}
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
                disabled={actioningId === reschedulingBooking.id || !newDate || !newTime}
                className="bg-white hover:bg-zinc-800 text-zinc-900 font-bold rounded-xl h-10 px-5 flex items-center gap-1.5 text-xs"
              >
                {actioningId === reschedulingBooking.id ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    Confirm Reschedule
                  </>
                )}
              </Button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
