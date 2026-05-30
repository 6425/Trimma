"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/config/supabase";
import { fetchAgentWorkQueue, WorkItem } from "@/app/actions/agent-work-queue";
import { 
  CheckCircle2, AlertCircle, Clock, Search, Filter, Briefcase, 
  Store, Banknote, Target, Bell, ArrowRight, Activity, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatRelativeTime } from "@/lib/dashboard-stats";

const TABS = ["All Work", "Leads", "Salons", "Commissions", "Alerts"] as const;
type TabType = typeof TABS[number];

export default function AgentTasksQueue() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("All Work");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [metrics, setMetrics] = useState<any>({
    totalAssignedLeads: 0,
    verifiedSalons: 0,
    pendingCommissionsCount: 0,
    totalCommissionAmount: 0,
    performanceScore: 0
  });
  const [activityLogs, setActivityLogs] = useState<any[]>([]);

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        toast.error("Not authenticated");
        return;
      }
      const data = await fetchAgentWorkQueue(user.email);
      setWorkItems(data.workItems);
      setMetrics(data.metrics);
      setActivityLogs(data.activityLogs);
    } catch (err: any) {
      toast.error(err.message || "Failed to load work queue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTimeout(() => loadData(), 0);
  }, []);

  const filteredItems = workItems.filter(item => {
    if (activeTab === "Leads" && item.type !== "LEAD") return false;
    if (activeTab === "Salons" && item.type !== "SALON") return false;
    if (activeTab === "Commissions" && item.type !== "COMMISSION") return false;
    if (activeTab === "Alerts" && item.type !== "ALERT") return false;
    
    if (searchQuery) {
      return item.businessName.toLowerCase().includes(searchQuery.toLowerCase()) || 
             item.currentStatus.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH": return "bg-red-500/10 text-red-500 border-red-500/20";
      case "MEDIUM": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "LOW": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      default: return "bg-zinc-800 text-zinc-400 border-zinc-700";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "LEAD": return <Target className="w-4 h-4 text-blue-400" />;
      case "SALON": return <Store className="w-4 h-4 text-emerald-400" />;
      case "COMMISSION": return <Banknote className="w-4 h-4 text-amber-400" />;
      case "ALERT": return <Bell className="w-4 h-4 text-red-400" />;
      default: return <Briefcase className="w-4 h-4 text-zinc-400" />;
    }
  };

  if (loading) {
    return (
      <div className="flex-1 min-h-[100dvh] flex items-center justify-center bg-[#121212]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 rounded-full blur-xl bg-brand/20 animate-pulse" />
            <div className="w-12 h-12 rounded-full border-4 border-brand/30 border-t-brand animate-spin" />
          </div>
          <p className="text-zinc-400 font-medium">Assembling Work Queue...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-zinc-200 selection:bg-brand/30 pb-20 lg:pb-8">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-30 bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                <Zap className="w-6 h-6 text-brand" />
                Dynamic Work Queue
              </h1>
              <p className="text-sm text-zinc-400 mt-1">Smart operational command center driven by real-time business states.</p>
            </div>
            <div className="hidden sm:flex items-center gap-4">
              <Button onClick={() => loadData()} variant="outline" className="border-white/10 hover:bg-white/5 h-10">
                Refresh Sync
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#121212] border border-white/5 rounded-2xl p-5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150" />
            <Target className="w-6 h-6 text-blue-400 mb-4" />
            <p className="text-sm font-medium text-zinc-400">Assigned Leads</p>
            <p className="text-3xl font-bold text-white mt-1">{metrics?.totalAssignedLeads || 0}</p>
          </div>
          
          <div className="bg-[#121212] border border-white/5 rounded-2xl p-5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150" />
            <Store className="w-6 h-6 text-emerald-400 mb-4" />
            <p className="text-sm font-medium text-zinc-400">Verified Salons</p>
            <p className="text-3xl font-bold text-white mt-1">{metrics?.verifiedSalons || 0}</p>
          </div>

          <div className="bg-[#121212] border border-white/5 rounded-2xl p-5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150" />
            <Banknote className="w-6 h-6 text-amber-400 mb-4" />
            <p className="text-sm font-medium text-zinc-400">Pending Commissions</p>
            <p className="text-3xl font-bold text-white mt-1">{metrics?.pendingCommissionsCount || 0}</p>
          </div>

          <div className="bg-gradient-to-br from-brand/20 to-[#121212] border border-brand/20 rounded-2xl p-5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand/20 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150" />
            <Activity className="w-6 h-6 text-brand mb-4" />
            <p className="text-sm font-medium text-brand">Performance Score</p>
            <div className="flex items-end gap-2 mt-1">
              <p className="text-3xl font-bold text-white">{metrics?.performanceScore || 0}</p>
              <p className="text-brand font-medium mb-1">%</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Work Grid (Left 2 columns) */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* Toolbar */}
            <div className="bg-[#121212] border border-white/5 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4 justify-between sticky top-24 z-20 shadow-2xl shadow-black/50">
              <div className="flex items-center gap-1 overflow-x-auto w-full pb-2 sm:pb-0 hide-scrollbar">
                {TABS.map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`relative px-4 py-2 text-sm font-medium rounded-xl whitespace-nowrap transition-colors ${
                      activeTab === tab ? "text-black" : "text-zinc-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {activeTab === tab && (
                      <motion.div 
                        layoutId="activeQueueTab"
                        className="absolute inset-0 bg-brand rounded-xl"
                        initial={false}
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <span className="relative z-10">{tab}</span>
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-auto min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search work items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-black/50 border border-white/10 rounded-xl text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/50 transition-all"
                />
              </div>
            </div>

            {/* List */}
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {filteredItems.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-[#121212] border border-white/5 rounded-2xl p-12 text-center"
                  >
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-8 h-8 text-zinc-600" />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">Inbox Zero!</h3>
                    <p className="text-zinc-400 max-w-sm mx-auto">
                      There are no active work items matching your current filters. Great job staying on top of things!
                    </p>
                  </motion.div>
                ) : (
                  filteredItems.map((item, idx) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: idx * 0.05 }}
                      className="group bg-[#121212] hover:bg-[#181818] border border-white/5 hover:border-brand/30 rounded-2xl p-5 transition-all cursor-pointer"
                      onClick={() => router.push(item.actionUrl)}
                    >
                      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                        <div className="flex items-start gap-4">
                          <div className="mt-1 bg-black/50 p-2.5 rounded-xl border border-white/5 shadow-inner">
                            {getTypeIcon(item.type)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className={`border ${getPriorityColor(item.priority)} px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase`}>
                                {item.priority}
                              </Badge>
                              <span className="text-xs text-zinc-500 font-medium tracking-wide uppercase">
                                {item.type}
                              </span>
                            </div>
                            <h3 className="text-lg font-semibold text-white group-hover:text-brand transition-colors">
                              {item.businessName}
                            </h3>
                            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm">
                              <span className="flex items-center gap-1.5 text-zinc-400">
                                <Activity className="w-4 h-4 text-zinc-500" />
                                {item.currentStatus.replace(/_/g, " ")}
                              </span>
                              <span className="text-zinc-700">•</span>
                              <span className="flex items-center gap-1.5 text-zinc-400">
                                <Clock className="w-4 h-4 text-zinc-500" />
                                {formatRelativeTime(item.lastActivityDate)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <Button 
                          className="w-full sm:w-auto bg-brand hover:bg-[#D49E00] text-black font-semibold rounded-xl gap-2 shadow-[0_0_15px_rgba(245,183,0,0.2)] group-hover:shadow-[0_0_20px_rgba(245,183,0,0.4)] transition-all"
                        >
                          {item.recommendedAction}
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right Panel - Activity Feed & Performance Details */}
          <div className="flex flex-col gap-6">
            
            <div className="bg-[#121212] border border-white/5 rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 rounded-full blur-3xl -mr-32 -mt-32" />
              
              <h3 className="text-lg font-semibold text-white mb-6 relative z-10 flex items-center gap-2">
                <Activity className="w-5 h-5 text-brand" />
                Recent Activity
              </h3>
              
              <div className="space-y-6 relative z-10">
                {activityLogs.length > 0 ? (
                  activityLogs.map((log, i) => (
                    <div key={log.id || i} className="relative pl-6 before:absolute before:left-[11px] before:top-2 before:bottom-[-24px] last:before:hidden before:w-px before:bg-white/10">
                      <div className="absolute left-0 top-1.5 w-[22px] h-[22px] rounded-full bg-black border-2 border-brand/50 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-brand" />
                      </div>
                      <p className="text-sm font-medium text-white">{log.action.replace(/_/g, " ")}</p>
                      <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{log.notes}</p>
                      <p className="text-[10px] font-bold tracking-wider text-zinc-600 uppercase mt-2">
                        {formatRelativeTime(log.created_at)}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10">
                    <AlertCircle className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
                    <p className="text-sm text-zinc-500">No recent activity found.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-2">Queue Health</h3>
              <p className="text-sm text-zinc-400 mb-6">Overview of your derived workloads based on actual business states.</p>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-zinc-300 font-medium">Lead Conversion</span>
                    <span className="text-brand font-bold">{metrics.totalAssignedLeads > 0 ? Math.round((metrics.verifiedSalons / metrics.totalAssignedLeads) * 100) : 0}%</span>
                  </div>
                  <div className="h-2 w-full bg-black rounded-full overflow-hidden border border-white/5">
                    <motion.div 
                      className="h-full bg-brand"
                      initial={{ width: 0 }}
                      animate={{ width: `${metrics.totalAssignedLeads > 0 ? Math.round((metrics.verifiedSalons / metrics.totalAssignedLeads) * 100) : 0}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2 mt-6">
                    <span className="text-zinc-300 font-medium">Pending Payouts</span>
                    <span className="text-amber-400 font-bold">LKR {metrics.totalCommissionAmount?.toLocaleString() || 0}</span>
                  </div>
                  <div className="h-2 w-full bg-black rounded-full overflow-hidden border border-white/5">
                    <motion.div 
                      className="h-full bg-amber-400"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((metrics.pendingCommissionsCount / 10) * 100, 100)}%` }} // arbitrary scale for demo
                      transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                    />
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
