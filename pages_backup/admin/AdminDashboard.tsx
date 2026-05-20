import React, { useState, useEffect } from "react";
import AdminCard from "../../components/ui/AdminCard";
import { supabase } from "@/src/config/supabase";
import { Loader2, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { seedMarketplaceData } from "@/src/services/seedService";
import { toast } from "sonner";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    salons: 0,
    bookings: 0,
    leads: 0,
    templates: 0,
    revenue: "0"
  });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const fetchStats = async () => {
    try {
      const [salons, bookings, leads, templates] = await Promise.all([
        supabase.from("salons").select("id", { count: "exact", head: true }),
        supabase.from("bookings").select("id", { count: "exact", head: true }),
        supabase.from("leads").select("id", { count: "exact", head: true }),
        supabase.from("global_services").select("id", { count: "exact", head: true })
      ]);

      setStats({
        salons: salons.count || 0,
        bookings: bookings.count || 0,
        leads: leads.count || 0,
        templates: templates.count || 0,
        revenue: "2.4M" // Mock for now and keep it consistent with UI
      });
    } catch (err) {
      console.error("Error fetching stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleSyncData = async () => {
    try {
      setSyncing(true);
      const result = await seedMarketplaceData();
      if (result.success) {
        toast.success("Marketplace data synchronized successfully!");
        fetchStats();
      } else {
        // Look for RLS policy error specifically
        if (result.error?.includes("row-level security policy")) {
          toast.error("Database Protection Active: Please run the provided SQL script in your Supabase dashboard to allow master data updates.");
        } else {
          toast.error("Sync failed: " + result.error);
        }
      }
    } catch (err: any) {
      toast.error("Error: " + err.message);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* SYSTEM ACTIONS */}
      <div className="bg-[#1A1C29] p-6 rounded-[2.5rem] text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">System Integrity Check</h2>
            <p className="text-white/50 text-sm font-medium">Verify and synchronize marketplace master data.</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 relative z-10">
          <Button 
            disabled={syncing}
            onClick={handleSyncData}
            className="h-14 px-8 rounded-2xl bg-[#D81E5B] hover:bg-[#BF1A50] text-white font-bold text-lg shadow-xl shadow-[#D81E5B]/30 flex items-center gap-3 transition-all active:scale-95"
          >
            {syncing ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <RefreshCw className="w-6 h-6" />
            )}
            {syncing ? 'Synchronizing Service Catalog...' : 'Sync Marketplace Database'}
          </Button>
          <p className="text-[10px] text-white/30 uppercase tracking-widest font-black flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            If sync fails, use SQL script in project root
          </p>
        </div>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <AdminCard title="Total Salons" value={loading ? "..." : stats.salons.toLocaleString()} />
        <AdminCard title="Active Bookings" value={loading ? "..." : stats.bookings.toLocaleString()} />
        <AdminCard title="Revenue" value={`LKR ${stats.revenue}`} />
        <AdminCard title="Pending Leads" value={loading ? "..." : stats.leads.toLocaleString()} />
        <AdminCard title="Global Templates" value={loading ? "..." : stats.templates.toLocaleString()} />
      </div>

      {/* CHART SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 h-64 flex flex-col">
          <h3 className="font-semibold text-gray-900 mb-2">Booking Trends</h3>
          <div className="flex-1 flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-100 rounded-lg">
            [Chart Placeholder]
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 h-64 flex flex-col">
          <h3 className="font-semibold text-gray-900 mb-2">Revenue Growth</h3>
          <div className="flex-1 flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-100 rounded-lg">
            [Chart Placeholder]
          </div>
        </div>
      </div>

      {/* RECENT ACTIVITY */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <h3 className="font-semibold text-gray-900 mb-4">Recent Activity</h3>

          <ul className="space-y-3 text-sm text-gray-600">
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              New salon added: Glam Studio Colombo
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              Lead assigned to Agent #A12
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500"></span>
              Booking completed - Salon XYZ
            </li>
          </ul>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <h3 className="font-semibold text-gray-900 mb-4">Marketplace Management</h3>
          <div className="grid grid-cols-2 gap-4">
            <a href="/admin/categories" className="flex flex-col items-center justify-center p-4 rounded-xl bg-rose-50 border border-rose-100 hover:bg-rose-100 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-[#D81E5B] mb-2 shadow-sm italic font-bold">C</div>
              <span className="text-xs font-bold text-[#1A1C29]">Categories</span>
            </a>
            <a href="/admin/global-services" className="flex flex-col items-center justify-center p-4 rounded-xl bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-emerald-600 mb-2 shadow-sm italic font-bold">GS</div>
              <span className="text-xs font-bold text-[#1A1C29]">Global Services</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}