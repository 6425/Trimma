import React from "react";
import { Loader2, Zap, Trash2, Send, CheckCircle2, AlertCircle, Shield, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface LeadTablesProps {
  activeTab: "discovery" | "draft" | "pipeline" | "archived";
  setActiveTab: React.Dispatch<React.SetStateAction<"discovery" | "draft" | "pipeline" | "archived">>;
  leads: any[];
  filteredLeads: any[];
  loading: boolean;
  editingCell: { id: string, field: string } | null;
  setEditingCell: (cell: { id: string, field: string } | null) => void;
  editValue: string;
  setEditValue: (val: string) => void;
  handleSaveCell: (id: string, field: string, value: any) => void;
  handleStartEdit: (id: string, field: string, value: any) => void;
  handleHeroImageUpload: (e: React.ChangeEvent<HTMLInputElement>, leadId: string) => void;
  agents: any[];
  handleCreateSalon: (lead: any) => void;
  handleDeleteLead: (id: string) => void;
  handleOpenAssignModal: (lead: any) => void;
  handleSendToAgent: (lead: any) => void;
  handleVerifySalon: (lead: any) => void;
  setRejectTarget: (lead: any) => void;
  setShowRejectModal: (show: boolean) => void;
  verifying: boolean;
}

export function LeadTables({
  activeTab, setActiveTab, leads, filteredLeads, loading,
  editingCell, setEditingCell, editValue, setEditValue,
  handleSaveCell, handleStartEdit, handleHeroImageUpload,
  agents, handleCreateSalon, handleDeleteLead, handleOpenAssignModal,
  handleSendToAgent, handleVerifySalon, setRejectTarget, setShowRejectModal,
  verifying
}: LeadTablesProps) {

  return (
    <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
      <div className="p-5 border-b border-zinc-50 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-[#1A1C29] text-base">Interactive Lead Sheet</h3>
          <p className="text-zinc-500 text-xs mt-0.5">Exactly aligned with your DB schema columns. Automatically populated by Google Places searches and fully editable by the admin.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-1.5 bg-zinc-100/80 p-1.5 rounded-2xl shrink-0 self-start xl:self-auto">
          <button
            onClick={() => setActiveTab("discovery")}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
              activeTab === "discovery" 
                ? "bg-white text-brand shadow-sm" 
                : "text-zinc-500 hover:text-zinc-950"
            }`}
          >
            1. Discovery ({leads.filter(l => (l.onboarding_status || "DISCOVERED") === "DISCOVERED").length})
          </button>
          <button
            onClick={() => setActiveTab("draft")}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
              activeTab === "draft" 
                ? "bg-white text-brand shadow-sm" 
                : "text-zinc-500 hover:text-zinc-950"
            }`}
          >
            2. Draft Queue ({leads.filter(l => ["AUTO_PROVISIONED", "DRAFT_REVIEW"].includes(l.onboarding_status || "DISCOVERED")).length})
          </button>
          <button
            onClick={() => setActiveTab("pipeline")}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
              activeTab === "pipeline" 
                ? "bg-white text-brand shadow-sm" 
                : "text-zinc-500 hover:text-zinc-950"
            }`}
          >
            3. Pipeline ({leads.filter(l => ["ASSIGNED_TO_AGENT", "PUBLISHED_UNBOOKABLE", "OWNER_INVITED", "OWNER_ACTIVATED", "PENDING_ADMIN_VERIFICATION"].includes(l.onboarding_status || "DISCOVERED")).length})
          </button>
          <button
            onClick={() => setActiveTab("archived")}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
              activeTab === "archived" 
                ? "bg-white text-brand shadow-sm" 
                : "text-zinc-500 hover:text-zinc-950"
            }`}
          >
            4. Verified / Archived ({leads.filter(l => ["VERIFIED", "REJECTED", "ON_HOLD"].includes(l.onboarding_status || "DISCOVERED")).length})
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto w-full max-h-[600px] border-t border-zinc-50">
        <table className="w-full text-left border-collapse min-w-[2400px] text-xs">
          <thead className="bg-zinc-50/50 sticky top-0 backdrop-blur-md border-b border-zinc-100 z-10">
            <tr className="text-zinc-500 font-extrabold uppercase tracking-wider text-[10px] h-11 border-b border-zinc-100">
              <th className="px-4 py-2 pl-6 w-72">ID (UUID)</th>
              <th className="px-4 py-2 w-52">Place ID</th>
              <th className="px-4 py-2 w-64">Salon Name</th>
              <th className="px-4 py-2 w-32">Completion</th>
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
              <th className="px-4 py-2 w-48">Assignee (Agent)</th>
              <th className="px-4 py-2 w-48">Onboarding Status</th>
              <th className="px-4 py-2 w-36">System Status</th>
              <th className="px-4 py-2 w-72">Working Hours</th>
              <th className="px-4 py-2 w-48">Created At</th>
              <th className="px-4 py-2 w-48">Updated At</th>
              <th className="px-4 py-2 pr-6 text-center w-[280px]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50 font-medium text-zinc-700">
            {loading ? (
              <tr>
                <td colSpan={22} className="text-center py-20 opacity-40">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-brand" />
                  <span>Loading leads database...</span>
                </td>
              </tr>
            ) : filteredLeads.length === 0 ? (
              <tr>
                <td colSpan={22} className="text-center py-20 text-zinc-700">
                  No leads found matching your search.
                </td>
              </tr>
            ) : (
              filteredLeads.map((lead) => {
                const completionScore = (() => {
                  let score = 0;
                  if (lead.owner_email && !lead.owner_email.startsWith("draft-")) score += 15;
                  if (lead.phone) score += 10;
                  if (lead.category || lead.price_level) score += 15;
                  if (lead.hero_url || lead.logo_url) score += 15;
                  if (lead.summary || lead.description) score += 10;
                  if (lead.working_hours && lead.working_hours !== "[]" && lead.working_hours.length > 0) score += 10;
                  if (lead.latitude && lead.longitude) score += 15;
                  if (lead.city) score += 10;
                  return score;
                })();

                return (
                <tr key={lead.id} className="hover:bg-zinc-50/50 transition-colors h-12">
                  {/* ID (Read-only) */}
                  <td className="px-4 py-2 pl-6 font-mono text-[10px] text-zinc-500 select-all">
                    {lead.id}
                  </td>

                  {/* Place ID */}
                  <td className="px-4 py-2 font-mono text-[10px] max-w-[150px] truncate">
                    {editingCell?.id === lead.id && editingCell?.field === "place_id" ? (
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => handleSaveCell(lead.id, "place_id", editValue)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveCell(lead.id, "place_id", editValue);
                          if (e.key === "Escape") setEditingCell(null);
                        }}
                        autoFocus
                        className="w-full h-8 px-2 border-2 border-brand focus:outline-none rounded-lg text-[10px] bg-white font-mono"
                      />
                    ) : (
                      <span 
                        onDoubleClick={() => handleStartEdit(lead.id, "place_id", lead.place_id)}
                        className="cursor-pointer hover:bg-zinc-50 p-1 rounded block truncate"
                      >
                        {lead.place_id || <em className="text-zinc-800">empty</em>}
                      </span>
                    )}
                  </td>

                  {/* Salon Name */}
                  <td className="px-4 py-2">
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
                        className="w-full h-8 px-2 border-2 border-brand focus:outline-none rounded-lg text-xs font-bold text-[#1A1C29] bg-white"
                      />
                    ) : (
                      <span 
                        onDoubleClick={() => handleStartEdit(lead.id, "name", lead.name)}
                        className="cursor-pointer hover:bg-zinc-50 p-1.5 rounded block text-[#1A1C29] font-bold"
                      >
                        {lead.name}
                      </span>
                    )}
                  </td>

                  {/* Completion */}
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${completionScore >= 100 ? 'bg-emerald-500' : completionScore >= 50 ? 'bg-amber-400' : 'bg-rose-500'}`} 
                          style={{ width: `${Math.min(completionScore, 100)}%` }} 
                        />
                      </div>
                      <span className="text-[10px] font-bold text-zinc-500 w-6 text-right">{completionScore}%</span>
                    </div>
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
                        className="w-full h-8 px-2 border-2 border-brand focus:outline-none rounded-lg text-xs font-semibold bg-white"
                      />
                    ) : (
                      <span 
                        onDoubleClick={() => handleStartEdit(lead.id, "category", lead.category)}
                        className="cursor-pointer hover:bg-zinc-50 p-1.5 rounded block truncate text-zinc-500 font-semibold"
                      >
                        {lead.category || <em className="text-zinc-800">empty</em>}
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
                        className="w-full h-8 px-2 border-2 border-brand focus:outline-none rounded-lg text-xs font-semibold bg-white"
                      />
                    ) : (
                      <span 
                        onDoubleClick={() => handleStartEdit(lead.id, "address", lead.address)}
                        className="cursor-pointer hover:bg-zinc-50 p-1.5 rounded block truncate text-zinc-500"
                      >
                        {lead.address || <em className="text-zinc-800">empty</em>}
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
                        className="w-full h-8 px-2 border-2 border-brand focus:outline-none rounded-lg text-xs font-semibold bg-white"
                      />
                    ) : (
                      <span 
                        onDoubleClick={() => handleStartEdit(lead.id, "phone", lead.phone)}
                        className="cursor-pointer hover:bg-zinc-50 p-1.5 rounded block text-zinc-600 font-semibold truncate"
                      >
                        {lead.phone || <em className="text-zinc-800">empty</em>}
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
                        className="w-full h-8 px-2 border-2 border-brand focus:outline-none rounded-lg text-xs font-semibold bg-white"
                      />
                    ) : (
                      <span 
                        onDoubleClick={() => handleStartEdit(lead.id, "website", lead.website)}
                        className="cursor-pointer hover:bg-zinc-50 p-1.5 rounded block truncate text-blue-600 hover:underline"
                      >
                        {lead.website || <em className="text-zinc-800">empty</em>}
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
                        className="w-full h-8 px-2 border-2 border-brand focus:outline-none rounded-lg text-xs font-semibold bg-white"
                      />
                    ) : (
                      <span 
                        onDoubleClick={() => handleStartEdit(lead.id, "map_url", lead.map_url)}
                        className="cursor-pointer hover:bg-zinc-50 p-1.5 rounded block truncate text-zinc-500 hover:underline font-mono text-[10px]"
                      >
                        {lead.map_url || <em className="text-zinc-800">empty</em>}
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
                        className="w-full h-8 px-2 border-2 border-brand focus:outline-none rounded-lg text-xs font-semibold bg-white"
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
                        className="w-full h-8 px-2 border-2 border-brand focus:outline-none rounded-lg text-[10px] bg-white"
                      />
                    ) : (
                      <span 
                        onDoubleClick={() => handleStartEdit(lead.id, "latitude", lead.latitude)}
                        className="cursor-pointer hover:bg-zinc-50 p-1 rounded block"
                      >
                        {lead.latitude || <em className="text-zinc-800">empty</em>}
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
                        className="w-full h-8 px-2 border-2 border-brand focus:outline-none rounded-lg text-[10px] bg-white"
                      />
                    ) : (
                      <span 
                        onDoubleClick={() => handleStartEdit(lead.id, "longitude", lead.longitude)}
                        className="cursor-pointer hover:bg-zinc-50 p-1 rounded block"
                      >
                        {lead.longitude || <em className="text-zinc-800">empty</em>}
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
                        className="w-full h-8 px-2 border-2 border-brand focus:outline-none rounded-lg text-xs font-semibold bg-white"
                      />
                    ) : (
                      <span 
                        onDoubleClick={() => handleStartEdit(lead.id, "price_level", lead.price_level)}
                        className="cursor-pointer hover:bg-zinc-50 p-1 rounded block"
                      >
                        {lead.price_level || <em className="text-zinc-800">empty</em>}
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
                        className="w-full h-8 px-2 border-2 border-brand focus:outline-none rounded-lg text-xs bg-white"
                      />
                    ) : (
                      <span 
                        onDoubleClick={() => handleStartEdit(lead.id, "summary", lead.summary)}
                        className="cursor-pointer hover:bg-zinc-50 p-1 rounded block truncate"
                        title={lead.summary}
                      >
                        {lead.summary || <em className="text-zinc-800">empty</em>}
                      </span>
                    )}
                  </td>

                  {/* Hero Image */}
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      {lead.hero_url ? (
                        <a href={lead.hero_url} target="_blank" rel="noopener noreferrer" className="shrink-0">
                          <img src={lead.hero_url} alt="Hero" className="w-8 h-8 rounded object-cover border border-zinc-200 shadow-sm hover:scale-150 transition-transform" />
                        </a>
                      ) : (
                        <div className="w-8 h-8 rounded bg-zinc-100 border border-zinc-200 border-dashed flex items-center justify-center shrink-0">
                          <span className="text-[8px] text-zinc-500 font-bold">NONE</span>
                        </div>
                      )}
                      <div className="relative overflow-hidden shrink-0">
                        <Button size="sm" variant="outline" className="h-7 text-[10px] px-2 bg-white">
                          Upload
                        </Button>
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={(e) => handleHeroImageUpload(e, lead.id)}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </div>
                    </div>
                  </td>

                  {/* Assignee */}
                  <td className="px-4 py-2">
                    {editingCell?.id === lead.id && editingCell?.field === "assign_to" ? (
                      <select
                        value={editValue}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditValue(val);
                          handleSaveCell(lead.id, "assign_to", val);
                        }}
                        onBlur={() => setEditingCell(null)}
                        autoFocus
                        className="w-full h-8 px-1 border-2 border-brand focus:outline-none rounded-lg text-xs font-semibold bg-white"
                      >
                        <option value="">Unassigned</option>
                        {agents.map((agent) => (
                          <option key={agent.email} value={agent.email}>
                            {agent.full_name || agent.email}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span 
                        onClick={() => handleStartEdit(lead.id, "assign_to", lead.assign_to)}
                        className="cursor-pointer hover:bg-zinc-100 hover:text-zinc-950 p-1.5 rounded block text-zinc-500 font-bold border border-zinc-100 truncate"
                      >
                        {lead.assigned_user?.full_name || lead.assign_to || <em className="text-zinc-700 font-normal">Unassigned</em>}
                      </span>
                    )}
                  </td>

                  {/* Onboarding Status */}
                  <td className="px-4 py-2">
                    {editingCell?.id === lead.id && editingCell?.field === "onboarding_status" ? (
                      <select
                        value={editValue}
                        onChange={(e) => handleSaveCell(lead.id, "onboarding_status", e.target.value)}
                        onBlur={() => setEditingCell(null)}
                        autoFocus
                        className="w-full h-8 px-2 border-2 border-brand focus:outline-none rounded-lg text-[10px] uppercase font-bold bg-white"
                      >
                        <option value="DISCOVERED">Discovered</option>
                        <option value="ASSIGNED">Assigned</option>
                        <option value="FIELD_VERIFIED">Field Verified</option>
                        <option value="PROFILE_COMPLETED">Profile Completed</option>
                        <option value="PENDING_APPROVAL">Pending Approval</option>
                        <option value="ACTIVE">Active</option>
                        <option value="REJECTED">Rejected</option>
                        <option value="ON_HOLD">On Hold</option>
                      </select>
                    ) : (
                      <span 
                        onDoubleClick={() => handleStartEdit(lead.id, "onboarding_status", lead.onboarding_status)}
                        className={`cursor-pointer hover:opacity-80 px-2 py-1 rounded-[6px] block w-fit text-[9px] uppercase font-bold tracking-wider shadow-sm border border-black/5 ${
                          lead.onboarding_status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' :
                          lead.onboarding_status === 'DISCOVERED' ? 'bg-blue-100 text-blue-700' :
                          lead.onboarding_status === 'PENDING_APPROVAL' ? 'bg-amber-100 text-amber-700' :
                          ['REJECTED', 'ON_HOLD'].includes(lead.onboarding_status || "") ? 'bg-rose-100 text-rose-700' :
                          'bg-indigo-100 text-indigo-700'
                        }`}
                      >
                        {(lead.onboarding_status || "DISCOVERED").replace(/_/g, ' ')}
                      </span>
                    )}
                  </td>

                  {/* System Status (Activation) */}
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded-[6px] block w-fit text-[9px] uppercase font-bold tracking-wider shadow-sm border border-black/5 ${
                      lead.activation_status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' :
                      'bg-zinc-100 text-zinc-700'
                    }`}>
                      {lead.activation_status || "INACTIVE"}
                    </span>
                  </td>
                  
                  {/* Working Hours */}
                  <td className="px-4 py-2">
                    <div className="text-[10px] text-zinc-500 font-mono truncate max-w-[200px]">
                      {lead.working_hours && lead.working_hours !== "[]" ? "Configured" : "None"}
                    </div>
                  </td>

                  {/* Created At */}
                  <td className="px-4 py-2 text-zinc-500 font-mono text-[10px]">
                    {new Date(lead.created_at).toLocaleString()}
                  </td>

                  {/* Updated At */}
                  <td className="px-4 py-2 text-zinc-500 font-mono text-[10px]">
                    {new Date(lead.updated_at).toLocaleString()}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-2 pr-6 text-center">
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                      {(lead.onboarding_status || "DISCOVERED") === "DISCOVERED" && (
                        <>
                          <Button
                            onClick={() => handleCreateSalon(lead)}
                            size="sm"
                            className="bg-white hover:bg-zinc-800 text-zinc-900 hover:text-white font-bold h-7 px-2.5 rounded-lg text-[10px] uppercase tracking-tighter flex items-center gap-1 border-none shadow-sm"
                          >
                            <Zap className="w-3 h-3" /> Create Salon
                          </Button>
                          <Button 
                            onClick={() => handleDeleteLead(lead.id)}
                            variant="ghost" 
                            size="icon" 
                            className="w-7 h-7 rounded-lg text-zinc-700 hover:text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </>
                      )}
                      {(lead.onboarding_status === "AUTO_PROVISIONED" || lead.onboarding_status === "DRAFT_REVIEW") && (
                        <>
                          <Button
                            onClick={() => handleOpenAssignModal(lead)}
                            size="sm"
                            className="bg-brand hover:bg-brand-hover text-black font-bold h-7 px-2.5 rounded-lg text-[10px] uppercase tracking-tighter flex items-center gap-1 border-none shadow-sm"
                          >
                            Edit
                          </Button>
                          <Button
                            onClick={() => handleSendToAgent(lead)}
                            size="sm"
                            className="bg-white hover:bg-zinc-800 text-zinc-900 hover:text-white font-bold h-7 px-2.5 rounded-lg text-[10px] uppercase tracking-tighter flex items-center gap-1 border-none shadow-sm"
                          >
                            <Send className="w-3 h-3" /> Send to Agent
                          </Button>
                        </>
                      )}
                      {lead.onboarding_status === "PENDING_ADMIN_VERIFICATION" && (
                        <>
                          <Button
                            onClick={() => handleVerifySalon(lead)}
                            disabled={verifying}
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold h-7 px-3 rounded-lg text-[10px] uppercase tracking-wider flex items-center gap-1 border-none shadow-md"
                          >
                            <CheckCircle2 className="w-3 h-3" /> Verify
                          </Button>
                          <Button
                            onClick={() => { setRejectTarget(lead); setShowRejectModal(true); }}
                            size="sm"
                            variant="outline"
                            className="border-rose-200 text-rose-600 hover:bg-rose-50 font-bold h-7 px-3 rounded-lg text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-sm"
                          >
                            <AlertCircle className="w-3 h-3" /> Reject
                          </Button>
                        </>
                      )}
                      {lead.onboarding_status === "VERIFIED" && (
                        <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold uppercase text-[9px] px-2.5 py-1 flex items-center gap-1">
                          <Shield className="w-3 h-3" /> Live Salon
                        </Badge>
                      )}
                      {lead.onboarding_status === "REJECTED" && (
                        <Badge className="bg-rose-50 text-rose-600 border border-rose-200 font-bold uppercase text-[9px] px-2.5 py-1">
                          Rejected
                        </Badge>
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
  );
}
