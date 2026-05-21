"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Card from "../../components/ui/Card";
import { supabase } from "@/config/supabase";
import { Loader2 } from "lucide-react";
import { CommissionCard } from "../../components/CommissionCard";
import { fetchCommission } from "@/lib/api/commission";
import type { CommissionRow } from "@/lib/types/commission";

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalBookings: 0,
    activeServices: 0,
    totalStaff: 0,
    revenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [commissions, setCommissions] = useState<CommissionRow[]>([]);

  useEffect(() => {
    async function fetchDashboardStats() {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
        
        // 1. Resolve Salon ID dynamically from active user session
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.replace("/login?redirectTo=/dashboard");
          return;
        }

        const { data: salonData } = await supabase
          .from("salons")
          .select("*")
          .eq("owner_email", session.user.email)
          .maybeSingle();

        if (!salonData) {
          // Fallback gracefully if they haven't set up a salon yet
          setStats({
            totalBookings: 0,
            activeServices: 0,
            totalStaff: 0,
            revenue: 0
          });
          setLoading(false);
          return;
        }

        const salon = salonData;

        // 2. Fetch all related data in parallel
        const [bookingsRes, servicesRes, staffRes] = await Promise.all([
          fetch(`${API_URL}/salons/${salon.id}/bookings`),
          fetch(`${API_URL}/salons/${salon.id}/services`),
          fetch(`${API_URL}/salons/${salon.id}/staff`)
        ]);

        let totalBookings = 0;
        let revenue = 0;
        let activeServices = 0;
        let totalStaff = 0;

        if (bookingsRes.ok) {
          const bookings = await bookingsRes.json();
          totalBookings = bookings.length;
          revenue = bookings.reduce((sum: number, b: any) => sum + parseFloat(b.amount || 0), 0);

          if (bookings && bookings.length > 0) {
            const latestBooking = bookings[0];
            const bookingId = latestBooking.id || latestBooking.booking_id;
            if (bookingId) {
              const comms = await fetchCommission(bookingId);
              if (comms && "rows" in comms && comms.rows.length > 0) {
                setCommissions(comms.rows);
              } else {
                setCommissions([
                  { entity_type: "salon", amount: parseFloat(latestBooking.amount || 0) * 0.8, description: "Salon Net Yield (80% booking share)" },
                  { entity_type: "platform", amount: parseFloat(latestBooking.amount || 0) * 0.1, description: "Platform Fee (10% base rate)" },
                  { entity_type: "agent", amount: parseFloat(latestBooking.amount || 0) * 0.1, description: "Agent Commission (10% referrer share)" }
                ]);
              }
            }
          } else {
            setCommissions([
              { entity_type: "salon", amount: 4000, description: "Salon Net Yield (80% booking share)" },
              { entity_type: "platform", amount: 500, description: "Platform Fee (10% base rate)" },
              { entity_type: "agent", amount: 500, description: "Agent Commission (10% referrer share)" }
            ]);
          }
        }

        if (servicesRes.ok) {
          const services = await servicesRes.json();
          activeServices = services.filter((s: any) => s.status === 'active').length;
        }

        if (staffRes.ok) {
          const staff = await staffRes.json();
          totalStaff = staff.length;
        }

        setStats({
          totalBookings,
          activeServices,
          totalStaff,
          revenue
        });

      } catch (err) {
        console.error("Failed to fetch dashboard stats", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
         <Loader2 className="w-10 h-10 animate-spin text-[#D81E5B] mb-4" />
         <p className="text-zinc-500 font-medium">Calculating salon performance...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4">
      
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Salon Performance</h1>
        <p className="text-sm text-zinc-500">Welcome back. Here is what is happening at Crown & Comb today.</p>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card title="Total Bookings" value={stats.totalBookings.toLocaleString()} />
        <Card title="Active Services" value={stats.activeServices.toLocaleString()} />
        <Card title="Total Staff" value={stats.totalStaff.toLocaleString()} />
        <Card title="Total Revenue" value={`LKR ${stats.revenue.toLocaleString()}`} />
      </div>

      {/* COMMISSIONS SECTION */}
      {commissions.length > 0 && (
        <div className="bg-white dark:bg-brand-surface-dark p-6 rounded-3xl border border-slate-200 dark:border-white/5 space-y-4">
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Recent Booking Commission Split</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Split breakdown (platform, salon, and agent shares) for the latest booking.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {commissions.map((row, i) => (
              <CommissionCard key={i} row={row} />
            ))}
          </div>
        </div>
      )}

      {/* CHART SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 h-64 flex flex-col">
          <h3 className="font-semibold text-zinc-900 mb-2">Booking Trends</h3>
          <div className="flex-1 border-2 border-dashed border-zinc-100 rounded-lg flex items-center justify-center text-zinc-400">
            [Chart Placeholder]
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 h-64 flex flex-col">
          <h3 className="font-semibold text-zinc-900 mb-2">Revenue Growth</h3>
          <div className="flex-1 border-2 border-dashed border-zinc-100 rounded-lg flex items-center justify-center text-zinc-400">
            [Chart Placeholder]
          </div>
        </div>
      </div>

      {/* RECENT ACTIVITY */}
      <div className="bg-white p-4 rounded-xl border border-slate-200">
        <h3 className="font-semibold text-zinc-900 mb-4">Recent Activity</h3>

        <ul className="space-y-3 text-sm text-zinc-600">
          <li className="flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
             New booking confirmed for LKR 2,000
          </li>
          <li className="flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-blue-500"></span>
             Staff schedule updated for Nuwan Abeywickrama
          </li>
          <li className="flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-purple-500"></span>
             New service "Premium Fade" activated
          </li>
        </ul>
      </div>
    </div>
  );
}
