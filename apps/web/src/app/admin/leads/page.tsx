"use client";

import React, { useState, useEffect } from "react";
import { Search, Filter, Phone, MapPin, Loader2, ScanSearch, Zap, Target, Star, X, Trash2, Compass, Hash, CheckCircle2, AlertCircle, Send, Shield, Store, Sparkles, Save, RefreshCw, UploadCloud, Scissors, User, Pencil, Check, Image as ImageIcon } from "lucide-react";
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
              className={`text-[10px] font-extrabold px-4 py-1.5 rounded-full border transition-all ${isOpen ? 'bg-emerald-100/50 text-emerald-700 border-emerald-200' : 'bg-white text-zinc-500 border-zinc-200 hover:bg-zinc-100'}`}
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
                <span className="text-zinc-500 text-xs font-medium">to</span>
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

export default function Leads() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [agents, setAgents] = useState<any[]>([]);
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState<'discovery' | 'draft' | 'pipeline' | 'archived'>('discovery');
  
  // Spreadsheet Sheet Editing States
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState<any>("");

  // Modal Tables State
  const [modalServices, setModalServices] = useState<any[]>([]);
  const [modalStaff, setModalStaff] = useState<any[]>([]);

  // Onboarding Pipeline Modal States
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [verifying, setVerifying] = useState(false);

  // Staff Inline Editing State
  const [globalRoles, setGlobalRoles] = useState<any[]>([]);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [staffEditData, setStaffEditData] = useState<any>({});

  // Google Places Discovery States (Permanently Visible)
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Barber Salon");
  const [fetchLimit, setFetchLimit] = useState(15);
  const [discovering, setDiscovering] = useState(false);

  // Full Editor Form State (covers all fields in salons for Drafts)
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
    logo_url: "",
    assign_to: "",
    onboarding_status: "DISCOVERED",
    activation_status: "INACTIVE",
    source_type: "GOOGLE_PLACES",
    admin_notes: "",
    owner_gmail: ""
  });

  const fetchGlobalRoles = async () => {
    try {
      const { data } = await supabase.from('global_staff_roles').select('*').order('category');
      if (data && data.length > 0) {
        setGlobalRoles(data);
      } else {
        setGlobalRoles([
          { role_name: "Stylist", category: "Operational" },
          { role_name: "Barber", category: "Operational" },
          { role_name: "Manager", category: "Admin" },
        ]);
      }
    } catch (e) {}
  };

  useEffect(() => {
    const cachedLeads = localStorage.getItem('trimma_admin_leads_cache');
    let initialDiscovered = [];
    if (cachedLeads) {
      try {
        initialDiscovered = JSON.parse(cachedLeads);
      } catch(e) {}
    }
    
    if (initialDiscovered.length > 0) {
      setLeads(initialDiscovered);
    }

    fetchLeads();
    fetchAgents();
    fetchGlobalRoles();
  }, []);

  useEffect(() => {
    if (!loading) {
      const discoveredOnly = leads.filter(l => l.onboarding_status === 'DISCOVERED');
      if (discoveredOnly.length > 0) {
        localStorage.setItem('trimma_admin_leads_cache', JSON.stringify(discoveredOnly));
      } else {
        localStorage.removeItem('trimma_admin_leads_cache');
      }
    }
  }, [leads, loading]);

  // Reset dependent geography dropdowns when parent changes
  useEffect(() => {
    setSelectedDistrict("");
    setSelectedCity("");
  }, [selectedProvince]);

  useEffect(() => {
    setSelectedCity("");
  }, [selectedDistrict]);

  useEffect(() => {
    if (isAssignModalOpen && formData.id) {
      fetchModalExtras(formData.id);
    }
  }, [isAssignModalOpen, formData.id]);

  const fetchModalExtras = async (id: string) => {
    try {
      const [servicesRes, staffRes] = await Promise.all([
        supabase.from('services').select('*').eq('salon_id', id).order('created_at', { ascending: false }),
        supabase.from('salon_staff').select('*').eq('salon_id', id).order('created_at', { ascending: false })
      ]);
      if (!servicesRes.error) setModalServices(servicesRes.data || []);
      if (!staffRes.error) setModalStaff(staffRes.data || []);
    } catch (err) {
      console.error("Failed to fetch modal extras", err);
    }
  };

  const handleDeleteModalService = async (serviceId: string) => {
    try {
      const { error } = await supabase.from('services').delete().eq('id', serviceId);
      if (error) throw error;
      setModalServices(prev => prev.filter(s => s.id !== serviceId));
      toast.success("Service deleted.");
    } catch (err: any) {
      toast.error("Failed to delete service: " + err.message);
    }
  };

  const handleDeleteModalStaff = async (staffId: string) => {
    try {
      const { error } = await supabase.from('salon_staff').delete().eq('id', staffId);
      if (error) throw error;
      setModalStaff(prev => prev.filter(s => s.id !== staffId));
      toast.success("Staff member deleted.");
    } catch (err: any) {
      toast.error("Failed to delete staff: " + err.message);
    }
  };

  const handleEditModalStaff = (staff: any) => {
    setEditingStaffId(staff.id);
    setStaffEditData({
      name: staff.name || '',
      role: staff.role || '',
      skill_level: staff.skill_level || ''
    });
  };

  const handleSaveModalStaff = async () => {
    if (!editingStaffId) return;
    try {
      const { error } = await supabase
        .from('salon_staff')
        .update({
          name: staffEditData.name,
          role: staffEditData.role,
          skill_level: staffEditData.skill_level
        })
        .eq('id', editingStaffId);
        
      if (error) throw error;
      
      setModalStaff(prev => prev.map(s => 
        s.id === editingStaffId ? { ...s, ...staffEditData } : s
      ));
      toast.success("Staff member updated.");
      setEditingStaffId(null);
    } catch (err: any) {
      toast.error("Failed to update staff: " + err.message);
    }
  };

  const fetchLeads = async (limit?: number) => {
    try {
      setLoading(true);
      
      const { data: pipelineData, error: pipelineError } = await supabase
        .from("salons")
        .select("*")
        .eq('activation_status', 'INACTIVE')
        .neq('onboarding_status', 'DISCOVERED')
        .order("created_at", { ascending: false });
        
      if (pipelineError) throw pipelineError;
      
      let newlyDiscovered: any[] = [];
      if (limit) {
        const { data: discoveryData, error: discoveryError } = await supabase
          .from("salons")
          .select("*")
          .eq('activation_status', 'INACTIVE')
          .eq('onboarding_status', 'DISCOVERED')
          .order("created_at", { ascending: false })
          .limit(limit);
          
        if (discoveryError) throw discoveryError;
        newlyDiscovered = discoveryData || [];
      }

      setLeads(prev => {
        const prevDiscovered = prev.filter(l => l.onboarding_status === 'DISCOVERED');
        const existingIds = new Set(prevDiscovered.map(l => l.id));
        const uniqueNew = newlyDiscovered.filter(l => !existingIds.has(l.id));
        
        const finalDiscovered = [...uniqueNew, ...prevDiscovered];
        return [...finalDiscovered, ...(pipelineData || [])];
      });

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
      await fetchLeads(fetchLimit);
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
        .from("onboarding_logs")
        .insert({
          salon_id: leadId,
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
      working_hours: lead.working_hours ? JSON.stringify(lead.working_hours, null, 2) : "[]",
      latitude: lead.latitude !== null && lead.latitude !== undefined ? String(lead.latitude) : "",
      longitude: lead.longitude !== null && lead.longitude !== undefined ? String(lead.longitude) : "",
      price_level: lead.price_level || "",
      summary: lead.summary || "",
      hero_url: lead.hero_url || "",
      logo_url: lead.logo_url || "",
      assign_to: lead.assign_to || "",
      onboarding_status: lead.onboarding_status || "DISCOVERED",
      activation_status: lead.activation_status || "INACTIVE",
      source_type: lead.source_type || "GOOGLE_PLACES",
      admin_notes: lead.admin_notes || "",
      owner_gmail: lead.owner_gmail || ""
    });
    setIsAssignModalOpen(true);
  };

  const handleSaveChanges = async () => {
    if (!selectedLead) return;
    try {
      setUpdating(true);
      
      let parsedHours = [];
      try {
        parsedHours = JSON.parse(formData.working_hours || "[]");
      } catch (e) {
        parsedHours = formData.working_hours;
      }

      let newStatus = formData.onboarding_status;
      if (formData.assign_to && ["DISCOVERED", "AUTO_PROVISIONED", "DRAFT_REVIEW"].includes(newStatus)) {
        newStatus = "ASSIGNED_TO_AGENT";
      } else if (newStatus === 'AUTO_PROVISIONED') {
        newStatus = 'DRAFT_REVIEW';
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
        working_hours: parsedHours,
        latitude: formData.latitude === "" ? null : parseFloat(formData.latitude),
        longitude: formData.longitude === "" ? null : parseFloat(formData.longitude),
        price_level: formData.price_level || null,
        summary: formData.summary || null,
        hero_url: formData.hero_url || null,
        logo_url: formData.logo_url || null,
        assign_to: formData.assign_to || null,
        onboarding_status: newStatus,
        activation_status: formData.activation_status,
        source_type: formData.source_type,
        admin_notes: formData.admin_notes || null,
        owner_gmail: formData.owner_gmail || null
      };

      const { error } = await supabase
        .from("salons")
        .update(updatePayload)
        .eq("id", selectedLead.id);

      if (error) throw error;

      // Log the update activity
      await logActivity(selectedLead.id, "LEAD_UPDATED", "Lead details updated via Admin Editor Form.");

      setLeads(prev => prev.map(l => {
        if (l.id === selectedLead.id) {
          const updated = { ...l, ...updatePayload };
          if (updatePayload.assign_to !== undefined) {
             const ag = agents.find(a => a.email === updatePayload.assign_to);
             updated.assigned_user = ag ? { full_name: ag.full_name, email: ag.email } : null;
          }
          return updated;
        }
        return l;
      }));

      toast.success("Lead changes fully committed to DB!");
      setIsAssignModalOpen(false);
      fetchLeads();
    } catch (error: any) {
      toast.error("Failed to save changes: " + error.message);
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
      const prevStatus = currentLead?.onboarding_status || "DISCOVERED";
      if (newValue && ["DISCOVERED", "AUTO_PROVISIONED", "DRAFT_REVIEW"].includes(prevStatus)) {
        updatePayload.onboarding_status = "ASSIGNED_TO_AGENT";
      } else if (!newValue && prevStatus === "ASSIGNED_TO_AGENT") {
        updatePayload.onboarding_status = "DRAFT_REVIEW";
      }
    }

    try {
      const { error } = await supabase
        .from("salons")
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

  // Convert uploaded image to WebP (16:9) and upload to Supabase
  const handleHeroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, leadId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      toast.loading("Cropping and converting to WebP...", { id: `upload_${leadId}` });
      
      // 1. Read file as Data URL to draw on canvas
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // 2. Load into image object
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = dataUrl;
      });

      // 3. Setup Canvas for 16:9 crop
      const canvas = document.createElement("canvas");
      const targetWidth = 1200;
      const targetHeight = 675; // 16:9
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext("2d");
      
      if (!ctx) throw new Error("Could not get canvas context");
      
      // Cover logic (crop to fill 16:9)
      const imgRatio = img.width / img.height;
      const targetRatio = targetWidth / targetHeight;
      
      let drawWidth = targetWidth;
      let drawHeight = targetHeight;
      let offsetX = 0;
      let offsetY = 0;
      
      if (imgRatio > targetRatio) {
        drawWidth = img.height * targetRatio;
        drawHeight = img.height;
        offsetX = (img.width - drawWidth) / 2;
      } else {
        drawWidth = img.width;
        drawHeight = img.width / targetRatio;
        offsetY = (img.height - drawHeight) / 2;
      }
      
      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight, 0, 0, targetWidth, targetHeight);
      
      // 4. Convert to WebP blob
      const webpBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Canvas toBlob failed"));
        }, "image/webp", 0.9);
      });

      // 5. Upload to Supabase Storage
      toast.loading("Uploading optimized image...", { id: `upload_${leadId}` });
      const fileName = `leads/hero_${leadId}_${Date.now()}.webp`;
      
      const { data, error } = await supabase.storage
        .from('salon-images')
        .upload(fileName, webpBlob, { cacheControl: '3600', upsert: true });

      if (error) {
        throw error;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('salon-images')
        .getPublicUrl(fileName);

      // 6. Save URL to Database
      await handleSaveCell(leadId, "hero_url", publicUrl);
      
      toast.success("Image successfully cropped to WebP and uploaded!", { id: `upload_${leadId}` });
    } catch (err: any) {
      toast.error("Upload failed: " + err.message, { id: `upload_${leadId}` });
    } finally {
      e.target.value = ""; // reset input
    }
  };

  // Unified image upload for Draft Editor Modal (Hero and Logo)
  const handleModalImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: "hero_url" | "logo_url") => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      toast.loading(`Compressing (<100KB) and uploading ${field.replace('_', ' ')}...`, { id: `upload_modal_${field}` });
      
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = dataUrl;
      });

      const canvas = document.createElement("canvas");
      // Hero: 1200x675 (16:9). Logo: 400x400 (1:1)
      const targetWidth = field === "hero_url" ? 1200 : 400;
      const targetHeight = field === "hero_url" ? 675 : 400;
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext("2d");
      
      if (!ctx) throw new Error("Could not get canvas context");
      
      const imgRatio = img.width / img.height;
      const targetRatio = targetWidth / targetHeight;
      
      let drawWidth = targetWidth;
      let drawHeight = targetHeight;
      let offsetX = 0;
      let offsetY = 0;
      
      if (imgRatio > targetRatio) {
        drawWidth = img.height * targetRatio;
        drawHeight = img.height;
        offsetX = (img.width - drawWidth) / 2;
      } else {
        drawWidth = img.width;
        drawHeight = img.width / targetRatio;
        offsetY = (img.height - drawHeight) / 2;
      }
      
      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight, 0, 0, targetWidth, targetHeight);
      
      // Convert to WebP with very low quality to guarantee < 100KB capacity
      const webpBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Canvas toBlob failed"));
        }, "image/webp", 0.4); 
      });

      const fileName = `leads/${field}_${Date.now()}.webp`;
      
      const { data, error } = await supabase.storage
        .from('salon-images')
        .upload(fileName, webpBlob, { cacheControl: '3600', upsert: true });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('salon-images')
        .getPublicUrl(fileName);

      setFormData((prev: any) => ({ ...prev, [field]: publicUrl }));
      
      toast.success(`Image optimized & uploaded! (${(webpBlob.size / 1024).toFixed(1)} KB)`, { id: `upload_modal_${field}` });
    } catch (err: any) {
      toast.error("Upload failed: " + err.message, { id: `upload_modal_${field}` });
    } finally {
      e.target.value = ""; // reset input
    }
  };

  // Add lead row manually: Instantly creates a draft row in DB and opens the Editor Form modal immediately!
  const handleAddNewLead = async () => {
    try {
      const tempPlaceId = "manual_" + Date.now();
      const slug = `manual-${Date.now()}`;
      const newLeadPayload = {
        place_id: tempPlaceId,
        name: "New Salon Draft",
        slug: slug,
        owner_email: `draft-${slug}@trimma.io`,
        onboarding_status: "DISCOVERED",
        activation_status: "INACTIVE",
        source_type: "MANUAL"
      };

      const { data, error } = await supabase
        .from("salons")
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
          const name = row.name || row.salon_name || row.business_name || "Imported Salon Opportunity";
          const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
          return {
            place_id: tempPlaceId,
            name: name,
            slug: slug,
            owner_email: `draft-${slug}-${idx}@trimma.io`,
            category: row.category || row.type || null,
            address: row.address || row.location || null,
            phone: row.phone || row.contact || null,
            website: row.website || row.url || null,
            rating: row.rating ? parseFloat(row.rating) : null,
            latitude: row.latitude ? parseFloat(row.latitude) : null,
            longitude: row.longitude ? parseFloat(row.longitude) : null,
            price_level: row.price_level || null,
            summary: row.summary || row.description || null,
            onboarding_status: row.onboarding_status || "DISCOVERED",
            activation_status: "INACTIVE",
            source_type: "CSV_IMPORT"
          };
        });

        toast.loading(`Importing ${leadsToInsert.length} draft salons in bulk...`, { id: "csv_upload" });

        const { error } = await supabase
          .from("salons")
          .insert(leadsToInsert);

        if (error) throw error;

        toast.success(`Successfully imported ${leadsToInsert.length} leads!`, { id: "csv_upload" });
        fetchLeads();
      } catch (error: any) {
        toast.error("CSV Import failed: " + error.message, { id: "csv_upload" });
      } finally {
        e.target.value = ""; // reset
      }
    };
    reader.readAsText(file);
  };

  const handleCreateSalon = async (lead: any) => {
    try {
      toast.loading(`Provisioning draft storefront for "${lead.name}"...`, { id: "provision_salon" });

      const { data: { user } } = await supabase.auth.getUser();
      const actorEmail = user?.email || "admin@trimma.io";

      const response = await fetch("/api/provision-salon", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          salonId: lead.id,
          category: lead.category,
          actorEmail: actorEmail
        })
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.error || "Provisioning failed");
      }

      toast.success(resData.message || "Storefront provisioned! Moved to Draft Queue.", { id: "provision_salon" });
      fetchLeads();
    } catch (error: any) {
      toast.error("Provisioning failed: " + error.message, { id: "provision_salon" });
    }
  };

  // Delete lead from the terminal
  const handleDeleteLead = async (leadId: string) => {
    if (!confirm("Are you sure you want to delete this lead? This cannot be undone.")) return;
    try {
      const { error } = await supabase
        .from("salons")
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
      toast.error(`Please assign an Agent to "${lead.name}" before sending!`);
      handleStartEdit(lead.id, "assign_to", lead.assign_to);
      return;
    }

    try {
      toast.loading(`Sending "${lead.name}" to agent...`, { id: "send_to_agent" });

      const agentUser = agents.find(a => a.email === lead.assign_to);
      const agentLabel = agentUser ? agentUser.full_name || agentUser.email : lead.assign_to;

      const { error } = await supabase
        .from("salons")
        .update({
          onboarding_status: "ASSIGNED_TO_AGENT"
        })
        .eq("id", lead.id);

      if (error) throw error;

      await logActivity(lead.id, "ASSIGNED_TO_AGENT", `Salon assigned and routed to field agent: ${agentLabel}.`);

      toast.success(`"${lead.name}" sent to ${agentLabel} for field verification! 🚀`, { id: "send_to_agent" });
      setIsAssignModalOpen(false);
      setActiveTab("pipeline");
      fetchLeads();
    } catch (error: any) {
      toast.error("Failed to send to agent: " + error.message, { id: "send_to_agent" });
    }
  };

  const handleVerifySalon = async (lead: any) => {
    try {
      setVerifying(true);
      toast.loading(`Verifying "${lead.name}"...`, { id: "verify_salon" });

      const { error } = await supabase
        .from("salons")
        .update({
          onboarding_status: "VERIFIED",
          activation_status: "ACTIVE",
          is_verified: true,
          booking_enabled: true,
          verified_at: new Date().toISOString()
        })
        .eq("id", lead.id);

      if (error) throw error;

      await logActivity(lead.id, "SALON_VERIFIED", "Salon verified and activated by Admin. Now live on the platform.");
      toast.success(`"${lead.name}" is now VERIFIED and LIVE! ✓`, { id: "verify_salon" });
      fetchLeads();
    } catch (error: any) {
      toast.error("Verification failed: " + error.message, { id: "verify_salon" });
    } finally {
      setVerifying(false);
    }
  };

  const handleRejectSalon = async () => {
    if (!rejectTarget) return;
    try {
      toast.loading(`Rejecting "${rejectTarget.name}"...`, { id: "reject_salon" });

      const { error } = await supabase
        .from("salons")
        .update({
          onboarding_status: "REJECTED",
          rejection_reason: rejectReason
        })
        .eq("id", rejectTarget.id);

      if (error) throw error;

      await logActivity(rejectTarget.id, "SALON_REJECTED", `Salon rejected by Admin. Reason: ${rejectReason}`);
      toast.success(`"${rejectTarget.name}" has been rejected.`, { id: "reject_salon" });
      setShowRejectModal(false);
      setRejectTarget(null);
      setRejectReason("");
      fetchLeads();
    } catch (error: any) {
      toast.error("Rejection failed: " + error.message, { id: "reject_salon" });
    }
  };

  // Filter leads based on the current active tab and search query
  const tabLeads = leads.filter(l => {
    const status = l.onboarding_status || "DISCOVERED";
    
    if (activeTab === "discovery") {
      return status === "DISCOVERED";
    } else if (activeTab === "draft") {
      return ["AUTO_PROVISIONED", "DRAFT_REVIEW"].includes(status);
    } else if (activeTab === "pipeline") {
      return ["ASSIGNED_TO_AGENT", "AGENT_VERIFIED", "OWNER_INVITED", "OWNER_ACTIVATED"].includes(status);
    } else if (activeTab === "archived") {
      return ["VERIFIED", "REJECTED", "ON_HOLD"].includes(status);
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
          <h1 className="text-2xl font-black text-[#1A1C29] tracking-tight">Salon Discovery Center</h1>
          <p className="text-zinc-500 text-sm mt-1">Import, discover, and assign draft salons to agents for field verification.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => {
              setLeads(prev => prev.filter(l => l.onboarding_status !== 'DISCOVERED'));
              localStorage.removeItem('trimma_admin_leads_cache');
              toast.success("Discovery sheet cleared and ready for fresh input!");
            }}
            variant="outline"
            className="border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 rounded-xl font-bold text-sm h-11"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Clear Sheet
          </Button>
        </div>
      </div>

      {/* STATS CARDS & SEARCH BAR - MOVED ABOVE THE DISCOVERY FORM */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 border-none shadow-sm flex items-center gap-4 bg-white rounded-2xl">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-0.5">Total Leads</p>
            <p className="text-xl font-black text-[#1A1C29]">{leads.length}</p>
          </div>
        </Card>
        <Card className="p-4 border-none shadow-sm flex items-center gap-4 bg-white rounded-2xl">
          <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center text-brand">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-0.5">Conversion</p>
            <p className="text-xl font-black text-[#1A1C29]">
               {leads.length > 0 ? Math.round((leads.filter(l => l.status === 'converted').length / leads.length) * 100) : 0}%
            </p>
          </div>
        </Card>
        <div className="md:col-span-2 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by salon name, city or contact number..." 
            className="w-full pl-12 h-14 bg-white border-none shadow-sm rounded-2xl focus:ring-2 focus:ring-brand/20 transition-all font-medium"
          />
        </div>
      </div>

      {/* PERMANENT DEDICATED GOOGLE PLACES DISCOVERY FORM CARD */}
      <Card className="p-6 border-none shadow-md rounded-3xl bg-amber-50 border border-amber-200">
        <div className="mb-4">
          <h3 className="font-bold text-[#1A1C29] text-base flex items-center gap-2">
            <ScanSearch className="w-5 h-5 text-brand" /> Google Places Lead Discovery
          </h3>
          <p className="text-zinc-500 text-xs mt-0.5">Select a destination in Sri Lanka to query Google Maps and perform intelligent incremental updates on duplicates.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
          {/* Province Dropdown */}
          <div className="space-y-1.5">
            <label className="font-bold text-zinc-500 uppercase text-[9px] tracking-wide flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-zinc-500" /> 1. Province
            </label>
            <select
              value={selectedProvince}
              onChange={(e) => setSelectedProvince(e.target.value)}
              className="w-full h-11 px-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 text-xs font-light text-zinc-800 shadow-sm"
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
              <MapPin className="w-3.5 h-3.5 text-zinc-500" /> 2. District
            </label>
            <select
              value={selectedDistrict}
              disabled={!selectedProvince}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full h-11 px-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 text-xs font-light text-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
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
              <MapPin className="w-3.5 h-3.5 text-zinc-500" /> 3. City
            </label>
            <select
              value={selectedCity}
              disabled={!selectedDistrict}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full h-11 px-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 text-xs font-light text-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
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
              <Filter className="w-3.5 h-3.5 text-zinc-500" /> 4. Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full h-11 px-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 text-xs font-light text-zinc-800 shadow-sm"
            >
              {DISCOVERY_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          {/* Fetch Limit Selector */}
          <div className="space-y-1.5">
            <label className="font-bold text-zinc-500 uppercase text-[9px] tracking-wide flex items-center gap-1">
              <Hash className="w-3.5 h-3.5 text-zinc-500" /> 5. Fetch Limit
            </label>
            <Input 
              type="number"
              min={1}
              max={60}
              value={fetchLimit}
              onChange={(e) => setFetchLimit(Math.max(1, parseInt(e.target.value) || 15))}
              className="w-full h-11 px-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 text-xs font-light text-zinc-800 shadow-sm"
            />
          </div>

          {/* Fetch Action Button */}
          <Button
            onClick={handleDiscoverLeads}
            disabled={discovering || !selectedCity}
            className="w-full bg-black hover:bg-slate-50 text-zinc-900 rounded-xl font-light h-11 shadow-md flex items-center justify-center gap-2 text-xs disabled:opacity-50"
          >
            {discovering ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                <span>Upserting Salons...</span>
              </>
            ) : (
              <span>Start Fetching & Upsert</span>
            )}
          </Button>
        </div>
      </Card>

      {/* PERMANENT INTERACTIVE SPREADSHEET VIEW WITH ALL DB COLUMNS */}
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
              3. Pipeline ({leads.filter(l => ["ASSIGNED_TO_AGENT", "AGENT_VERIFIED", "OWNER_INVITED", "OWNER_ACTIVATED"].includes(l.onboarding_status || "DISCOVERED")).length})
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
                  <td colSpan={21} className="text-center py-20 opacity-40">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-brand" />
                    <span>Loading leads database...</span>
                  </td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={21} className="text-center py-20 text-zinc-700">
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
                              className="bg-white hover:bg-zinc-800 text-zinc-900 font-bold h-7 px-2.5 rounded-lg text-[10px] uppercase tracking-tighter flex items-center gap-1 border-none shadow-sm"
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
                              className="bg-blue-600 hover:bg-blue-700 text-zinc-900 font-bold h-7 px-2.5 rounded-lg text-[10px] uppercase tracking-tighter flex items-center gap-1 border-none shadow-sm"
                            >
                              Edit
                            </Button>
                            <Button
                              onClick={() => handleSendToAgent(lead)}
                              size="sm"
                              className="bg-white hover:bg-zinc-800 text-zinc-900 font-bold h-7 px-2.5 rounded-lg text-[10px] uppercase tracking-tighter flex items-center gap-1 border-none shadow-sm"
                            >
                              <Send className="w-3 h-3" /> Send to Agent
                            </Button>
                          </>
                        )}
                        {lead.onboarding_status === "OWNER_ACTIVATED" && (
                          <>
                            <Button
                              onClick={() => handleVerifySalon(lead)}
                              disabled={verifying}
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 text-zinc-900 font-extrabold h-7 px-3 rounded-lg text-[10px] uppercase tracking-wider flex items-center gap-1 border-none shadow-md"
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

      {/* FULL DATABASE FORM EDITOR MODAL (Covers all columns of salons) */}
      {isAssignModalOpen && selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-50 rounded-[2rem] max-w-7xl w-full shadow-2xl relative border border-zinc-200 flex flex-col h-[90vh] md:h-full max-h-[96vh] animate-in zoom-in-95 duration-200 overflow-hidden">
            
            {/* Modal Header Bar */}
            <div className="flex items-center justify-between px-8 py-5 border-b border-zinc-200 bg-white z-10 shadow-sm">
              <div>
                <h3 className="text-2xl font-black text-[#1A1C29] tracking-tight">Salon Profile Studio — Admin</h3>
                <p className="text-sm text-zinc-500 mt-1 font-medium">Lead ID: {formData.id} <span className="text-zinc-700 mx-2">|</span> Created: {new Date(selectedLead.created_at).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => { setIsAssignModalOpen(false); setSelectedLead(null); }}
                  className="rounded-xl font-bold h-11 border-zinc-200 text-zinc-500 hover:bg-slate-50 text-sm px-6"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveChanges}
                  disabled={updating}
                  className="bg-brand hover:bg-[#b01849] text-zinc-900 rounded-xl font-bold h-11 px-8 shadow-md shadow-brand/20 flex items-center gap-2 text-sm transition-all"
                >
                  {updating ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                  ) : (
                    <><Save className="w-4 h-4" /> Save Profile</>
                  )}
                </Button>
                <button 
                  onClick={() => { setIsAssignModalOpen(false); setSelectedLead(null); }}
                  className="w-11 h-11 flex items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 hover:bg-zinc-200 transition-colors ml-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body (Scrollable Dashboard Layout) */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left Column (Main Forms) */}
                <div className="lg:col-span-2 space-y-8">
                  
                  {/* VISUAL ASSET MANAGER */}
                  <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                    <h3 className="text-lg font-bold text-zinc-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-brand" />
                      Visual Asset Manager
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500">Hero Cover Image URL</label>
                        <div className="h-32 w-full rounded-2xl bg-zinc-50 border border-zinc-100 overflow-hidden shadow-inner flex items-center justify-center relative group">
                          {formData.hero_url ? (
                            <img src={formData.hero_url} alt="Hero" className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="w-8 h-8 text-zinc-700" />
                          )}
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Input 
                            value={formData.hero_url}
                            onChange={(e) => setFormData({...formData, hero_url: e.target.value})}
                            placeholder="https://..."
                            className="h-11 rounded-xl bg-zinc-50 border-zinc-200 focus:ring-2 focus:ring-brand/20 flex-1"
                          />
                          <div className="relative">
                            <Button variant="outline" type="button" className="h-11 rounded-xl border-zinc-200 px-3 hover:bg-zinc-100 relative overflow-hidden">
                              <UploadCloud className="w-4 h-4 text-zinc-500" />
                              <input 
                                type="file" 
                                accept="image/*" 
                                onChange={(e) => handleModalImageUpload(e, "hero_url")}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              />
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500">Logo Image URL</label>
                        <div className="h-32 w-32 rounded-full mx-auto bg-zinc-50 border border-zinc-100 overflow-hidden shadow-inner flex items-center justify-center relative group">
                          {formData.logo_url ? (
                            <img src={formData.logo_url} alt="Logo" className="w-full h-full object-cover" />
                          ) : (
                            <Store className="w-8 h-8 text-zinc-700" />
                          )}
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Input 
                            value={formData.logo_url || ""}
                            onChange={(e) => setFormData({...formData, logo_url: e.target.value})}
                            placeholder="https://..."
                            className="h-11 rounded-xl bg-zinc-50 border-zinc-200 focus:ring-2 focus:ring-brand/20 flex-1"
                          />
                          <div className="relative">
                            <Button variant="outline" type="button" className="h-11 rounded-xl border-zinc-200 px-3 hover:bg-zinc-100 relative overflow-hidden">
                              <UploadCloud className="w-4 h-4 text-zinc-500" />
                              <input 
                                type="file" 
                                accept="image/*" 
                                onChange={(e) => handleModalImageUpload(e, "logo_url")}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CORE BUSINESS IDENTITY */}
                  <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                    <h3 className="text-lg font-bold text-zinc-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                      <Target className="w-5 h-5 text-brand" />
                      Core Business Identity
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-1">
                        <label className="font-bold text-zinc-500 uppercase text-[10px] tracking-wide">Salon Name</label>
                        <Input 
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          className="h-12 rounded-xl bg-zinc-50 border-zinc-200 focus:ring-2 focus:ring-brand/20 text-sm font-medium"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold text-zinc-500 uppercase text-[10px] tracking-wide">Category</label>
                        <select
                          value={formData.category || ""}
                          onChange={(e) => setFormData({...formData, category: e.target.value})}
                          className="w-full h-12 px-3 rounded-xl bg-zinc-50 border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-brand/20 text-sm font-medium text-zinc-800 shadow-sm"
                        >
                          <option value="">Select Category...</option>
                          {DISCOVERY_CATEGORIES.map((cat) => (
                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold text-zinc-500 uppercase text-[10px] tracking-wide">Owner Gmail</label>
                        <Input 
                          value={formData.owner_gmail}
                          onChange={(e) => setFormData({...formData, owner_gmail: e.target.value})}
                          className="h-12 rounded-xl bg-zinc-50 border-zinc-200 focus:ring-2 focus:ring-brand/20 text-sm font-medium"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="font-bold text-zinc-500 uppercase text-[10px] tracking-wide">Rating</label>
                          <Input 
                            type="number" step="0.01"
                            value={formData.rating}
                            onChange={(e) => setFormData({...formData, rating: e.target.value})}
                            className="h-12 rounded-xl bg-zinc-50 border-zinc-200 focus:ring-2 focus:ring-brand/20 text-sm font-medium"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-bold text-zinc-500 uppercase text-[10px] tracking-wide">Price Lvl</label>
                          <Input 
                            value={formData.price_level}
                            onChange={(e) => setFormData({...formData, price_level: e.target.value})}
                            className="h-12 rounded-xl bg-zinc-50 border-zinc-200 focus:ring-2 focus:ring-brand/20 text-sm font-medium"
                          />
                        </div>
                      </div>
                      <div className="md:col-span-2 space-y-1">
                        <label className="font-bold text-zinc-500 uppercase text-[10px] tracking-wide">Google Place ID</label>
                        <Input 
                          value={formData.place_id}
                          onChange={(e) => setFormData({...formData, place_id: e.target.value})}
                          className="h-12 rounded-xl bg-zinc-50 border-zinc-200 font-mono text-[11px] focus:ring-2 focus:ring-brand/20"
                        />
                      </div>
                    </div>
                  </div>

                  {/* CONTACT & GEO */}
                  <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                    <h3 className="text-lg font-bold text-zinc-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-brand" />
                      Location & Contact Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-1">
                        <label className="font-bold text-zinc-500 uppercase text-[10px] tracking-wide">Phone Number</label>
                        <Input 
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                          className="h-12 rounded-xl bg-zinc-50 border-zinc-200 focus:ring-2 focus:ring-brand/20 text-sm font-medium"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold text-zinc-500 uppercase text-[10px] tracking-wide">Website</label>
                        <Input 
                          value={formData.website}
                          onChange={(e) => setFormData({...formData, website: e.target.value})}
                          className="h-12 rounded-xl bg-zinc-50 border-zinc-200 focus:ring-2 focus:ring-brand/20 text-sm font-medium"
                        />
                      </div>
                      <div className="md:col-span-2 space-y-1">
                        <label className="font-bold text-zinc-500 uppercase text-[10px] tracking-wide">Full Address</label>
                        <Input 
                          value={formData.address}
                          onChange={(e) => setFormData({...formData, address: e.target.value})}
                          className="h-12 rounded-xl bg-zinc-50 border-zinc-200 focus:ring-2 focus:ring-brand/20 text-sm font-medium"
                        />
                      </div>
                      <div className="md:col-span-2 space-y-1">
                        <label className="font-bold text-zinc-500 uppercase text-[10px] tracking-wide">Google Maps URL</label>
                        <Input 
                          value={formData.map_url}
                          onChange={(e) => setFormData({...formData, map_url: e.target.value})}
                          className="h-12 rounded-xl bg-zinc-50 border-zinc-200 focus:ring-2 focus:ring-brand/20 text-sm font-medium text-brand"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold text-zinc-500 uppercase text-[10px] tracking-wide">Latitude</label>
                        <Input 
                          type="number" step="any"
                          value={formData.latitude}
                          onChange={(e) => setFormData({...formData, latitude: e.target.value})}
                          className="h-12 rounded-xl bg-zinc-50 border-zinc-200 font-mono text-[11px] focus:ring-2 focus:ring-brand/20"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold text-zinc-500 uppercase text-[10px] tracking-wide">Longitude</label>
                        <Input 
                          type="number" step="any"
                          value={formData.longitude}
                          onChange={(e) => setFormData({...formData, longitude: e.target.value})}
                          className="h-12 rounded-xl bg-zinc-50 border-zinc-200 font-mono text-[11px] focus:ring-2 focus:ring-brand/20"
                        />
                      </div>
                    </div>
                  </div>

                  {/* PROVISIONED SERVICES LIBRARY */}
                  <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                    <h3 className="text-lg font-bold text-zinc-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                      <Scissors className="w-5 h-5 text-brand" />
                      Provisioned Services Library
                    </h3>
                    <div className="overflow-x-auto rounded-2xl border border-zinc-100">
                      <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-zinc-50 border-b border-zinc-100 text-zinc-500 font-bold uppercase text-[10px] tracking-wider">
                          <tr>
                            <th className="px-6 py-4 rounded-tl-2xl">Service Name</th>
                            <th className="px-6 py-4">Category</th>
                            <th className="px-6 py-4">Price</th>
                            <th className="px-6 py-4">Duration</th>
                            <th className="px-6 py-4 text-right rounded-tr-2xl">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50 text-zinc-700 font-medium">
                          {modalServices.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-6 py-8 text-center text-zinc-500 font-normal">
                                No services provisioned yet.
                              </td>
                            </tr>
                          ) : (
                            modalServices.map(service => (
                              <tr key={service.id} className="hover:bg-zinc-50/50 transition-colors">
                                <td className="px-6 py-4">{service.name}</td>
                                <td className="px-6 py-4">
                                  <Badge variant="secondary" className="bg-zinc-100 text-zinc-600 font-bold">{service.category}</Badge>
                                </td>
                                <td className="px-6 py-4">LKR {service.price}</td>
                                <td className="px-6 py-4 text-zinc-500">{service.duration_min} min</td>
                                <td className="px-6 py-4 text-right">
                                  <button onClick={() => handleDeleteModalService(service.id)} className="text-zinc-500 hover:text-red-500 p-2 rounded-xl hover:bg-red-50 transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* PROVISIONED SALON STAFF */}
                  <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                    <h3 className="text-lg font-bold text-zinc-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                      <User className="w-5 h-5 text-brand" />
                      Provisioned Salon Staff
                    </h3>
                    <div className="overflow-x-auto rounded-2xl border border-zinc-100">
                      <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-zinc-50 border-b border-zinc-100 text-zinc-500 font-bold uppercase text-[10px] tracking-wider">
                          <tr>
                            <th className="px-6 py-4 rounded-tl-2xl">Staff Name</th>
                            <th className="px-6 py-4">Role</th>
                            <th className="px-6 py-4">Skill Level</th>
                            <th className="px-6 py-4 text-right rounded-tr-2xl">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50 text-zinc-700 font-medium">
                          {modalStaff.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="px-6 py-8 text-center text-zinc-500 font-normal">
                                No staff members provisioned yet.
                              </td>
                            </tr>
                          ) : (
                            modalStaff.map(staff => (
                              <tr key={staff.id} className="hover:bg-zinc-50/50 transition-colors">
                                {editingStaffId === staff.id ? (
                                  <>
                                    <td className="px-6 py-4">
                                      <input 
                                        type="text" 
                                        className="w-full text-sm border-zinc-200 rounded-md px-2 py-1 outline-none focus:ring-1 focus:ring-brand"
                                        value={staffEditData.name || ''} 
                                        onChange={e => setStaffEditData({...staffEditData, name: e.target.value})} 
                                      />
                                    </td>
                                    <td className="px-6 py-4">
                                      <select 
                                        className="w-full text-sm border-zinc-200 rounded-md px-2 py-1 outline-none focus:ring-1 focus:ring-brand capitalize bg-white"
                                        value={staffEditData.role || ''}
                                        onChange={e => setStaffEditData({...staffEditData, role: e.target.value})}
                                      >
                                        <optgroup label="Operational">
                                          {globalRoles.filter(r => r.category === 'Operational').map(r => (
                                            <option key={r.role_name} value={r.role_name}>{r.role_name}</option>
                                          ))}
                                        </optgroup>
                                        <optgroup label="Admin">
                                          {globalRoles.filter(r => r.category === 'Admin').map(r => (
                                            <option key={r.role_name} value={r.role_name}>{r.role_name}</option>
                                          ))}
                                        </optgroup>
                                      </select>
                                    </td>
                                    <td className="px-6 py-4">
                                      <input 
                                        type="text" 
                                        className="w-32 text-sm border-zinc-200 rounded-md px-2 py-1 outline-none focus:ring-1 focus:ring-brand"
                                        value={staffEditData.skill_level || ''} 
                                        onChange={e => setStaffEditData({...staffEditData, skill_level: e.target.value})} 
                                      />
                                    </td>
                                    <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                                      <button onClick={handleSaveModalStaff} className="text-brand hover:text-brand-hover p-2 rounded-xl hover:bg-brand/10 transition-colors">
                                        <Check className="w-4 h-4" />
                                      </button>
                                      <button onClick={() => setEditingStaffId(null)} className="text-zinc-500 hover:text-zinc-600 p-2 rounded-xl hover:bg-zinc-100 transition-colors">
                                        <X className="w-4 h-4" />
                                      </button>
                                    </td>
                                  </>
                                ) : (
                                  <>
                                    <td className="px-6 py-4 font-bold text-zinc-900">{staff.name}</td>
                                    <td className="px-6 py-4 capitalize">{staff.role}</td>
                                    <td className="px-6 py-4">
                                      <Badge variant="outline" className="text-zinc-500 border-zinc-200">{staff.skill_level}</Badge>
                                    </td>
                                    <td className="px-6 py-4 text-right flex items-center justify-end gap-1">
                                      <button onClick={() => handleEditModalStaff(staff)} className="text-zinc-500 hover:text-brand p-2 rounded-xl hover:bg-brand/10 transition-colors">
                                        <Pencil className="w-4 h-4" />
                                      </button>
                                      <button onClick={() => handleDeleteModalStaff(staff.id)} className="text-zinc-500 hover:text-red-500 p-2 rounded-xl hover:bg-red-50 transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </td>
                                  </>
                                )}
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>

                {/* Right Column (Sidebar Workflow) */}
                <div className="space-y-8">
                  
                  {/* WORKFLOW STATUS */}
                  <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                    <h3 className="text-lg font-bold text-zinc-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                      <Zap className="w-5 h-5 text-amber-500" />
                      Pipeline & Assignment
                    </h3>
                    
                    <div className="space-y-5">
                      <div className="space-y-2">
                        <label className="font-bold text-zinc-500 uppercase text-[10px] tracking-wide">Onboarding Status</label>
                        <select
                          value={formData.onboarding_status}
                          onChange={(e) => setFormData({...formData, onboarding_status: e.target.value})}
                          className="w-full h-12 px-4 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 text-sm font-black text-zinc-800"
                        >
                          <option value="DISCOVERED">DISCOVERED</option>
                          <option value="AUTO_PROVISIONED">AUTO_PROVISIONED</option>
                          <option value="ASSIGNED_TO_AGENT">ASSIGNED_TO_AGENT</option>
                          <option value="AGENT_VERIFIED">AGENT_VERIFIED</option>
                          <option value="OWNER_INVITED">OWNER_INVITED</option>
                          <option value="OWNER_ACTIVATED">OWNER_ACTIVATED</option>
                          <option value="VERIFIED">VERIFIED</option>
                          <option value="REJECTED">REJECTED</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="font-bold text-zinc-500 uppercase text-[10px] tracking-wide">Assign to Agent</label>
                        <select
                          value={formData.assign_to}
                          onChange={(e) => setFormData({...formData, assign_to: e.target.value})}
                          className="w-full h-12 px-4 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 text-sm font-semibold text-zinc-800"
                        >
                          <option value="">Unassigned</option>
                          {agents.map((agent) => (
                            <option key={agent.email} value={agent.email}>
                              {agent.full_name || agent.email} ({agent.global_role})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2 pt-2">
                        <label className="font-bold text-zinc-500 uppercase text-[10px] tracking-wide text-amber-600">Admin Notes for Agent</label>
                        <textarea
                          value={formData.admin_notes}
                          onChange={(e) => setFormData({...formData, admin_notes: e.target.value})}
                          placeholder="e.g. Visit on weekday morning..."
                          className="w-full min-h-[100px] p-4 rounded-xl bg-amber-50 border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-xs font-semibold leading-relaxed text-amber-900"
                        />
                      </div>
                    </div>
                  </div>

                  {/* AI SUMMARY & JSON */}
                  <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                    <h3 className="text-lg font-bold text-zinc-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-indigo-500" />
                      AI & Tech Details
                    </h3>
                    <div className="space-y-5">
                      <div className="space-y-2">
                        <label className="font-bold text-zinc-500 uppercase text-[10px] tracking-wide">AI Summary / Description</label>
                        <textarea
                          value={formData.summary}
                          onChange={(e) => setFormData({...formData, summary: e.target.value})}
                          className="w-full min-h-[120px] p-4 rounded-xl bg-zinc-50 border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-brand/20 text-xs font-medium leading-relaxed"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="font-bold text-zinc-500 uppercase text-[10px] tracking-wide">Opening Hours</label>
                        <WorkingHoursEditor 
                          value={formData.working_hours} 
                          onChange={(val) => setFormData({...formData, working_hours: val})} 
                        />
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* REJECT SALON MODAL */}
      {showRejectModal && rejectTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-zinc-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-black text-zinc-900">Reject Salon</h3>
                <p className="text-xs text-zinc-500 mt-0.5">{rejectTarget.name}</p>
              </div>
            </div>
            <div className="space-y-3">
              <label className="font-bold text-zinc-500 uppercase text-[9px] tracking-wide">Rejection Reason (required)</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Salon is permanently closed, duplicate entry, invalid location data..."
                className="w-full min-h-[100px] p-3 rounded-xl bg-zinc-50 border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 text-xs font-semibold leading-relaxed"
                autoFocus
              />
            </div>
            <div className="flex items-center justify-end gap-3 mt-5">
              <Button
                variant="outline"
                onClick={() => { setShowRejectModal(false); setRejectTarget(null); setRejectReason(""); }}
                className="rounded-xl font-bold h-10 border-zinc-200 text-zinc-500 text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRejectSalon}
                disabled={!rejectReason.trim()}
                className="bg-rose-600 hover:bg-rose-700 text-zinc-900 rounded-xl font-bold h-10 px-5 text-xs flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4" /> Confirm Rejection
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
