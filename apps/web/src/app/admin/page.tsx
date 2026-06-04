"use client";

import React, { useState, useEffect } from "react";
import AdminCard from "../../components/ui/AdminCard";
import { supabase } from "@/config/supabase";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw, Play, ShieldAlert, ShieldCheck, Globe, Activity, Database, Lock, Server, CreditCard, ExternalLink, Settings, Building2 } from "lucide-react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { seedMarketplaceData } from "@/services/seedService";
import { toast } from "sonner";
import { fetchAdminDashboard } from "@/app/actions/admin-list-data";
import { fetchAdminDashboardClient } from "@/lib/admin-dashboard-client";
import { resolveAdminAccess } from "@/lib/trimma-role";
import { withTimeout } from "@/lib/promise-timeout";
import {
  ActivityItem,
  formatLkr,
  formatRelativeTime,
  getBookingAmount,
} from "@/lib/dashboard-stats";

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    salons: 0,
    salonsThisWeek: 0,
    bookings: 0,
    bookingGmv: 0,
    pendingApprovals: 0,
    platformMrr: 0,
    users: 0,
  });
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [loadWarning, setLoadWarning] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [diagResults, setDiagResults] = useState<any[]>([]);
  const [runningDiag, setRunningDiag] = useState(false);

  const fetchStats = async () => {
    try {
      setLoadWarning(null);
      let result: Awaited<ReturnType<typeof fetchAdminDashboard>> | Awaited<
        ReturnType<typeof fetchAdminDashboardClient>
      >;

      try {
        result = await withTimeout(
          fetchAdminDashboard(),
          12000,
          "Server dashboard load timed out."
        );
      } catch {
        result = await fetchAdminDashboardClient();
        setLoadWarning(
          "Loaded in limited mode (server actions unavailable). Add SUPABASE_SERVICE_ROLE_KEY on Vercel for full admin data."
        );
      }

      if (result.success === false) {
        if (
          result.error.includes("sign in") ||
          result.error.includes("Admin access") ||
          result.error.includes("SUPABASE_SERVICE_ROLE_KEY")
        ) {
          router.replace("/admin/login?redirect=/admin");
          return;
        }
        result = await fetchAdminDashboardClient();
        setLoadWarning(result.clientFallback ? "Using client data fallback." : null);
      } else if ("clientFallback" in result && result.clientFallback) {
        setLoadWarning(
          "Limited dashboard data — configure SUPABASE_SERVICE_ROLE_KEY on beta for full metrics."
        );
      }

      const bookingGmv = (result.bookingRows || [])
        .filter((row) => ["confirmed", "completed", "pending", "reservation_paid"].includes(String(row.status || "").toLowerCase()))
        .reduce((sum, row) => sum + getBookingAmount(row), 0);

      const platformMrr = (result.activeSalons || []).reduce((sum, salon: any) => {
        const plan = salon.subscription_plans;
        const price = Number(plan?.intro_monthly_price ?? plan?.monthly_price ?? 0);
        return sum + price;
      }, 0);

      const pendingApprovals = (result.pendingSalons || []).filter((salon) => {
        const status = String(salon.status || "").toLowerCase();
        if (["pending", "pending_approval"].includes(status)) return true;
        const onboarding = salon.onboarding_status || "";
        if (["OWNER_ACTIVATED", "AGENT_APPROVED"].includes(onboarding) && !salon.is_verified) return true;
        return false;
      }).length;

      setStats({
        salons: result.salonsCount || 0,
        salonsThisWeek: result.salonsThisWeek || 0,
        bookings: result.bookingsCount || 0,
        bookingGmv,
        pendingApprovals,
        platformMrr,
        users: result.usersCount || 0,
      });

      const feed: ActivityItem[] = [];

      for (const log of result.onboardingLogs || []) {
        const salonName = (log as any).salons?.name || "Salon";
        feed.push({
          id: `log-${log.id}`,
          title: String(log.action || "Onboarding update").replace(/_/g, " "),
          description: log.notes || `${salonName} updated by ${log.actor_email || "system"}`,
          time: formatRelativeTime(log.created_at),
          tone: "amber",
        });
      }

      for (const booking of result.recentBookings || []) {
        feed.push({
          id: `booking-${booking.id}`,
          title: "New booking",
          description: `${(booking as any).salons?.name || "Salon"} · LKR ${formatLkr(getBookingAmount(booking))} · ${booking.booking_no || booking.id}`,
          time: formatRelativeTime(booking.created_at),
          tone: "blue",
        });
      }

      for (const salon of result.recentSalons || []) {
        feed.push({
          id: `salon-${salon.id}`,
          title: salon.onboarding_status === "VERIFIED" ? "Salon verified" : "Salon registered",
          description: `${salon.name} · ${String(salon.onboarding_status || "DISCOVERED").replace(/_/g, " ")}`,
          time: formatRelativeTime(salon.verified_at || salon.created_at),
          tone: "emerald",
        });
      }

      for (const service of result.recentServices || []) {
        feed.push({
          id: `service-${service.id}`,
          title: "Global service published",
          description: service.name,
          time: formatRelativeTime(service.created_at),
          tone: "purple",
        });
      }

      setActivity(feed.slice(0, 8));
    } catch (err) {
      console.error("Error fetching stats:", err);
      toast.error(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        router.replace("/admin/login?redirect=/admin");
        return;
      }

      const isAdmin = await resolveAdminAccess(session.user.id, session.user.email);
      if (!isAdmin) {
        toast.error("You are not allowed to access the admin dashboard.");
        router.replace("/admin/login?redirect=/admin");
        return;
      }

      setAuthorized(true);
      await fetchStats();
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSyncData = async () => {
    try {
      setSyncing(true);
      const result = await seedMarketplaceData();
      if (result.success) {
        toast.success("Marketplace data synchronized successfully!");
        fetchStats();
      } else {
        toast.error("Sync failed: " + result.error);
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
         <Loader2 className="w-10 h-10 animate-spin text-brand mb-4" />
         <p className="text-zinc-500 font-medium">Verifying administrator credentials…</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-screen-2xl mx-auto">
      {loadWarning ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
          {loadWarning}
        </div>
      ) : null}
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#1A1C29] tracking-tight">Master Command Center</h1>
          <p className="text-zinc-500 text-sm mt-1">Global platform overview, SaaS fleet operations, and security integrity.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-amber-100 text-amber-700 border-none px-3 py-1 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Systems Operational
          </Badge>
        </div>
      </div>

      {/* PLATFORM KPI GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm flex flex-col relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-amber-50 rounded-full group-hover:scale-150 transition-transform duration-700 ease-out z-0"></div>
          <div className="relative z-10 flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <Globe className="w-6 h-6" />
            </div>
            <Badge className="bg-emerald-50 text-emerald-600 border-none">
              {stats.users.toLocaleString()} users
            </Badge>
          </div>
          <h3 className="text-zinc-500 text-sm font-bold uppercase tracking-wider mb-1 relative z-10">Platform MRR</h3>
          <p className="text-3xl font-black text-zinc-900 relative z-10">LKR {formatLkr(stats.platformMrr)}</p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm flex flex-col relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-50 rounded-full group-hover:scale-150 transition-transform duration-700 ease-out z-0"></div>
          <div className="relative z-10 flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
            <Badge className="bg-emerald-50 text-emerald-600 border-none">
              +{stats.salonsThisWeek} this week
            </Badge>
          </div>
          <h3 className="text-zinc-500 text-sm font-bold uppercase tracking-wider mb-1 relative z-10">Active Fleet</h3>
          <p className="text-3xl font-black text-zinc-900 relative z-10">{stats.salons.toLocaleString()}</p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm flex flex-col relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-purple-50 rounded-full group-hover:scale-150 transition-transform duration-700 ease-out z-0"></div>
          <div className="relative z-10 flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center">
              <Activity className="w-6 h-6" />
            </div>
            <Badge className="bg-zinc-100 text-zinc-600 border-none">
              {stats.bookings.toLocaleString()} bookings
            </Badge>
          </div>
          <h3 className="text-zinc-500 text-sm font-bold uppercase tracking-wider mb-1 relative z-10">Booking GMV</h3>
          <p className="text-3xl font-black text-zinc-900 relative z-10">LKR {formatLkr(stats.bookingGmv)}</p>
        </div>

        <div className="bg-gradient-to-br from-[#1A1C29] to-[#0A0B10] rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden group trimma-dark-surface">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all duration-700 ease-out z-0"></div>
          <div className="relative z-10 flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <CreditCard className="w-6 h-6" />
            </div>
            {stats.pendingApprovals > 0 ? (
              <Badge className="bg-amber-500 text-amber-950 font-black border-none px-2 py-0.5 text-[10px] uppercase tracking-widest">
                Action Req
              </Badge>
            ) : null}
          </div>
          <h3 className="text-zinc-400 text-sm font-bold uppercase tracking-wider mb-1 relative z-10">Pending Approvals</h3>
          <p className="text-3xl font-black text-white relative z-10">{stats.pendingApprovals.toLocaleString()}</p>
        </div>
      </div>

      {/* CORE OPERATIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Marketplace & Fleet Operations */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-8 border border-zinc-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-bold text-zinc-900">Fleet Security & Compliance</h2>
                <p className="text-sm text-zinc-500">Run global diagnostics and synchronize master templates.</p>
              </div>
              <ShieldCheck className="w-8 h-8 text-amber-400" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Sync Action */}
              <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-5 hover:border-amber-200 transition-colors group">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                    <Database className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-zinc-900">Master Data Sync</h3>
                </div>
                <p className="text-xs text-zinc-500 mb-4 leading-relaxed">Ensure all partner salons have the latest service catalogs, subscription tiers, and geolocation boundaries.</p>
                <Button 
                  disabled={syncing}
                  onClick={handleSyncData}
                  className="w-full bg-slate-50 hover:bg-zinc-800 hover:text-white text-zinc-900 rounded-xl h-10 text-xs font-bold"
                >
                  {syncing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                  {syncing ? 'Synchronizing...' : 'Sync Fleet Database'}
                </Button>
              </div>

              {/* RLS Action */}
              <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-5 hover:border-amber-200 transition-colors group">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center">
                    <Lock className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-zinc-900">RLS Audit</h3>
                </div>
                <p className="text-xs text-zinc-500 mb-4 leading-relaxed">Simulate tenant isolation and guest checkout flows to verify Row-Level Security integrity across the SaaS.</p>
                <Button 
                  disabled={runningDiag}
                  onClick={runDiagnostics}
                  variant="outline"
                  className="w-full border-zinc-200 hover:bg-zinc-100 text-zinc-900 rounded-xl h-10 text-xs font-bold"
                >
                  {runningDiag ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                  {runningDiag ? 'Running Audit...' : 'Execute Security Audit'}
                </Button>
              </div>
            </div>

            {/* Diagnostic Results */}
            {diagResults.length > 0 && (
              <div className="mt-6 border-t border-zinc-100 pt-6">
                <h4 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-4">Audit Output Log</h4>
                <div className="space-y-3">
                  {diagResults.map((result, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-zinc-50 px-4 py-3 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${result.status === "PASS" ? "bg-emerald-500" : result.status === "SKIP" ? "bg-amber-500" : "bg-rose-500"}`} />
                        <span className="text-sm font-bold text-zinc-800">{result.test}</span>
                      </div>
                      <Badge className={
                        result.status === "PASS" ? "bg-emerald-100 text-emerald-700 border-none" : 
                        result.status === "SKIP" ? "bg-amber-100 text-amber-700 border-none" : 
                        "bg-rose-100 text-rose-700 border-none animate-pulse"
                      }>
                        {result.status}
                      </Badge>
                    </div>
                  ))}
                  {diagResults.some(r => r.status === "FAIL") && (
                    <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200">
                      <div className="flex items-center gap-2 text-amber-800 font-bold text-sm mb-2">
                        <ShieldAlert className="w-4 h-4" /> Policy Action Required
                      </div>
                      <p className="text-xs text-amber-900 mb-2">
                        Supabase RLS is blocking guest checkout or admin writes. Run the production-safe patch in Supabase SQL Editor:
                      </p>
                      <pre className="p-3 bg-slate-50 text-amber-400 font-mono text-[10px] rounded-lg overflow-x-auto">
{`-- File: packages/db/GUEST_WRITE_RLS_PATCH.sql
-- Keeps RLS enabled; adds checkout + admin policies.
-- Do NOT disable RLS on users or bookings in production.`}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Audit Log / Activity Stream */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-[#2D3042] shadow-xl text-zinc-900 h-full relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl z-0"></div>
            
            <div className="relative z-10 flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">Fleet Activity Stream</h2>
              <Server className="w-5 h-5 text-amber-400 opacity-50" />
            </div>

            <div className="relative z-10 space-y-5">
              {activity.length === 0 ? (
                <p className="text-sm text-zinc-500">No recent platform activity yet.</p>
              ) : (
                activity.map((item) => (
                  <div key={item.id} className="flex gap-4 group">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
                        item.tone === "emerald"
                          ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                          : item.tone === "blue"
                            ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                            : item.tone === "purple"
                              ? "bg-purple-500/20 text-purple-400 border-purple-500/30"
                              : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                      }`}
                    >
                      {item.tone === "emerald" ? <Building2 className="w-3.5 h-3.5" /> :
                       item.tone === "blue" ? <CreditCard className="w-3.5 h-3.5" /> :
                       item.tone === "purple" ? <Settings className="w-3.5 h-3.5" /> :
                       <Activity className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-800">{item.title}</p>
                      <p className="text-xs text-zinc-500 mt-1">{item.description}</p>
                      <p className="text-[10px] text-zinc-600 mt-2 font-mono">{item.time}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <Link
              href="/admin/leads"
              className={buttonVariants({
                variant: "ghost",
                className: "w-full mt-8 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 text-xs font-bold rounded-xl relative z-10",
              })}
            >
              View onboarding pipeline <ExternalLink className="w-3 h-3 ml-2" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
