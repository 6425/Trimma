"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Card from "../../components/ui/Card";
import { supabase } from "@/config/supabase";
import { Loader2 } from "lucide-react";

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalBookings: 0,
    activeServices: 0,
    totalStaff: 0,
    revenue: 0,
  });
  const [loading, setLoading] = useState(true);

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
