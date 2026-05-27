"use client";

import React, { useState, useEffect } from "react";
import { Users, Rocket, PhoneCall, ArrowUpRight, Target, Plus, CheckCircle2, AlertCircle, Phone, MessageCircle, Navigation2, MapPin, Loader2, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { supabase } from "@/config/supabase";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getAgentSalonStatusClass, getAgentSalonStatusLabel } from "@/lib/agent-salons";

export default function AgentDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [agentEmail, setAgentEmail] = useState("");
  const [agentName, setAgentName] = useState("");
  const [stats, setStats] = useState({
    assignedCount: 0,
    convertedCount: 0,
    commissionRate: 10,
    bookingCommissions: 0,
    hotLeads: [] as any[]
  });

  const loadAgentData = async () => {
    try {
      setLoading(true);
      
      // 1. Get currently authenticated Agent session
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        router.replace("/login?redirectTo=/agent");
        return;
      }

      // Verify agent role (or allow admin/thusitha to view)
      const { data: userData } = await supabase
        .from('users')
        .select('global_role')
        .eq('email', user.email)
        .single();

      const role = userData?.global_role;
      const isAllowedAgent = role === "agent" || role === "admin";

      if (!isAllowedAgent) {
        if (role === 'salon_owner') {
          router.replace("/dashboard");
        } else if (role === 'customer') {
          router.replace("/customer");
        } else {
          router.replace("/onboarding");
        }
        return;
      }

      setAuthorized(true);
      
      const email = user.email || "";
      setAgentEmail(email);
      setAgentName(user.user_metadata?.full_name || email.split("@")[0]);

      // 2. Fetch assigned salons from the salons pipeline
      const { data: assignedSalons, error: assignedErr } = await supabase
        .from("salons")
        .select("id, name, address, phone, rating, onboarding_status, created_at")
        .eq("assign_to", email)
        .order("created_at", { ascending: false });

      if (assignedErr) throw assignedErr;

      const salonRows = assignedSalons || [];
      const assignedCount = salonRows.length;
      const convertedCount = salonRows.filter((salon) =>
        ["AGENT_APPROVED", "VERIFIED"].includes(salon.onboarding_status || "")
      ).length;
      const hotLeads = salonRows.slice(0, 3);

      // 4. Fetch Agent Commission Rate
      const { data: agentProfile } = await supabase
        .from("agents")
        .select("commission_rate")
        .eq("user_email", email)
        .maybeSingle();

      const commRate = agentProfile?.commission_rate || 10;

      // 5. Recent assigned salons for quick access
      let totalBookingCommissions = 0;
      if (email) {
        const { data: commData } = await supabase
          .from("bookings")
          .select("agent_commission_amount")
          .eq("agent_email", email);
          
        if (commData) {
          totalBookingCommissions = commData.reduce((sum, b) => sum + (parseFloat(b.agent_commission_amount as any) || 0), 0);
        }
      }

      setStats({
        assignedCount,
        convertedCount,
        commissionRate: commRate,
        bookingCommissions: totalBookingCommissions,
        hotLeads,
      });

    } catch (error: any) {
      console.error("Failed to load agent metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(() => loadAgentData());
  }, []);

  // WhatsApp quick link trigger
  const handleWhatsAppClick = (phone: string, salonName: string) => {
    if (!phone) return;
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const message = encodeURIComponent(`Hello! This is ${agentName} from Trimma. I saw your professional salon, "${salonName}", on Google and would love to help you activate your Trimma Premium Subscription. Let me know when is a good time to talk!`);
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, "_blank");
  };

  if (loading || !authorized) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-brand mb-4" />
        <p className="text-zinc-500 font-medium">Verifying agent credentials...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:space-y-8 max-w-6xl mx-auto animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-zinc-900 mb-1">Agent Cockpit</h1>
          <p className="text-zinc-500 font-semibold text-sm">Welcome back, <span className="text-brand">{agentName}</span>! Convert your assigned leads into active subscriptions.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button 
            onClick={() => router.push("/agent/leads")}
            variant="outline" 
            className="flex-1 sm:flex-none h-10 rounded-lg text-zinc-700 font-semibold border-slate-200"
          >
            <Plus className="w-4 h-4 mr-2" /> View Lead Sheet
          </Button>
          <Button 
            onClick={() => router.push("/agent/leads")}
            className="flex-1 sm:flex-none h-10 rounded-lg bg-brand hover:bg-brand/90 text-white font-semibold"
          >
            <PhoneCall className="w-4 h-4 mr-2" /> Start Calls
          </Button>
        </div>
      </div>

      {/* LOADING SPINNER */}
      {loading ? (
        <div className="py-20 text-center text-zinc-400">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-brand mb-2" />
          <span>Synchronizing your agent metrics...</span>
        </div>
      ) : (
        <>
          {/* KPI CARDS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            {[
              { title: "Assigned Salons", value: stats.assignedCount, trend: "Managed by you", icon: <Users className="w-5 h-5 text-indigo-500" /> },
              { title: "In Progress", value: stats.assignedCount - stats.convertedCount, trend: "Still onboarding", icon: <Rocket className="w-5 h-5 text-amber-500" /> },
              { title: "Live Salons", value: stats.convertedCount, trend: "Approved / verified", icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" /> },
              { title: "Total Earnings", value: `Rs ${((stats.convertedCount * 5000) + stats.bookingCommissions).toLocaleString()}`, trend: `Sub + Booking fees`, icon: <Target className="w-5 h-5 text-sky-500" /> },
            ].map((kpi, i) => (
              <div key={i} className="bg-white p-4 lg:p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 ${
                  i === 0 ? 'bg-indigo-500' :
                  i === 1 ? 'bg-amber-500' :
                  i === 2 ? 'bg-emerald-500' : 'bg-sky-500'
                }`} />
                <div className="flex justify-between items-start mb-3">
                  <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">{kpi.icon}</div>
                </div>
                <div className="text-2xl lg:text-3xl font-bold text-zinc-900 tracking-tight mb-1">{kpi.value}</div>
                <div className="text-xs lg:text-sm font-medium text-zinc-500">{kpi.title}</div>
                <div className="text-[10px] lg:text-xs text-zinc-400 font-semibold mt-2 flex items-center">
                  <ArrowUpRight className="w-3 h-3 mr-1 text-emerald-500" /> {kpi.trend}
                </div>
              </div>
            ))}
          </div>

          {/* MAIN TWO-COLUMN LAYOUT */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            
            {/* ACTION PANEL & LEADS (Left / Broader) */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Today's Actions */}
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 shadow-sm">
                 <div className="flex items-center gap-2 mb-4">
                   <AlertCircle className="w-5 h-5 text-emerald-600" />
                   <h2 className="text-lg font-bold text-emerald-900">Today&apos;s Priorities</h2>
                 </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                   <div 
                     onClick={() => router.push("/agent/salons")}
                     className="bg-white rounded-xl p-4 border border-emerald-100/50 flex items-center justify-between shadow-sm cursor-pointer hover:border-emerald-300 transition-colors"
                   >
                      <div>
                        <div className="font-bold text-zinc-900">View My Salons</div>
                        <div className="text-xs font-medium text-zinc-500">{stats.assignedCount} salons assigned to you</div>
                      </div>
                      <PhoneCall className="w-5 h-5 text-emerald-500" />
                   </div>
                   <div 
                     onClick={() => router.push("/agent/leads")}
                     className="bg-white rounded-xl p-4 border border-emerald-100/50 flex items-center justify-between shadow-sm cursor-pointer hover:border-emerald-300 transition-colors"
                   >
                      <div>
                        <div className="font-bold text-zinc-900">Open Field Editor</div>
                        <div className="text-xs font-medium text-zinc-500">Verify details and invite owners</div>
                      </div>
                      <MessageCircle className="w-5 h-5 text-amber-500" />
                   </div>
                 </div>
              </div>

              {/* Lead List */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-5 lg:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <div>
                    <h2 className="text-lg font-bold text-zinc-900">Recent Assigned Salons</h2>
                    <p className="text-sm text-zinc-500 mt-0.5">Quick access to salons managed by you</p>
                  </div>
                  <Link href="/agent/salons" className="text-sm font-semibold text-brand flex items-center gap-1 hover:underline">
                    View all salons &rarr;
                  </Link>
                </div>
                <div className="divide-y divide-slate-100">
                  {stats.hotLeads.length === 0 ? (
                    <div className="p-10 text-center text-zinc-300">
                      No leads currently assigned to you. Admin assignments will automatically flow here!
                    </div>
                  ) : (
                    stats.hotLeads.map((lead, i) => (
                      <div key={i} className="p-4 lg:p-5 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-1">
                            <h3 className="font-bold text-zinc-900 text-base">{lead.name}</h3>
                            <Badge variant="secondary" className={`shadow-none font-bold text-[9px] uppercase px-2.5 py-0.5 ${getAgentSalonStatusClass(lead.onboarding_status)}`}>
                              {getAgentSalonStatusLabel(lead.onboarding_status)}
                            </Badge>
                          </div>
                          <div className="text-xs text-zinc-500 flex flex-wrap items-center gap-x-3 gap-y-1 mb-3">
                            <span className="flex items-center"><MapPin className="w-3.5 h-3.5 mr-1" /> {lead.address || "No address listed"}</span>
                            <span className="flex items-center"><Phone className="w-3.5 h-3.5 mr-1" /> {lead.phone || "No phone listed"}</span>
                          </div>
                          {lead.rating && (
                            <div className="text-xs font-semibold text-amber-600 flex items-center">
                              <ArrowUpRight className="w-3.5 h-3.5 mr-1 text-amber-500" /> Google Rating: {lead.rating.toFixed(2)} ★
                            </div>
                          )}
                        </div>
                        
                        <div className="flex sm:flex-col gap-2 shrink-0 justify-center">
                          {lead.phone ? (
                            <>
                              <Button 
                                onClick={() => window.open(`tel:${lead.phone}`, "_self")}
                                size="sm" 
                                className="flex-1 bg-zinc-900 text-white rounded-lg h-9 font-bold"
                              >
                                <PhoneCall className="w-3.5 h-3.5 mr-1.5" /> Call
                              </Button>
                              <Button 
                                onClick={() => handleWhatsAppClick(lead.phone, lead.name)}
                                size="sm" 
                                variant="outline" 
                                className="flex-1 border-slate-200 text-emerald-600 font-bold rounded-lg h-9 hover:bg-emerald-50"
                              >
                                <MessageCircle className="w-3.5 h-3.5 mr-1.5" /> WhatsApp
                              </Button>
                            </>
                          ) : (
                            <span className="text-xs text-zinc-400 font-semibold italic">No contact details</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* PROSPECTING & TERRITORY (Right Column) */}
            <div className="space-y-6">
              
              <div className="bg-zinc-900 text-white rounded-2xl shadow-sm p-6 relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-10">
                   <Map className="w-24 h-24" />
                 </div>
                 <div className="relative z-10">
                   <Badge className="bg-white/20 hover:bg-white/30 text-white mb-4 border-none font-bold uppercase text-[9px] tracking-wider">Sales Territory</Badge>
                   <h3 className="font-bold text-xl mb-1">Assigned Region</h3>
                   <p className="text-zinc-400 text-sm mb-6">Coordinate with your Admin to activate regional lists.</p>
                   
                   <Button 
                     onClick={() => router.push("/agent/leads")}
                     className="w-full bg-white text-zinc-900 hover:bg-zinc-100 font-bold h-11 rounded-xl"
                   >
                     <Navigation2 className="w-4 h-4 mr-2" /> Start Prospecting
                   </Button>
                 </div>
              </div>

               {/* Agent Commission Summary */}
               <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-10">
                   <Target className="w-24 h-24 text-emerald-500" />
                 </div>
                 <h3 className="font-bold text-zinc-900 text-lg mb-4">Referral Earnings</h3>
                 
                 <div className="space-y-4 relative z-10">
                   <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                     <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Total Estimated Payout</p>
                     <p className="text-2xl font-black text-emerald-700">Rs {((stats.convertedCount * 5000) + stats.bookingCommissions).toLocaleString()}</p>
                   </div>
                   
                   <div className="flex items-center justify-between py-2 border-b border-slate-100">
                     <span className="text-xs font-semibold text-zinc-500">Subscription Sales</span>
                     <span className="text-sm font-bold text-zinc-900">Rs {(stats.convertedCount * 5000).toLocaleString()}</span>
                   </div>
                   <div className="flex items-center justify-between py-2 border-b border-slate-100">
                     <span className="text-xs font-semibold text-zinc-500">Booking Commissions</span>
                     <span className="text-sm font-bold text-brand">Rs {stats.bookingCommissions.toLocaleString()}</span>
                   </div>
                   
                   <Button 
                     onClick={() => router.push("/agent/commissions")}
                     className="w-full bg-[#1A1C29] text-white hover:bg-zinc-800 font-bold h-11 rounded-xl mt-2"
                   >
                     View Commission Ledger
                   </Button>
                 </div>
               </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                 <h3 className="font-bold text-zinc-900 text-lg border-b border-slate-100 pb-3">Upcoming Tasks</h3>
                 
                 {[
                   { task: "Call: Glam Studio", time: "10:00 AM", type: "call" },
                   { task: "Follow-up: Style Lounge", time: "2:00 PM", type: "msg" },
                   { task: "Visit: Elite Salon", time: "4:30 PM", type: "visit" }
                 ].map((task, i) => (
                   <div key={i} className="flex items-center gap-3">
                     <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                       task.type === 'call' ? 'bg-sky-100 text-sky-600' :
                       task.type === 'msg' ? 'bg-amber-100 text-amber-600' :
                       'bg-indigo-100 text-indigo-600'
                     }`}>
                       {task.type === 'call' ? <PhoneCall className="w-4 h-4" /> :
                        task.type === 'msg' ? <MessageCircle className="w-4 h-4" /> :
                        <MapPin className="w-4 h-4" />}
                     </div>
                     <div className="flex-1 min-w-0">
                       <div className="font-semibold text-sm text-zinc-900 truncate">{task.task}</div>
                       <div className="text-xs text-zinc-500">{task.time}</div>
                     </div>
                     <Badge variant="outline" className="border-slate-200 text-zinc-500 hover:bg-slate-50 cursor-pointer font-bold text-[9px] uppercase">Done</Badge>
                   </div>
                 ))}
              </div>

            </div>

          </div>
        </>
      )}
    </div>
  );
}
