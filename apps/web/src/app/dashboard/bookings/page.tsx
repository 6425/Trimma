"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Search, MoreHorizontal, Calendar, Loader2, AlertCircle, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/config/supabase";
import { toast } from "sonner";

// Custom Dropdown Action Menu for Lifecycle Operations
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

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <div className="flex items-center justify-end gap-1">
        <Button variant="outline" size="sm" className="h-8 text-xs font-bold px-3 border-zinc-200">
          <Eye className="w-3 h-3 mr-1.5" /> View
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setOpen(!open)} 
          className="h-8 w-8 text-zinc-500 hover:bg-slate-100 shrink-0"
          disabled={isProcessing}
        >
          {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <MoreHorizontal className="w-4 h-4" />}
        </Button>
      </div>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden transform opacity-100 scale-100 transition-all duration-200 origin-top-right">
          <div className="py-1 flex flex-col">
            <div className="px-3 py-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Lifecycle Operations</div>
            <button onClick={() => handleFire('confirm')} className="w-full text-left px-4 py-2 text-xs hover:bg-emerald-50 text-emerald-700 font-bold transition-colors">Confirm</button>
            <button onClick={() => handleFire('check_in')} className="w-full text-left px-4 py-2 text-xs hover:bg-blue-50 text-blue-700 font-bold transition-colors">Check-In</button>
            <button onClick={() => handleFire('start_service')} className="w-full text-left px-4 py-2 text-xs hover:bg-indigo-50 text-indigo-700 font-bold transition-colors">Start Service</button>
            <button onClick={() => handleFire('complete')} className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 text-zinc-900 font-bold transition-colors">Complete Service</button>
            
            <div className="h-px bg-slate-100 my-1 mx-2" />
            <div className="px-3 py-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Payment</div>
            <button onClick={() => handleFire('mark_paid')} className="w-full text-left px-4 py-2 text-xs hover:bg-emerald-50 text-emerald-600 font-bold transition-colors">Mark as Paid</button>
            
            <div className="h-px bg-slate-100 my-1 mx-2" />
            <div className="px-3 py-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Exceptions</div>
            <button onClick={() => handleFire('no_show')} className="w-full text-left px-4 py-2 text-xs hover:bg-amber-50 text-amber-700 font-bold transition-colors">Mark No Show</button>
            <button onClick={() => handleFire('decline')} className="w-full text-left px-4 py-2 text-xs hover:bg-rose-50 text-rose-600 font-bold transition-colors">Decline / Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}


export default function DashboardBookings() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  async function fetchBookings() {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Unauthorized");

      const { data: salonData } = await supabase
        .from("salons")
        .select("*")
        .eq("owner_email", session.user.email)
        .maybeSingle();

      if (!salonData) {
        setBookings([]);
        setLoading(false);
        return;
      }

      const salon = salonData;

      // Note: In a fully related schema we would do .select("*, services(name), staff(name)")
      const { data: bookingsData, error: bookingsError } = await supabase
        .from("bookings")
        .select("*")
        .eq("salon_id", salon.id)
        .order("booking_date", { ascending: false })
        .order("booking_time", { ascending: false });

      if (bookingsError) throw bookingsError;
      setBookings(bookingsData || []);
    } catch (err) {
      console.error("Failed to fetch bookings:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleBookingLifecycleAction = async (bookingId: string, action: string) => {
    setProcessingId(bookingId);
    try {
      let updatePayload: any = {};
      
      switch (action) {
        case 'confirm': updatePayload.status = 'confirmed'; break;
        case 'check_in': updatePayload.status = 'checked_in'; break;
        case 'start_service': updatePayload.status = 'in_progress'; break;
        case 'complete': updatePayload.status = 'completed'; break;
        case 'mark_paid': updatePayload.payment_status = 'paid'; break;
        case 'no_show': updatePayload.status = 'no_show'; break;
        case 'decline': 
        case 'cancel':
          // In a real app, open a modal to capture reason
          updatePayload.status = action === 'decline' ? 'declined' : 'cancelled'; 
          break;
      }

      const { error } = await supabase
        .from("bookings")
        .update(updatePayload)
        .eq("id", bookingId);

      if (error) throw error;

      toast.success(`Booking successfully updated!`);
      await fetchBookings(); // Refresh UI
    } catch (e: any) {
      toast.error("Failed to update booking: " + e.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleActionReschedule = async (bookingId: string, status: 'approved' | 'rejected') => {
    setProcessingId(bookingId);
    try {
      const { error } = await supabase
        .from("bookings")
        .update({
          reschedule_requested: false,
          reschedule_status: status
        })
        .eq("id", bookingId);

      if (error) throw error;
      toast.success(`Reschedule request ${status === 'approved' ? 'approved' : 'declined'}!`);
      await fetchBookings();
    } catch (e: any) {
      toast.error("Failed to process reschedule action: " + e.message);
    } finally {
      setProcessingId(null);
    }
  };

  const filteredBookings = bookings.filter(b => 
    (b.customer_email || 'Walk-in Customer').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (b.booking_no || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingRequests = bookings.filter(b => b.reschedule_requested);

  const renderStatusBadge = (status: string) => {
    const s = (status || 'pending').toLowerCase();
    if (s === 'pending') return <Badge className="bg-amber-50 text-amber-600 border-none px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider shadow-xs">Pending</Badge>;
    if (s === 'confirmed') return <Badge className="bg-emerald-50 text-emerald-600 border-none px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider shadow-xs">Confirmed</Badge>;
    if (s === 'checked_in') return <Badge className="bg-blue-50 text-blue-600 border-none px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider shadow-xs">Checked-In</Badge>;
    if (s === 'in_progress') return <Badge className="bg-indigo-50 text-indigo-600 border-none px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider shadow-xs">In Progress</Badge>;
    if (s === 'completed') return <Badge className="bg-zinc-100 text-zinc-700 border-none px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider shadow-xs">Completed</Badge>;
    if (s === 'cancelled' || s === 'declined') return <Badge className="bg-rose-50 text-rose-600 border-none px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider shadow-xs">{s}</Badge>;
    if (s === 'no_show') return <Badge className="bg-orange-50 text-orange-600 border-none px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider shadow-xs">No Show</Badge>;
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
             <h3 className="text-base font-bold text-zinc-900">No bookings found</h3>
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
                        {b.reservation_fee_paid && (
                          <div className="bg-amber-50/50 border border-amber-100 rounded flex flex-col p-1.5 mt-0.5">
                            <div className="flex justify-between text-[9px] font-bold">
                              <span className="text-amber-700/70">Platform Fee ({b.platform_commission_percent || 10}%):</span>
                              <span className="text-amber-700">- LKR {((parseFloat(b.amount || "0") * 0.2) * ((b.platform_commission_percent || 10) / 100)).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-[10px] font-black mt-0.5 border-t border-amber-100/50 pt-0.5">
                              <span className="text-emerald-700">Salon Payout:</span>
                              <span className="text-emerald-700">LKR {((parseFloat(b.amount || "0") * 0.2) * (1 - ((b.platform_commission_percent || 10) / 100))).toLocaleString()}</span>
                            </div>
                          </div>
                        )}
                      </div>
                      {(b.payment_status === 'paid' || b.payment_status === 'refunded') && (
                        <div className="text-[10px] font-bold text-zinc-400 mt-1.5 capitalize border-t border-slate-100 pt-1">
                          Balance: <span className={b.payment_status === 'paid' ? 'text-emerald-600' : 'text-rose-600'}>{b.payment_status}</span>
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
    </div>
  );
}
