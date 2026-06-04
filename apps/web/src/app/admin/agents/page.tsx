"use client";

import React, { useState, useEffect } from "react";
import { Users, Search, Percent, Trash2, Phone, Loader2, Edit, CheckCircle2, UserCheck, MapPin, TrendingUp, Plus, Award, DollarSign, ClipboardList, Check, X, Lock, AlertTriangle, History, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { fetchAdminAgentsPage } from "@/app/actions/admin-list-data";
import { assignAgentTerritory, removeAgentTerritory, syncAgentTerritories } from "@/app/actions/agent-territories";
import { MultiSelect } from "@/components/ui/multi-select";
import {
  saveAdminAgentProfile,
  demoteAdminAgent,
  insertAgentActivityLog,
  updateCommissionLedgerStatus,
} from "@/app/actions/admin-operations";
import { withTimeout } from "@/lib/promise-timeout";

const getDeepestSelectedTerritories = (
  catalog: any[],
  provIds: string[],
  distIds: string[],
  cityIds: string[]
) => {
  const result: string[] = [];
  provIds.forEach(pId => {
    const childDistricts = distIds.filter(dId => {
      const dist = catalog.find(c => c.id === dId);
      return dist?.parent_id === pId;
    });
    if (childDistricts.length === 0) {
      result.push(pId);
    } else {
      childDistricts.forEach(dId => {
        const childCities = cityIds.filter(cId => {
          const city = catalog.find(c => c.id === cId);
          return city?.parent_id === dId;
        });
        if (childCities.length === 0) {
          result.push(dId);
        } else {
          result.push(...childCities);
        }
      });
    }
  });
  return result;
};

export default function AdminAgents() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'directory' | 'territories' | 'ledger' | 'logs'>('dashboard');
  
  // Data States
  const [agents, setAgents] = useState<any[]>([]);
  const [agentTerritories, setAgentTerritories] = useState<any[]>([]);
  const [territoryCatalog, setTerritoryCatalog] = useState<any[]>([]);
  const [ledger, setLedger] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [pendingPayouts, setPendingPayouts] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  
  // Filtering & Modal States
  const [searchTerm, setSearchTerm] = useState("");
  const [updating, setUpdating] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<any | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [initialSyncDone, setInitialSyncDone] = useState(false);

  // Form edit states
  const [editCommission, setEditCommission] = useState("10");
  const [editStatus, setEditStatus] = useState("active");
  const [editTerritoryIds, setEditTerritoryIds] = useState<string[]>([]);
  
  const [modalProvinceIds, setModalProvinceIds] = useState<string[]>([]);
  const [modalDistrictIds, setModalDistrictIds] = useState<string[]>([]);
  const [modalCityIds, setModalCityIds] = useState<string[]>([]);

  // Territory Creation states
  const [newTerritoryEmail, setNewTerritoryEmail] = useState("");
  const [newTerritoryIds, setNewTerritoryIds] = useState<string[]>([]);

  const [selectedProvinceIds, setSelectedProvinceIds] = useState<string[]>([]);
  const [selectedDistrictIds, setSelectedDistrictIds] = useState<string[]>([]);
  const [selectedCityIds, setSelectedCityIds] = useState<string[]>([]);

  const refreshTerritoryAssignments = async () => {
    try {
      const result = await fetchAdminAgentsPage();
      if (result.success === false) throw new Error(result.error);
      setAgentTerritories(result.agentTerritories || []);
      setTerritoryCatalog(result.territoryCatalog || []);
    } catch (e: any) {
      console.error("Territories fetch failed:", e.message || e);
    }
  };

  const mapAgentsFromPageData = (
    usersData: any[],
    agentsData: any[],
    leadsData: any[],
    userRolesData: { user_id: string | null; role: string }[] = []
  ) => {
    const agentUserIds = new Set(
      userRolesData
        .filter((r) => r.role === "agent" && r.user_id)
        .map((r) => r.user_id as string)
    );
    const agentEmailsFromRoles = new Set(
      (agentsData || [])
        .filter((a) => a.user_id && agentUserIds.has(a.user_id))
        .map((a) => String(a.user_email || "").trim().toLowerCase())
        .filter(Boolean)
    );

    const isAgentUser = (u: { email?: string; global_role?: string }) => {
      const email = String(u.email || "").trim().toLowerCase();
      return (
        String(u.global_role || "").toLowerCase() === "agent" ||
        agentEmailsFromRoles.has(email) ||
        (agentsData || []).some(
          (a) => String(a.user_email || "").trim().toLowerCase() === email
        )
      );
    };

    const agentUsers = (usersData || []).filter(isAgentUser);
    const flattened = agentUsers.map((u: any) => {
      const emailKey = String(u.email || "").trim().toLowerCase();
      const agentMeta: any =
        (agentsData || []).find(
          (a: any) => String(a.user_email || "").trim().toLowerCase() === emailKey
        ) || {};
      const agentLeads = (leadsData || []).filter((l: any) => l.assign_to === u.email);
      const convertedCount = agentLeads.filter((l: any) => l.onboarding_stage === "CONVERTED").length;

      return {
        id: agentMeta.id,
        email: u.email,
        full_name: u.full_name || "New Agent",
        phone: u.phone || "No Phone",
        created_at: u.created_at,
        agent_exists: !!agentMeta.user_email,
        status: agentMeta.status || "active",
        commission_rate: agentMeta.commission_rate !== undefined ? agentMeta.commission_rate : 10,
        territory: agentMeta.territory || "",
        total_leads: agentLeads.length,
        converted_leads: convertedCount,
        conversion_rate: agentLeads.length > 0 ? Math.round((convertedCount / agentLeads.length) * 100) : 0,
      };
    });

    setAgents(flattened);
    if (flattened.length > 0 && !newTerritoryEmail) {
      setNewTerritoryEmail(flattened[0].email);
    }
  };

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const result = await withTimeout(
        fetchAdminAgentsPage(),
        20000,
        "Loading timed out. Check Vercel env (SUPABASE_SERVICE_ROLE_KEY) and refresh."
      );

      if (result.success === false) {
        throw new Error(result.error);
      }

      mapAgentsFromPageData(
        result.users || [],
        result.agents || [],
        result.leads || [],
        result.userRoles || []
      );
      setAgentTerritories(result.agentTerritories || []);
      setTerritoryCatalog(result.territoryCatalog || []);
      setLedger(result.ledger || []);
      setActivityLogs(result.activityLogs || []);
      setPendingPayouts(result.totalPendingPayouts || 0);
    } catch (error: any) {
      toast.error("Failed to load agents: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialSyncDone && newTerritoryEmail && agentTerritories.length > 0 && agents.length > 0) {
      const agent = agents.find(a => a.email === newTerritoryEmail);
      if (agent) {
        const assignedIds = agentTerritories
          .filter((t) => t.agent_id === agent.id || t.agents?.user_email === newTerritoryEmail)
          .map((t) => t.territory_id);
        setTimeout(() => {
          setNewTerritoryIds(assignedIds);
          setInitialSyncDone(true);
        }, 0);
      }
    }
  }, [newTerritoryEmail, agentTerritories, agents, initialSyncDone]);

  useEffect(() => {
    void Promise.resolve().then(() => fetchInitialData());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpenEditModal = (agent: any) => {
    setSelectedAgent(agent);
    setEditCommission(String(agent.commission_rate));
    setEditStatus(agent.status);
    
    // Find assigned territories for this agent
    const assignedIds = agentTerritories
      .filter((t: any) => t.agents?.user_email === agent.email)
      .map((t: any) => t.territory_id);
    setEditTerritoryIds(assignedIds);
    
    setModalProvinceIds([]);
    setModalDistrictIds([]);
    setModalCityIds([]);
    setIsEditModalOpen(true);
  };

  const logAgentActivity = async (agentEmail: string, action: string, notes: string) => {
    try {
      await insertAgentActivityLog({ agent_email: agentEmail, action, notes });
      fetchInitialData();
    } catch (err) {
      console.error("Failed to insert agent audit log", err);
    }
  };

  const handleSaveAgent = async () => {
    if (!selectedAgent) return;
    try {
      setUpdating(true);
      const parsedRate = parseFloat(editCommission) || 0;

      const targetIds = getDeepestSelectedTerritories(
        territoryCatalog,
        modalProvinceIds,
        modalDistrictIds,
        modalCityIds
      );
      const finalIds = Array.from(new Set([...editTerritoryIds, ...targetIds]));

      // Create a comma-separated string of territory names for the legacy string column
      const assignedNames = territoryCatalog
        .filter((t) => finalIds.includes(t.id))
        .map((t) => t.name)
        .join(", ");

      const result = await saveAdminAgentProfile({
        user_email: selectedAgent.email,
        status: editStatus,
        commission_rate: parsedRate,
        territory: assignedNames,
        territory_id: finalIds[0] ?? null,
        createIfMissing: !selectedAgent.agent_exists,
      });
      if (result.success === false) throw new Error(result.error);

      // Sync the exact territory IDs using the sync function
      const syncResult = await syncAgentTerritories(selectedAgent.email, finalIds);
      if (syncResult.success === false) throw new Error(syncResult.error);

      await logAgentActivity(
        selectedAgent.email,
        "CREDENTIALS_OVERRIDE",
        `Commission rate set to ${parsedRate}%, status set to ${editStatus.toUpperCase()}, and territories synced.`
      );

      toast.success(`Successfully updated ${selectedAgent.full_name}!`);
      setIsEditModalOpen(false);
      setSelectedAgent(null);
      fetchInitialData();
    } catch (error: any) {
      toast.error("Update failed: " + error.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteAgent = async (agent: any) => {
    if (!confirm(`Are you sure you want to demote ${agent.full_name}? They will lose agent privileges.`)) return;
    try {
      toast.loading("Demoting agent...", { id: "delete_agent" });

      const result = await demoteAdminAgent(agent.email);
      if (result.success === false) throw new Error(result.error);

      await logAgentActivity(
        agent.email,
        "AGENT_DEMOTED",
        "Agent credentials deleted and platform role demoted to customer."
      );

      toast.success(`Successfully deleted and demoted ${agent.full_name}!`, { id: "delete_agent" });
      fetchInitialData();
    } catch (error: any) {
      toast.error("Failed to delete agent: " + error.message, { id: "delete_agent" });
    }
  };

  const handleAssignTerritory = async () => {
    if (!newTerritoryEmail) {
      toast.error("Please select an agent.");
      return;
    }

    try {
      setUpdating(true);

      const agent = agents.find(a => a.email === newTerritoryEmail);

      const targetIds = getDeepestSelectedTerritories(
        territoryCatalog,
        selectedProvinceIds,
        selectedDistrictIds,
        selectedCityIds
      );
      const finalIds = Array.from(new Set([...newTerritoryIds, ...targetIds]));

      const assignedNames = territoryCatalog
        .filter((t) => finalIds.includes(t.id))
        .map((t) => t.name)
        .join(", ");

      // Always sync the legacy territory string column to mirror the exact hierarchical assignments
      const saveRes = await saveAdminAgentProfile({
        user_email: newTerritoryEmail,
        status: agent?.status && agent.status !== "inactive" ? agent.status : "active",
        commission_rate: agent?.commission_rate || 10,
        territory: assignedNames,
        territory_id: finalIds[0] ?? null,
        createIfMissing: true,
      });
      if (saveRes.success === false) throw new Error(saveRes.error);

      const syncResult = await syncAgentTerritories(newTerritoryEmail, finalIds);
      if (syncResult.success === false) throw new Error(syncResult.error);

      await logAgentActivity(
        newTerritoryEmail,
        "TERRITORIES_ASSIGNED",
        `Assigned territories: ${assignedNames}.`
      );

      toast.success(`Successfully assigned ${newTerritoryIds.length} territories!`);
      setNewTerritoryIds([]);
      setSelectedProvinceIds([]);
      setSelectedDistrictIds([]);
      setSelectedCityIds([]);
      await fetchInitialData();
    } catch (error: any) {
      toast.error("Territory assignment failed: " + error.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteTerritory = async (agentEmail: string, territoryId: string, territoryName: string) => {
    if (!confirm(`Are you sure you want to revoke the territory assignment for ${territoryName}?`)) return;
    try {
      const result = await removeAgentTerritory(agentEmail, territoryId);
      if (result.success === false) throw new Error(result.error);

      await logAgentActivity(
        agentEmail,
        "TERRITORY_REVOKED",
        `Revoked assigned territory: ${territoryName}.`
      );

      toast.success("Territory assignment revoked!");
      await refreshTerritoryAssignments();
    } catch (e: any) {
      toast.error("Failed to revoke territory: " + e.message);
    }
  };

  // Payout settlement handler
  const handleSettlementAction = async (id: string, email: string, amount: number, newStatus: string) => {
    try {
      const result = await updateCommissionLedgerStatus(id, newStatus, {
        approved_at: newStatus === "APPROVED" ? new Date().toISOString() : undefined,
        paid_at: newStatus === "PAID" ? new Date().toISOString() : undefined,
      });
      if (result.success === false) throw new Error(result.error);

      await logAgentActivity(
        email,
        `PAYOUT_${newStatus}`,
        `Payout transaction for LKR ${amount} has been ${newStatus.toLowerCase()}.`
      );

      toast.success(`Transaction status successfully updated to ${newStatus}!`);
      fetchInitialData();
    } catch (e: any) {
      toast.error("Settlement transaction failed: " + e.message);
    }
  };

  // Filter agents based on search query
  const filteredAgents = agents.filter(a => 
    a.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.phone.includes(searchTerm)
  );

  // Stats Counters
  const activeCount = agents.filter(a => a.status === 'active').length;
  const totalLeadsGenerated = agents.reduce((sum, a) => sum + (a.total_leads || 0), 0);
  const totalConvertedSalons = agents.reduce((sum, a) => sum + (a.converted_leads || 0), 0);
  const averageConversionRate = agents.length > 0 
    ? Math.round(agents.reduce((sum, a) => sum + (a.conversion_rate || 0), 0) / agents.length)
    : 0;

  // Ledger stats
  const approvedPayouts = ledger.filter(l => l.status === 'APPROVED').reduce((sum, l) => sum + parseFloat(l.amount || 0), 0);
  const paidPayouts = ledger.filter(l => l.status === 'PAID').reduce((sum, l) => sum + parseFloat(l.amount || 0), 0);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div className="space-y-6 lg:space-y-8 max-w-6xl mx-auto animate-in fade-in duration-500">
      


      {loading ? (
        <Card className="p-20 border-none shadow-sm rounded-3xl bg-white text-center border border-slate-100/50">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-brand mb-3" />
          <p className="font-extrabold text-zinc-800 text-sm">Loading Agent CRM Database Modules...</p>
          <p className="text-xs text-zinc-500 mt-1">Retrieving territories, ledger payouts, and activity logs.</p>
        </Card>
      ) : (
        <>
          {/* HEADER WITH TABS - Globally Visible */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-zinc-900 mb-1">CRM Agent Operating Intelligence</h1>
              <p className="text-zinc-500 font-semibold text-sm">Assign territories, calculate tiered commissions, and monitor agent performance funnels.</p>
            </div>
            
            {/* Workspace Tab Triggers */}
            <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/50">
              <button 
                onClick={() => setActiveTab('dashboard')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  activeTab === 'dashboard' ? 'bg-white shadow-sm text-brand' : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5 inline mr-1" /> Dashboard
              </button>
              <button 
                onClick={() => setActiveTab('directory')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  activeTab === 'directory' ? 'bg-white shadow-sm text-brand' : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                <Users className="w-3.5 h-3.5 inline mr-1" /> Directory
              </button>
              <button 
                onClick={() => setActiveTab('territories')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  activeTab === 'territories' ? 'bg-white shadow-sm text-brand' : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                <MapPin className="w-3.5 h-3.5 inline mr-1" /> Territories
              </button>
              <button 
                onClick={() => setActiveTab('ledger')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  activeTab === 'ledger' ? 'bg-white shadow-sm text-brand' : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                <Landmark className="w-3.5 h-3.5 inline mr-1" /> Ledger
              </button>
              <button 
                onClick={() => setActiveTab('logs')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  activeTab === 'logs' ? 'bg-white shadow-sm text-brand' : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                <History className="w-3.5 h-3.5 inline mr-1" /> Audit Trail
              </button>
            </div>
          </div>

          {/* KPI metrics cards - Globally Visible */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="p-4 border-none shadow-sm flex items-center gap-4 bg-white rounded-2xl border border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-0.5">Active Agents</p>
                <p className="text-xl font-black text-zinc-900">{activeCount}</p>
              </div>
            </Card>
            <Card className="p-4 border-none shadow-sm flex items-center gap-4 bg-white rounded-2xl border border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-brand/5 flex items-center justify-center text-brand">
                <ClipboardList className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-0.5">Leads Generated</p>
                <p className="text-xl font-black text-zinc-900">{totalLeadsGenerated}</p>
              </div>
            </Card>
            <Card className="p-4 border-none shadow-sm flex items-center gap-4 bg-white rounded-2xl border border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-0.5">Converted Salons</p>
                <p className="text-xl font-black text-zinc-900">{totalConvertedSalons}</p>
              </div>
            </Card>
            <Card className="p-4 border-none shadow-sm flex items-center gap-4 bg-white rounded-2xl border border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-0.5">Pending Payouts</p>
                <p className="text-xl font-black text-zinc-900">LKR {pendingPayouts.toLocaleString()}</p>
              </div>
            </Card>
          </div>

          {/* TAB 1: INTELLIGENCE DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 lg:space-y-8 animate-in fade-in duration-300">
              {/* Leaderboard and conversion funnels */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Agent Leaderboard */}
                <Card className="md:col-span-2 p-5 border border-slate-100 shadow-sm rounded-2xl bg-white flex flex-col">
                  <div className="mb-4">
                    <h3 className="font-extrabold text-zinc-900 text-sm tracking-tight flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-amber-500" /> Agent Conversion Leaderboard
                    </h3>
                    <p className="text-[11px] text-zinc-500">Ranked by overall successful salon conversions and closing velocity.</p>
                  </div>
                  
                  <div className="space-y-3.5 flex-1">
                    {agents.length === 0 ? (
                      <p className="text-xs text-zinc-700 py-10 text-center">No agent closing data logged.</p>
                    ) : (
                      agents
                        .sort((a, b) => b.converted_leads - a.converted_leads)
                        .slice(0, 5)
                        .map((agent, index) => {
                          const trophyColors = ["text-amber-500", "text-slate-400", "text-amber-700", "text-zinc-700", "text-zinc-700"];
                          return (
                            <div key={agent.email} className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                              <div className="flex items-center gap-3">
                                <div className="font-black text-sm text-zinc-500 w-5">#{index + 1}</div>
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 bg-indigo-50 text-indigo-600`}>
                                  {getInitials(agent.full_name)}
                                </div>
                                <div>
                                  <div className="font-extrabold text-zinc-800 text-xs tracking-tight">{agent.full_name}</div>
                                  <div className="text-[10px] text-zinc-500">{agent.email}</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-4 text-right">
                                <div>
                                  <span className="font-black text-zinc-900 text-xs">{agent.converted_leads} Conversions</span>
                                  <div className="text-[9px] font-bold text-zinc-500">{agent.conversion_rate}% Ratio</div>
                                </div>
                                <Award className={`w-5 h-5 shrink-0 ${trophyColors[index] || "text-zinc-800"}`} />
                              </div>
                            </div>
                          );
                        })
                    )}
                  </div>
                </Card>

                {/* Closing funnel analytics */}
                <Card className="p-5 border border-slate-100 shadow-sm rounded-2xl bg-white flex flex-col justify-between">
                  <div>
                    <h3 className="font-extrabold text-zinc-900 text-sm tracking-tight flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-emerald-500" /> Platform-Wide CRM Funnel
                    </h3>
                    <p className="text-[11px] text-zinc-500">Prospect acquisition rates across the sales pipeline.</p>
                  </div>
                  
                  <div className="space-y-4 py-4">
                    {/* Funnel Section A */}
                    <div>
                      <div className="flex justify-between text-[11px] font-bold text-zinc-500 mb-1">
                        <span>Raw Prospect Leads</span>
                        <span>{totalLeadsGenerated}</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div className="bg-indigo-600 h-full rounded-full" style={{ width: '100%' }}></div>
                      </div>
                    </div>

                    {/* Funnel Section B */}
                    <div>
                      <div className="flex justify-between text-[11px] font-bold text-zinc-500 mb-1">
                        <span>Converted / Claimed Salons</span>
                        <span>{totalConvertedSalons} ({averageConversionRate}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div className="bg-brand h-full rounded-full" style={{ width: `${averageConversionRate}%` }}></div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-indigo-50/50 rounded-xl text-center border border-indigo-100/50">
                    <p className="text-[10px] font-bold text-indigo-800">Conversion Credit attribution locks securely under first valid creator.</p>
                  </div>
                </Card>

              </div>
            </div>
          )}

          {/* TAB 2: AGENT DIRECTORY */}
          {activeTab === 'directory' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <Input 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search agents by name, telephone, or email..." 
                  className="w-full pl-12 h-14 bg-white border border-slate-200 shadow-sm rounded-2xl focus:ring-2 focus:ring-brand/20 transition-all font-semibold"
                />
              </div>

              {/* Directory Listing Grid */}
              <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden border border-slate-100">
                <div className="p-5 border-b border-zinc-50 flex items-center justify-between bg-slate-50/50">
                  <div>
                    <h3 className="font-extrabold text-zinc-900 text-base">Authorized Platform Discoverers</h3>
                    <p className="text-zinc-500 text-xs mt-0.5">Manage credentials, modify commission rates, and review performance dashboards.</p>
                  </div>
                </div>

                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-zinc-50 text-zinc-500 font-extrabold uppercase tracking-wider text-[9px] h-10 border-b border-zinc-100">
                        <th className="px-6 py-2">Discoverer Details</th>
                        <th className="px-6 py-2">Coverage Territories</th>
                        <th className="px-6 py-2 text-center">Prospect Leads</th>
                        <th className="px-6 py-2 text-center">Conversions</th>
                        <th className="px-6 py-2 text-center">Conversion Ratio</th>
                        <th className="px-6 py-2 text-center">Commission Tier</th>
                        <th className="px-6 py-2 text-center">Status</th>
                        <th className="px-6 py-2 text-center pr-6">Action Overrides</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50 font-medium text-zinc-700">
                      {filteredAgents.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center py-20 text-zinc-700">
                            No matching platform agents discovered.
                          </td>
                        </tr>
                      ) : (
                        filteredAgents.map((agent, i) => {
                          const matchingTerritories = agentTerritories.filter(
                            (t) => (agent.id && t.agent_id === agent.id) || t.agents?.user_email === agent.email
                          );
                          return (
                            <tr key={agent.email} className="hover:bg-zinc-50/50 transition-colors h-14">
                              
                              {/* Details */}
                              <td className="px-6 py-2">
                                <div className="flex items-center gap-3">
                                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 bg-slate-100 text-zinc-700`}>
                                    {getInitials(agent.full_name)}
                                  </div>
                                  <div>
                                    <div className="font-extrabold text-zinc-900 text-sm tracking-tight">{agent.full_name}</div>
                                    <div className="text-[10px] text-zinc-500">{agent.email}</div>
                                  </div>
                                </div>
                              </td>

                              {/* Coverage */}
                              <td className="px-6 py-2">
                                <div className="flex flex-wrap gap-1 max-w-[200px]">
                                  {agent.territory && (
                                    <Badge
                                      variant="secondary"
                                      className="px-1.5 py-0 border-none bg-[#F5B700]/20 text-[#F5B700] font-bold text-[9px] mr-1"
                                    >
                                      {agent.territory}
                                    </Badge>
                                  )}
                                  {matchingTerritories.map((t) => (
                                    <Badge
                                      key={`${t.agent_id}-${t.territory_id}`}
                                      variant="secondary"
                                      className="px-1.5 py-0 border-none bg-slate-100 text-zinc-600 font-semibold text-[9px]"
                                    >
                                      {t.territories?.name || t.territory_id}
                                    </Badge>
                                  ))}
                                  {!agent.territory && matchingTerritories.length === 0 && (
                                    <span className="text-[10px] text-zinc-500 italic">No assigned zones</span>
                                  )}
                                </div>
                              </td>

                              {/* Leads Generated */}
                              <td className="px-6 py-2 text-center font-extrabold text-zinc-800 text-sm">
                                {agent.total_leads}
                              </td>

                              {/* Conversions */}
                              <td className="px-6 py-2 text-center font-extrabold text-brand text-sm">
                                {agent.converted_leads}
                              </td>

                              {/* Ratio */}
                              <td className="px-6 py-2 text-center">
                                <span className="font-bold text-zinc-900">{agent.conversion_rate}%</span>
                                <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden mx-auto mt-1">
                                  <div className="bg-brand h-full rounded-full" style={{ width: `${agent.conversion_rate}%` }}></div>
                                </div>
                              </td>

                              {/* Commission Tier */}
                              <td className="px-6 py-2 text-center font-black text-zinc-900 text-sm">
                                {agent.commission_rate}%
                              </td>

                              {/* Status */}
                              <td className="px-6 py-2 text-center">
                                <Badge className={`shadow-none font-bold uppercase text-[9px] px-2.5 py-0.5 border-none ${
                                  agent.status === "active" ? "bg-emerald-50 text-emerald-600" : "bg-zinc-100 text-zinc-500"
                                }`}>
                                  {agent.status}
                                </Badge>
                              </td>

                              {/* Overrides */}
                              <td className="px-6 py-2 pr-6 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <Button 
                                    onClick={() => handleOpenEditModal(agent)}
                                    variant="ghost" 
                                    size="icon" 
                                    className="w-7 h-7 rounded-lg text-zinc-500 hover:text-indigo-600 hover:bg-indigo-50"
                                    title="Edit Credentials"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button 
                                    onClick={() => handleDeleteAgent(agent)}
                                    variant="ghost" 
                                    size="icon" 
                                    className="w-7 h-7 rounded-lg text-zinc-700 hover:text-rose-600 hover:bg-rose-50"
                                    title="Demote User"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </td>

                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* TAB 3: TERRITORY CONTROLS */}
          {activeTab === 'territories' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-300">
              
              {/* Territory Assignment Creator */}
              <Card className="p-5 border border-slate-100 shadow-sm rounded-2xl bg-white h-fit">
                <div className="pb-4 border-b border-slate-50 mb-4">
                  <h3 className="font-extrabold text-zinc-900 text-sm tracking-tight flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-brand" /> Map Coverage Allocation
                  </h3>
                  <p className="text-[11px] text-zinc-500">Assign territories from the platform catalog to sales agents.</p>
                </div>

                <div className="space-y-4 text-xs font-semibold text-zinc-500">
                  {/* Select Agent */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Select Sales Agent</label>
                    <select
                      value={newTerritoryEmail}
                      onChange={(e) => {
                        const email = e.target.value;
                        setNewTerritoryEmail(email);
                        const agent = agents.find(a => a.email === email);
                        if (agent) {
                          const assignedIds = agentTerritories
                            .filter((t) => t.agent_id === agent.id || t.agents?.user_email === email)
                            .map((t) => t.territory_id);
                          setNewTerritoryIds(assignedIds);
                          setSelectedProvinceIds([]);
                          setSelectedDistrictIds([]);
                          setSelectedCityIds([]);
                        }
                      }}
                      className="w-full h-10 px-3 border border-slate-200 focus:outline-none rounded-xl text-xs font-bold bg-white text-zinc-700 focus:ring-2 focus:ring-brand/20"
                    >
                      {agents.map(a => (
                        <option key={a.email} value={a.email}>{a.full_name} ({a.email})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Select Territories</label>
                    
                    {/* Cascading Dropdowns */}
                    <div className="grid grid-cols-1 gap-2">
                      <MultiSelect
                        label="-- Select Provinces --"
                        options={territoryCatalog.filter(t => t.type === "province")}
                        selectedIds={selectedProvinceIds}
                        onChange={(ids) => {
                          setSelectedProvinceIds(ids);
                          setSelectedDistrictIds([]);
                          setSelectedCityIds([]);
                        }}
                      />

                      <MultiSelect
                        label="-- Select Districts --"
                        options={territoryCatalog.filter(t => t.type === "district" && t.parent_id && selectedProvinceIds.includes(t.parent_id))}
                        selectedIds={selectedDistrictIds}
                        onChange={(ids) => {
                          setSelectedDistrictIds(ids);
                          setSelectedCityIds([]);
                        }}
                        disabled={selectedProvinceIds.length === 0}
                      />

                      <MultiSelect
                        label="-- Select Cities --"
                        options={territoryCatalog.filter(t => t.type === "city" && t.parent_id && selectedDistrictIds.includes(t.parent_id))}
                        selectedIds={selectedCityIds}
                        onChange={(ids) => setSelectedCityIds(ids)}
                        disabled={selectedDistrictIds.length === 0}
                      />
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const targetIds = getDeepestSelectedTerritories(
                          territoryCatalog,
                          selectedProvinceIds,
                          selectedDistrictIds,
                          selectedCityIds
                        );
                        const uniqueIds = Array.from(new Set([...newTerritoryIds, ...targetIds]));
                        setNewTerritoryIds(uniqueIds);
                        setSelectedProvinceIds([]);
                        setSelectedDistrictIds([]);
                        setSelectedCityIds([]);
                      }}
                      disabled={selectedProvinceIds.length === 0}
                      className="w-full text-xs font-bold h-9"
                    >
                      <Plus className="w-3 h-3 mr-1" /> Add to Selection
                    </Button>

                    {/* Staged Territories */}
                    {newTerritoryIds.length > 0 && (
                      <div className="w-full max-h-[120px] overflow-y-auto border border-slate-200 rounded-xl bg-white p-2 space-y-1 custom-scrollbar">
                        {newTerritoryIds.map((id) => {
                          const t = territoryCatalog.find(tc => tc.id === id);
                          if (!t) return null;
                          return (
                            <div key={id} className="flex items-center justify-between p-1.5 bg-slate-50 rounded-lg">
                              <span className="text-xs font-bold text-zinc-700">
                                {t.name} <span className="text-[10px] font-normal text-zinc-500">({t.type})</span>
                              </span>
                              <button
                                onClick={() => setNewTerritoryIds(newTerritoryIds.filter(tid => tid !== id))}
                                className="text-red-500 hover:text-red-700"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={handleAssignTerritory}
                    disabled={updating}
                    className="w-full bg-brand hover:bg-brand/90 text-zinc-900 h-11 rounded-xl font-bold gap-2 text-xs"
                  >
                    {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> Save Coverage Zone</>}
                  </Button>
                </div>
              </Card>

              {/* Active Territory Coverage mapping */}
              <Card className="md:col-span-2 p-5 border border-slate-100 shadow-sm rounded-2xl bg-white flex flex-col">
                <div className="pb-4 border-b border-slate-50 mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-zinc-900 text-sm tracking-tight">Active Map Territory Coverage</h3>
                    <p className="text-[11px] text-zinc-500">List of geographic zones currently allocated to discoverers.</p>
                  </div>
                  
                  {/* Conflict model alert callout */}
                  <Badge variant="secondary" className="px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border-none shrink-0 gap-1">
                    <MapPin className="w-3 h-3" /> Live territory catalog
                  </Badge>
                </div>

                <div className="overflow-x-auto w-full flex-1">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-zinc-50 text-zinc-500 font-bold uppercase text-[9px] h-9 border-b border-zinc-100">
                        <th className="px-4 py-1.5">Assigned Agent</th>
                        <th className="px-4 py-1.5">Territory</th>
                        <th className="px-4 py-1.5">Type</th>
                        <th className="px-4 py-1.5">Assigned</th>
                        <th className="px-4 py-1.5 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50 font-semibold text-zinc-600">
                      {agentTerritories.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-14 text-zinc-700 italic">
                            No boundaries assigned yet.
                          </td>
                        </tr>
                      ) : (
                        agentTerritories.map((t) => {
                          const agentEmail = t.agents?.user_email || "";
                          const ag = agents.find((a) => a.email === agentEmail);
                          const territoryName = t.territories?.name || t.territory_id;
                          return (
                            <tr key={`${t.agent_id}-${t.territory_id}`} className="hover:bg-slate-50/50 transition-colors h-11">
                              <td className="px-4 py-1.5">
                                <span className="font-bold text-zinc-900">{ag?.full_name || "Unknown Agent"}</span>
                                <div className="text-[10px] text-zinc-500 font-normal">{agentEmail}</div>
                              </td>
                              <td className="px-4 py-1.5 font-bold text-zinc-800">{territoryName}</td>
                              <td className="px-4 py-1.5 capitalize">{t.territories?.type || "—"}</td>
                              <td className="px-4 py-1.5">
                                {t.created_at ? new Date(t.created_at).toLocaleDateString() : "—"}
                              </td>
                              <td className="px-4 py-1.5 text-center">
                                <Button
                                  onClick={() => handleDeleteTerritory(agentEmail, t.territory_id, territoryName)}
                                  variant="ghost"
                                  size="icon"
                                  className="w-7 h-7 rounded-lg text-zinc-700 hover:text-rose-600 hover:bg-rose-50"
                                  title="Revoke Territory"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </Button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>

            </div>
          )}

          {/* TAB 4: COMMISSION LEDGER */}
          {activeTab === 'ledger' && (
            <div className="space-y-6 lg:space-y-8 animate-in fade-in duration-300">
              
              {/* Ledger Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4 border-none shadow-sm flex items-center gap-4 bg-white rounded-2xl border border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-0.5">Pending Approvals</p>
                    <p className="text-xl font-black text-zinc-900">LKR {pendingPayouts.toLocaleString()}</p>
                  </div>
                </Card>
                <Card className="p-4 border-none shadow-sm flex items-center gap-4 bg-white rounded-2xl border border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-0.5">Approved Balance</p>
                    <p className="text-xl font-black text-zinc-900">LKR {approvedPayouts.toLocaleString()}</p>
                  </div>
                </Card>
                <Card className="p-4 border-none shadow-sm flex items-center gap-4 bg-white rounded-2xl border border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <Landmark className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-0.5">Paid Commission</p>
                    <p className="text-xl font-black text-zinc-900">LKR {paidPayouts.toLocaleString()}</p>
                  </div>
                </Card>
              </div>

              {/* Payout table */}
              <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden border border-slate-100">
                <div className="p-5 border-b border-zinc-50 flex items-center justify-between bg-slate-50/50">
                  <div>
                    <h3 className="font-extrabold text-zinc-900 text-base">Commission Balance Sheet</h3>
                    <p className="text-zinc-500 text-xs mt-0.5">Approve, pay, or dispute calculated agent signup commissions and rewards.</p>
                  </div>
                </div>

                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-zinc-50 text-zinc-500 font-extrabold uppercase tracking-wider text-[9px] h-10 border-b border-zinc-100">
                        <th className="px-6 py-2">Salon Onboarded</th>
                        <th className="px-6 py-2">Earning Agent</th>
                        <th className="px-6 py-2">Payout Amount</th>
                        <th className="px-6 py-2 text-center">Status</th>
                        <th className="px-6 py-2">Ledger Notes</th>
                        <th className="px-6 py-2">Converted At</th>
                        <th className="px-6 py-2 text-center pr-6">Settlement Controls</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50 font-medium text-zinc-700">
                      {ledger.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-20 text-zinc-700 italic">
                            No ledger records or payouts calculated.
                          </td>
                        </tr>
                      ) : (
                        ledger.map(row => {
                          const ag = agents.find(a => a.email === row.agent_email);
                          return (
                            <tr key={row.id} className="hover:bg-zinc-50/50 transition-colors h-14">
                              
                              {/* Lead */}
                              <td className="px-6 py-2 font-extrabold text-zinc-900">
                                {row.lead?.name || "Unnamed Conversions"}
                              </td>

                              {/* Agent */}
                              <td className="px-6 py-2">
                                <span className="font-bold text-zinc-800">{ag?.full_name || "Unknown Agent"}</span>
                                <div className="text-[10px] text-zinc-500 font-normal">{row.agent_email}</div>
                              </td>

                              {/* Amount */}
                              <td className="px-6 py-2 font-black text-zinc-900 text-sm">
                                LKR {parseFloat(row.amount).toLocaleString()}
                              </td>

                              {/* Status */}
                              <td className="px-6 py-2 text-center">
                                <Badge className={`shadow-none font-bold uppercase text-[9px] px-2.5 py-0.5 border-none ${
                                  row.status === 'PAID' ? 'bg-indigo-50 text-indigo-600' :
                                  row.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600' :
                                  row.status === 'DISPUTED' ? 'bg-rose-50 text-rose-600' :
                                  'bg-amber-50 text-amber-600'
                                }`}>
                                  {row.status}
                                </Badge>
                              </td>

                              {/* Notes */}
                              <td className="px-6 py-2 text-zinc-500 font-normal max-w-[220px] truncate" title={row.notes}>
                                {row.notes || "No transaction details logged."}
                              </td>

                              {/* Timestamps */}
                              <td className="px-6 py-2 text-zinc-500 font-mono text-[10px]">
                                {new Date(row.created_at).toLocaleDateString()}
                              </td>

                              {/* Controls */}
                              <td className="px-6 py-2 pr-6 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  {row.status === 'PENDING' && (
                                    <>
                                      <Button 
                                        onClick={() => handleSettlementAction(row.id, row.agent_email, row.amount, 'APPROVED')}
                                        variant="outline" 
                                        className="h-7 rounded-lg text-emerald-600 border-emerald-100 hover:bg-emerald-50 font-bold px-2 text-[10px] gap-1"
                                      >
                                        <Check className="w-3.5 h-3.5" /> Approve
                                      </Button>
                                      <Button 
                                        onClick={() => handleSettlementAction(row.id, row.agent_email, row.amount, 'DISPUTED')}
                                        variant="outline" 
                                        className="h-7 rounded-lg text-rose-600 border-rose-100 hover:bg-rose-50 font-bold px-2 text-[10px] gap-1"
                                      >
                                        <X className="w-3.5 h-3.5" /> Dispute
                                      </Button>
                                    </>
                                  )}
                                  {row.status === 'APPROVED' && (
                                    <Button 
                                      onClick={() => handleSettlementAction(row.id, row.agent_email, row.amount, 'PAID')}
                                      variant="outline" 
                                      className="h-7 rounded-lg text-indigo-600 border-indigo-100 hover:bg-indigo-50 font-bold px-2.5 text-[10px] gap-1"
                                    >
                                      <Landmark className="w-3.5 h-3.5" /> Pay Agent
                                    </Button>
                                  )}
                                  {row.status === 'PAID' && (
                                    <span className="text-[10px] text-zinc-500 font-semibold italic">Settled Payout</span>
                                  )}
                                  {row.status === 'DISPUTED' && (
                                    <Button 
                                      onClick={() => handleSettlementAction(row.id, row.agent_email, row.amount, 'PENDING')}
                                      variant="outline" 
                                      className="h-7 rounded-lg text-zinc-600 border-zinc-200 hover:bg-zinc-50 font-bold px-2 text-[10px]"
                                    >
                                      Reset Review
                                    </Button>
                                  )}
                                </div>
                              </td>

                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>

            </div>
          )}

          {/* TAB 5: AUDIT LOGS */}
          {activeTab === 'logs' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <Card className="p-5 border border-slate-100 shadow-sm rounded-2xl bg-white">
                <div className="pb-4 border-b border-slate-50 mb-5">
                  <h3 className="font-extrabold text-zinc-900 text-sm tracking-tight flex items-center gap-1.5">
                    <History className="w-4 h-4 text-indigo-600" /> Immutable Agent Activity Logs
                  </h3>
                  <p className="text-[11px] text-zinc-500">Chronological history of overrides, commission resets, and territory assignments.</p>
                </div>

                <div className="relative border-l border-zinc-100 pl-6 ml-4 space-y-6">
                  {activityLogs.length === 0 ? (
                    <p className="text-xs text-zinc-700 italic">No agent log files written yet.</p>
                  ) : (
                    activityLogs.map(log => (
                      <div key={log.id} className="relative">
                        {/* Dot indicator */}
                        <div className="absolute -left-[30px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-600 border-2 border-white shadow-sm shrink-0"></div>
                        
                        <div>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                            <span className="text-xs font-bold text-zinc-800 uppercase tracking-wider bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded border-none w-fit text-[9px]">
                              {log.action}
                            </span>
                            <span className="text-[10px] text-zinc-500 font-mono">
                              {new Date(log.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-600 font-semibold mt-1.5">{log.notes}</p>
                          <div className="flex items-center gap-1.5 text-[9px] font-bold text-zinc-500 uppercase tracking-wider mt-1">
                            <span>Actor: {log.actor_email}</span>
                            <span>•</span>
                            <span>Target Agent: {log.agent_email}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>
          )}
        </>
      )}

      {/* EDIT STATUS / COMMISSION RATE DIALOG MODAL */}
      {isEditModalOpen && selectedAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl relative border border-zinc-100 flex flex-col animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="pb-4 border-b border-zinc-100">
              <h3 className="text-lg font-black text-zinc-900 tracking-tight">Modify Agent Credentials</h3>
              <p className="text-xs text-zinc-500 mt-0.5">Updating agent credentials for <span className="font-semibold text-zinc-700">{selectedAgent.full_name}</span></p>
            </div>

            {/* Inputs */}
            <div className="py-5 space-y-4 text-xs font-semibold text-zinc-500">
              {/* Commission Rate */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Sales Commission Rate (%)</label>
                <div className="relative">
                  <Input 
                    type="number"
                    min="0"
                    max="100"
                    value={editCommission}
                    onChange={(e) => setEditCommission(e.target.value)}
                    className="h-10 text-zinc-700 font-extrabold focus:ring-2 focus:ring-brand/20 rounded-xl"
                  />
                  <Percent className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-700" />
                </div>
              </div>

              {/* Status */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Agent Authorization Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full h-10 px-3 border border-slate-200 focus:outline-none rounded-xl text-xs font-bold bg-white text-zinc-700 focus:ring-2 focus:ring-[#F5B700]/20"
                >
                  <option value="active">Active (Authorized to Prospect)</option>
                  <option value="inactive">Inactive (Suspended)</option>
                </select>
              </div>

              {/* Cascading Territory Assignment */}
              <div className="space-y-3">
                <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Primary Territory Assignment</label>
                
                <div className="grid grid-cols-1 gap-2">
                  <MultiSelect
                    label="-- Select Provinces --"
                    options={territoryCatalog.filter(t => t.type === "province")}
                    selectedIds={modalProvinceIds}
                    onChange={(ids) => {
                      setModalProvinceIds(ids);
                      setModalDistrictIds([]);
                      setModalCityIds([]);
                    }}
                  />

                  <MultiSelect
                    label="-- Select Districts --"
                    options={territoryCatalog.filter(t => t.type === "district" && t.parent_id && modalProvinceIds.includes(t.parent_id))}
                    selectedIds={modalDistrictIds}
                    onChange={(ids) => {
                      setModalDistrictIds(ids);
                      setModalCityIds([]);
                    }}
                    disabled={modalProvinceIds.length === 0}
                  />

                  <MultiSelect
                    label="-- Select Cities --"
                    options={territoryCatalog.filter(t => t.type === "city" && t.parent_id && modalDistrictIds.includes(t.parent_id))}
                    selectedIds={modalCityIds}
                    onChange={(ids) => setModalCityIds(ids)}
                    disabled={modalDistrictIds.length === 0}
                  />
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const targetIds = getDeepestSelectedTerritories(
                      territoryCatalog,
                      modalProvinceIds,
                      modalDistrictIds,
                      modalCityIds
                    );
                    const uniqueIds = Array.from(new Set([...editTerritoryIds, ...targetIds]));
                    setEditTerritoryIds(uniqueIds);
                    setModalProvinceIds([]);
                    setModalDistrictIds([]);
                    setModalCityIds([]);
                  }}
                  disabled={modalProvinceIds.length === 0}
                  className="w-full text-xs font-bold h-10 rounded-xl"
                >
                  <Plus className="w-3 h-3 mr-1" /> Add Territories
                </Button>

                {/* Staged Territories */}
                {editTerritoryIds.length > 0 && (
                  <div className="w-full max-h-[120px] overflow-y-auto border border-slate-200 rounded-xl bg-slate-50 p-2 space-y-1 custom-scrollbar">
                    {editTerritoryIds.map((id) => {
                      const t = territoryCatalog.find(tc => tc.id === id);
                      if (!t) return null;
                      return (
                        <div key={id} className="flex items-center justify-between p-1.5 bg-white border border-slate-100 shadow-sm rounded-lg">
                          <span className="text-xs font-bold text-zinc-700">
                            {t.name} <span className="text-[10px] font-normal text-zinc-500">({t.type})</span>
                          </span>
                          <button
                            onClick={() => setEditTerritoryIds(editTerritoryIds.filter(tid => tid !== id))}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-zinc-100 flex items-center justify-end gap-2">
              <Button 
                onClick={() => { setIsEditModalOpen(false); setSelectedAgent(null); }}
                variant="outline" 
                className="h-10 rounded-xl border-slate-200 font-bold"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveAgent}
                disabled={updating}
                className="bg-brand hover:bg-brand/90 text-zinc-900 h-10 rounded-xl font-bold px-4"
              >
                {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
              </Button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
