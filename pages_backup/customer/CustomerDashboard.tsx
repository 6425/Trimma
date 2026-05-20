import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  CalendarDays, MapPin, Star, Scissors, 
  Sparkles, CheckCircle2, Navigation2, ChevronRight,
  TrendingUp, Award, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "../../config/supabase";

export default function CustomerDashboard() {
  const [userName, setUserName] = useState("Guest");
  const [userRole, setUserRole] = useState("Member");
  const [upcomingBookings, setUpcomingBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
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

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8 md:space-y-12">
      
      {/* 1. WELCOME HERO & QUICK ACTIONS */}
      <section className="bg-zinc-900 rounded-3xl p-6 md:p-10 text-white relative overflow-hidden shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-900 to-zinc-800 z-0"></div>
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-emerald-500/20 blur-3xl rounded-full z-0"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <Avatar className="w-16 h-16 md:w-20 md:h-20 border-2 border-white/20">
              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`} />
              <AvatarFallback>{userName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-1">{getGreeting()}, {userName} 👋</h1>
              <div className="flex items-center gap-3 text-sm text-zinc-300">
                <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400 border-none font-medium text-xs px-2 py-0.5">{userRole}</Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-8 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm font-medium">
           <Button variant="outline" className="bg-white/5 border-white/10 text-white hover:bg-white/10 h-12 rounded-xl">Book Now</Button>
           <Button variant="outline" className="bg-white/5 border-white/10 text-white hover:bg-white/10 h-12 rounded-xl">Find Salons</Button>
           <Button variant="outline" className="bg-white/5 border-white/10 text-white hover:bg-white/10 h-12 rounded-xl">Saved Styles</Button>
           <Button variant="outline" className="bg-white/5 border-white/10 text-white hover:bg-white/10 h-12 rounded-xl">History</Button>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="bg-white rounded-2xl p-6 border border-slate-200">
          <h2 className="text-xl font-bold mb-4">Upcoming Bookings</h2>
          <div className="text-center py-12 text-zinc-500">
            <CalendarDays className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>You have no upcoming bookings.</p>
            <Button variant="link" className="mt-2 text-emerald-600">Browse salons to book</Button>
          </div>
        </section>

        <section className="bg-white rounded-2xl p-6 border border-slate-200">
          <h2 className="text-xl font-bold mb-4">Quick Recommendations</h2>
          <div className="text-center py-12 text-zinc-500">
            <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>Style recommendations will appear here.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
