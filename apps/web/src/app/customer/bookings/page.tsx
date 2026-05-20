"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { 
  CalendarDays, MapPin, Scissors, Clock, 
  Sparkles, CheckCircle2, ChevronRight, AlertCircle, ShoppingBag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "../../../config/supabase";

function BookingsListContent() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBookings() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Fetch User's Bookings
        const { data: bookingsData } = await supabase
          .from('bookings')
          .select('*, salons(name, city)')
          .ilike('customer_email', session.user.email)
          .order('booking_date', { ascending: false })
          .order('booking_time', { ascending: false });

        if (bookingsData) {
          setBookings(bookingsData);
        }
      }
      setLoading(false);
    }
    fetchBookings();
  }, []);

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-zinc-900 tracking-tight">My Bookings</h1>
          <p className="text-sm text-zinc-500 mt-1">View, track, and manage all your salon appointments.</p>
        </div>
        
        <Link href="/salons">
          <Button className="bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl font-bold text-xs h-10 px-4">
            <Scissors className="w-4 h-4 mr-2" />
            Book New Appointment
          </Button>
        </Link>
      </div>

      {/* BOOKINGS MAIN */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
          <p className="text-sm text-zinc-500 font-bold">Loading your appointments...</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-10 md:p-16 text-center max-w-xl mx-auto mt-8 shadow-sm">
          <CalendarDays className="w-16 h-16 mx-auto mb-4 text-zinc-300 stroke-[1.5]" />
          <h3 className="text-lg font-bold text-zinc-900">No appointments scheduled</h3>
          <p className="text-sm text-zinc-500 mt-2 max-w-sm mx-auto leading-relaxed">
            You don't have any bookings yet. Let's find a professional salon nearby and book your first experience!
          </p>
          <Link href="/salons">
            <Button className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold px-6 py-2.5">
              Explore Salons
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div 
              key={booking.id} 
              className="bg-white rounded-2xl border border-slate-200 hover:border-zinc-300 transition-all p-5 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm hover:shadow-md"
            >
              <div className="flex items-start gap-4">
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 flex items-center justify-center shrink-0">
                  <Scissors className="w-6 h-6 text-zinc-700" />
                </div>
                
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-extrabold text-zinc-900 text-base">{booking.salons?.name || 'Trimma Partner Salon'}</h3>
                    <Badge variant={booking.status === 'confirmed' ? 'default' : booking.status === 'pending' ? 'secondary' : 'outline'} 
                           className={`text-[9px] font-black uppercase px-2 py-0.5 tracking-wide rounded-md border-none ${
                             booking.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600' :
                             booking.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                             'bg-zinc-100 text-zinc-500'
                           }`}>
                      {booking.status}
                    </Badge>
                  </div>
                  
                  <div className="text-xs text-zinc-500 font-medium flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{booking.salons?.city || 'Sri Lanka'}</span>
                  </div>

                  <div className="text-xs font-mono font-bold text-zinc-400 mt-2">
                    ID: <span className="text-zinc-700">{booking.booking_no}</span>
                  </div>
                </div>
              </div>

              {/* DATE, TIME & PAYMENT */}
              <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-start sm:items-center md:items-end lg:items-center gap-4 sm:gap-10 md:gap-4 lg:gap-10 pt-4 md:pt-0 border-t border-slate-100 md:border-t-0 justify-between">
                
                {/* DATE & TIME */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-zinc-800 text-xs font-extrabold">
                    <CalendarDays className="w-4 h-4 text-emerald-600" />
                    <span>{booking.booking_date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-500 text-xs font-semibold">
                    <Clock className="w-4 h-4" />
                    <span>{booking.booking_time}</span>
                  </div>
                </div>

                {/* FINANCIAL STATUS */}
                <div className="space-y-1.5 md:text-right flex flex-col md:items-end">
                  <div className="text-sm font-black text-zinc-900">
                    Total: LKR {parseFloat(booking.amount).toLocaleString()}
                  </div>
                  
                  {booking.status === 'confirmed' || booking.status === 'pending' || booking.reservation_fee_paid ? (
                    <>
                      <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md uppercase tracking-wider">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        20% Deposit Paid (LKR {(parseFloat(booking.amount) * 0.2).toLocaleString()})
                      </div>
                      <div className="text-[10px] text-zinc-400 font-bold leading-relaxed">
                        Balance 80% (LKR {(parseFloat(booking.amount) * 0.8).toLocaleString()}) paid at salon
                      </div>
                    </>
                  ) : (
                    <div className="text-[10px] text-zinc-400 font-bold uppercase">
                      Booking {booking.status || 'cancelled'}
                    </div>
                  )}
                </div>
                
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CustomerBookingsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-zinc-500">Loading Appointments...</div>}>
      <BookingsListContent />
    </Suspense>
  );
}
