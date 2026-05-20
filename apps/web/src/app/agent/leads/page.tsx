"use client";

import React, { useState, useEffect } from "react";
import { 
  Users, 
  Search, 
  Plus,
  Mail,
  Phone,
  MapPin,
  Clock,
  Loader2,
  Zap,
  Target,
  Globe,
  Star,
  DollarSign,
  X,
  Table,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { supabase } from "@/config/supabase";
import { toast } from "sonner";

export default function AgentLeads() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [agentEmail, setAgentEmail] = useState("");
  const [agentName, setAgentName] = useState("");
  
  // Spreadsheet Sheet Editing States
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState<any>("");

  // Full Editor Form State (covers all fields in salon_leads)
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
    opening_hours: "",
    latitude: "",
    longitude: "",
    price_level: "",
    summary: "",
    hero_image: "",
    assign_to: "",
    role: "",
    status: "",
    lead_status: "NEW",
    onboarding_stage: "NOT_STARTED",
    lead_score: 0
  });

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      
      // 1. Get currently authenticated Agent session
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      
      const email = user?.email || "";
      setAgentEmail(email);
      setAgentName(user?.user_metadata?.full_name || email.split("@")[0]);

      if (!email) {
        toast.error("No active session found. Please log in.");
        return;
      }

      // 2. Fetch only leads assigned to this agent
      const { data, error } = await supabase
        .from("salon_leads")
        .select(`
          *,
          assigned_user:users!assign_to(full_name, email)
        `)
        .eq("assign_to", email)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      setLeads(data || []);
    } catch (error: any) {
      toast.error("Failed to load your assigned leads: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const logActivity = async (leadId: string, action: string, notes: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const currentEmail = user?.email || agentEmail || "agent@trimma.lk";
      
      await supabase
        .from("lead_activity_logs")
        .insert({
          lead_id: leadId,
          actor_email: currentEmail,
          action: action,
          notes: notes
        });
    } catch (err) {
      console.error("Activity logging failed:", err);
    }
  };

  // Open the detail editor form with all database fields
  const handleOpenAssignModal = (lead: any) => {
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
      opening_hours: lead.opening_hours ? JSON.stringify(lead.opening_hours, null, 2) : "[]",
      latitude: lead.latitude !== null && lead.latitude !== undefined ? String(lead.latitude) : "",
      longitude: lead.longitude !== null && lead.longitude !== undefined ? String(lead.longitude) : "",
      price_level: lead.price_level || "",
      summary: lead.summary || "",
      hero_image: lead.hero_image || "",
      assign_to: lead.assign_to || "",
      role: lead.role || "salon_owner",
      status: lead.status || "new",
      lead_status: lead.lead_status || "ASSIGNED_TO_AGENT",
      onboarding_stage: lead.onboarding_stage || "NOT_STARTED",
      lead_score: lead.lead_score || 0
    });
    setIsAssignModalOpen(true);
  };

  const handleSaveChanges = async () => {
    if (!selectedLead) return;
    try {
      setUpdating(true);
      
      let parsedHours = [];
      try {
        parsedHours = JSON.parse(formData.opening_hours || "[]");
      } catch (e) {
        parsedHours = formData.opening_hours;
      }

      const updatePayload = {
        place_id: formData.place_id || null,
        name: formData.name || "Unnamed Salon",
        address: formData.address || null,
        rating: formData.rating === "" ? null : parseFloat(formData.rating),
        phone: formData.phone || null,
        website: formData.website || null,
        map_url: formData.map_url || null,
        category: formData.category || null,
        opening_hours: parsedHours,
        latitude: formData.latitude === "" ? null : parseFloat(formData.latitude),
        longitude: formData.longitude === "" ? null : parseFloat(formData.longitude),
        price_level: formData.price_level || null,
        summary: formData.summary || null,
        hero_image: formData.hero_image || null,
        assign_to: agentEmail, // Keep assigned to this agent
        role: formData.role || "salon_owner",
        status: formData.status,
        lead_status: formData.lead_status,
        onboarding_stage: formData.onboarding_stage,
        lead_score: parseInt(formData.lead_score) || 0
      };

      const { error } = await supabase
        .from("salon_leads")
        .update(updatePayload)
        .eq("id", selectedLead.id);

      if (error) throw error;

      // Log the update activity
      await logActivity(selectedLead.id, "LEAD_UPDATED", "Lead details updated by Field Agent.");

      toast.success("Lead changes saved successfully!");
      setIsAssignModalOpen(false);
      setSelectedLead(null);
      fetchLeads();
    } catch (error: any) {
      toast.error("Failed to update lead: " + error.message);
    } finally {
      setUpdating(false);
    }
  };

  // Sheet View Inline Save (Double Click cell edits)
  const handleStartEdit = (leadId: string, field: string, val: any) => {
    // Only allow editing relevant columns (do not let agent assign to others via sheet inline)
    if (field === "assign_to") return; 
    setEditingCell({ id: leadId, field });
    setEditValue(val || "");
  };

  const handleSaveCell = async (leadId: string, field: string, newValue: any) => {
    let updatePayload: any = { [field]: newValue === "" ? null : newValue };

    try {
      const { error } = await supabase
        .from("salon_leads")
        .update(updatePayload)
        .eq("id", leadId);

      if (error) throw error;
      
      // Log cell update
      await logActivity(leadId, "CELL_UPDATED", `Field '${field}' updated inline in agent spreadsheet view to '${newValue || "empty"}'.`);

      toast.success("Lead cell updated!");
      
      setLeads(prev => prev.map(l => {
        if (l.id === leadId) {
          return { ...l, ...updatePayload };
        }
        return l;
      }));
    } catch (error: any) {
      toast.error("Save failed: " + error.message);
    } finally {
      setEditingCell(null);
    }
  };

  const handleSubmitForApproval = async (lead: any) => {
    try {
      toast.loading(`Submitting "${lead.name}" for Admin approval...`, { id: "submit_lead" });

      const { error } = await supabase
        .from("salon_leads")
        .update({ 
          lead_status: "INTERESTED",
          onboarding_stage: "SUBMITTED_FOR_APPROVAL"
        })
        .eq("id", lead.id);

      if (error) throw error;

      await logActivity(lead.id, "SUBMITTED_FOR_APPROVAL", "Agent completed salon profile data collection and submitted for super admin approval.");

      toast.success(`Successfully submitted "${lead.name}" for Admin review! 🚀`, { id: "submit_lead" });
      fetchLeads();
    } catch (error: any) {
      toast.error("Failed to submit lead: " + error.message, { id: "submit_lead" });
    }
  };

  // Delete lead from the terminal
  const handleDeleteLead = async (leadId: string) => {
    if (!confirm("Are you sure you want to delete this lead? This cannot be undone.")) return;
    try {
      const { error } = await supabase
        .from("salon_leads")
        .delete()
        .eq("id", leadId);

      if (error) throw error;
      toast.success("Lead deleted successfully!");
      setLeads(prev => prev.filter(l => l.id !== leadId));
    } catch (error: any) {
      toast.error("Failed to delete lead: " + error.message);
    }
  };

  // Filter leads based on search query
  const filteredLeads = leads.filter(l => 
    l.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (l.phone && l.phone.includes(searchTerm)) ||
    (l.category && l.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (l.address && l.address.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 tracking-tight">Assigned Leads Terminal</h1>
          <p className="text-zinc-500 text-sm mt-1">Manage and convert your assigned salon opportunities.</p>
        </div>
      </div>

      {/* KPI Cards & Search bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 border-none shadow-sm flex items-center gap-4 bg-white rounded-2xl border border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-0.5">Assigned Leads</p>
            <p className="text-xl font-black text-zinc-900">{leads.length}</p>
          </div>
        </Card>
        <Card className="p-4 border-none shadow-sm flex items-center gap-4 bg-white rounded-2xl border border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-0.5">Conversion</p>
            <p className="text-xl font-black text-zinc-900">
               {leads.length > 0 ? Math.round((leads.filter(l => l.status === 'converted').length / leads.length) * 100) : 0}%
            </p>
          </div>
        </Card>
        <div className="md:col-span-2 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by salon name, category or contact number..." 
            className="w-full pl-12 h-14 bg-white border border-slate-200 shadow-sm rounded-2xl focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
          />
        </div>
      </div>

      {/* INTERACTIVE LEADS SHEET */}
      <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden border border-slate-100">
        <div className="p-5 border-b border-zinc-50 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-zinc-900 text-base">My Leads Sheet</h3>
            <p className="text-zinc-400 text-xs mt-0.5">Double-click cells to inline-edit. Click a salon name to open the comprehensive profile editor.</p>
          </div>
        </div>
        
        <div className="overflow-x-auto w-full max-h-[600px] border-t border-zinc-50">
          <table className="w-full text-left border-collapse min-w-[2200px] text-xs">
            <thead className="bg-zinc-50/50 sticky top-0 backdrop-blur-md border-b border-zinc-100 z-10">
              <tr className="text-zinc-500 font-extrabold uppercase tracking-wider text-[10px] h-11 border-b border-zinc-100">
                <th className="px-4 py-2 pl-6 w-72">ID (UUID)</th>
                <th className="px-4 py-2 w-64">Salon Name</th>
                <th className="px-4 py-2 w-48">Category</th>
                <th className="px-4 py-2 w-72">Address</th>
                <th className="px-4 py-2 w-44">Phone</th>
                <th className="px-4 py-2 w-52">Website</th>
                <th className="px-4 py-2 w-52">Map URL</th>
                <th className="px-4 py-2 w-28">Rating</th>
                <th className="px-4 py-2 w-32">Latitude</th>
                <th className="px-4 py-2 w-32">Longitude</th>
                <th className="px-4 py-2 w-28">Price Level</th>
                <th className="px-4 py-2 w-64">Summary</th>
                <th className="px-4 py-2 w-52">Hero Image URL</th>
                <th className="px-4 py-2 w-48">Pipeline Status</th>
                <th className="px-4 py-2 w-48">Onboarding Stage</th>
                <th className="px-4 py-2 w-28">Score</th>
                <th className="px-4 py-2 w-36">Role</th>
                <th className="px-4 py-2 w-72">Opening Hours</th>
                <th className="px-4 py-2 w-48">Created At</th>
                <th className="px-4 py-2 pr-6 text-center w-[200px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50 font-medium text-zinc-700">
              {loading ? (
                <tr>
                  <td colSpan={18} className="text-center py-20 opacity-40">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                    <span>Loading your assigned leads...</span>
                  </td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={18} className="text-center py-20 text-zinc-300">
                    No leads assigned to you yet. Leads assigned by admin will flow here.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-zinc-50/50 transition-colors h-12">
                    {/* ID (Read-only) */}
                    <td className="px-4 py-2 pl-6 font-mono text-[10px] text-zinc-400 select-all">
                      {lead.id}
                    </td>

                    {/* Name */}
                    <td className="px-4 py-2 font-bold text-zinc-900">
                      {editingCell?.id === lead.id && editingCell?.field === "name" ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleSaveCell(lead.id, "name", editValue)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveCell(lead.id, "name", editValue);
                            if (e.key === "Escape") setEditingCell(null);
                          }}
                          autoFocus
                          className="w-full h-8 px-2 border-2 border-emerald-500 focus:outline-none rounded-lg text-xs font-semibold bg-white"
                        />
                      ) : (
                        <span 
                          onClick={() => handleOpenAssignModal(lead)}
                          title="Click to open full profile editor"
                          className="cursor-pointer hover:text-emerald-600 hover:underline p-1 rounded block truncate"
                        >
                          {lead.name}
                        </span>
                      )}
                    </td>

                    {/* Category */}
                    <td className="px-4 py-2">
                      {editingCell?.id === lead.id && editingCell?.field === "category" ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleSaveCell(lead.id, "category", editValue)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveCell(lead.id, "category", editValue);
                            if (e.key === "Escape") setEditingCell(null);
                          }}
                          autoFocus
                          className="w-full h-8 px-2 border-2 border-emerald-500 focus:outline-none rounded-lg text-xs font-semibold bg-white"
                        />
                      ) : (
                        <span 
                          onDoubleClick={() => handleStartEdit(lead.id, "category", lead.category)}
                          className="cursor-pointer hover:bg-zinc-50 p-1.5 rounded block truncate text-zinc-500 font-semibold"
                        >
                          {lead.category || <em className="text-zinc-200">empty</em>}
                        </span>
                      )}
                    </td>

                    {/* Address */}
                    <td className="px-4 py-2 max-w-[200px] truncate">
                      {editingCell?.id === lead.id && editingCell?.field === "address" ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleSaveCell(lead.id, "address", editValue)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveCell(lead.id, "address", editValue);
                            if (e.key === "Escape") setEditingCell(null);
                          }}
                          autoFocus
                          className="w-full h-8 px-2 border-2 border-emerald-500 focus:outline-none rounded-lg text-xs font-semibold bg-white"
                        />
                      ) : (
                        <span 
                          onDoubleClick={() => handleStartEdit(lead.id, "address", lead.address)}
                          className="cursor-pointer hover:bg-zinc-50 p-1.5 rounded block truncate text-zinc-500"
                        >
                          {lead.address || <em className="text-zinc-200">empty</em>}
                        </span>
                      )}
                    </td>

                    {/* Phone */}
                    <td className="px-4 py-2">
                      {editingCell?.id === lead.id && editingCell?.field === "phone" ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleSaveCell(lead.id, "phone", editValue)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveCell(lead.id, "phone", editValue);
                            if (e.key === "Escape") setEditingCell(null);
                          }}
                          autoFocus
                          className="w-full h-8 px-2 border-2 border-emerald-500 focus:outline-none rounded-lg text-xs font-semibold bg-white"
                        />
                      ) : (
                        <span 
                          onDoubleClick={() => handleStartEdit(lead.id, "phone", lead.phone)}
                          className="cursor-pointer hover:bg-zinc-50 p-1.5 rounded block text-zinc-600 font-semibold"
                        >
                          {lead.phone || <em className="text-zinc-200">empty</em>}
                        </span>
                      )}
                    </td>

                    {/* Website */}
                    <td className="px-4 py-2 max-w-[150px] truncate">
                      {editingCell?.id === lead.id && editingCell?.field === "website" ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleSaveCell(lead.id, "website", editValue)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveCell(lead.id, "website", editValue);
                            if (e.key === "Escape") setEditingCell(null);
                          }}
                          autoFocus
                          className="w-full h-8 px-2 border-2 border-emerald-500 focus:outline-none rounded-lg text-xs font-semibold bg-white"
                        />
                      ) : (
                        <span 
                          onDoubleClick={() => handleStartEdit(lead.id, "website", lead.website)}
                          className="cursor-pointer hover:bg-zinc-50 p-1.5 rounded block truncate text-blue-600 hover:underline"
                        >
                          {lead.website || <em className="text-zinc-200">empty</em>}
                        </span>
                      )}
                    </td>

                    {/* Map URL */}
                    <td className="px-4 py-2 max-w-[150px] truncate">
                      {editingCell?.id === lead.id && editingCell?.field === "map_url" ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleSaveCell(lead.id, "map_url", editValue)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveCell(lead.id, "map_url", editValue);
                            if (e.key === "Escape") setEditingCell(null);
                          }}
                          autoFocus
                          className="w-full h-8 px-2 border-2 border-emerald-500 focus:outline-none rounded-lg text-xs font-semibold bg-white"
                        />
                      ) : (
                        <span 
                          onDoubleClick={() => handleStartEdit(lead.id, "map_url", lead.map_url)}
                          className="cursor-pointer hover:bg-zinc-50 p-1.5 rounded block truncate text-zinc-500 hover:underline font-mono text-[10px]"
                        >
                          {lead.map_url || <em className="text-zinc-200">empty</em>}
                        </span>
                      )}
                    </td>

                    {/* Rating */}
                    <td className="px-4 py-2">
                      {editingCell?.id === lead.id && editingCell?.field === "rating" ? (
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="5"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleSaveCell(lead.id, "rating", editValue ? parseFloat(editValue) : null)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveCell(lead.id, "rating", editValue ? parseFloat(editValue) : null);
                            if (e.key === "Escape") setEditingCell(null);
                          }}
                          autoFocus
                          className="w-full h-8 px-2 border-2 border-emerald-500 focus:outline-none rounded-lg text-xs font-semibold bg-white"
                        />
                      ) : (
                        <span 
                          onDoubleClick={() => handleStartEdit(lead.id, "rating", lead.rating)}
                          className="cursor-pointer hover:bg-zinc-50 p-1.5 rounded flex items-center gap-1 text-amber-500 font-bold"
                        >
                          <Star className="w-3.5 h-3.5 fill-amber-500 stroke-amber-500 shrink-0" />
                          {lead.rating ? lead.rating.toFixed(2) : "0.00"}
                        </span>
                      )}
                    </td>

                    {/* Latitude */}
                    <td className="px-4 py-2 font-mono text-[10px]">
                      {editingCell?.id === lead.id && editingCell?.field === "latitude" ? (
                        <input
                          type="number"
                          step="any"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleSaveCell(lead.id, "latitude", editValue ? parseFloat(editValue) : null)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveCell(lead.id, "latitude", editValue ? parseFloat(editValue) : null);
                            if (e.key === "Escape") setEditingCell(null);
                          }}
                          autoFocus
                          className="w-full h-8 px-2 border-2 border-emerald-500 focus:outline-none rounded-lg text-[10px] bg-white"
                        />
                      ) : (
                        <span 
                          onDoubleClick={() => handleStartEdit(lead.id, "latitude", lead.latitude)}
                          className="cursor-pointer hover:bg-zinc-50 p-1 rounded block"
                        >
                          {lead.latitude || <em className="text-zinc-200">empty</em>}
                        </span>
                      )}
                    </td>

                    {/* Longitude */}
                    <td className="px-4 py-2 font-mono text-[10px]">
                      {editingCell?.id === lead.id && editingCell?.field === "longitude" ? (
                        <input
                          type="number"
                          step="any"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleSaveCell(lead.id, "longitude", editValue ? parseFloat(editValue) : null)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveCell(lead.id, "longitude", editValue ? parseFloat(editValue) : null);
                            if (e.key === "Escape") setEditingCell(null);
                          }}
                          autoFocus
                          className="w-full h-8 px-2 border-2 border-emerald-500 focus:outline-none rounded-lg text-[10px] bg-white"
                        />
                      ) : (
                        <span 
                          onDoubleClick={() => handleStartEdit(lead.id, "longitude", lead.longitude)}
                          className="cursor-pointer hover:bg-zinc-50 p-1 rounded block"
                        >
                          {lead.longitude || <em className="text-zinc-200">empty</em>}
                        </span>
                      )}
                    </td>

                    {/* Price Level */}
                    <td className="px-4 py-2 text-zinc-500 font-bold">
                      {editingCell?.id === lead.id && editingCell?.field === "price_level" ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleSaveCell(lead.id, "price_level", editValue)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveCell(lead.id, "price_level", editValue);
                            if (e.key === "Escape") setEditingCell(null);
                          }}
                          autoFocus
                          className="w-full h-8 px-2 border-2 border-emerald-500 focus:outline-none rounded-lg text-xs font-semibold bg-white"
                        />
                      ) : (
                        <span 
                          onDoubleClick={() => handleStartEdit(lead.id, "price_level", lead.price_level)}
                          className="cursor-pointer hover:bg-zinc-50 p-1 rounded block"
                        >
                          {lead.price_level || <em className="text-zinc-200">empty</em>}
                        </span>
                      )}
                    </td>

                    {/* Summary */}
                    <td className="px-4 py-2 max-w-[200px] truncate text-zinc-500 italic">
                      {editingCell?.id === lead.id && editingCell?.field === "summary" ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleSaveCell(lead.id, "summary", editValue)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveCell(lead.id, "summary", editValue);
                            if (e.key === "Escape") setEditingCell(null);
                          }}
                          autoFocus
                          className="w-full h-8 px-2 border-2 border-emerald-500 focus:outline-none rounded-lg text-xs bg-white"
                        />
                      ) : (
                        <span 
                          onDoubleClick={() => handleStartEdit(lead.id, "summary", lead.summary)}
                          className="cursor-pointer hover:bg-zinc-50 p-1 rounded block truncate"
                          title={lead.summary}
                        >
                          {lead.summary || <em className="text-zinc-200">empty</em>}
                        </span>
                      )}
                    </td>

                    {/* Hero Image */}
                    <td className="px-4 py-2 max-w-[150px] truncate font-mono text-[10px]">
                      {editingCell?.id === lead.id && editingCell?.field === "hero_image" ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleSaveCell(lead.id, "hero_image", editValue)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveCell(lead.id, "hero_image", editValue);
                            if (e.key === "Escape") setEditingCell(null);
                          }}
                          autoFocus
                          className="w-full h-8 px-2 border-2 border-emerald-500 focus:outline-none rounded-lg text-[10px] bg-white"
                        />
                      ) : (
                        <span 
                          onDoubleClick={() => handleStartEdit(lead.id, "hero_image", lead.hero_image)}
                          className="cursor-pointer hover:bg-zinc-50 p-1 rounded block truncate"
                        >
                          {lead.hero_image || <em className="text-zinc-200">empty</em>}
                        </span>
                      )}
                    </td>
                    {/* Pipeline Status */}
                    <td className="px-4 py-2">
                      {editingCell?.id === lead.id && editingCell?.field === "lead_status" ? (
                        <select
                          value={editValue}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditValue(val);
                            handleSaveCell(lead.id, "lead_status", val);
                          }}
                          onBlur={() => setEditingCell(null)}
                          autoFocus
                          className="w-full h-8 px-1 border-2 border-emerald-500 focus:outline-none rounded-lg text-xs font-semibold bg-white"
                        >
                          <option value="NEW">NEW</option>
                          <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                          <option value="ASSIGNED_TO_AGENT">ASSIGNED_TO_AGENT</option>
                          <option value="CONTACTED">CONTACTED</option>
                          <option value="INTERESTED">INTERESTED</option>
                          <option value="NOT_INTERESTED">NOT_INTERESTED</option>
                        </select>
                      ) : (
                        <span 
                          onClick={() => handleStartEdit(lead.id, "lead_status", lead.lead_status || "ASSIGNED_TO_AGENT")}
                          className="cursor-pointer hover:opacity-85 p-1 rounded inline-block"
                        >
                          <Badge variant="outline" className={`border-none font-bold uppercase text-[9px] px-2.5 py-1 ${
                            lead.lead_status === 'INTERESTED' ? 'bg-emerald-50 text-emerald-600' :
                            lead.lead_status === 'NOT_INTERESTED' ? 'bg-rose-50 text-rose-600' :
                            lead.lead_status === 'CONTACTED' ? 'bg-amber-50 text-amber-600' :
                            lead.lead_status === 'ASSIGNED_TO_AGENT' ? 'bg-indigo-50 text-indigo-600' :
                            'bg-zinc-100 text-zinc-500'
                          }`}>
                            {lead.lead_status || "ASSIGNED_TO_AGENT"}
                          </Badge>
                        </span>
                      )}
                    </td>

                    {/* Onboarding Stage */}
                    <td className="px-4 py-2">
                      {editingCell?.id === lead.id && editingCell?.field === "onboarding_stage" ? (
                        <select
                          value={editValue}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditValue(val);
                            handleSaveCell(lead.id, "onboarding_stage", val);
                          }}
                          onBlur={() => setEditingCell(null)}
                          autoFocus
                          className="w-full h-8 px-1 border-2 border-emerald-500 focus:outline-none rounded-lg text-xs font-semibold bg-white"
                        >
                          <option value="NOT_STARTED">NOT_STARTED</option>
                          <option value="CONTACT_ESTABLISHED">CONTACT_ESTABLISHED</option>
                          <option value="DATA_COLLECTION">DATA_COLLECTION</option>
                          <option value="SUBMITTED_FOR_APPROVAL">SUBMITTED_FOR_APPROVAL</option>
                        </select>
                      ) : (
                        <span 
                          onClick={() => handleStartEdit(lead.id, "onboarding_stage", lead.onboarding_stage || "NOT_STARTED")}
                          className="cursor-pointer hover:opacity-85 p-1 rounded inline-block"
                        >
                          <Badge variant="outline" className={`border-none font-bold uppercase text-[9px] px-2.5 py-1 ${
                            lead.onboarding_stage === 'CONVERTED' ? 'bg-emerald-50 text-emerald-600' :
                            lead.onboarding_stage === 'SUBMITTED_FOR_APPROVAL' ? 'bg-amber-50 text-amber-600 animate-pulse border border-amber-200' :
                            lead.onboarding_stage === 'DATA_COLLECTION' ? 'bg-cyan-50 text-cyan-600' :
                            lead.onboarding_stage === 'CONTACT_ESTABLISHED' ? 'bg-indigo-50 text-indigo-600' :
                            'bg-zinc-100 text-zinc-500'
                          }`}>
                            {lead.onboarding_stage || "NOT_STARTED"}
                          </Badge>
                        </span>
                      )}
                    </td>

                    {/* Lead Score */}
                    <td className="px-4 py-2">
                      <Badge variant="outline" className={`border-none font-extrabold text-[10px] px-2.5 py-1 ${
                        (lead.lead_score || 0) >= 70 ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                        (lead.lead_score || 0) >= 40 ? 'bg-amber-50 text-amber-600' :
                        'bg-zinc-50 text-zinc-400'
                      }`}>
                        {lead.lead_score || 0} pts
                      </Badge>
                    </td>

                    {/* Role */}
                    <td className="px-4 py-2">
                      {editingCell?.id === lead.id && editingCell?.field === "role" ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleSaveCell(lead.id, "role", editValue)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveCell(lead.id, "role", editValue);
                            if (e.key === "Escape") setEditingCell(null);
                          }}
                          autoFocus
                          className="w-full h-8 px-2 border-2 border-emerald-500 focus:outline-none rounded-lg text-xs font-semibold bg-white"
                        />
                      ) : (
                        <span 
                          onDoubleClick={() => handleStartEdit(lead.id, "role", lead.role)}
                          className="cursor-pointer hover:bg-zinc-50 p-1.5 rounded block truncate text-zinc-500"
                        >
                          {lead.role || <em className="text-zinc-200">salon_owner</em>}
                        </span>
                      )}
                    </td>

                    {/* Opening Hours */}
                    <td className="px-4 py-2 max-w-[250px] truncate font-mono text-[9px] text-zinc-400">
                      {editingCell?.id === lead.id && editingCell?.field === "opening_hours" ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => {
                            try {
                              const parsed = JSON.parse(editValue || "[]");
                              handleSaveCell(lead.id, "opening_hours", parsed);
                            } catch (e) {
                              handleSaveCell(lead.id, "opening_hours", editValue);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              try {
                                const parsed = JSON.parse(editValue || "[]");
                                handleSaveCell(lead.id, "opening_hours", parsed);
                              } catch (err) {
                                handleSaveCell(lead.id, "opening_hours", editValue);
                              }
                            }
                            if (e.key === "Escape") setEditingCell(null);
                          }}
                          autoFocus
                          className="w-full h-8 px-2 border-2 border-emerald-500 focus:outline-none rounded-lg text-[9px] bg-white font-mono"
                        />
                      ) : (
                        <span 
                          onDoubleClick={() => handleStartEdit(lead.id, "opening_hours", lead.opening_hours ? JSON.stringify(lead.opening_hours) : "[]")}
                          className="cursor-pointer hover:bg-zinc-50 p-1 rounded block truncate"
                          title={lead.opening_hours ? JSON.stringify(lead.opening_hours) : "[]"}
                        >
                          {lead.opening_hours ? JSON.stringify(lead.opening_hours) : "[]"}
                        </span>
                      )}
                    </td>

                    {/* Created At */}
                    <td className="px-4 py-2 text-zinc-400 font-mono text-[10px]">
                      {new Date(lead.created_at).toLocaleString()}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-2 pr-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {lead.onboarding_stage === "CONVERTED" || lead.status === "converted" ? (
                          <Badge className="bg-emerald-50 text-emerald-600 border-none font-bold uppercase text-[9px] px-2.5 py-1">
                            Live Salon
                          </Badge>
                        ) : lead.onboarding_stage === "SUBMITTED_FOR_APPROVAL" ? (
                          <Badge className="bg-amber-50 text-amber-600 border-none font-bold uppercase text-[9px] px-2.5 py-1 animate-pulse">
                            Pending Review
                          </Badge>
                        ) : (
                          <Button 
                            onClick={() => handleSubmitForApproval(lead)}
                            size="sm"
                            className="bg-[#D81E5B] hover:bg-[#b01849] text-white font-bold h-7 px-3 rounded-lg text-[10px] uppercase tracking-tighter flex items-center gap-1 border-none shadow-sm"
                          >
                            Submit to Admin
                          </Button>
                        )}
                        <Button 
                          onClick={() => handleDeleteLead(lead.id)}
                          variant="ghost" 
                          size="icon" 
                          className="w-7 h-7 rounded-lg text-zinc-300 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* FULL DATABASE FORM EDITOR MODAL (Covers all 20 columns of salon_leads) */}
      {isAssignModalOpen && selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-4xl w-full shadow-2xl relative border border-zinc-100 flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
              <div>
                <h3 className="text-lg font-black text-zinc-900 tracking-tight">Lead Profile Editor</h3>
                <p className="text-xs text-zinc-400 mt-0.5 font-mono">Lead ID: {formData.id} (Created At: {new Date(selectedLead.created_at).toLocaleString()})</p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => { setIsAssignModalOpen(false); setSelectedLead(null); }}
                className="rounded-full w-8 h-8 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Modal Body (Scrollable Multi-Section Form) */}
            <div className="flex-1 overflow-y-auto py-5 space-y-6 pr-1 text-xs">
              
              {/* Section 1: Core Business Identity */}
              <div className="space-y-3">
                <h4 className="font-extrabold uppercase tracking-widest text-emerald-600 text-[10px] border-b border-emerald-100 pb-1 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5" /> 1. Core Business Identity
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-zinc-500 uppercase text-[9px] tracking-wide">Salon Name</label>
                    <Input 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="e.g. Elegance Hair Salon"
                      className="h-10 rounded-xl bg-zinc-50 border-zinc-200 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-zinc-500 uppercase text-[9px] tracking-wide">Category</label>
                    <Input 
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      placeholder="e.g. Hair Salon, Spa"
                      className="h-10 rounded-xl bg-zinc-50 border-zinc-200 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-zinc-500 uppercase text-[9px] tracking-wide">Role</label>
                    <Input 
                      value={formData.role}
                      onChange={(e) => setFormData({...formData, role: e.target.value})}
                      placeholder="e.g. salon_owner, manager"
                      className="h-10 rounded-xl bg-zinc-50 border-zinc-200 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-zinc-500 uppercase text-[9px] tracking-wide">Rating (0.00 - 5.00)</label>
                    <Input 
                      type="number"
                      step="0.01"
                      min="0"
                      max="5"
                      value={formData.rating}
                      onChange={(e) => setFormData({...formData, rating: e.target.value})}
                      placeholder="e.g. 4.8"
                      className="h-10 rounded-xl bg-zinc-50 border-zinc-200 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-zinc-500 uppercase text-[9px] tracking-wide">Price Level</label>
                    <Input 
                      value={formData.price_level}
                      onChange={(e) => setFormData({...formData, price_level: e.target.value})}
                      placeholder="e.g. $, $$, $$$"
                      className="h-10 rounded-xl bg-zinc-50 border-zinc-200 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-zinc-500 uppercase text-[9px] tracking-wide font-mono text-[9px]">Google Place ID (Read-only)</label>
                    <Input 
                      value={formData.place_id}
                      disabled
                      className="h-10 rounded-xl bg-zinc-100 border-zinc-200 font-mono text-[10px] text-zinc-500 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Contact Details & GPS Location */}
              <div className="space-y-3">
                <h4 className="font-extrabold uppercase tracking-widest text-emerald-600 text-[10px] border-b border-emerald-100 pb-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> 2. Contacts & Geographical Coordinates
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-zinc-500 uppercase text-[9px] tracking-wide">Phone Number</label>
                    <Input 
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="e.g. +94..."
                      className="h-10 rounded-xl bg-zinc-50 border-zinc-200 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-zinc-500 uppercase text-[9px] tracking-wide">Website URL</label>
                    <Input 
                      value={formData.website}
                      onChange={(e) => setFormData({...formData, website: e.target.value})}
                      placeholder="e.g. https://..."
                      className="h-10 rounded-xl bg-zinc-50 border-zinc-200 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-zinc-500 uppercase text-[9px] tracking-wide">Google Maps Link</label>
                    <Input 
                      value={formData.map_url}
                      onChange={(e) => setFormData({...formData, map_url: e.target.value})}
                      placeholder="e.g. https://maps.google.com/..."
                      className="h-10 rounded-xl bg-zinc-50 border-zinc-200 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div className="md:col-span-3 space-y-1">
                    <label className="font-bold text-zinc-500 uppercase text-[9px] tracking-wide">Full Physical Address</label>
                    <Input 
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      placeholder="e.g. Street Number, City Name, Province"
                      className="h-10 rounded-xl bg-zinc-50 border-zinc-200 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-zinc-500 uppercase text-[9px] tracking-wide">GPS Latitude</label>
                    <Input 
                      type="number"
                      step="any"
                      value={formData.latitude}
                      onChange={(e) => setFormData({...formData, latitude: e.target.value})}
                      placeholder="e.g. 6.927079"
                      className="h-10 rounded-xl bg-zinc-50 border-zinc-200 font-mono text-[10px] focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-zinc-500 uppercase text-[9px] tracking-wide">GPS Longitude</label>
                    <Input 
                      type="number"
                      step="any"
                      value={formData.longitude}
                      onChange={(e) => setFormData({...formData, longitude: e.target.value})}
                      placeholder="e.g. 79.861244"
                      className="h-10 rounded-xl bg-zinc-50 border-zinc-200 font-mono text-[10px] focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-zinc-500 uppercase text-[9px] tracking-wide">Hero Cover Image URL</label>
                    <Input 
                      value={formData.hero_image}
                      onChange={(e) => setFormData({...formData, hero_image: e.target.value})}
                      placeholder="e.g. https://images.unsplash.com/..."
                      className="h-10 rounded-xl bg-zinc-50 border-zinc-200 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: AI insights, Opening Hours & Pipeline Stage */}
              <div className="space-y-3">
                <h4 className="font-extrabold uppercase tracking-widest text-emerald-600 text-[10px] border-b border-emerald-100 pb-1 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" /> 3. Workflow, AI Summary & Opening Hours JSON
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-zinc-500 uppercase text-[9px] tracking-wide">Assigned Owner (Agent)</label>
                    <Input 
                      value={agentName}
                      disabled
                      className="h-10 rounded-xl bg-zinc-100 border-zinc-200 text-zinc-500 cursor-not-allowed font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-zinc-500 uppercase text-[9px] tracking-wide">Pipeline Status</label>
                    <select
                      value={formData.lead_status}
                      onChange={(e) => setFormData({...formData, lead_status: e.target.value})}
                      className="w-full h-11 px-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-sm font-semibold text-zinc-800"
                    >
                      <option value="NEW">NEW</option>
                      <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                      <option value="ASSIGNED_TO_AGENT">ASSIGNED_TO_AGENT</option>
                      <option value="CONTACTED">CONTACTED</option>
                      <option value="INTERESTED">INTERESTED</option>
                      <option value="NOT_INTERESTED">NOT_INTERESTED</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-zinc-500 uppercase text-[9px] tracking-wide font-mono text-[9px]">Lead Score (Auto-computed)</label>
                    <Input 
                      type="number"
                      value={formData.lead_score}
                      disabled
                      className="h-11 rounded-xl bg-zinc-100 border-zinc-200 font-mono text-sm text-zinc-500 cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="font-bold text-zinc-500 uppercase text-[9px] tracking-wide">Onboarding Stage</label>
                    <select
                      value={formData.onboarding_stage}
                      onChange={(e) => setFormData({...formData, onboarding_stage: e.target.value})}
                      className="w-full h-11 px-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-sm font-semibold text-zinc-800"
                    >
                      <option value="NOT_STARTED">NOT_STARTED</option>
                      <option value="CONTACT_ESTABLISHED">CONTACT_ESTABLISHED</option>
                      <option value="DATA_COLLECTION">DATA_COLLECTION</option>
                      <option value="SUBMITTED_FOR_APPROVAL">SUBMITTED_FOR_APPROVAL</option>
                      <option value="CONVERTED">CONVERTED</option>
                    </select>
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="font-bold text-zinc-500 uppercase text-[9px] tracking-wide font-semibold">AI insights Summary / Profile Notes</label>
                    <textarea
                      value={formData.summary}
                      onChange={(e) => setFormData({...formData, summary: e.target.value})}
                      placeholder="Enter AI insights, contact details summary or meeting notes..."
                      className="w-full min-h-[72px] p-3 rounded-xl bg-zinc-50 border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-xs font-semibold leading-relaxed"
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="font-bold text-zinc-500 uppercase text-[9px] tracking-wide flex items-center justify-between">
                      <span>Structured Opening Hours (JSON format)</span>
                      <span className="text-[8px] font-normal text-zinc-400 lowercase">Must be a valid JSON array or empty brackets []</span>
                    </label>
                    <textarea
                      value={formData.opening_hours}
                      onChange={(e) => setFormData({...formData, opening_hours: e.target.value})}
                      placeholder="e.g. []"
                      className="w-full min-h-[96px] p-3 rounded-xl bg-zinc-50 border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-xs font-mono leading-relaxed"
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100">
              <Button 
                variant="outline" 
                onClick={() => { setIsAssignModalOpen(false); setSelectedLead(null); }}
                className="rounded-xl font-bold h-11 border-zinc-200 text-zinc-500 hover:bg-slate-50 text-xs"
              >
                Cancel
              </Button>
              
              {formData.onboarding_stage !== "SUBMITTED_FOR_APPROVAL" && formData.onboarding_stage !== "CONVERTED" && (
                <Button 
                  onClick={async () => {
                    await handleSaveChanges();
                    await handleSubmitForApproval(selectedLead);
                    setIsAssignModalOpen(false);
                    setSelectedLead(null);
                  }}
                  disabled={updating}
                  className="bg-[#D81E5B] hover:bg-[#b01849] text-white rounded-xl font-bold h-11 px-5 shadow-lg shadow-[#D81E5B]/20 flex items-center gap-2 text-xs"
                >
                  Submit for Approval 🚀
                </Button>
              )}

              <Button 
                onClick={handleSaveChanges}
                disabled={updating}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold h-11 px-6 shadow-lg shadow-emerald-600/20 flex items-center gap-2 text-xs"
              >
                {updating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                  </>
                ) : (
                  "Save Lead Details"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
