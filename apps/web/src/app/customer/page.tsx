"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  CalendarDays, MapPin, Star, Scissors, 
  Sparkles, CheckCircle2, Navigation2, ChevronRight,
  TrendingUp, Award, Clock, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "../../config/supabase";
import { toast } from "sonner";
import { sendWhatsAppNotification } from "../actions/whatsapp";

function DashboardContent() {
  const router = useRouter();
  const [userName, setUserName] = useState("Guest");
  const [userRole, setUserRole] = useState("Member");
  const [upcomingBookings, setUpcomingBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();

  useEffect(() => {
    // Handle PayHere Success Redirect
    if (searchParams.get("payment_success") === "true") {
      const bookingNo = searchParams.get("booking_no");
      
      if (bookingNo) {
        // Trigger WhatsApp Notification Server Action
        sendWhatsAppNotification(bookingNo).then((res) => {
          if (res?.success) {
            toast.success("Receipt sent to your WhatsApp! 📱", {
              position: "top-center"
            });
          } else {
            console.error("WhatsApp dispatch failure:", res?.error);
          }
        });
      }

      toast.success(`Payment successful! Booking ${bookingNo} is confirmed.`, {
        duration: 5000,
        position: "top-center"
      });
      // Clean up URL parameter
      window.history.replaceState(null, '', '/customer');
    }
  }, [searchParams]);

  useEffect(() => {
    async function fetchUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/login?redirectTo=/customer");
        return;
      }
      if (session.user) {
        const name = session.user.user_metadata?.first_name || session.user.email?.split('@')[0] || "Guest";
        setUserName(name);

        const { data } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .single();

        if (data) {
          if (data.role === 'admin') setUserRole('Admin');
          else if (data.role === 'agent') setUserRole('Agent');
          else if (data.role === 'salon_owner') setUserRole('Salon Partner');
          else setUserRole(data.role); 
        } else {
          setUserRole('Member');
        }

        // Fetch User's Bookings
        const { data: bookingsData } = await supabase
          .from('bookings')
          .select('*, salons(name, city)')
          .ilike('customer_email', session.user.email)
          .order('created_at', { ascending: false });

        if (bookingsData) {
          setUpcomingBookings(bookingsData);
        }
      }
      setLoading(false);
    }
    fetchUser();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
         <Loader2 className="w-10 h-10 animate-spin text-brand mb-4" />
         <p className="text-zinc-500 font-medium">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8 md:space-y-12">
      
      {/* 1. WELCOME HERO & QUICK ACTIONS */}
      <section className="bg-zinc-900 rounded-3xl p-6 md:p-10 text-white relative overflow-hidden shadow-xl border border-white/10">
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-900 to-[#1A1608] z-0"></div>
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#F5B700]/10 blur-3xl rounded-full z-0"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <Avatar className="w-16 h-16 md:w-20 md:h-20 border-2 border-white/20">
              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`} />
              <AvatarFallback>{userName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-1">{getGreeting()}, {userName} 👋</h1>
              <div className="flex items-center gap-3 text-sm text-zinc-300">
                <Badge variant="secondary" className="bg-[#F5B700]/10 text-[#F5B700] border border-[#F5B700]/20 font-semibold text-xs px-2.5 py-0.5">{userRole}</Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-8 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm font-medium">
           <Link href="/salons"><Button variant="outline" className="bg-white/5 border-white/10 text-white hover:bg-[#F5B700]/10 hover:text-[#F5B700] hover:border-[#F5B700]/30 h-12 rounded-xl w-full">Book Now</Button></Link>
           <Link href="/salons"><Button variant="outline" className="bg-white/5 border-white/10 text-white hover:bg-[#F5B700]/10 hover:text-[#F5B700] hover:border-[#F5B700]/30 h-12 rounded-xl w-full">Find Salons</Button></Link>
           <Link href="/customer/styles"><Button variant="outline" className="bg-white/5 border-white/10 text-white hover:bg-[#F5B700]/10 hover:text-[#F5B700] hover:border-[#F5B700]/30 h-12 rounded-xl w-full">Saved Styles</Button></Link>
           <Link href="/customer/bookings"><Button variant="outline" className="bg-white/5 border-white/10 text-white hover:bg-[#F5B700]/10 hover:text-[#F5B700] hover:border-[#F5B700]/30 h-12 rounded-xl w-full">History</Button></Link>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="bg-zinc-900/50 rounded-2xl p-6 border border-white/10 backdrop-blur-sm">
          <h2 className="text-xl font-bold mb-4 text-white">Your Bookings</h2>
          {loading ? (
            <div className="flex justify-center py-8"><span className="animate-pulse text-zinc-400">Loading...</span></div>
          ) : upcomingBookings.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              <CalendarDays className="w-12 h-12 mx-auto mb-4 opacity-20 text-zinc-400" />
              <p>You have no bookings yet.</p>
              <Link href="/salons">
                <Button variant="link" className="mt-2 text-[#F5B700] hover:text-[#F5B700]/80">Browse salons to book</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingBookings.map((booking) => (
                <div key={booking.id} className="p-4 rounded-xl border border-white/10 bg-zinc-900 hover:border-[#F5B700]/30 hover:bg-[#F5B700]/5 transition-all flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-zinc-100">{booking.salons?.name || 'Trimma Partner Salon'}</h3>
                    <div className="flex items-center gap-2 mt-1 text-sm text-zinc-400">
                      <CalendarDays className="w-4 h-4 text-[#F5B700]/80" />
                      <span>{booking.booking_date} at {booking.booking_time}</span>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1.5 max-w-[240px]">
                    <span className="font-bold text-white">Total: Rs. {booking.amount}</span>
                    
                    {booking.status === 'confirmed' || booking.status === 'pending' ? (
                      <>
                        <Badge className="bg-[#F5B700]/10 hover:bg-[#F5B700]/20 text-[#F5B700] border-none font-bold text-[9px] px-1.5 py-0.5 uppercase tracking-wide">
                          20% Deposit Paid (Rs. {Math.round(booking.amount * 0.2)})
                        </Badge>
                        <span className="text-[9px] text-zinc-500 font-medium text-right">
                          Balance 80% (Rs. {Math.round(booking.amount * 0.8)}) paid at salon
                        </span>
                      </>
                    ) : (
                      <Badge variant="outline" className="text-[9px] uppercase border-white/20 text-zinc-300">
                        {booking.status}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-zinc-900/50 rounded-2xl p-6 border border-white/10 backdrop-blur-sm">
          <h2 className="text-xl font-bold mb-4 text-white">Quick Recommendations</h2>
          <div className="text-center py-12 text-zinc-500">
            <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-20 text-[#F5B700]" />
            <p>Style recommendations will appear here.</p>
          </div>
        </section>
      </div>
    </div>
  );
}

export default function CustomerDashboard() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-slate-500">Loading Dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
