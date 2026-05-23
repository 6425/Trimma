"use client";

import React, { useState, useEffect } from "react";
import { Search, Phone, MapPin, Loader2, Target, Globe, Star, X, CheckCircle2, Mail, ClipboardList, Send, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { supabase } from "@/config/supabase";
import { toast } from "sonner";
import { sendOnboardingInviteAlert, sendAgentApprovalAlerts } from "../../actions/whatsapp";


const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

function WorkingHoursEditor({ value, onChange }: { value: string, onChange: (val: string) => void }) {
  const [periods, setPeriods] = useState<any[]>([]);

  useEffect(() => {
    try {
      const parsed = JSON.parse(value || "[]");
      if (Array.isArray(parsed)) {
        setPeriods(parsed);
      } else {
        setPeriods([]);
      }
    } catch {
      setPeriods([]);
    }
  }, [value]);

  const handleUpdate = (day: number, openTime: string, closeTime: string, isClosed: boolean) => {
    let newPeriods = periods.filter(p => p.open?.day !== day);
    
    if (!isClosed) {
      newPeriods.push({
        open: { day, time: openTime },
        close: { day, time: closeTime }
      });
    }
    
    newPeriods.sort((a, b) => (a.open?.day || 0) - (b.open?.day || 0));
    onChange(JSON.stringify(newPeriods));
  };

  return (
    <div className="space-y-3">
      {DAYS_OF_WEEK.map(d => {
        const period = periods.find(p => p.open?.day === d.value);
        const isOpen = !!period;
        const openTime = period?.open?.time || "0900";
        const closeTime = period?.close?.time || "2000";

        const formatTimeForInput = (t: string) => {
          if (!t || t.length !== 4) return "09:00";
          return `${t.slice(0, 2)}:${t.slice(2)}`;
        };

        const parseTimeFromInput = (t: string) => {
          return t.replace(":", "");
        };

        return (
          <div key={d.value} className="flex flex-col sm:flex-row sm:items-center gap-3 bg-zinc-50 p-3 rounded-xl border border-zinc-100">
            <div className="w-24 font-bold text-xs text-zinc-700">{d.label}</div>
            
            <button 
              type="button"
              onClick={() => handleUpdate(d.value, openTime, closeTime, isOpen)}
              className={`text-[10px] font-extrabold px-4 py-1.5 rounded-full border transition-all ${isOpen ? 'bg-emerald-100/50 text-emerald-700 border-emerald-200' : 'bg-white text-zinc-400 border-zinc-200 hover:bg-zinc-100'}`}
            >
              {isOpen ? 'OPEN' : 'CLOSED'}
            </button>
            
            {isOpen && (
              <div className="flex items-center gap-2">
                <input 
                  type="time" 
                  value={formatTimeForInput(openTime)}
                  onChange={(e) => handleUpdate(d.value, parseTimeFromInput(e.target.value), closeTime, false)}
                  className="text-xs font-semibold bg-white border border-zinc-200 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-brand/20 outline-none text-zinc-700"
                />
                <span className="text-zinc-400 text-xs font-medium">to</span>
                <input 
                  type="time" 
                  value={formatTimeForInput(closeTime)}
                  onChange={(e) => handleUpdate(d.value, openTime, parseTimeFromInput(e.target.value), false)}
                  className="text-xs font-semibold bg-white border border-zinc-200 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-brand/20 outline-none text-zinc-700"
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function AgentLeads() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [agentEmail, setAgentEmail] = useState("");
  const [agentName, setAgentName] = useState("");
  const [activeTab, setActiveTab] = useState<'assigned' | 'field_verified' | 'completed'>('assigned');

  const [formData, setFormData] = useState<any>({
    id: "",
    place_id: "",
    name: "",
    address: "",
    rating: "",
    phone: "",
    website: "",
    map_url: "",
    category: "",
    working_hours: "",
    latitude: "",
    longitude: "",
    price_level: "",
    summary: "",
    hero_url: "",
    onboarding_status: "ASSIGNED_TO_AGENT",
    activation_status: "INACTIVE",
    owner_gmail: "",
    agent_notes: "",
    admin_notes: ""
  });

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      
      const email = user?.email || "";
      setAgentEmail(email);
      setAgentName(user?.user_metadata?.full_name || email.split("@")[0]);

      if (!email) {
        toast.error("No active session found. Please log in.");
        return;
      }

      const { data, error } = await supabase
        .from("salons")
        .select(`*`)
        .eq("assign_to", email)
        .not("onboarding_status", "in", '("VERIFIED","REJECTED")')
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      setLeads(data || []);
    } catch (error: any) {
      toast.error("Failed to load your assigned salons: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const logActivity = async (salonId: string, action: string, notes: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const currentEmail = user?.email || agentEmail;
      
      await supabase
        .from("onboarding_logs")
        .insert({
          salon_id: salonId,
          actor_email: currentEmail,
          action: action,
          notes: notes
        });
    } catch (err) {
      console.error("Activity logging failed:", err);
    }
  };

  const handleOpenModal = (lead: any) => {
    setSelectedLead(lead);
    setFormData({
      id: lead.id || "",
      place_id: lead.place_id || "",
      name: lead.name || "",
      address: lead.address || "",
      rating: lead.rating !== null && lead.rating !== undefined ? String(lead.rating) : "",
      phone: lead.phone || "",
      website: lead.website || "",
      map_url: lead.map_url || "",
      category: lead.category || "",
      working_hours: lead.working_hours ? JSON.stringify(lead.working_hours, null, 2) : "[]",
      latitude: lead.latitude !== null && lead.latitude !== undefined ? String(lead.latitude) : "",
      longitude: lead.longitude !== null && lead.longitude !== undefined ? String(lead.longitude) : "",
      price_level: lead.price_level || "",
      summary: lead.summary || "",
      hero_url: lead.hero_url || "",
      onboarding_status: lead.onboarding_status || "ASSIGNED_TO_AGENT",
      activation_status: lead.activation_status || "INACTIVE",
      owner_gmail: lead.owner_gmail || "",
      agent_notes: lead.agent_notes || "",
      admin_notes: lead.admin_notes || ""
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!selectedLead) return;
    try {
      setUpdating(true);
      
      let parsedHours: any = [];
      try {
        parsedHours = JSON.parse(formData.working_hours || "[]");
      } catch (e) {
        parsedHours = formData.working_hours;
      }

      const updatePayload: any = {
        name: formData.name || selectedLead.name,
        address: formData.address || null,
        phone: formData.phone || null,
        website: formData.website || null,
        map_url: formData.map_url || null,
        category: formData.category || null,
        working_hours: parsedHours,
        latitude: formData.latitude === "" ? null : parseFloat(formData.latitude),
        longitude: formData.longitude === "" ? null : parseFloat(formData.longitude),
        price_level: formData.price_level || null,
        summary: formData.summary || null,
        hero_url: formData.hero_url || null,
        owner_gmail: formData.owner_gmail || null,
        agent_notes: formData.agent_notes || null
      };

      const { error } = await supabase
        .from("salons")
        .update(updatePayload)
        .eq("id", selectedLead.id);

      if (error) throw error;

      await logActivity(selectedLead.id, "LEAD_UPDATED", "Agent updated salon details in field editor.");
      toast.success("Changes saved!");

      setIsModalOpen(false);
      setSelectedLead(null);
      fetchLeads();
    } catch (error: any) {
      toast.error("Failed to save: " + error.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleCompleteVerification = async () => {
    if (!selectedLead) return;
    if (!formData.owner_gmail || !formData.phone) {
      toast.error("Owner Gmail and Phone number are required to send an invite!");
      return;
    }
    
    try {
      setUpdating(true);
      
      let parsedHours: any = [];
      try {
        parsedHours = JSON.parse(formData.working_hours || "[]");
      } catch (e) {
        parsedHours = formData.working_hours;
      }

      const updatePayload: any = {
        name: formData.name || selectedLead.name,
        address: formData.address || null,
        phone: formData.phone || null,
        website: formData.website || null,
        map_url: formData.map_url || null,
        category: formData.category || null,
        working_hours: parsedHours,
        latitude: formData.latitude === "" ? null : parseFloat(formData.latitude),
        longitude: formData.longitude === "" ? null : parseFloat(formData.longitude),
        price_level: formData.price_level || null,
        summary: formData.summary || null,
        hero_url: formData.hero_url || null,
        owner_gmail: formData.owner_gmail || null,
        agent_notes: formData.agent_notes || null,
        onboarding_status: "AGENT_VERIFIED"
      };

      const { error } = await supabase
        .from("salons")
        .update(updatePayload)
        .eq("id", selectedLead.id);

      if (error) throw error;
      
      await logActivity(selectedLead.id, "AGENT_VERIFIED", "Agent completed field verification and added phone/email.");

      const res = await fetch("/api/invite-owner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ salonId: selectedLead.id, ownerEmail: formData.owner_gmail })
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to send email invite");
      }

      // Dispatch WhatsApp message
      if (formData.phone && formData.owner_gmail) {
        const waRes = await sendOnboardingInviteAlert(
          selectedLead.id, 
          formData.phone, 
          formData.owner_gmail, 
          formData.name || selectedLead.name
        );
        if (!waRes.success) {
          console.warn("WhatsApp notification failed:", waRes.error);
        }
      }
      
      toast.success("Verification complete! Invites sent to owner.");
      setIsModalOpen(false);
      setSelectedLead(null);
      fetchLeads();
    } catch (error: any) {
      toast.error("Error: " + error.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleAgentApproval = async () => {
    if (!selectedLead) return;
    try {
      setUpdating(true);
      
      const updatePayload: any = {
        onboarding_status: "AGENT_APPROVED",
        booking_enabled: true
      };

      const { error } = await supabase
        .from("salons")
        .update(updatePayload)
        .eq("id", selectedLead.id);

      if (error) throw error;
      
      await logActivity(selectedLead.id, "AGENT_APPROVED", "Agent approved the salon and enabled bookings.");

      if (formData.phone) {
        const waRes = await sendAgentApprovalAlerts(
          selectedLead.id,
          formData.phone,
          formData.name || selectedLead.name
        );
        if (!waRes.success) {
          console.warn("WhatsApp agent approval alert failed:", waRes.error);
        }
      }
      
      toast.success("Salon approved and is now live!");
      setIsModalOpen(false);
      setSelectedLead(null);
      fetchLeads();
    } catch (error: any) {
      toast.error("Error: " + error.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    if (!confirm("Are you sure you want to remove this salon from your list?")) return;
    try {
      const { error } = await supabase
        .from("salons")
        .update({ assign_to: null, onboarding_status: "DISCOVERED" })
        .eq("id", leadId);

      if (error) throw error;
      toast.success("Salon unassigned from your list.");
      setLeads(prev => prev.filter(l => l.id !== leadId));
    } catch (error: any) {
      toast.error("Failed: " + error.message);
    }
  };

  const tabLeads = leads.filter(l => {
    const status = l.onboarding_status || "ASSIGNED_TO_AGENT";
    if (activeTab === "assigned") return status === "ASSIGNED_TO_AGENT";
    if (activeTab === "field_verified") return status === "AGENT_VERIFIED";
    if (activeTab === "completed") return ["OWNER_INVITED", "OWNER_ACTIVATED", "AGENT_APPROVED", "VERIFIED"].includes(status);
    return true;
  });

  const filteredLeads = tabLeads.filter(l =>
    (l.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (l.phone && l.phone.includes(searchTerm)) ||
    (l.category && l.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (l.address && l.address.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      ASSIGNED_TO_AGENT: "bg-blue-100 text-blue-700",
      AGENT_VERIFIED: "bg-indigo-100 text-indigo-700",
      OWNER_INVITED: "bg-emerald-100 text-emerald-700",
      OWNER_ACTIVATED: "bg-amber-100 text-amber-700",
      AGENT_APPROVED: "bg-indigo-100 text-indigo-700",
      VERIFIED: "bg-green-100 text-green-700"
    };
    return map[status] || "bg-zinc-100 text-zinc-600";
  };

  const completionScore = (lead: any) => {
    let score = 0;
    if (lead.owner_gmail) score += 20;
    if (lead.phone) score += 15;
    if (lead.address) score += 15;
    if (lead.category) score += 10;
    if (lead.hero_url) score += 15;
    if (lead.summary) score += 10;
    if (lead.working_hours && JSON.stringify(lead.working_hours) !== '[]') score += 15;
    return score;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#1A1C29] tracking-tight">Field Verification Editor</h1>
          <p className="text-zinc-500 text-sm mt-1">Your assigned draft salons. Visit, verify, set up Gmail for owner, and submit for Admin approval.</p>
        </div>
      </div>

      {/* KPI Cards & Search */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 border-none shadow-sm flex items-center gap-4 bg-white rounded-2xl">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">My Salons</p>
            <p className="text-xl font-black text-[#1A1C29]">{leads.length}</p>
          </div>
        </Card>
        <Card className="p-4 border-none shadow-sm flex items-center gap-4 bg-white rounded-2xl">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Verified</p>
            <p className="text-xl font-black text-[#1A1C29]">{leads.filter(l => ["AGENT_VERIFIED","OWNER_INVITED","OWNER_ACTIVATED","AGENT_APPROVED","VERIFIED"].includes(l.onboarding_status)).length}</p>
          </div>
        </Card>
        <Card className="p-4 border-none shadow-sm flex items-center gap-4 bg-white rounded-2xl">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Owner Invited</p>
            <p className="text-xl font-black text-[#1A1C29]">{leads.filter(l => ["OWNER_INVITED","OWNER_ACTIVATED","AGENT_APPROVED","VERIFIED"].includes(l.onboarding_status)).length}</p>
          </div>
        </Card>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search salons..."
            className="w-full h-full min-h-[72px] pl-12 pr-4 bg-white border-none shadow-sm rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand/20 font-medium text-sm"
          />
        </div>
      </div>

      {/* Tabs */}
      <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
        <div className="p-5 border-b border-zinc-50 flex items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-[#1A1C29] text-base">My Assigned Salons</h3>
            <p className="text-zinc-400 text-xs mt-0.5">Click a salon name to open the Field Editor. Double-click cells to edit inline.</p>
          </div>
          <div className="flex items-center gap-1.5 bg-zinc-100/80 p-1.5 rounded-2xl shrink-0">
            <button
              onClick={() => setActiveTab("assigned")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                activeTab === "assigned" ? "bg-white text-brand shadow-sm" : "text-zinc-500 hover:text-zinc-950"
              }`}
            >
              Assigned ({leads.filter(l => l.onboarding_status === "ASSIGNED_TO_AGENT").length})
            </button>
            <button
              onClick={() => setActiveTab("field_verified")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                activeTab === "field_verified" ? "bg-white text-brand shadow-sm" : "text-zinc-500 hover:text-zinc-950"
              }`}
            >
              Verified ({leads.filter(l => l.onboarding_status === "AGENT_VERIFIED").length})
            </button>
            <button
              onClick={() => setActiveTab("completed")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                activeTab === "completed" ? "bg-white text-brand shadow-sm" : "text-zinc-500 hover:text-zinc-950"
              }`}
            >
              Invited/Activated ({leads.filter(l => ["OWNER_INVITED","OWNER_ACTIVATED","AGENT_APPROVED","VERIFIED"].includes(l.onboarding_status)).length})
            </button>
          </div>
        </div>

        {/* Salon Cards Grid */}
        <div className="p-5">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-zinc-400">
              <Loader2 className="w-6 h-6 animate-spin mr-3" />
              <span className="text-sm font-medium">Loading your assigned salons...</span>
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="text-center py-20 text-zinc-300">
              <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No salons in this category yet.</p>
              <p className="text-xs mt-1">Salons assigned by the Admin will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredLeads.map((lead) => {
                const score = completionScore(lead);
                return (
                  <div
                    key={lead.id}
                    className="bg-zinc-50 rounded-2xl p-4 border border-zinc-100 hover:border-brand/20 hover:shadow-md transition-all cursor-pointer group"
                    onClick={() => handleOpenModal(lead)}
                  >
                    {/* Hero Image */}
                    {lead.hero_url ? (
                      <div className="w-full h-32 rounded-xl overflow-hidden mb-3 bg-zinc-200">
                        <img src={lead.hero_url} alt={lead.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      </div>
                    ) : (
                      <div className="w-full h-32 rounded-xl mb-3 bg-gradient-to-br from-zinc-100 to-zinc-200 flex items-center justify-center">
                        <Building2 className="w-10 h-10 text-zinc-300" />
                      </div>
                    )}

                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-bold text-sm text-[#1A1C29] leading-tight">{lead.name}</h3>
                      <span className={`shrink-0 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${getStatusBadge(lead.onboarding_status)}`}>
                        {(lead.onboarding_status || "ASSIGNED_TO_AGENT").replace(/_/g, " ")}
                      </span>
                    </div>

                    {lead.category && (
                      <p className="text-xs text-zinc-400 font-medium mb-1">{lead.category}</p>
                    )}
                    {lead.address && (
                      <p className="text-xs text-zinc-400 flex items-center gap-1 mb-2 truncate">
                        <MapPin className="w-3 h-3 shrink-0" /> {lead.address}
                      </p>
                    )}

                    {/* Admin Notes callout */}
                    {lead.admin_notes && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-2 mb-2">
                        <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wide mb-0.5">Admin Notes</p>
                        <p className="text-xs text-amber-800">{lead.admin_notes}</p>
                      </div>
                    )}

                    {/* Completion Bar */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Completion</span>
                        <span className={`text-[10px] font-bold ${score >= 80 ? 'text-emerald-600' : score >= 50 ? 'text-amber-500' : 'text-rose-500'}`}>{score}%</span>
                      </div>
                      <div className="w-full bg-zinc-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${score >= 80 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-400' : 'bg-rose-400'}`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                    </div>

                    {/* Key data pills */}
                    <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                      {lead.phone && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white border border-zinc-200 text-[10px] text-zinc-500 font-medium">
                          <Phone className="w-2.5 h-2.5" /> {lead.phone}
                        </span>
                      )}
                      {lead.rating && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-100 text-[10px] text-amber-600 font-bold">
                          <Star className="w-2.5 h-2.5 fill-amber-400 stroke-amber-400" /> {lead.rating}
                        </span>
                      )}
                      {lead.owner_gmail && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-[10px] text-emerald-700 font-medium">
                          <Mail className="w-2.5 h-2.5" /> Gmail Set
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>

      {/* FIELD EDITOR MODAL */}
      {isModalOpen && selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-3xl w-full shadow-2xl relative border border-zinc-100 flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-black text-zinc-900 tracking-tight">Field Editor</h3>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${getStatusBadge(formData.onboarding_status)}`}>
                    {(formData.onboarding_status || "ASSIGNED_TO_AGENT").replace(/_/g, " ")}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 font-mono">ID: {formData.id}</p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => { setIsModalOpen(false); setSelectedLead(null); }}
                className="rounded-full w-8 h-8 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Admin Notes Banner */}
            {formData.admin_notes && (
              <div className="mt-4 bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-start gap-3">
                <ClipboardList className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wide">Admin Instructions</p>
                  <p className="text-xs text-amber-800 mt-0.5">{formData.admin_notes}</p>
                </div>
              </div>
            )}

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto py-5 space-y-6 pr-1 text-xs">

              {/* Section 1: Salon & Owner Details */}
              <div className="space-y-3">
                <h4 className="font-extrabold uppercase tracking-widest text-blue-600 text-[10px] border-b border-blue-100 pb-1 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" /> 1. Salon & Owner Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1 md:col-span-2">
                    <label className="font-bold text-zinc-500 uppercase text-[9px] tracking-wide">Salon Name</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="h-10 rounded-xl bg-zinc-50 border-zinc-200 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-zinc-500 uppercase text-[9px] tracking-wide">Category</label>
                    <Input
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="h-10 rounded-xl bg-zinc-50 border-zinc-200 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div className="space-y-1 md:col-span-3">
                    <label className="font-bold text-zinc-500 uppercase text-[9px] tracking-wide">Full Address</label>
                    <Input
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      className="h-10 rounded-xl bg-zinc-50 border-zinc-200 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-zinc-500 uppercase text-[9px] tracking-wide">Phone <span className="text-rose-500">*</span></label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="+94..."
                      className="h-10 rounded-xl bg-zinc-50 border-zinc-200 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="font-bold text-zinc-500 uppercase text-[9px] tracking-wide flex items-center gap-1.5">
                      <Mail className="w-3 h-3 text-emerald-600" /> Owner Gmail (Creates Invite)
                      <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      value={formData.owner_gmail}
                      onChange={(e) => setFormData({...formData, owner_gmail: e.target.value})}
                      placeholder="e.g. salonname.trimma@gmail.com"
                      className="h-10 rounded-xl bg-emerald-50 border-emerald-200 focus:ring-2 focus:ring-emerald-500/20 font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-zinc-500 uppercase text-[9px] tracking-wide">Website</label>
                    <Input
                      value={formData.website}
                      onChange={(e) => setFormData({...formData, website: e.target.value})}
                      className="h-10 rounded-xl bg-zinc-50 border-zinc-200 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-zinc-500 uppercase text-[9px] tracking-wide">Rating</label>
                    <Input
                      type="number" step="0.1" min="0" max="5"
                      value={formData.rating}
                      onChange={(e) => setFormData({...formData, rating: e.target.value})}
                      className="h-10 rounded-xl bg-zinc-50 border-zinc-200 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="font-bold text-zinc-500 uppercase text-[9px] tracking-wide">Hero Image URL</label>
                    <Input
                      value={formData.hero_url}
                      onChange={(e) => setFormData({...formData, hero_url: e.target.value})}
                      placeholder="https://..."
                      className="h-10 rounded-xl bg-zinc-50 border-zinc-200 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-zinc-500 uppercase text-[9px] tracking-wide">Price Level</label>
                    <Input
                      value={formData.price_level}
                      onChange={(e) => setFormData({...formData, price_level: e.target.value})}
                      placeholder="$, $$, $$$"
                      className="h-10 rounded-xl bg-zinc-50 border-zinc-200 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div className="space-y-1 md:col-span-3">
                    <label className="font-bold text-zinc-500 uppercase text-[9px] tracking-wide">Google Summary / Description</label>
                    <textarea
                      value={formData.summary}
                      onChange={(e) => setFormData({...formData, summary: e.target.value})}
                      placeholder="Google Places description or AI-generated summary..."
                      className="w-full min-h-[64px] p-3 rounded-xl bg-zinc-50 border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-xs font-medium leading-relaxed"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Field Agent Data */}
              <div className="space-y-3">
                <h4 className="font-extrabold uppercase tracking-widest text-emerald-600 text-[10px] border-b border-emerald-100 pb-1 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5" /> 2. Agent Field Data
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Owner Gmail moved to Section 1 for better visibility */}
                  <div className="space-y-1 md:col-span-2">
                    <label className="font-bold text-zinc-500 uppercase text-[9px] tracking-wide">Agent Field Notes</label>
                    <textarea
                      value={formData.agent_notes}
                      onChange={(e) => setFormData({...formData, agent_notes: e.target.value})}
                      placeholder="e.g. Spoke with manager, salon is open 7 days, interested in Premium plan..."
                      className="w-full min-h-[80px] p-3 rounded-xl bg-zinc-50 border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-xs font-medium leading-relaxed"
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="font-bold text-zinc-500 uppercase text-[9px] tracking-wide flex items-center justify-between">
                      <span>Working Hours</span>
                    </label>
                    <WorkingHoursEditor 
                      value={formData.working_hours} 
                      onChange={(val) => setFormData({...formData, working_hours: val})} 
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer — Action Buttons based on current status */}
            <div className="pt-4 border-t border-zinc-100 space-y-3">
              {/* Progress bar in footer */}
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide shrink-0">Profile Completion</span>
                <div className="flex-1 bg-zinc-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      completionScore(formData) >= 80 ? 'bg-emerald-500' :
                      completionScore(formData) >= 50 ? 'bg-amber-400' : 'bg-rose-400'
                    }`}
                    style={{ width: `${completionScore(formData)}%` }}
                  />
                </div>
                <span className={`text-[11px] font-black shrink-0 ${
                  completionScore(formData) >= 80 ? 'text-emerald-600' :
                  completionScore(formData) >= 50 ? 'text-amber-500' : 'text-rose-500'
                }`}>{completionScore(formData)}%</span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <Button
                  variant="outline"
                  onClick={() => { setIsModalOpen(false); setSelectedLead(null); }}
                  className="rounded-xl font-bold h-10 border-zinc-200 text-zinc-500 text-xs"
                >
                  Close
                </Button>

                <div className="flex items-center gap-2">
                  {/* Save */}
                  <Button
                    onClick={() => handleSave()}
                    disabled={updating}
                    variant="outline"
                    className="rounded-xl font-bold h-10 px-4 border-zinc-200 text-xs"
                  >
                    {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                  </Button>

                  {/* Complete Verification & Send Invite — only if ASSIGNED_TO_AGENT or AGENT_VERIFIED */}
                  {["ASSIGNED_TO_AGENT", "AGENT_VERIFIED"].includes(formData.onboarding_status) && (
                    <Button
                      onClick={handleCompleteVerification}
                      disabled={updating}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold h-10 px-4 text-xs flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Complete Verification & Send Invite
                    </Button>
                  )}

                  {/* Agent Approval Button — only if OWNER_ACTIVATED */}
                  {formData.onboarding_status === "OWNER_ACTIVATED" && (
                    <Button
                      onClick={handleAgentApproval}
                      disabled={updating}
                      className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold h-10 px-4 text-xs flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Approve & Go Live
                    </Button>
                  )}

                  {/* Pending status display */}
                  {["OWNER_INVITED"].includes(formData.onboarding_status) && (
                    <Badge className="bg-amber-50 text-amber-600 border border-amber-200 font-bold text-[10px] px-3 py-2">
                      ⏳ Owner Invited
                    </Badge>
                  )}

                  {["AGENT_APPROVED", "VERIFIED"].includes(formData.onboarding_status) && (
                    <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-200 font-bold text-[10px] px-3 py-2">
                      ✅ Salon Live
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
