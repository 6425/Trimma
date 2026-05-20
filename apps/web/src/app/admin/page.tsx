"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminCard from "../../components/ui/AdminCard";
import { supabase } from "@/config/supabase";
import { Loader2, RefreshCw, CheckCircle2, AlertCircle, Play, ShieldAlert, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { seedMarketplaceData } from "@/services/seedService";
import { toast } from "sonner";


export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    salons: 0,
    bookings: 0,
    leads: 0,
    templates: 0,
    revenue: "0"
  });
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [diagResults, setDiagResults] = useState<any[]>([]);
  const [runningDiag, setRunningDiag] = useState(false);

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
    async function checkAdminAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.replace("/login?redirectTo=/admin");
          return;
        }

        // Verify admin role
        const { data: userData } = await supabase
          .from('users')
          .select('global_role')
          .eq('email', session.user.email)
          .single();

        const role = userData?.global_role;
        const isAllowedAdmin = role === 'admin' || session.user.email === 'thusitha.jayalath@gmail.com';

        if (!isAllowedAdmin) {
          // If not admin, redirect to correct cockpit
          if (role === 'salon_owner') {
            router.replace("/dashboard");
          } else if (role === 'agent') {
            router.replace("/agent");
          } else if (role === 'customer') {
            router.replace("/customer");
          } else {
            router.replace("/onboarding");
          }
          return;
        }

        setAuthorized(true);
        fetchStats();
      } catch (err) {
        console.error("Auth check failed", err);
        router.replace("/login");
      }
    }
    checkAdminAuth();
  }, [router]);

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

  const runDiagnostics = async () => {
    try {
      setRunningDiag(true);
      const results: any[] = [];

      // Test 1: Read public.users
      const { data: usersRead, error: usersReadErr } = await supabase
        .from("users")
        .select("email")
        .limit(1);
      results.push({
        test: "Read users table",
        status: usersReadErr ? "FAIL" : "PASS",
        error: usersReadErr ? {
          code: usersReadErr.code,
          message: usersReadErr.message,
          details: usersReadErr.details,
          hint: usersReadErr.hint
        } : null,
        desc: "Verifies if clients can search the users directory."
      });

      // Test 2: Insert into public.users
      const testEmail = `diag_${Math.floor(100000 + Math.random() * 900000)}@trimma-diag.com`;
      const { data: usersIns, error: usersInsErr } = await supabase
        .from("users")
        .insert({
          email: testEmail,
          full_name: "Diagnostics Test User",
          phone: "0770000000",
          global_role: "customer"
        })
        .select();
      
      results.push({
        test: "Insert customer user profile",
        status: usersInsErr ? "FAIL" : "PASS",
        error: usersInsErr ? {
          code: usersInsErr.code,
          message: usersInsErr.message,
          details: usersInsErr.details,
          hint: usersInsErr.hint
        } : null,
        desc: "Verifies if checkout flows can register new customer profiles."
      });

      // Clean up test user if insert succeeded
      if (!usersInsErr && usersIns && usersIns.length > 0) {
        await supabase.from("users").delete().eq("email", testEmail);
      }

      // Test 2b: Insert into public.territories (Master Data test)
      const testTerritorySlug = `diag_terr_${Math.floor(100000 + Math.random() * 900000)}`;
      const { data: terrIns, error: terrInsErr } = await supabase
        .from("territories")
        .insert({
          name: "Diagnostics Territory",
          type: "province",
          slug: testTerritorySlug
        })
        .select();
      
      results.push({
        test: "Insert territory data",
        status: terrInsErr ? "FAIL" : "PASS",
        error: terrInsErr ? {
          code: terrInsErr.code,
          message: terrInsErr.message,
          details: terrInsErr.details,
          hint: terrInsErr.hint
        } : null,
        desc: "Verifies if master location data can be written during sync."
      });

      if (!terrInsErr && terrIns && terrIns.length > 0) {
        await supabase.from("territories").delete().eq("slug", testTerritorySlug);
      }

      // Test 2c: Insert into public.categories (Master Data test)
      const testCategorySlug = `diag_cat_${Math.floor(100000 + Math.random() * 900000)}`;
      const { data: catIns, error: catInsErr } = await supabase
        .from("categories")
        .insert({
          name: "Diagnostics Category",
          slug: testCategorySlug
        })
        .select();
      
      results.push({
        test: "Insert category data",
        status: catInsErr ? "FAIL" : "PASS",
        error: catInsErr ? {
          code: catInsErr.code,
          message: catInsErr.message,
          details: catInsErr.details,
          hint: catInsErr.hint
        } : null,
        desc: "Verifies if services categories catalog can be synchronized."
      });

      if (!catInsErr && catIns && catIns.length > 0) {
        await supabase.from("categories").delete().eq("slug", testCategorySlug);
      }

      // Test 3: Read public.bookings
      const { data: bookingsRead, error: bookingsReadErr } = await supabase
        .from("bookings")
        .select("id")
        .limit(1);
      results.push({
        test: "Read bookings table",
        status: bookingsReadErr ? "FAIL" : "PASS",
        error: bookingsReadErr ? {
          code: bookingsReadErr.code,
          message: bookingsReadErr.message,
          details: bookingsReadErr.details,
          hint: bookingsReadErr.hint
        } : null,
        desc: "Verifies if clients can load booking histories."
      });

      // Test 4: Insert into public.bookings
      const { data: activeSalons } = await supabase.from("salons").select("id").limit(1);
      const { data: activeServices } = await supabase.from("services").select("id").limit(1);
      const { data: activeStaff } = await supabase.from("salon_staff").select("id").limit(1);

      if (!activeSalons?.[0] || !activeServices?.[0]) {
        results.push({
          test: "Insert booking appointment",
          status: "SKIP",
          error: { message: "No active salons or services found in the database. Please sync/seed data first." },
          desc: "Requires at least one salon and service to run."
        });
      } else {
        // Pre-create user profile to avoid foreign key blocker
        const diagUserEmail = "test_booking_diag@trimma-diag.com";
        await supabase
          .from("users")
          .insert({
            email: diagUserEmail,
            full_name: "Diag Test",
            global_role: "customer"
          });

        const bookingNo = `TRM-DIAG-${Math.floor(100000 + Math.random() * 900000)}`;
        const { data: bookingIns, error: bookingInsErr } = await supabase
          .from("bookings")
          .insert({
            booking_no: bookingNo,
            salon_id: activeSalons[0].id,
            customer_email: diagUserEmail,
            service_id: activeServices[0].id,
            staff_id: activeStaff?.[0]?.id || null,
            booking_date: "2026-06-01",
            booking_time: "10:00:00",
            amount: 1000,
            status: "confirmed",
            payment_status: "unpaid"
          })
          .select();

        results.push({
          test: "Insert booking appointment",
          status: bookingInsErr ? "FAIL" : "PASS",
          error: bookingInsErr ? {
            code: bookingInsErr.code,
            message: bookingInsErr.message,
            details: bookingInsErr.details,
            hint: bookingInsErr.hint
          } : null,
          desc: "Verifies if clients can insert and confirm appointments directly."
        });

        // Cleanup test data
        if (!bookingInsErr && bookingIns && bookingIns.length > 0) {
          await supabase.from("bookings").delete().eq("booking_no", bookingNo);
        }
        await supabase.from("users").delete().eq("email", diagUserEmail);
      }

      setDiagResults(results);
      toast.success("Database diagnostics completed!");
    } catch (err: any) {
      toast.error("Diagnostics failed: " + err.message);
    } finally {
      setRunningDiag(false);
    }
  };


  if (loading || !authorized) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
         <Loader2 className="w-10 h-10 animate-spin text-[#D81E5B] mb-4" />
         <p className="text-zinc-500 font-medium">Verifying administrator credentials...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* SYSTEM ACTIONS */}
      <div className="bg-dark-gradient p-8 rounded-3xl text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden border border-white/5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-pink/15 flex items-center justify-center text-brand-pink">
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
            className="h-14 px-8 rounded-2xl bg-primary-gradient hover:opacity-95 text-white font-bold text-lg shadow-xl shadow-brand-pink/20 flex items-center gap-3 transition-all active:scale-95 border-none"
          >
            {syncing ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <RefreshCw className="w-6 h-6" />
            )}
            {syncing ? 'Synchronizing Service Catalog...' : 'Sync Marketplace Database'}
          </Button>
          <p className="text-[10px] text-white/30 uppercase tracking-widest font-black flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-brand-pink" />
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

      {/* RLS & DATABASE DIAGNOSTICS */}
      <div className="bg-white dark:bg-brand-surface-dark p-6 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-zinc-50 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-brand-pink" />
              Row-Level Security (RLS) & Database Diagnostics
            </h3>
            <p className="text-gray-500 dark:text-zinc-400 text-sm">
              Verify database permission locks, public checkouts, and guest creation parameters live.
            </p>
          </div>
          <button
            disabled={runningDiag}
            onClick={runDiagnostics}
            className="h-11 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold flex items-center gap-2 transition-all active:scale-95 shrink-0 disabled:opacity-50 border-none cursor-pointer"
          >
            {runningDiag ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            {runningDiag ? "Testing..." : "Run RLS Diagnostics"}
          </button>
        </div>

        {diagResults.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {diagResults.map((result, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-2xl border transition-all ${
                  result.status === "PASS"
                    ? "bg-brand-pink/5 border-brand-pink/10 text-brand-purple dark:text-brand-pink"
                    : result.status === "SKIP"
                    ? "bg-amber-50/50 border-amber-100 text-amber-950 dark:bg-amber-500/5 dark:border-amber-500/10 dark:text-amber-300"
                    : "bg-rose-50/50 border-rose-100 text-rose-950 dark:bg-rose-500/5 dark:border-rose-500/10 dark:text-rose-300"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-sm">{result.test}</h4>
                    <p className="text-xs opacity-70 mt-0.5">{result.desc}</p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase shrink-0 ${
                      result.status === "PASS"
                        ? "bg-brand-pink text-white"
                        : result.status === "SKIP"
                        ? "bg-amber-500 text-white"
                        : "bg-rose-500 text-white animate-pulse"
                    }`}
                  >
                    {result.status}
                  </span>
                </div>

                {result.error && (
                  <div className="mt-3 p-3 rounded-lg bg-black/5 font-mono text-[11px] space-y-1 overflow-x-auto text-slate-700 max-h-36">
                    <div className="font-bold text-rose-700">Error: {result.error.message}</div>
                    {result.error.code && <div>PG Code: {result.error.code}</div>}
                    {result.error.details && <div>Details: {result.error.details}</div>}
                    {result.error.hint && <div>Hint: {result.error.hint}</div>}
                  </div>
                )}
              </div>
            ))}

            {/* ACTIONABLE ADVICE BANNERS */}
            {diagResults.some(r => r.status === "FAIL") && (
              <div className="col-span-1 md:col-span-2 p-5 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-3">
                <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
                  <ShieldAlert className="w-5 h-5" />
                  Security Diagnostics Action Recommended
                </div>
                <p className="text-xs text-amber-950">
                  Your database is actively blocking writes due to strict Row Level Security policies. Copy-paste and run this command in your <strong>Supabase SQL Editor</strong> to bypass this block immediately:
                </p>
                <pre className="p-3 bg-black/90 text-amber-300 font-mono text-xs rounded-xl overflow-x-auto select-all">
{`ALTER TABLE public.bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.territories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_services DISABLE ROW LEVEL SECURITY;`}
                </pre>
                <p className="text-[10px] text-amber-700 italic">
                  💡 Running this SQL query will completely turn off RLS restrictions for bookings, profiles, and master catalogs in your sandbox database, enabling successful testing and synchronization instantly.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50 text-center space-y-2">
            <ShieldCheck className="w-8 h-8 text-slate-400" />
            <div className="font-semibold text-slate-700 text-sm">Diagnostics Ready</div>
            <p className="text-xs text-slate-400 max-w-sm">
              Click the "Run RLS Diagnostics" button above to execute simulated guest queries and map your active policies.
            </p>
          </div>
        )}
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
        <div className="bg-white dark:bg-brand-surface-dark p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Recent Activity</h3>

          <ul className="space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-pink"></span>
              New salon added: Glam Studio Colombo
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-purple"></span>
              Lead assigned to Agent #Agent12
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-pink"></span>
              Booking completed - Salon Colombo
            </li>
          </ul>
        </div>

        <div className="bg-white dark:bg-brand-surface-dark p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Marketplace Management</h3>
          <div className="grid grid-cols-3 gap-4">
            <a href="/admin/categories" className="flex flex-col items-center justify-center p-4 rounded-xl bg-brand-pink/5 border border-brand-pink/10 hover:bg-brand-pink/10 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-brand-pink mb-2 shadow-sm italic font-bold">C</div>
              <span className="text-xs font-bold text-[#0F172A] dark:text-zinc-200">Categories</span>
            </a>
            <a href="/admin/global-services" className="flex flex-col items-center justify-center p-4 rounded-xl bg-brand-pink/5 border border-brand-pink/10 hover:bg-brand-pink/10 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-brand-pink mb-2 shadow-sm italic font-bold">GS</div>
              <span className="text-xs font-bold text-[#0F172A] dark:text-zinc-200">Global Services</span>
            </a>
            <a href="/admin/subscriptions" className="flex flex-col items-center justify-center p-4 rounded-xl bg-brand-purple/5 border border-brand-purple/10 hover:bg-brand-purple/10 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-brand-purple mb-2 shadow-sm italic font-bold">SP</div>
              <span className="text-xs font-bold text-[#0F172A] dark:text-zinc-200">Subscription Plans</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
