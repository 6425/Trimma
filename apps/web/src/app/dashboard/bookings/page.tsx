"use client";

import { useState, useEffect } from "react";
import { Plus, Search, MoreHorizontal, Calendar, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/config/supabase";

export default function DashboardBookings() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  async function fetchBookings() {
    try {
      setLoading(true);
      // 1. Resolve Salon ID dynamically from active user session
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

      // 2. Fetch Bookings for this Salon directly from Supabase for real-time accuracy
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

      alert(`Reschedule request successfully ${status === 'approved' ? 'approved' : 'declined'}!`);
      
      // Refresh local bookings list
      await fetchBookings();
    } catch (e: any) {
      alert("Failed to process reschedule action: " + e.message);
    } finally {
      setProcessingId(null);
    }
  };

  // Filter bookings based on email search
  const filteredBookings = bookings.filter(b => 
    (b.customer_email || 'Walk-in Customer').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (b.booking_no || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingRequests = bookings.filter(b => b.reschedule_requested);

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 sm:p-6">
      
      {/* Page Title & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Bookings</h1>
          <p className="text-sm text-zinc-500">Manage your salon appointments and scheduling requests.</p>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
            <Input 
              placeholder="Search by ID or customer email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9.5 h-10 rounded-xl"
            />
          </div>
          <Button className="h-10 bg-zinc-900 text-white hover:bg-zinc-800 rounded-xl font-bold text-xs">
            <Plus className="w-4 h-4 mr-2" />
            New Booking
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
          
          <p className="text-xs text-amber-700/90 font-medium leading-relaxed">
            The following clients have submitted reschedule requests. According to the locked <strong>20% Upfront Commitment Policy</strong>, rescheduling requires direct, manual merchant approval. No financial refunds or transactions are processed by the platform.
          </p>

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
                  <Button 
                    size="sm" 
                    disabled={processingId === req.id}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 h-8 rounded-lg"
                    onClick={() => handleActionReschedule(req.id, 'approved')}
                  >
                    {processingId === req.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Approve'}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    disabled={processingId === req.id}
                    className="border-rose-100 text-rose-600 hover:bg-rose-50 text-xs font-bold px-3 py-1.5 h-8 rounded-lg"
                    onClick={() => handleActionReschedule(req.id, 'rejected')}
                  >
                    {processingId === req.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Decline'}
                  </Button>
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
             <p className="text-xs text-zinc-400 max-w-xs mx-auto mt-1 leading-relaxed">
               Appointments matching your query will show up here. You can also manually schedule work slots.
             </p>
           </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-zinc-50/50 text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-200">
                  <th className="px-6 py-4">Booking ID</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Date & Time</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status & Contract</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-zinc-50/60 transition-colors">
                    <td className="px-6 py-4 text-sm font-mono font-bold text-zinc-900">{b.booking_no}</td>
                    
                    <td className="px-6 py-4">
                      <div className="font-extrabold text-zinc-900 text-sm">{b.customer_email || 'Walk-in Customer'}</div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="font-bold text-zinc-900 text-sm">{b.booking_date}</div>
                      <div className="text-xs font-semibold text-zinc-400 mt-0.5">{b.booking_time}</div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="text-sm font-black text-zinc-900">LKR {parseFloat(b.amount).toLocaleString()}</div>
                      <div className="text-[10px] text-zinc-400 font-bold mt-0.5">
                        Dep: LKR {(parseFloat(b.amount) * 0.2).toLocaleString()} ({b.reservation_fee_paid ? 'Paid' : 'Unpaid'})
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        <Badge className={`w-fit text-[10px] font-extrabold px-2 py-0.5 border-none shadow-xs uppercase tracking-wider ${
                          b.status === 'confirmed' ? "bg-emerald-50 text-emerald-600" : 
                          b.status === 'pending' ? "bg-amber-50 text-amber-600" : 
                          "bg-zinc-100 text-zinc-500"
                        }`}>
                          {b.status || 'pending'}
                        </Badge>
                        
                        {b.reschedule_requested && (
                          <Badge className="bg-rose-50 text-rose-600 border-none animate-pulse w-fit text-[9px] font-black uppercase tracking-wider px-2 py-0.5">
                            Reschedule Requested
                          </Badge>
                        )}
                        
                        {b.reschedule_status === 'approved' && (
                          <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-100 w-fit text-[9px] font-bold uppercase tracking-wider px-2 py-0.5">
                            Rescheduled
                          </Badge>
                        )}
                        
                        {b.reschedule_status === 'rejected' && (
                          <Badge className="bg-rose-50 text-rose-700 border border-rose-100 w-fit text-[9px] font-bold uppercase tracking-wider px-2 py-0.5">
                            Reschedule Declined
                          </Badge>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 text-right">
                      {b.reschedule_requested ? (
                        <div className="flex justify-end gap-1.5">
                          <Button 
                            size="sm" 
                            disabled={processingId === b.id}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-2 py-1 h-7 rounded-md"
                            onClick={() => handleActionReschedule(b.id, 'approved')}
                          >
                            Approve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            disabled={processingId === b.id}
                            className="border-rose-100 text-rose-600 hover:bg-rose-50 text-[10px] font-bold px-2 py-1 h-7 rounded-md"
                            onClick={() => handleActionReschedule(b.id, 'rejected')}
                          >
                            Decline
                          </Button>
                        </div>
                      ) : (
                        <Button variant="ghost" size="icon" className="text-zinc-400">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      )}
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
