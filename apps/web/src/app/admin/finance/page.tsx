"use client";

import React, { useEffect, useState } from "react";
import { DollarSign, History, Calendar, FileText, ArrowRight, Activity, Loader2, TrendingUp, Sparkles, Store, Briefcase, Handshake, CreditCard, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/config/supabase";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface BookingWithSplits {
  id: string;
  booking_no: string;
  booking_date: string;
  booking_time: string;
  amount: number;
  status: string;
  customer_email: string;
  created_at: string;
  platform_commission_amount: number;
  salon_upfront_amount: number;
  payhere_fee_amount: number;
  agent_commission_amount: number;
}

export default function FinanceDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [salon, setSalon] = useState<any>(null);
  const [bookings, setBookings] = useState<BookingWithSplits[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null);

  // Stats
  const [stats, setStats] = useState({
    grossRevenue: 0,
    platformComm: 0,
    salonComm: 0,
    agentComm: 0,
    payhereComm: 0,
    completedCount: 0
  });

  // Admin Settings
  const [isAdmin, setIsAdmin] = useState(false);
  const [globalRates, setGlobalRates] = useState({ platform: 10, salon: 10, payhere: 3, agent: 20 });
  const [savingRates, setSavingRates] = useState(false);

  useEffect(() => {
    async function loadFinanceData() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.replace("/login?redirectTo=/dashboard/finance");
          return;
        }

        // 1. Check if user is Admin
        const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', session.user.id).maybeSingle();
        if (roleData?.role === 'admin') {
          setIsAdmin(true);
          // Fetch current active commission rule
          const { data: commData } = await supabase.from('commission_master').select('*').eq('commission_type', 'booking').eq('active', true).maybeSingle();
          if (commData) {
            setGlobalRates({
              platform: commData.platform_percentage,
              salon: commData.salon_percentage,
              payhere: commData.payhere_percentage,
              agent: commData.agent_percentage || 0
            });
          }
        }

        // 2. Fetch Salon Data
        let salonId = null;
        if (roleData?.role === 'salon_owner') {
          const { data: salonData } = await supabase.from("salons").select("id").eq("owner_email", session.user.email).maybeSingle();
          if (salonData) salonId = salonData.id;
        }

        // 3. Fetch Bookings (If Admin, fetch all platform bookings. If Salon, fetch only theirs)
        let query = supabase.from("bookings").select("*").order("created_at", { ascending: false });
        if (salonId) {
          query = query.eq("salon_id", salonId);
        } else if (roleData?.role !== 'admin') {
          setLoading(false);
          return; // Neither admin nor salon owner
        }

        const { data: bookingsData, error } = await query;
        if (!error && bookingsData) {
          
          const resolvedBookings = bookingsData.map((b: any) => ({
            ...b,
            amount: parseFloat(b.total_price || 0),
            platform_commission_amount: parseFloat(b.platform_commission_amount || 0),
            salon_upfront_amount: parseFloat(b.salon_upfront_amount || 0),
            payhere_fee_amount: parseFloat(b.payhere_fee_amount || 0),
            agent_commission_amount: parseFloat(b.agent_commission_amount || 0),
          }));

          setBookings(resolvedBookings);

          // 4. Calculate aggregates
          let gross = 0;
          let platform = 0;
          let salonUpfront = 0;
          let agent = 0;
          let payhere = 0;
          let completed = 0;

          resolvedBookings.forEach((b: BookingWithSplits) => {
            if (b.status === "completed" || b.status === "confirmed") {
              gross += b.amount;
              platform += b.platform_commission_amount;
              salonUpfront += b.salon_upfront_amount;
              agent += b.agent_commission_amount;
              payhere += b.payhere_fee_amount;
              completed += 1;
            }
          });

          setStats({
            grossRevenue: gross,
            platformComm: platform,
            salonComm: salonUpfront,
            agentComm: agent,
            payhereComm: payhere,
            completedCount: completed
          });
        }
      } catch (err) {
        console.error("Failed to load finance data", err);
      } finally {
        setLoading(false);
      }
    }
    loadFinanceData();
  }, [router]);

  const handleUpdateRates = async () => {
    try {
      setSavingRates(true);
      
      const { error: dropErr } = await supabase
        .from('commission_master')
        .update({ active: false })
        .eq('commission_type', 'booking')
        .eq('active', true);

      const { error: insertErr } = await supabase
        .from('commission_master')
        .insert({
          commission_type: 'booking',
          platform_percentage: globalRates.platform,
          salon_percentage: globalRates.salon,
          payhere_percentage: globalRates.payhere,
          agent_percentage: globalRates.agent,
          active: true
        });

      if (insertErr) throw insertErr;
      toast.success("Global Commission Structure updated successfully!");
    } catch (err: any) {
      toast.error("Failed to update rates: " + err.message);
    } finally {
      setSavingRates(false);
    }
  };

  const formatLKR = (amount: number) => {
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch (e) {
      return dateStr;
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed": return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "confirmed": return "bg-blue-50 text-blue-700 border-blue-100";
      case "pending": return "bg-amber-50 text-amber-700 border-amber-100";
      default: return "bg-rose-50 text-rose-700 border-rose-100";
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (filter === "all") return true;
    if (filter === "completed") return b.status === "completed" || b.status === "confirmed";
    return b.status === filter;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-brand" />
        <p className="text-zinc-500 font-medium">Reconciling financial ledgers...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto p-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 text-[10px] font-bold tracking-wider bg-brand/10 text-brand uppercase rounded-full">Sprint 5 Ledger</span>
            <span className="flex items-center gap-1 text-[10px] font-semibold text-zinc-400">
              <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" /> Direct Database Reads Enabled
            </span>
          </div>
          <h1 className="text-3xl font-black text-zinc-900 tracking-tight">Finance &amp; Revenue</h1>
          <p className="text-zinc-500 text-sm mt-0.5">Real-time ledger audit showing gross bookings, platform fee deductions, and referrer splits.</p>
        </div>
        <div className="flex gap-2">
          <Button className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold rounded-2xl shadow-sm h-11 px-5 flex items-center gap-2 text-xs transition-all">
            <FileText className="w-4 h-4" /> Export Ledger
          </Button>
        </div>
      </div>

      {/* KPI Stats Section (5 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Gross Revenue */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3 relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Gross Bookings</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-black text-zinc-900">{formatLKR(stats.grossRevenue)}</h3>
            <p className="text-[10px] text-zinc-500">{stats.completedCount} successful bookings</p>
          </div>
        </div>

        {/* Platform Share */}
        <div className="bg-[#1A1C29] border border-[#1A1C29] rounded-3xl p-5 shadow-xl space-y-3 relative overflow-hidden group hover:-translate-y-0.5 transition-all text-white">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Platform Fee ({globalRates.platform}%)</span>
            <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-black text-white">{formatLKR(stats.platformComm)}</h3>
            <p className="text-[10px] text-white/50">Base engine fee applied</p>
          </div>
        </div>

        {/* Salon Upfront Reservation */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3 relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Salon Res. ({globalRates.salon}%)</span>
            <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-black text-zinc-900">{formatLKR(stats.salonComm)}</h3>
            <p className="text-[10px] text-zinc-500">Upfront online deposit</p>
          </div>
        </div>

        {/* PayHere Fee */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3 relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">PayHere ({globalRates.payhere}%)</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center text-rose-500">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-black text-zinc-900">{formatLKR(stats.payhereComm)}</h3>
            <p className="text-[10px] text-zinc-500">Payment Gateway Costs</p>
          </div>
        </div>

        {/* Agent Share */}
        <div className="bg-brand/5 border border-brand/20 rounded-3xl p-5 shadow-sm space-y-3 relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-brand uppercase tracking-widest">Agent Comm.</span>
            <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-brand">
              <Handshake className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-black text-brand">{formatLKR(stats.agentComm)}</h3>
            <p className="text-[10px] text-brand/70">From Platform cut (5-20%)</p>
          </div>
        </div>
      </div>

      {/* Main Ledger Section */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <h2 className="font-bold text-lg text-zinc-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-zinc-400" /> Bookings Ledger &amp; Breakdown
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">Click any booking row to review the platform, salon, payhere, and agent split breakdowns.</p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl">
            {['all', 'completed', 'pending', 'cancelled'].map(f => (
              <Button
                key={f}
                onClick={() => setFilter(f)}
                className={`h-8 px-3 text-xs font-bold rounded-xl transition-all shadow-none border-none capitalize ${
                  filter === f ? "bg-white text-zinc-950" : "bg-transparent text-zinc-500 hover:text-zinc-900"
                }`}
              >
                {f === 'completed' ? 'Settled' : f}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {filteredBookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-400 space-y-2">
              <Calendar className="w-8 h-8 text-zinc-300" />
              <p className="text-sm font-medium">No bookings found matching the filter.</p>
            </div>
          ) : (
            filteredBookings.map((booking) => {
              const isExpanded = expandedBooking === booking.id;
              return (
                <div key={booking.id} className={`border rounded-2xl transition-all ${isExpanded ? "border-slate-300 bg-slate-50/50" : "border-slate-100 hover:border-slate-200"}`}>
                  {/* Row Summary */}
                  <div onClick={() => setExpandedBooking(isExpanded ? null : booking.id)} className="flex flex-col md:flex-row md:items-center justify-between p-4 cursor-pointer select-none gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-[#1A1C29] text-xs">
                        {booking.booking_no?.substring(4) || "BK"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-zinc-900 text-sm">{booking.booking_no || "TRM-000000"}</span>
                          <span className={`px-2 py-0.5 border text-[10px] font-bold rounded-full ${getStatusStyle(booking.status)}`}>{booking.status}</span>
                        </div>
                        <p className="text-xs text-zinc-400 mt-0.5">{booking.customer_email} • {formatDate(booking.booking_date)}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-none pt-3 md:pt-0">
                      <div className="text-left md:text-right">
                        <span className="text-sm font-black text-zinc-900">{formatLKR(booking.amount)}</span>
                        <p className="text-[10px] text-zinc-400 mt-0.5">Gross Amount</p>
                      </div>
                      <div className="text-zinc-400">
                        <ArrowRight className={`w-4 h-4 transform transition-transform ${isExpanded ? "rotate-90 text-brand" : ""}`} />
                      </div>
                    </div>
                  </div>

                  {/* Expanded Breakdown */}
                  {isExpanded && (
                    <div className="border-t border-slate-200 p-5 bg-white rounded-b-2xl space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Direct Database Fee Breakdown</h4>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">💼 Platform Gross</span>
                          <h5 className="text-lg font-black text-zinc-900 mt-1">{formatLKR(booking.platform_commission_amount)}</h5>
                        </div>

                        <div className="bg-teal-50/50 p-4 rounded-xl border border-teal-100">
                          <span className="text-[10px] font-bold text-teal-600 uppercase tracking-wider">🏢 Salon Res.</span>
                          <h5 className="text-lg font-black text-teal-700 mt-1">{formatLKR(booking.salon_upfront_amount)}</h5>
                        </div>

                        <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-100">
                          <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">💳 PayHere Fee</span>
                          <h5 className="text-lg font-black text-rose-600 mt-1">{formatLKR(booking.payhere_fee_amount)}</h5>
                        </div>

                        <div className="bg-brand/5 p-4 rounded-xl border border-brand/10">
                          <span className="text-[10px] font-bold text-brand uppercase tracking-wider">🤝 Agent Cut</span>
                          <h5 className="text-lg font-black text-brand mt-1">{formatLKR(booking.agent_commission_amount)}</h5>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Global Commission Structure (Admin Only) */}
      {isAdmin && (
        <div className="bg-white border border-brand/20 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <h2 className="font-bold text-lg text-zinc-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand" /> Global Commission Structure
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">Admin centrally manage standard rates applied to all new bookings.</p>
            </div>
            <Button onClick={handleUpdateRates} disabled={savingRates} className="bg-brand hover:bg-brand/90 text-white font-bold rounded-xl shadow-sm h-10 px-5 flex items-center gap-2 text-xs">
              {savingRates ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Rates
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Platform Commission (%)</label>
              <Input 
                type="number" 
                value={globalRates.platform} 
                onChange={(e) => setGlobalRates({...globalRates, platform: parseFloat(e.target.value) || 0})}
                className="font-bold text-lg h-12 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Salon Reservation (%)</label>
              <Input 
                type="number" 
                value={globalRates.salon} 
                onChange={(e) => setGlobalRates({...globalRates, salon: parseFloat(e.target.value) || 0})}
                className="font-bold text-lg h-12 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">PayHere Gateway Fee (%)</label>
              <Input 
                type="number" 
                value={globalRates.payhere} 
                onChange={(e) => setGlobalRates({...globalRates, payhere: parseFloat(e.target.value) || 0})}
                className="font-bold text-lg h-12 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">Agent Commission (%)</label>
              <Input 
                type="number" 
                value={globalRates.agent} 
                onChange={(e) => setGlobalRates({...globalRates, agent: parseFloat(e.target.value) || 0})}
                className="font-bold text-lg h-12 rounded-xl"
              />
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl">
            <p className="text-xs font-semibold text-amber-700">
              Note: The Agent Commission (%) is calculated EXCLUSIVELY from the Platform Fee %, NOT from the total service value. (e.g., If Platform gets 10%, a 20% Agent cut means they earn 20% of that 10%).
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
