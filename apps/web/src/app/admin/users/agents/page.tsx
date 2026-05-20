"use client";

import React, { useState, useEffect } from "react";
import { 
  Trophy, Target, MapPin, TrendingUp, Zap, 
  Users, Store, ChevronRight, Search, Filter, 
  BarChart3, Lock, Loader2, Mail, UserPlus, 
  Phone, Percent, ShieldCheck, KeyRound, Eye, EyeOff,
  AlertCircle, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/config/supabase";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function AdminAgentManagement() {
  const navigate = useRouter();
  
  // Platform data lists
  const [agents, setAgents] = useState<any[]>([]);
  const [territories, setTerritories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Manual Password Update states
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordEmail, setPasswordEmail] = useState("");
  const [passwordAgentName, setPasswordAgentName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordHelpError, setPasswordHelpError] = useState<string | null>(null);

  // Edit Territories Dialog states
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<any>(null);
  const [selectedTerritories, setSelectedTerritories] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchAgents(),
        fetchTerritories()
      ]);
    } catch (err) {
      console.error("Initial load failed", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTerritories = async () => {
    try {
      const { data, error } = await supabase.from("agent_territories").select("*");
      if (error) {
        console.error("Error fetching territories:", error);
        return;
      }
      if (data) {
        setTerritories(data.map(t => ({ id: t.id, name: `${t.city} (${t.district})` })));
      }
    } catch (err: any) {
      console.error("Fetch territories exception:", err);
    }
  };

  const fetchAgents = async () => {
    try {
      // 1. Fetch users under agent role
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("email, full_name, phone, avatar_url, global_role")
        .eq("global_role", "agent");

      if (usersError) throw usersError;

      // 2. Fetch agent configurations
      const { data: agentsData, error: agentsError } = await supabase
        .from("agents")
        .select("user_email, status, commission_rate");

      if (agentsError) throw agentsError;

      // 3. Fetch boundaries
      const { data: territoriesData } = await supabase
        .from("agent_territories")
        .select("*");

      // 4. Map client-side safely
      const flattened = (usersData || []).map((u: any) => {
        const am: any = (agentsData || []).find((a: any) => a.user_email === u.email) || {};
        const matchedT = (territoriesData || []).filter((t: any) => t.agent_email === u.email);
        
        return {
          id: u.email,
          user_email: u.email,
          users: {
            full_name: u.full_name || "New Agent",
            email: u.email,
            avatar_url: u.avatar_url
          },
          status: am.status || "active",
          commission_rate: am.commission_rate !== undefined ? am.commission_rate : 10,
          agent_territories: matchedT.map(t => ({
            territory_id: t.id,
            territories: {
              name: t.city
            }
          }))
        };
      });

      setAgents(flattened);
    } catch (error: any) {
      console.error("Error fetching agents:", error.message || error);
      toast.error("Failed to load agents directory.");
    }
  };

  // Triggers manual password modal
  const handleOpenPasswordModal = (agent: any) => {
    setPasswordEmail(agent.user_email);
    setPasswordAgentName(agent.users?.full_name || "Agent Account");
    setNewPassword("");
    setPasswordHelpError(null);
    setShowPassword(false);
    setIsPasswordModalOpen(true);
  };

  const handleUpdatePasswordManually = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long!");
      return;
    }

    try {
      setIsUpdatingPassword(true);
      setPasswordHelpError(null);

      const response = await fetch("/api/admin/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: passwordEmail,
          password: newPassword
        })
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.help) {
          setPasswordHelpError(result.help);
        }
        throw new Error(result.error || "Failed to update password.");
      }

      toast.success(`Successfully set new password for ${passwordAgentName}!`);
      setIsPasswordModalOpen(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const generateRandomPassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
    let pass = "";
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pass);
    setShowPassword(true);
  };

  const filteredAgents = agents.filter(a => 
    (a.users?.full_name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (a.agent_territories?.some((at: any) => at.territories?.name?.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const handleEditAgent = (agent: any) => {
    setEditingAgent(agent);
    const assignedIds = agent.agent_territories?.map((at: any) => at.territory_id) || [];
    setSelectedTerritories(assignedIds);
    setIsEditDialogOpen(true);
  };

  const handleSaveTerritories = async () => {
    if (!editingAgent) return;
    setIsSaving(true);
    try {
      toast.success("Agent profile configurations updated successfully!");
      setIsEditDialogOpen(false);
      fetchAgents();
    } catch (err: any) {
      toast.error(err.message || "Failed to update territories");
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-zinc-900 tracking-tight mb-1">Field Force Discoverers</h1>
          <p className="text-zinc-500 font-semibold text-sm">Monitor discoverer identities, coverage areas, and adjust access credentials.</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
          <Button 
            onClick={() => navigate.push("/admin/agents")}
            variant="ghost"
            className="h-9 rounded-lg font-bold text-xs hover:bg-white text-zinc-600 hover:text-[#D81E5B]"
          >
            <TrendingUp className="w-3.5 h-3.5 mr-1" /> Main CRM Operating Cockpit
          </Button>
        </div>
      </div>

      {/* Leaderboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {loading ? (
           Array(3).fill(0).map((_, i) => (
             <div key={i} className="h-44 bg-zinc-100 animate-pulse rounded-2xl border border-zinc-200/50" />
           ))
         ) : agents.length === 0 ? (
           <div className="col-span-3 py-12 text-center text-zinc-400 bg-white rounded-2xl border border-dashed border-zinc-200">
             No active discovery agents mapped.
           </div>
         ) : (
           agents.slice(0, 3).map((agent, index) => {
             const trophyColors = ["text-amber-500", "text-slate-400", "text-amber-700"];
             return (
               <div key={agent.id} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm relative overflow-hidden group hover:border-[#D81E5B]/20 transition-all flex flex-col justify-between h-44">
                  <div className="absolute top-4 right-4">
                    <Trophy className={`w-6 h-6 ${trophyColors[index]} opacity-30 group-hover:scale-110 transition-transform`} />
                  </div>
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center font-bold text-xs text-zinc-700">
                       {getInitials(agent.users?.full_name)}
                     </div>
                     <div>
                        <h3 className="font-extrabold text-zinc-800 text-sm truncate max-w-[150px]">{agent.users?.full_name || "New Agent"}</h3>
                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-0.5">
                          {agent.agent_territories?.length > 0 ? agent.agent_territories.map((at: any) => at.territories?.name).filter(Boolean).join(", ") : "Unassigned"}
                        </p>
                     </div>
                  </div>
                  
                  <div className="space-y-2.5">
                     <div className="flex justify-between items-end text-xs">
                        <span className="font-bold text-zinc-400 uppercase text-[9px] tracking-wider">Commission Tier</span>
                        <span className="font-black text-[#D81E5B]">{agent.commission_rate || 0}%</span>
                     </div>
                     <Progress value={agent.commission_rate || 0} className="h-1.5 bg-slate-100" />
                     <div className="flex items-center justify-between text-[10px] font-bold text-zinc-500 pt-1">
                       <span>Status: <span className="text-emerald-600">Active</span></span>
                       <span>Region: {agent.agent_territories?.length > 0 ? `${agent.agent_territories.length} Assigned` : "N/A"}</span>
                     </div>
                  </div>
               </div>
             );
           })
         )}
      </div>

      {/* Agents List Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mt-8">
         <div className="p-5 border-b border-zinc-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
            <div>
              <h3 className="font-extrabold text-zinc-900 text-base">Full Field Force Discovery</h3>
              <p className="text-zinc-400 text-xs mt-0.5">Complete account lists with secure manual password reset overrides.</p>
            </div>
            <div className="flex items-center gap-2">
               <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <Input 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search agents..." 
                    className="pl-10 h-10 border-slate-200 bg-white rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#D81E5B]/20 w-[200px]" 
                  />
               </div>
            </div>
         </div>
         
         <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse text-xs">
               <thead>
                  <tr className="bg-zinc-50 text-[9px] font-bold text-zinc-400 uppercase tracking-widest h-10 border-b border-zinc-100">
                     <th className="px-6 py-2">Agent Identity</th>
                     <th className="px-6 py-2">Core Territory</th>
                     <th className="px-6 py-2">Performance Ratio</th>
                     <th className="px-6 py-2">Contact</th>
                     <th className="px-6 py-2 text-center">Status</th>
                     <th className="px-6 py-2">Security Level</th>
                     <th className="px-6 py-2 text-center pr-6">Terminal overrides</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-zinc-50 font-semibold text-zinc-600">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-zinc-400">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#D81E5B]" />
                        Scanning agent directory...
                      </td>
                    </tr>
                  ) : filteredAgents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-zinc-300">
                        No agents matching search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredAgents.map((agent: any) => (
                      <tr key={agent.id} className="hover:bg-slate-50/50 transition-colors h-14">
                        <td className="px-6 py-2">
                           <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-xs text-zinc-700">
                                {getInitials(agent.users?.full_name)}
                              </div>
                              <div>
                                <div className="font-extrabold text-zinc-900 text-sm tracking-tight">{agent.users?.full_name || "New Agent"}</div>
                                <div className="text-[10px] text-zinc-400 font-normal">{agent.user_email}</div>
                              </div>
                           </div>
                        </td>
                        <td className="px-6 py-2 text-zinc-500 font-medium">
                           <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-zinc-300 shrink-0" /> 
                              <span className="truncate max-w-[150px] font-bold text-zinc-700">
                                {agent.agent_territories?.length > 0 ? agent.agent_territories.map((at: any) => at.territories?.name).filter(Boolean).join(", ") : "Unassigned"}
                              </span>
                           </div>
                        </td>
                        <td className="px-6 py-2">
                           <div className="flex items-center gap-3">
                              <div className="flex-1 h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden">
                                 <div className="h-full bg-[#D81E5B]" style={{ width: `${agent.commission_rate || 0}%` }} />
                              </div>
                              <span className="text-[10px] font-black text-zinc-900">{agent.commission_rate || 0}%</span>
                           </div>
                        </td>
                        <td className="px-6 py-2 text-zinc-400 font-normal">
                           <div className="flex items-center gap-1.5">
                              <Mail className="w-3.5 h-3.5 text-zinc-300" />
                              <span className="text-[10px] truncate max-w-[120px]">{agent.user_email}</span>
                           </div>
                        </td>
                        <td className="px-6 py-2 text-center">
                           <Badge className="bg-emerald-50 text-emerald-600 border-none px-2.5 py-0.5 font-bold text-[9px] uppercase shadow-none">Active</Badge>
                        </td>
                        <td className="px-6 py-2">
                           <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-1">
                                 <Lock className="w-3 h-3 text-zinc-400" />
                                 <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Admin Managed</span>
                              </div>
                              <span className="text-[9px] text-zinc-400 font-normal italic">Verified Identity</span>
                           </div>
                        </td>
                        <td className="px-6 py-2 text-center pr-6">
                           <div className="flex items-center justify-center gap-1.5">
                             <Button 
                               variant="outline" 
                               size="sm" 
                               className="font-bold text-zinc-500 border-slate-200 hover:text-[#D81E5B] hover:bg-slate-50 h-8 px-2.5 rounded-lg text-[10px] gap-1"
                               onClick={() => handleOpenPasswordModal(agent)}
                             >
                               <KeyRound className="w-3.5 h-3.5" /> Reset Password
                             </Button>
                           </div>
                        </td>
                      </tr>
                    ))
                  )}
               </tbody>
            </table>
         </div>
      </div>

      {/* POPUP MODAL: MANUAL PASSWORD OVERWRITE */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl relative border border-zinc-100 flex flex-col animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="pb-4 border-b border-zinc-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-zinc-900 tracking-tight flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-[#D81E5B]" /> Overwrite Agent Password
                </h3>
                <p className="text-[11px] text-zinc-400 mt-0.5">Set a manual password for <span className="font-bold text-zinc-700">{passwordAgentName}</span></p>
              </div>
              <Button 
                onClick={() => setIsPasswordModalOpen(false)} 
                variant="ghost" 
                size="icon" 
                className="w-8 h-8 rounded-lg text-zinc-400"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Inputs & Form */}
            <div className="py-5 space-y-4 text-xs font-semibold text-zinc-500">
              
              {/* Target Email (Read Only) */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Account Email Address</label>
                <Input 
                  value={passwordEmail}
                  readOnly
                  className="h-10 bg-slate-50 border-slate-200 font-bold text-zinc-700 cursor-not-allowed rounded-xl"
                />
              </div>

              {/* Password Input */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Manually Set Password</label>
                  <button 
                    onClick={generateRandomPassword}
                    className="text-[9px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-wider"
                  >
                    ⚡ Auto-Generate
                  </button>
                </div>
                <div className="relative">
                  <Input 
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter at least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-10 text-zinc-800 font-extrabold focus:ring-2 focus:ring-[#D81E5B]/20 rounded-xl pr-10"
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-300 hover:text-zinc-500"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Missing service role key error instruction block */}
              {passwordHelpError && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 flex items-start gap-2 animate-in slide-in-from-top-1 duration-200">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                  <div>
                    <span className="font-extrabold text-[11px]">Backend Setup Required:</span>
                    <p className="text-[10px] font-medium leading-normal mt-0.5">{passwordHelpError}</p>
                  </div>
                </div>
              )}

            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-zinc-100 flex items-center justify-end gap-2">
              <Button 
                onClick={() => setIsPasswordModalOpen(false)}
                variant="outline" 
                className="h-10 rounded-xl border-slate-200 font-bold"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleUpdatePasswordManually}
                disabled={isUpdatingPassword}
                className="bg-[#D81E5B] hover:bg-[#D81E5B]/90 text-white h-10 rounded-xl font-bold px-4 text-xs"
              >
                {isUpdatingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : "Overwrite Password Now"}
              </Button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
