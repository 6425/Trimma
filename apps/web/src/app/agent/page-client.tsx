"use client";

import React, { useState, useEffect } from "react";
import { Users, Rocket, PhoneCall, ArrowUpRight, Target, Plus, CheckCircle2, AlertCircle, Phone, MessageCircle, Navigation2, MapPin, Loader2, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/config/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getAgentSalonStatusClass, getAgentSalonStatusLabel, isAgentSalonLive } from "@/lib/agent-salons";
import { formatRelativeTime } from "@/lib/dashboard-stats";
import { resolveAuthenticatedDestination } from "@/lib/post-auth";
import { toast } from "sonner";
import { getAgentDashboardData } from "@/app/actions/agent-dashboard";
import { loadAgentDashboardFromClient, tryAgentData } from "@/lib/agent-client-data";
import { useAgentPortal } from "@/lib/agent-portal-provider";

type AssignedSalon = {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  rating: number | null;
  onboarding_status: string | null;
  created_at: string;
};

type AgentTask = {
  id: string;
  task: string;
  time: string;
  type: "call" | "msg" | "visit";
  status: string;
};

export default function AgentDashboard() {
  const router = useRouter();
  const { path } = useAgentPortal();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [agentEmail, setAgentEmail] = useState("");
  const [agentName, setAgentName] = useState("");
  const [isRegionalHead, setIsRegionalHead] = useState(false);
  const [territoryLabel, setTerritoryLabel] = useState("No territory assigned");
  const [stats, setStats] = useState({
    assignedCount: 0,
    convertedCount: 0,
    commissionRate: 10,
    bookingCommissions: 0,
    subscriptionCommissions: 0,
    hotLeads: [] as AssignedSalon[],
    upcomingTasks: [] as AgentTask[],
  });

  const loadAgentData = async () => {
    let isRedirecting = false;
    try {
      setLoading(true);

      const res = await tryAgentData(getAgentDashboardData, loadAgentDashboardFromClient);

      if (!res.success) {
        isRedirecting = true;
        if (res.error === "Unauthorized access") {
          const role = res.role;
          if (role === "salon_owner") {
            router.replace(resolveAuthenticatedDestination({ role: "salon_owner" }));
          } else if (role === "customer") {
            router.replace(resolveAuthenticatedDestination({ role: "customer" }));
          } else if (role === "admin") {
            router.replace("/admin");
          } else {
            router.replace("/onboarding");
          }
          return;
        }
        
        router.replace(`/agent/login?redirectTo=${path()}`);
        return;
      }
      
      setAuthorized(true);
      
      const dashboardData = res.data;
      if (dashboardData) {
        setAgentEmail(dashboardData.agentEmail);
        setAgentName(dashboardData.agentName);
        setTerritoryLabel(dashboardData.territoryLabel);
        setIsRegionalHead(Boolean((dashboardData as { isRegionalHead?: boolean }).isRegionalHead));
        setStats(dashboardData.stats);
      }
      
    } catch (error: any) {
      console.error("Failed to load agent data:", error);
      toast.error("Failed to load dashboard data: " + (error.message || "Unknown error"));
    } finally {
      if (!isRedirecting) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    setTimeout(() => loadAgentData(), 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalEarnings = stats.subscriptionCommissions + stats.bookingCommissions;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-brand mb-4" />
        <p className="text-zinc-500 font-medium">Assembling your workspace...</p>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-zinc-900 mb-2">Access Denied</h2>
        <p className="text-zinc-500 font-medium max-w-md text-center mb-6">
          You do not have permission to access the Agent Dashboard.
        </p>
        <Button onClick={() => router.push("/")} variant="outline">
          Return to Home
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:space-y-8 max-w-6xl mx-auto min-w-0 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-zinc-900 mb-1">Agent Cockpit</h1>
          <p className="text-zinc-500 font-semibold text-sm">
            Welcome back, <span className="text-brand">{agentName}</span>! Convert your assigned leads into active subscriptions.
          </p>
        </div>
        <div className="w-full sm:w-auto">
          <Button
            onClick={() => router.push(path("/leads"))}
            className="w-full sm:w-auto h-11 px-6 rounded-xl bg-[#F5B700] hover:bg-[#F5B700]/90 text-black font-extrabold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4 mr-2" /> View Lead Sheet
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {[
          { title: "Assigned Salons", value: stats.assignedCount, trend: "Managed by you", icon: <Users className="w-5 h-5 text-indigo-500" /> },
          { title: "In Progress", value: stats.assignedCount - stats.convertedCount, trend: "Still onboarding", icon: <Rocket className="w-5 h-5 text-amber-500" /> },
          { title: "Live Salons", value: stats.convertedCount, trend: "Approved / verified", icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" /> },
          { title: "Total Earnings", value: `Rs ${totalEarnings.toLocaleString()}`, trend: `${stats.commissionRate}% commission tier`, icon: <Target className="w-5 h-5 text-sky-500" /> },
        ].map((kpi, i) => (
          <div key={i} className="bg-white p-4 lg:p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden min-w-0">
            <div
              className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 ${
                i === 0 ? "bg-indigo-500" : i === 1 ? "bg-amber-500" : i === 2 ? "bg-emerald-500" : "bg-sky-500"
              }`}
            />
            <div className="flex justify-between items-start mb-3">
              <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">{kpi.icon}</div>
            </div>
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-zinc-900 tracking-tight mb-1 break-words">{kpi.value}</div>
            <div className="text-xs lg:text-sm font-medium text-zinc-500">{kpi.title}</div>
            <div className="text-[10px] lg:text-xs text-zinc-400 font-semibold mt-2 flex items-center">
              <ArrowUpRight className="w-3 h-3 mr-1 text-emerald-500" /> {kpi.trend}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-bold text-emerald-900">Today&apos;s Priorities</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                onClick={() => router.push(path("/salons"))}
                className="bg-white rounded-xl p-4 border border-emerald-100/50 flex items-center justify-between shadow-sm cursor-pointer hover:border-emerald-300 transition-colors"
              >
                <div>
                  <div className="font-bold text-zinc-900">View My Salons</div>
                  <div className="text-xs font-medium text-zinc-500">{stats.assignedCount} salons assigned to you</div>
                </div>
                <PhoneCall className="w-5 h-5 text-emerald-500" />
              </div>
              <div
                onClick={() => router.push(path("/leads"))}
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

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 lg:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50">
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-zinc-900">Recent Assigned Salons</h2>
                <p className="text-sm text-zinc-500 mt-0.5">Quick access to salons managed by you</p>
              </div>
              <Link href={path("/salons")} className="text-sm font-semibold text-brand flex items-center gap-1 hover:underline shrink-0">
                View all salons &rarr;
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              {stats.hotLeads.length === 0 ? (
                <div className="p-10 text-center text-zinc-300">
                  No leads currently assigned to you. Admin assignments will automatically flow here!
                </div>
              ) : (
                stats.hotLeads.map((lead) => (
                  <div key={lead.id} className="p-4 lg:p-5 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
                        <h3 className="font-bold text-zinc-900 text-base min-w-0 flex-1">{lead.name}</h3>
                        <Badge variant="secondary" className={`shadow-none font-bold text-[9px] uppercase px-2.5 py-0.5 shrink-0 ${getAgentSalonStatusClass(lead.onboarding_status)}`}>
                          {getAgentSalonStatusLabel(lead.onboarding_status)}
                        </Badge>
                      </div>
                      <div className="text-xs text-zinc-500 flex flex-wrap items-center gap-x-3 gap-y-1 mb-3">
                        <span className="flex items-center">
                          <MapPin className="w-3.5 h-3.5 mr-1" /> {lead.address || "No address listed"}
                        </span>
                        <span className="flex items-center">
                          <Phone className="w-3.5 h-3.5 mr-1" /> {lead.phone || "No phone listed"}
                        </span>
                      </div>
                      {lead.rating ? (
                        <div className="text-xs font-semibold text-amber-600 flex items-center">
                          <ArrowUpRight className="w-3.5 h-3.5 mr-1 text-amber-500" /> Google Rating: {lead.rating.toFixed(2)} ★
                        </div>
                      ) : null}
                    </div>

                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Map className="w-24 h-24 text-brand" />
            </div>
            <div className="relative z-10">
              <Badge className="bg-brand/10 hover:bg-brand/20 text-brand mb-4 border-none font-bold uppercase text-[9px] tracking-wider">
                Agent Territory Explorer
              </Badge>
              <h3 className="font-bold text-zinc-900 text-xl mb-1">Assigned Territories</h3>
              <p className="text-zinc-500 text-sm mb-6">{territoryLabel}</p>

              <Button onClick={() => router.push(path("/territory"))} className="w-full bg-[#1A1C29] text-white hover:bg-zinc-800 font-bold h-11 rounded-xl">
                <Map className="w-4 h-4 mr-2" /> Open Territory Explorer
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Target className="w-24 h-24 text-emerald-500" />
            </div>
            <h3 className="font-bold text-zinc-900 text-lg mb-4">Referral Earnings</h3>

            <div className="space-y-4 relative z-10">
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Total Recorded Payout</p>
                <p className="text-2xl font-black text-emerald-700">Rs {totalEarnings.toLocaleString()}</p>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-xs font-semibold text-zinc-500">Conversion Rewards</span>
                <span className="text-sm font-bold text-zinc-900">Rs {stats.subscriptionCommissions.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-xs font-semibold text-zinc-500">Booking Commissions</span>
                <span className="text-sm font-bold text-brand">Rs {stats.bookingCommissions.toLocaleString()}</span>
              </div>

              <Button
                onClick={() => router.push(path("/commissions"))}
                className="w-full bg-[#1A1C29] text-white hover:bg-zinc-800 font-bold h-11 rounded-xl mt-2"
              >
                View Commission Ledger
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-zinc-900 text-lg border-b border-slate-100 pb-3">Salons Needing Action</h3>

            {stats.upcomingTasks.length === 0 ? (
              <p className="text-sm text-zinc-500">All assigned salons are live or up to date.</p>
            ) : (
              stats.upcomingTasks.map((task) => (
                <div key={task.id} className="flex flex-wrap items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      task.type === "call"
                        ? "bg-sky-100 text-sky-600"
                        : task.type === "msg"
                          ? "bg-amber-100 text-amber-600"
                          : "bg-indigo-100 text-indigo-600"
                    }`}
                  >
                    {task.type === "call" ? (
                      <PhoneCall className="w-4 h-4" />
                    ) : task.type === "msg" ? (
                      <MessageCircle className="w-4 h-4" />
                    ) : (
                      <MapPin className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-zinc-900 truncate">{task.task}</div>
                    <div className="text-xs text-zinc-500">Assigned {task.time}</div>
                  </div>
                  <Badge variant="outline" className="border-slate-200 text-zinc-500 font-bold text-[9px] uppercase shrink-0 ml-auto sm:ml-0">
                    {getAgentSalonStatusLabel(task.status)}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
