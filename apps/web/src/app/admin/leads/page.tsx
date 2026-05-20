"use client";

import React, { useState, useEffect } from "react";
import { 
  Users, 
  Search, 
  Filter, 
  Plus,
  Mail,
  Phone,
  MapPin,
  Clock,
  ChevronRight,
  Loader2,
  ScanSearch,
  Zap,
  Target,
  Globe,
  Star,
  DollarSign,
  X,
  Table,
  Trash2,
  Compass,
  UserCheck,
  Hash
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { supabase } from "@/config/supabase";
import { toast } from "sonner";

// Sri Lankan Hierarchical Geography Dictionary
const SRI_LANKA_GEOGRAPHY: any = {
  "Western Province": {
    "Colombo": ["Colombo", "Mount Lavinia", "Dehiwala", "Moratuwa", "Kotte", "Battaramulla", "Nugegoda", "Kolonnawa"],
    "Gampaha": ["Gampaha", "Negombo", "Kelaniya", "Wattala", "Kiribathgoda", "Ja-Ela", "Kadawatha"],
    "Kalutara": ["Kalutara", "Panadura", "Horana", "Beruwala", "Aluthgama"]
  },
  "Central Province": {
    "Kandy": ["Kandy", "Peradeniya", "Gampola", "Katugastota"],
    "Matale": ["Matale", "Dambulla", "Sigiriya"],
    "Nuwara Eliya": ["Nuwara Eliya", "Hatton", "Talawakele"]
  },
  "Southern Province": {
    "Galle": ["Galle", "Hikkaduwa", "Ambalangoda", "Unawatuna"],
    "Matara": ["Matara", "Weligama", "Mirissa"],
    "Hambantota": ["Hambantota", "Tangalle", "Beliatta"]
  },
  "North Western Province": {
    "Kurunegala": ["Kurunegala", "Kuliyapitiya"],
    "Puttalam": ["Puttalam", "Chilaw", "Marawila"]
  },
  "Sabaragamuwa Province": {
    "Ratnapura": ["Ratnapura", "Balangoda"],
    "Kegalle": ["Kegalle", "Mawanella"]
  },
  "Eastern Province": {
    "Trincomalee": ["Trincomalee"],
    "Batticaloa": ["Batticaloa"],
    "Ampara": ["Ampara"]
  },
  "North Central Province": {
    "Anuradhapura": ["Anuradhapura"],
    "Polonnaruwa": ["Polonnaruwa"]
  },
  "Uva Province": {
    "Badulla": ["Badulla", "Bandarawela", "Ella"],
    "Monaragala": ["Monaragala"]
  },
  "Northern Province": {
    "Jaffna": ["Jaffna", "Chavakachcheri"],
    "Vavuniya": ["Vavuniya"],
    "Mannar": ["Mannar"],
    "Mullaitivu": ["Mullaitivu"],
    "Kilinochchi": ["Kilinochchi"]
  }
};

const DISCOVERY_CATEGORIES = [
  { value: "Barber Salon", label: "Barber Salon" },
  { value: "Beauty Parlours", label: "Beauty Parlours" },
  { value: "Bridal & Beauty", label: "Bridal & Beauty" },
  { value: "Nail Studio", label: "Nail Studio" },
  { value: "Skincare Clinics", label: "Skincare Clinics" },
  { value: "Spa & Wellness", label: "Spa & Wellness" },
  { value: "Yoga Studio", label: "Yoga Studio" },
  { value: "Men's Grooming", label: "Men's Grooming" },
  { value: "Kids & Family", label: "Kids & Family" },
  { value: "Tattoo Studio", label: "Tattoo Studio" }
];

export default function Leads() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [agents, setAgents] = useState<any[]>([]);
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState<'discovery' | 'pipeline' | 'pending' | 'archived'>('discovery');
  
  // Spreadsheet Sheet Editing States
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState<any>("");

  // Google Places Discovery States (Permanently Visible)
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Barber Salon");
  const [fetchLimit, setFetchLimit] = useState(15);
  const [discovering, setDiscovering] = useState(false);

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
    fetchAgents();
  }, []);

  // Reset dependent geography dropdowns when parent changes
  useEffect(() => {
    setSelectedDistrict("");
    setSelectedCity("");
  }, [selectedProvince]);

  useEffect(() => {
    setSelectedCity("");
  }, [selectedDistrict]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("salon_leads")
        .select(`
          *,
          assigned_user:users!assign_to(full_name, email)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      setLeads(data || []);
    } catch (error: any) {
      toast.error("Failed to load leads: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAgents = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("email, full_name, global_role")
        .in("global_role", ["agent", "admin"]);
      
      if (error) throw error;
      setAgents(data || []);
    } catch (error: any) {
      console.error("Failed to load agents", error);
    }
  };

  // Google Places API Discovery & Incremental Upsert trigger
  const handleDiscoverLeads = async () => {
    if (!selectedProvince || !selectedDistrict || !selectedCity) {
      toast.error("Please select a Province, District, and City to discover salons!");
      return;
    }

    try {
      setDiscovering(true);
      toast.loading(`Discovering and incrementally updating salons in ${selectedCity}...`, { id: "google_discovery" });

      const response = await fetch("/api/discover-leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          province: selectedProvince,
          district: selectedDistrict,
          city: selectedCity,
          category: selectedCategory,
          limit: fetchLimit
        })
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.error || "Failed to query Google Places");
      }

      toast.success(resData.message || "Salons updated successfully!", { id: "google_discovery" });
      fetchLeads();
    } catch (error: any) {
      toast.error("Google Discovery failed: " + error.message, { id: "google_discovery" });
    } finally {
      setDiscovering(false);
    }
  };

  const logActivity = async (leadId: string, action: string, notes: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const currentEmail = user?.email || "admin@trimma.lk";
      
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
      lead_status: lead.lead_status || "NEW",
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

      let finalStatus = formData.status;
      if (formData.assign_to && formData.status === "new") {
        finalStatus = "assigned";
      } else if (!formData.assign_to && formData.status === "assigned") {
        finalStatus = "new";
      }

      let finalLeadStatus = formData.lead_status;
      if (formData.assign_to && (formData.lead_status === "NEW" || formData.lead_status === "UNDER_REVIEW")) {
        finalLeadStatus = "ASSIGNED_TO_AGENT";
      } else if (!formData.assign_to && formData.lead_status === "ASSIGNED_TO_AGENT") {
        finalLeadStatus = "NEW";
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
        assign_to: formData.assign_to || null,
        role: formData.role || "salon_owner",
        status: finalStatus,
        lead_status: finalLeadStatus,
        onboarding_stage: formData.onboarding_stage,
        lead_score: parseInt(formData.lead_score) || 0
      };

      const { error } = await supabase
        .from("salon_leads")
        .update(updatePayload)
        .eq("id", selectedLead.id);

      if (error) throw error;

      // Log the update activity
      await logActivity(selectedLead.id, "LEAD_UPDATED", "Lead details updated via Admin Editor Form.");

      toast.success("Lead changes fully committed to DB!");
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
    setEditingCell({ id: leadId, field });
    setEditValue(val || "");
  };

  const handleSaveCell = async (leadId: string, field: string, newValue: any) => {
    let updatePayload: any = { [field]: newValue === "" ? null : newValue };
    
    if (field === "assign_to") {
      const currentLead = leads.find(l => l.id === leadId);
      const prevStatus = currentLead?.lead_status || "NEW";
      if (newValue && (prevStatus === "NEW" || prevStatus === "UNDER_REVIEW")) {
        updatePayload.lead_status = "ASSIGNED_TO_AGENT";
        updatePayload.status = "assigned";
      } else if (!newValue && prevStatus === "ASSIGNED_TO_AGENT") {
        updatePayload.lead_status = "NEW";
        updatePayload.status = "new";
      }
    }

    try {
      const { error } = await supabase
        .from("salon_leads")
        .update(updatePayload)
        .eq("id", leadId);

      if (error) throw error;
      
      // Log inline cell update
      await logActivity(leadId, "CELL_UPDATED", `Spreadsheet cell '${field}' updated inline to '${newValue || "empty"}'.`);

      toast.success("Cell updated!");
      
      setLeads(prev => prev.map(l => {
        if (l.id === leadId) {
          const updated = { ...l, ...updatePayload };
          if (field === "assign_to") {
            const ag = agents.find(a => a.email === newValue);
            updated.assigned_user = ag ? { full_name: ag.full_name, email: ag.email } : null;
          }
          return updated;
        }
        return l;
      }));
    } catch (error: any) {
      toast.error("Save failed: " + error.message);
    } finally {
      setEditingCell(null);
    }
  };

  // Add lead row manually: Instantly creates a draft row in DB and opens the Editor Form modal immediately!
  const handleAddNewLead = async () => {
    try {
      const tempPlaceId = "manual_" + Date.now();
      const newLeadPayload = {
        place_id: tempPlaceId,
        name: "New Salon Lead",
        status: "new",
        role: "salon_owner"
      };

      const { data, error } = await supabase
        .from("salon_leads")
        .insert([newLeadPayload])
        .select();

      if (error) throw error;
      
      const createdLead = data[0];
      toast.success("New lead draft created! Opening editor form...");
      
      await fetchLeads();
      handleOpenAssignModal(createdLead);
    } catch (error: any) {
      toast.error("Failed to create manual lead draft: " + error.message);
    }
  };

  // Simple, robust client-side CSV parser
  const parseCSV = (text: string) => {
    const lines = text.split(/\r?\n/);
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(",").map(h => h.trim().replace(/^["']|["']$/g, "").toLowerCase());
    const results = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = [];
      let current = "";
      let inQuotes = false;
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim().replace(/^["']|["']$/g, ""));
          current = "";
        } else {
          current += char;
        }
      }
      values.push(current.trim().replace(/^["']|["']$/g, ""));
      
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || "";
      });
      results.push(row);
    }
    return results;
  };

  // Handles CSV Upload, Maps CSV columns, and bulk-inserts into salon_leads
  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const rawRows = parseCSV(text);
        
        if (rawRows.length === 0) {
          toast.error("CSV file is empty or has invalid headers.");
          return;
        }

        const leadsToInsert = rawRows.map((row, idx) => {
          const tempPlaceId = row.place_id || row.google_place_id || `csv_${Date.now()}_${idx}`;
          return {
            place_id: tempPlaceId,
            name: row.name || row.salon_name || row.business_name || "Imported Salon Opportunity",
            category: row.category || row.type || null,
            address: row.address || row.location || null,
            phone: row.phone || row.contact || null,
            website: row.website || row.url || null,
            rating: row.rating ? parseFloat(row.rating) : null,
            latitude: row.latitude ? parseFloat(row.latitude) : null,
            longitude: row.longitude ? parseFloat(row.longitude) : null,
            price_level: row.price_level || null,
            summary: row.summary || row.description || null,
            role: row.role || "salon_owner",
            status: row.status || "new"
          };
        });

        toast.loading(`Importing ${leadsToInsert.length} leads in bulk...`, { id: "csv_upload" });

        const { error } = await supabase
          .from("salon_leads")
          .insert(leadsToInsert);

        if (error) throw error;

        toast.success(`Successfully imported ${leadsToInsert.length} leads!`, { id: "csv_upload" });
        fetchLeads();
      } catch (error: any) {
        toast.error("Bulk CSV import failed: " + error.message, { id: "csv_upload" });
      }
    };
    reader.readAsText(file);
    e.target.value = "";
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

  // Publish lead as a live salon owner business
  const handlePublishLead = async (lead: any) => {
    try {
      toast.loading(`Publishing "${lead.name}" as live Salon owner...`, { id: "publish_lead" });

      // Generate slug from salon name
      const slug = lead.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");

      // 1. Retrieve the "Free" subscription plan ID
      const { data: freePlan } = await supabase
        .from("subscription_plans")
        .select("id")
        .eq("name", "Free")
        .maybeSingle();

      let freePlanId = freePlan?.id;
      if (!freePlanId) {
        const { data: anyPlan } = await supabase
          .from("subscription_plans")
          .select("id")
          .limit(1)
          .maybeSingle();
        freePlanId = anyPlan?.id;
      }

      // 2. Insert the Live Salon record in DRAFT state (Golden Rule 1)
      const { error: salonError } = await supabase
        .from("salons")
        .insert({
          name: lead.name,
          slug: slug,
          owner_email: `owner-${slug}@trimma.io`, // unique default email format for pre-populating profile pairing
          province: selectedProvince || "Western Province",
          district: selectedDistrict || "Colombo",
          city: lead.address || selectedCity || "Colombo",
          subscription_plan_id: freePlanId || null,
          status: "DRAFT" // Enforces RLS, invisible to public search until claimed/verified by owner
        });

      if (salonError) throw salonError;

      // 3. Update status in salon_leads to converted and pipeline stages
      const { error: statusError } = await supabase
        .from("salon_leads")
        .update({ 
          status: "converted", // legacy backward-compatibility
          lead_status: "INTERESTED",
          onboarding_stage: "CONVERTED"
        })
        .eq("id", lead.id);

      if (statusError) throw statusError;

      // Log the lead conversion audit trail
      await logActivity(lead.id, "LEAD_CONVERTED", `Lead converted. Salon created in DRAFT state with owner email owner-${slug}@trimma.io.`);

      toast.success(`Successfully published "${lead.name}"! Created in DRAFT state under owner-${slug}@trimma.io 🚀`, { id: "publish_lead" });
      fetchLeads();
    } catch (error: any) {
      toast.error("Failed to publish lead: " + error.message, { id: "publish_lead" });
    }
  };

  const handleSendToAgent = async (lead: any) => {
    if (!lead.assign_to) {
      toast.error(`Please select an Agent in the "Assignee (Agent)" column for "${lead.name}" first!`);
      // Start inline cell edit on click to guide the admin
      handleStartEdit(lead.id, "assign_to", lead.assign_to);
      return;
    }

    try {
      toast.loading(`Sending "${lead.name}" to agent...`, { id: "send_to_agent" });

      const agentUser = agents.find(a => a.email === lead.assign_to);
      const agentLabel = agentUser ? agentUser.full_name || agentUser.email : lead.assign_to;

      const { error } = await supabase
        .from("salon_leads")
        .update({ 
          status: "assigned", // legacy backward compatibility
          lead_status: "ASSIGNED_TO_AGENT",
          onboarding_stage: "NOT_STARTED"
        })
        .eq("id", lead.id);

      if (error) throw error;

      // Log assignment activity
      await logActivity(lead.id, "AGENT_ASSIGNED", `Lead assigned and routed to agent: ${agentLabel}.`);

      toast.success(`Successfully sent "${lead.name}" to ${agentLabel}! Removed from discovery list. 🚀`, { id: "send_to_agent" });
      fetchLeads();
    } catch (error: any) {
      toast.error("Failed to send lead to agent: " + error.message, { id: "send_to_agent" });
    }
  };

  // Filter leads based on the current active tab and search query
  const tabLeads = leads.filter(l => {
    const leadStatus = l.lead_status || "NEW";
    const onboardingStage = l.onboarding_stage || "NOT_STARTED";
    
    if (activeTab === "discovery") {
      return leadStatus === "NEW" || leadStatus === "UNDER_REVIEW";
    } else if (activeTab === "pipeline") {
      return ["ASSIGNED_TO_AGENT", "CONTACTED", "INTERESTED", "NOT_INTERESTED"].includes(leadStatus) && 
             onboardingStage !== "SUBMITTED_FOR_APPROVAL" && 
             onboardingStage !== "CONVERTED";
    } else if (activeTab === "pending") {
      return onboardingStage === "SUBMITTED_FOR_APPROVAL";
    } else if (activeTab === "archived") {
      return leadStatus === "REJECTED" || leadStatus === "DUPLICATE" || onboardingStage === "CONVERTED";
    }
    return true;
  });

  const filteredLeads = tabLeads.filter(l => 
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
          <h1 className="text-2xl font-black text-[#1A1C29] tracking-tight">Lead Intelligence Terminal</h1>
          <p className="text-zinc-500 text-sm mt-1">Acquire, assign and convert salon opportunities.</p>
        </div>
      </div>

      {/* STATS CARDS & SEARCH BAR - MOVED ABOVE THE DISCOVERY FORM */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 border-none shadow-sm flex items-center gap-4 bg-white rounded-2xl">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-0.5">Total Leads</p>
            <p className="text-xl font-black text-[#1A1C29]">{leads.length}</p>
          </div>
        </Card>
        <Card className="p-4 border-none shadow-sm flex items-center gap-4 bg-white rounded-2xl">
          <div className="w-10 h-10 rounded-xl bg-[#D81E5B]/10 flex items-center justify-center text-[#D81E5B]">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-0.5">Conversion</p>
            <p className="text-xl font-black text-[#1A1C29]">
               {leads.length > 0 ? Math.round((leads.filter(l => l.status === 'converted').length / leads.length) * 100) : 0}%
            </p>
          </div>
        </Card>
        <div className="md:col-span-2 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by salon name, city or contact number..." 
            className="w-full pl-12 h-14 bg-white border-none shadow-sm rounded-2xl focus:ring-2 focus:ring-[#D81E5B]/20 transition-all font-medium"
          />
        </div>
      </div>

      {/* PERMANENT DEDICATED GOOGLE PLACES DISCOVERY FORM CARD */}
      <Card className="p-6 border-none shadow-sm rounded-3xl bg-white border border-zinc-100">
        <div className="mb-4">
          <h3 className="font-bold text-[#1A1C29] text-base flex items-center gap-2">
            <ScanSearch className="w-5 h-5 text-[#D81E5B]" /> Google Places Lead Discovery
          </h3>
          <p className="text-zinc-400 text-xs mt-0.5">Select a destination in Sri Lanka to query Google Maps and perform intelligent incremental updates on duplicates.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
          {/* Province Dropdown */}
          <div className="space-y-1.5">
            <label className="font-bold text-zinc-500 uppercase text-[9px] tracking-wide flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-zinc-400" /> 1. Province
            </label>
            <select
              value={selectedProvince}
              onChange={(e) => setSelectedProvince(e.target.value)}
              className="w-full h-11 px-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D81E5B]/20 text-xs font-semibold text-zinc-800 shadow-sm"
            >
              <option value="">Choose Province...</option>
              {Object.keys(SRI_LANKA_GEOGRAPHY).map((prov) => (
                <option key={prov} value={prov}>{prov}</option>
              ))}
            </select>
          </div>

          {/* District Dropdown */}
          <div className="space-y-1.5">
            <label className="font-bold text-zinc-500 uppercase text-[9px] tracking-wide flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-zinc-400" /> 2. District
            </label>
            <select
              value={selectedDistrict}
              disabled={!selectedProvince}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full h-11 px-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D81E5B]/20 text-xs font-semibold text-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              <option value="">Choose District...</option>
              {selectedProvince && Object.keys(SRI_LANKA_GEOGRAPHY[selectedProvince]).map((dist) => (
                <option key={dist} value={dist}>{dist}</option>
              ))}
            </select>
          </div>

          {/* City Dropdown */}
          <div className="space-y-1.5">
            <label className="font-bold text-zinc-500 uppercase text-[9px] tracking-wide flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-zinc-400" /> 3. City
            </label>
            <select
              value={selectedCity}
              disabled={!selectedDistrict}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full h-11 px-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D81E5B]/20 text-xs font-semibold text-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              <option value="">Choose City...</option>
              {selectedProvince && selectedDistrict && SRI_LANKA_GEOGRAPHY[selectedProvince][selectedDistrict].map((cty: string) => (
                <option key={cty} value={cty}>{cty}</option>
              ))}
            </select>
          </div>

          {/* Search Category */}
          <div className="space-y-1.5">
            <label className="font-bold text-zinc-500 uppercase text-[9px] tracking-wide flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-zinc-400" /> 4. Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full h-11 px-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D81E5B]/20 text-xs font-semibold text-zinc-800 shadow-sm"
            >
              {DISCOVERY_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          {/* Fetch Limit Selector */}
          <div className="space-y-1.5">
            <label className="font-bold text-zinc-500 uppercase text-[9px] tracking-wide flex items-center gap-1">
              <Hash className="w-3.5 h-3.5 text-zinc-400" /> 5. Fetch Limit
            </label>
            <Input 
              type="number"
              min={1}
              max={60}
              value={fetchLimit}
              onChange={(e) => setFetchLimit(Math.max(1, parseInt(e.target.value) || 15))}
              className="w-full h-11 px-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D81E5B]/20 text-xs font-semibold text-zinc-800 shadow-sm"
            />
          </div>

          {/* Fetch Action Button */}
          <Button
            onClick={handleDiscoverLeads}
            disabled={discovering || !selectedCity}
            className="w-full bg-[#1A1C29] hover:bg-zinc-800 text-white rounded-xl font-bold h-11 shadow-md flex items-center justify-center gap-2 text-xs disabled:opacity-50"
          >
            {discovering ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                <span>Upserting Salons...</span>
              </>
            ) : (
              <>
                <ScanSearch className="w-4 h-4 shrink-0 text-amber-500" />
                <span>Start Fetching & Upsert</span>
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* PERMANENT INTERACTIVE SPREADSHEET VIEW WITH ALL DB COLUMNS */}
      <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
        <div className="p-5 border-b border-zinc-50 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-[#1A1C29] text-base">Interactive Lead Sheet</h3>
            <p className="text-zinc-400 text-xs mt-0.5">Exactly aligned with your DB schema columns. Automatically populated by Google Places searches and fully editable by the admin.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-1.5 bg-zinc-100/80 p-1.5 rounded-2xl shrink-0 self-start xl:self-auto">
            <button
              onClick={() => setActiveTab("discovery")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                activeTab === "discovery" 
                  ? "bg-white text-[#D81E5B] shadow-sm" 
                  : "text-zinc-500 hover:text-zinc-950"
              }`}
            >
              1. Discovery ({leads.filter(l => (l.lead_status || "NEW") === "NEW" || l.lead_status === "UNDER_REVIEW").length})
            </button>
            <button
              onClick={() => setActiveTab("pipeline")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                activeTab === "pipeline" 
                  ? "bg-white text-[#D81E5B] shadow-sm" 
                  : "text-zinc-500 hover:text-zinc-950"
              }`}
            >
              2. Pipeline ({leads.filter(l => ["ASSIGNED_TO_AGENT", "CONTACTED", "INTERESTED", "NOT_INTERESTED"].includes(l.lead_status || "NEW") && l.onboarding_stage !== "SUBMITTED_FOR_APPROVAL" && l.onboarding_stage !== "CONVERTED").length})
            </button>
            <button
              onClick={() => setActiveTab("pending")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all relative ${
                activeTab === "pending" 
                  ? "bg-white text-[#D81E5B] shadow-sm" 
                  : "text-zinc-500 hover:text-zinc-950"
              }`}
            >
              3. Pending Approvals ({leads.filter(l => l.onboarding_stage === "SUBMITTED_FOR_APPROVAL").length})
              {leads.some(l => l.onboarding_stage === "SUBMITTED_FOR_APPROVAL") && (
                <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-rose-600 rounded-full flex items-center justify-center text-[7px] text-white font-extrabold animate-pulse">
                  !
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("archived")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                activeTab === "archived" 
                  ? "bg-white text-[#D81E5B] shadow-sm" 
                  : "text-zinc-500 hover:text-zinc-950"
              }`}
            >
              4. Archived / Converted ({leads.filter(l => l.lead_status === "REJECTED" || l.lead_status === "DUPLICATE" || l.onboarding_stage === "CONVERTED").length})
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
                <th className="px-4 py-2 w-48">Pipeline Status</th>
                <th className="px-4 py-2 w-48">Onboarding Stage</th>
                <th className="px-4 py-2 w-28">Score</th>
                <th className="px-4 py-2 w-36">Role</th>
                <th className="px-4 py-2 w-72">Opening Hours</th>
                <th className="px-4 py-2 w-48">Created At</th>
                <th className="px-4 py-2 w-48">Updated At</th>
                <th className="px-4 py-2 pr-6 text-center w-[280px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50 font-medium text-zinc-700">
              {loading ? (
                <tr>
                  <td colSpan={21} className="text-center py-20 opacity-40">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#D81E5B]" />
                    <span>Loading leads database...</span>
                  </td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={21} className="text-center py-20 text-zinc-300">
                    No leads found matching your search.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-zinc-50/50 transition-colors h-12">
                    {/* ID (Read-only) */}
                    <td className="px-4 py-2 pl-6 font-mono text-[10px] text-zinc-400 select-all">
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
                          className="w-full h-8 px-2 border-2 border-[#D81E5B] focus:outline-none rounded-lg text-[10px] bg-white font-mono"
                        />
                      ) : (
                        <span 
                          onDoubleClick={() => handleStartEdit(lead.id, "place_id", lead.place_id)}
                          className="cursor-pointer hover:bg-zinc-50 p-1 rounded block truncate"
                        >
                          {lead.place_id || <em className="text-zinc-200">empty</em>}
                        </span>
                      )}
                    </td>

                    {/* Name */}
                    <td className="px-4 py-2 font-bold text-[#1A1C29]">
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
                          className="w-full h-8 px-2 border-2 border-[#D81E5B] focus:outline-none rounded-lg text-xs font-semibold bg-white"
                        />
                      ) : (
                        <span 
                          onClick={() => handleOpenAssignModal(lead)}
                          title="Click to open full form editor"
                          className="cursor-pointer hover:text-[#D81E5B] hover:underline p-1 rounded block truncate"
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
                          className="w-full h-8 px-2 border-2 border-[#D81E5B] focus:outline-none rounded-lg text-xs font-semibold bg-white"
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
                          className="w-full h-8 px-2 border-2 border-[#D81E5B] focus:outline-none rounded-lg text-xs font-semibold bg-white"
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
                          className="w-full h-8 px-2 border-2 border-[#D81E5B] focus:outline-none rounded-lg text-xs font-semibold bg-white"
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
                          className="w-full h-8 px-2 border-2 border-[#D81E5B] focus:outline-none rounded-lg text-xs font-semibold bg-white"
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
                          className="w-full h-8 px-2 border-2 border-[#D81E5B] focus:outline-none rounded-lg text-xs font-semibold bg-white"
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
                          className="w-full h-8 px-2 border-2 border-[#D81E5B] focus:outline-none rounded-lg text-xs font-semibold bg-white"
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
                          className="w-full h-8 px-2 border-2 border-[#D81E5B] focus:outline-none rounded-lg text-[10px] bg-white"
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
                          className="w-full h-8 px-2 border-2 border-[#D81E5B] focus:outline-none rounded-lg text-[10px] bg-white"
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
                          className="w-full h-8 px-2 border-2 border-[#D81E5B] focus:outline-none rounded-lg text-xs font-semibold bg-white"
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
                          className="w-full h-8 px-2 border-2 border-[#D81E5B] focus:outline-none rounded-lg text-xs bg-white"
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
                          className="w-full h-8 px-2 border-2 border-[#D81E5B] focus:outline-none rounded-lg text-[10px] bg-white"
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
                          className="w-full h-8 px-1 border-2 border-[#D81E5B] focus:outline-none rounded-lg text-xs font-semibold bg-white"
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
                          {lead.assigned_user?.full_name || lead.assign_to || <em className="text-zinc-300 font-normal">Unassigned</em>}
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
                          className="w-full h-8 px-1 border-2 border-[#D81E5B] focus:outline-none rounded-lg text-xs font-semibold bg-white"
                        >
                          <option value="NEW">NEW</option>
                          <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                          <option value="ASSIGNED_TO_AGENT">ASSIGNED_TO_AGENT</option>
                          <option value="CONTACTED">CONTACTED</option>
                          <option value="INTERESTED">INTERESTED</option>
                          <option value="NOT_INTERESTED">NOT_INTERESTED</option>
                          <option value="REJECTED">REJECTED</option>
                          <option value="DUPLICATE">DUPLICATE</option>
                        </select>
                      ) : (
                        <span 
                          onClick={() => handleStartEdit(lead.id, "lead_status", lead.lead_status || "NEW")}
                          className="cursor-pointer hover:opacity-85 p-1 rounded inline-block"
                        >
                          <Badge variant="outline" className={`border-none font-bold uppercase text-[9px] px-2.5 py-1 ${
                            lead.lead_status === 'INTERESTED' ? 'bg-emerald-50 text-emerald-600' :
                            lead.lead_status === 'REJECTED' || lead.lead_status === 'DUPLICATE' ? 'bg-rose-50 text-rose-600' :
                            lead.lead_status === 'NEW' ? 'bg-blue-50 text-blue-600' :
                            lead.lead_status === 'ASSIGNED_TO_AGENT' ? 'bg-indigo-50 text-indigo-600' :
                            'bg-zinc-100 text-zinc-500'
                          }`}>
                            {lead.lead_status || "NEW"}
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
                          className="w-full h-8 px-1 border-2 border-[#D81E5B] focus:outline-none rounded-lg text-xs font-semibold bg-white"
                        >
                          <option value="NOT_STARTED">NOT_STARTED</option>
                          <option value="CONTACT_ESTABLISHED">CONTACT_ESTABLISHED</option>
                          <option value="DATA_COLLECTION">DATA_COLLECTION</option>
                          <option value="SUBMITTED_FOR_APPROVAL">SUBMITTED_FOR_APPROVAL</option>
                          <option value="CONVERTED">CONVERTED</option>
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
                          className="w-full h-8 px-2 border-2 border-[#D81E5B] focus:outline-none rounded-lg text-xs font-semibold bg-white"
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
                          className="w-full h-8 px-2 border-2 border-[#D81E5B] focus:outline-none rounded-lg text-[9px] bg-white font-mono"
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

                    {/* Updated At */}
                    <td className="px-4 py-2 text-zinc-400 font-mono text-[10px]">
                      {new Date(lead.updated_at).toLocaleString()}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-2 pr-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {lead.onboarding_stage === "CONVERTED" || lead.status === "converted" ? (
                          <Badge className="bg-emerald-50 text-emerald-600 border-none font-bold uppercase text-[9px] px-2.5 py-1 flex items-center gap-1">
                            <Globe className="w-3 h-3" /> Salon Draft Created
                          </Badge>
                        ) : (
                          <>
                            {/* Publish / Approve button visible for Discovery, Pipeline, and Pending */}
                            {lead.onboarding_stage === "SUBMITTED_FOR_APPROVAL" ? (
                              <Button
                                onClick={() => handlePublishLead(lead)}
                                size="sm"
                                className="bg-[#D81E5B] hover:bg-[#b01849] text-white font-extrabold h-7 px-3.5 rounded-lg text-[10px] uppercase tracking-wider flex items-center gap-1 border-none shadow-md"
                              >
                                <Globe className="w-3 h-3 text-amber-300 animate-pulse" /> Approve & Create Draft
                              </Button>
                            ) : (
                              <>
                                {(activeTab === "discovery" || activeTab === "pipeline") && (
                                  <Button
                                    onClick={() => handleSendToAgent(lead)}
                                    size="sm"
                                    className="bg-[#1A1C29] hover:bg-zinc-800 text-white font-bold h-7 px-2.5 rounded-lg text-[10px] uppercase tracking-tighter flex items-center gap-1 border-none shadow-sm"
                                  >
                                    <UserCheck className="w-3 h-3" /> {lead.assign_to ? "Reassign Agent" : "Send to Agent"}
                                  </Button>
                                )}
                                {activeTab === "pipeline" && (
                                  <Button
                                    onClick={() => handlePublishLead(lead)}
                                    size="sm"
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-7 px-3 rounded-lg text-[10px] uppercase tracking-tighter flex items-center gap-1 border-none shadow-sm"
                                  >
                                    <Globe className="w-3 h-3" /> Force Publish
                                  </Button>
                                )}
                              </>
                            )}
                          </>
                        )}

                        {/* Delete Button */}
                        <Button 
                          onClick={() => handleDeleteLead(lead.id)}
                          variant="ghost" 
                          size="icon" 
                          className="w-7 h-7 rounded-lg text-zinc-300 hover:text-rose-600 hover:bg-rose-50"
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
                <h3 className="text-lg font-black text-[#1A1C29] tracking-tight">Full Lead Database Editor</h3>
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
                <h4 className="font-extrabold uppercase tracking-widest text-[#D81E5B] text-[10px] border-b border-rose-100 pb-1 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5" /> 1. Core Business Identity
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-zinc-500 uppercase text-[9px] tracking-wide">Salon Name</label>
                    <Input 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="e.g. Elegance Hair Salon"
                      className="h-10 rounded-xl bg-zinc-50 border-zinc-200 focus:ring-2 focus:ring-[#D81E5B]/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-zinc-500 uppercase text-[9px] tracking-wide">Category</label>
                    <Input 
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      placeholder="e.g. Hair Salon, Spa"
                      className="h-10 rounded-xl bg-zinc-50 border-zinc-200 focus:ring-2 focus:ring-[#D81E5B]/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-zinc-500 uppercase text-[9px] tracking-wide">Role</label>
                    <Input 
                      value={formData.role}
                      onChange={(e) => setFormData({...formData, role: e.target.value})}
                      placeholder="e.g. salon_owner, manager"
                      className="h-10 rounded-xl bg-zinc-50 border-zinc-200 focus:ring-2 focus:ring-[#D81E5B]/20"
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
                      className="h-10 rounded-xl bg-zinc-50 border-zinc-200 focus:ring-2 focus:ring-[#D81E5B]/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-zinc-500 uppercase text-[9px] tracking-wide">Price Level</label>
                    <Input 
                      value={formData.price_level}
                      onChange={(e) => setFormData({...formData, price_level: e.target.value})}
                      placeholder="e.g. $, $$, $$$"
                      className="h-10 rounded-xl bg-zinc-50 border-zinc-200 focus:ring-2 focus:ring-[#D81E5B]/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-zinc-500 uppercase text-[9px] tracking-wide">Place ID (Google Maps Unique Key)</label>
                    <Input 
                      value={formData.place_id}
                      onChange={(e) => setFormData({...formData, place_id: e.target.value})}
                      placeholder="e.g. ChIJ..."
                      className="h-10 rounded-xl bg-zinc-50 border-zinc-200 font-mono text-[10px] focus:ring-2 focus:ring-[#D81E5B]/20"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Contact Details & GPS Location */}
              <div className="space-y-3">
                <h4 className="font-extrabold uppercase tracking-widest text-[#D81E5B] text-[10px] border-b border-rose-100 pb-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> 2. Contacts & Geographical Coordinates
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-zinc-500 uppercase text-[9px] tracking-wide">Phone Number</label>
                    <Input 
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      placeholder="e.g. +94..."
                      className="h-10 rounded-xl bg-zinc-50 border-zinc-200 focus:ring-2 focus:ring-[#D81E5B]/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-zinc-500 uppercase text-[9px] tracking-wide">Website URL</label>
                    <Input 
                      value={formData.website}
                      onChange={(e) => setFormData({...formData, website: e.target.value})}
                      placeholder="e.g. https://..."
                      className="h-10 rounded-xl bg-zinc-50 border-zinc-200 focus:ring-2 focus:ring-[#D81E5B]/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-zinc-500 uppercase text-[9px] tracking-wide">Google Maps Link</label>
                    <Input 
                      value={formData.map_url}
                      onChange={(e) => setFormData({...formData, map_url: e.target.value})}
                      placeholder="e.g. https://maps.google.com/..."
                      className="h-10 rounded-xl bg-zinc-50 border-zinc-200 focus:ring-2 focus:ring-[#D81E5B]/20"
                    />
                  </div>
                  <div className="md:col-span-3 space-y-1">
                    <label className="font-bold text-zinc-500 uppercase text-[9px] tracking-wide">Full Physical Address</label>
                    <Input 
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      placeholder="e.g. Street Number, City Name, Province"
                      className="h-10 rounded-xl bg-zinc-50 border-zinc-200 focus:ring-2 focus:ring-[#D81E5B]/20"
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
                      className="h-10 rounded-xl bg-zinc-50 border-zinc-200 font-mono text-[10px] focus:ring-2 focus:ring-[#D81E5B]/20"
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
                      className="h-10 rounded-xl bg-zinc-50 border-zinc-200 font-mono text-[10px] focus:ring-2 focus:ring-[#D81E5B]/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-zinc-500 uppercase text-[9px] tracking-wide">Hero Cover Image URL</label>
                    <Input 
                      value={formData.hero_image}
                      onChange={(e) => setFormData({...formData, hero_image: e.target.value})}
                      placeholder="e.g. https://images.unsplash.com/..."
                      className="h-10 rounded-xl bg-zinc-50 border-zinc-200 focus:ring-2 focus:ring-[#D81E5B]/20"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: AI insights, Opening Hours & Pipeline Assignment */}
              <div className="space-y-3">
                <h4 className="font-extrabold uppercase tracking-widest text-[#D81E5B] text-[10px] border-b border-rose-100 pb-1 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" /> 3. Workflow, AI Summary & Opening Hours JSON
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-zinc-500 uppercase text-[9px] tracking-wide">Assign Opportunity Owner</label>
                    <select
                      value={formData.assign_to}
                      onChange={(e) => setFormData({...formData, assign_to: e.target.value})}
                      className="w-full h-11 px-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D81E5B]/20 text-sm font-semibold text-zinc-800"
                    >
                      <option value="">Unassigned</option>
                      {agents.map((agent) => (
                        <option key={agent.email} value={agent.email}>
                          {agent.full_name || agent.email} ({agent.global_role})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-zinc-500 uppercase text-[9px] tracking-wide">Pipeline Stage Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      className="w-full h-11 px-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D81E5B]/20 text-sm font-semibold text-zinc-800"
                    >
                      <option value="new">new</option>
                      <option value="assigned">assigned</option>
                      <option value="contacted">contacted</option>
                      <option value="converted">converted</option>
                      <option value="rejected">rejected</option>
                    </select>
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="font-bold text-zinc-500 uppercase text-[9px] tracking-wide">AI insights Summary / Scraper Notes</label>
                    <textarea
                      value={formData.summary}
                      onChange={(e) => setFormData({...formData, summary: e.target.value})}
                      placeholder="Enter AI insights, summary paragraphs or scraped descriptors..."
                      className="w-full min-h-[72px] p-3 rounded-xl bg-zinc-50 border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#D81E5B]/20 text-xs font-semibold leading-relaxed"
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
                      className="w-full min-h-[96px] p-3 rounded-xl bg-zinc-50 border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#D81E5B]/20 text-xs font-mono leading-relaxed"
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
              <Button 
                onClick={handleSaveChanges}
                disabled={updating}
                className="bg-[#1A1C29] hover:bg-zinc-800 text-white rounded-xl font-bold h-11 px-6 shadow-lg shadow-[#1A1C29]/20 flex items-center gap-2 text-xs"
              >
                {updating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Saving Changes...
                  </>
                ) : (
                  "Commit to Database"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
