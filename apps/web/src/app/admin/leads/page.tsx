"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Search, Filter, Phone, MapPin, Loader2, ScanSearch, Zap, Target, Star, X, Trash2, Compass, Hash, CheckCircle2, AlertCircle, Send, Shield, Store, Sparkles, Save, RefreshCw, UploadCloud, Scissors, User, Pencil, Check, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LkPhoneInput } from "@/components/ui/LkPhoneInput";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { fetchAdminLeadsPage } from "@/app/actions/admin-list-data";
import {
  updateAdminSalon,
  insertOnboardingLog,
  fetchSalonServicesAndStaff,
  deleteAdminSalonService,
  deleteAdminSalonStaff,
  updateAdminSalonStaff,
  fetchAdminSalonServicePickerData,
  importAdminSalonServices,
  bulkInsertAdminSalons,
  deleteAdminSalon,
  uploadAdminSalonImage,
  publishAdminLead,
  fetchAdminActorEmail,
  createAdminSalonDraft,
} from "@/app/actions/admin-operations";
import { withTimeout } from "@/lib/promise-timeout";
import { getSalonVerificationReadinessIssues } from "@/lib/salon-onboarding-progress";
import { WorkingHoursEditor } from "../../../components/admin/WorkingHoursEditor";
import { LeadTables } from "../../../components/admin/LeadTables";
import { LeadEditorModal } from "../../../components/admin/LeadEditorModal";
import { SalonRequestLeadSheet } from "../../../components/admin/SalonRequestLeadSheet";
import {
  assignAdminSalonRequest,
  fetchAdminSalonRequests,
  type SalonRequestRow,
} from "@/app/actions/salon-requests";
import {
  notifyAdminRejectedSalon,
  notifyAgentOfSalonAssignment,
  notifySalonVerifiedByAdmin,
} from "@/app/actions/salon-onboarding-notifications";

import { autoCropAndUpload } from "@/lib/auto-crop-upload";

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





export default function Leads() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const tabQuery = searchParams.get("tab");
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [agents, setAgents] = useState<any[]>([]);
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [activeTabState, setActiveTabState] = useState<'discovery' | 'draft' | 'pipeline' | 'archived' | 'salon-requests'>('discovery');
  const activeTab = tabQuery === "salon-requests" ? "salon-requests" : activeTabState;
  const setActiveTab = useCallback((
    tab: React.SetStateAction<'discovery' | 'draft' | 'pipeline' | 'archived' | 'salon-requests'>
  ) => {
    setActiveTabState((prev) => {
      const nextTab = typeof tab === "function" ? tab(prev) : tab;
      if (tabQuery === "salon-requests" && nextTab !== "salon-requests") {
        router.replace(pathname);
      }
      return nextTab;
    });
  }, [pathname, router, tabQuery]);
  const [salonRequests, setSalonRequests] = useState<SalonRequestRow[]>([]);
  const [salonRequestsLoading, setSalonRequestsLoading] = useState(false);
  
  // Spreadsheet Sheet Editing States
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState<any>("");

  // Modal Tables State
  const [modalServices, setModalServices] = useState<any[]>([]);
  const [modalStaff, setModalStaff] = useState<any[]>([]);
  const [servicePickerData, setServicePickerData] = useState<any>(null);
  const [servicePickerCategory, setServicePickerCategory] = useState("");
  const [selectedImportServices, setSelectedImportServices] = useState<Record<string, boolean>>({});
  const [importingServices, setImportingServices] = useState(false);

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
  const [discoveryCategories, setDiscoveryCategories] = useState<{value: string, label: string}[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
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

  const fetchSalonRequests = useCallback(async () => {
    setSalonRequestsLoading(true);
    try {
      const result = await fetchAdminSalonRequests();
      if (result.success === false) {
        toast.error(result.error);
        return;
      }
      setSalonRequests(result.requests);
    } finally {
      setSalonRequestsLoading(false);
    }
  }, []);

  const handleAssignSalonRequest = async (input: {
    id: string;
    origin: SalonRequestRow["origin"];
    assignToEmail: string;
    adminNotes?: string | null;
  }) => {
    const result = await assignAdminSalonRequest(input);
    if (result.success === false) {
      toast.error(result.error);
      return;
    }
    toast.success("Salon request assigned successfully.");
    await fetchSalonRequests();
  };

  const applyLeadsFromSalons = (allSalons: any[], limit?: number) => {
    const pipelineData = (allSalons || []).filter(
      (s) => s.activation_status === "INACTIVE" && s.onboarding_status !== "DISCOVERED"
    );

    let newlyDiscovered: any[] = [];
    if (limit) {
      newlyDiscovered = (allSalons || [])
        .filter((s) => s.activation_status === "INACTIVE" && s.onboarding_status === "DISCOVERED")
        .slice(0, limit);
    }

    setLeads((prev) => {
      const prevDiscovered = prev.filter((l) => l.onboarding_status === "DISCOVERED");
      const existingIds = new Set(prevDiscovered.map((l) => l.id));
      const uniqueNew = newlyDiscovered.filter((l) => !existingIds.has(l.id));

      const finalDiscovered = [...uniqueNew, ...prevDiscovered];
      return [...finalDiscovered, ...pipelineData];
    });
  };

  const fetchGlobalRoles = async () => {
    try {
      const result = await withTimeout(
        fetchAdminLeadsPage(),
        20000,
        "Loading timed out. Check Vercel env (SUPABASE_SERVICE_ROLE_KEY) and refresh."
      );

      if (result.success === false) {
        throw new Error(result.error);
      }

      const data = result.staffRoles || [];
      if (data.length > 0) {
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

  const fetchLeads = async (limit?: number) => {
    try {
      setLoading(true);

      const result = await withTimeout(
        fetchAdminLeadsPage(),
        20000,
        "Loading timed out. Check Vercel env (SUPABASE_SERVICE_ROLE_KEY) and refresh."
      );

      if (result.success === false) {
        throw new Error(result.error);
      }

      if (result.categories) {
        setDiscoveryCategories(result.categories.map((c: string) => ({ value: c, label: c })));
        if (result.categories.length > 0 && selectedCategory === "") {
          setSelectedCategory(result.categories[0]);
        }
      }

      applyLeadsFromSalons(result.salons || [], limit);
    } catch (error: any) {
      toast.error("Failed to load leads: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAgents = async () => {
    try {
      const result = await withTimeout(
        fetchAdminLeadsPage(),
        20000,
        "Loading timed out. Check Vercel env (SUPABASE_SERVICE_ROLE_KEY) and refresh."
      );

      if (result.success === false) {
        throw new Error(result.error);
      }

      const data = (result.users || []).filter((u) =>
        ["agent", "regional_head", "regional_admin", "admin"].includes(u.global_role)
      );
      setAgents(data);
    } catch (error: any) {
      console.error("Failed to load agents", error);
    }
  };

  const fetchModalExtras = async (id: string) => {
    try {
      const [result, pickerResult] = await Promise.all([
        fetchSalonServicesAndStaff(id),
        fetchAdminSalonServicePickerData(id),
      ]);
      if (result.success === false) throw new Error(result.error);
      setModalServices(result.services || []);
      setModalStaff(result.staff || []);

      if (pickerResult.success) {
        setServicePickerData(pickerResult);
        setServicePickerCategory("");
        setSelectedImportServices({});
      } else {
        setServicePickerData(null);
      }
    } catch (err) {
      console.error("Failed to fetch modal extras", err);
    }
  };

  const handleImportModalServices = async () => {
    if (!formData.id || !servicePickerData) return;
    try {
      setImportingServices(true);
      const selected = servicePickerData.services.filter(
        (svc: any) => selectedImportServices[svc.id]
      );
      if (selected.length === 0) {
        toast.error("Select at least one service to import.");
        return;
      }

      const result = await importAdminSalonServices(
        formData.id,
        selected.map((svc: any) => ({
          global_service_id: svc.id,
          name: svc.name,
          category: svc.category || "Other",
          price: Number(svc.default_price) || 0,
          duration_min: Number(svc.default_duration) || 30,
          image_url: svc.icon_image_url || null,
        }))
      );

      if (result.success === false) throw new Error(result.error);
      await fetchModalExtras(formData.id);
      toast.success(`Imported ${result.inserted} service(s).`);
    } catch (err: any) {
      toast.error(err.message || "Failed to import services.");
    } finally {
      setImportingServices(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(() => {
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
      fetchSalonRequests();
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void Promise.resolve().then(() => {
      if (!loading) {
      const discoveredOnly = leads.filter(l => l.onboarding_status === 'DISCOVERED');
      if (discoveredOnly.length > 0) {
      localStorage.setItem('trimma_admin_leads_cache', JSON.stringify(discoveredOnly));
      } else {
      localStorage.removeItem('trimma_admin_leads_cache');
      }
      }
    });
  }, [leads, loading]);

  // Reset dependent geography dropdowns when parent changes
  useEffect(() => {
    void Promise.resolve().then(() => {
      setSelectedDistrict("");
      setSelectedCity("");
    });
  }, [selectedProvince]);

  useEffect(() => {
    void Promise.resolve().then(() => setSelectedCity(""));
  }, [selectedDistrict]);

  useEffect(() => {
    if (isAssignModalOpen && formData.id) {
      void Promise.resolve().then(() => fetchModalExtras(formData.id));
    }
  }, [isAssignModalOpen, formData.id]);

  const handleDeleteModalService = async (serviceId: string) => {
    try {
      const result = await deleteAdminSalonService(serviceId);
      if (result.success === false) throw new Error(result.error);
      setModalServices(prev => prev.filter(s => s.id !== serviceId));
      toast.success("Service deleted.");
    } catch (err: any) {
      toast.error("Failed to delete service: " + err.message);
    }
  };

  const handleDeleteModalStaff = async (staffId: string) => {
    try {
      const result = await deleteAdminSalonStaff(staffId);
      if (result.success === false) throw new Error(result.error);
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
      role: staff.role || ''
    });
  };

  const handleSaveModalStaff = async () => {
    if (!editingStaffId) return;
    try {
      const result = await updateAdminSalonStaff(editingStaffId, {
          name: staffEditData.name,
          role: staffEditData.role
        });
      if (result.success === false) throw new Error(result.error);
      
      setModalStaff(prev => prev.map(s => 
        s.id === editingStaffId ? { ...s, ...staffEditData } : s
      ));
      toast.success("Staff member updated.");
      setEditingStaffId(null);
    } catch (err: any) {
      toast.error("Failed to update staff: " + err.message);
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
      await insertOnboardingLog({ salon_id: leadId, action, notes });
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
      working_hours: typeof lead.working_hours === 'string' ? lead.working_hours : (lead.working_hours ? JSON.stringify(lead.working_hours, null, 2) : "[]"),
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

      const result = await updateAdminSalon(selectedLead.id, updatePayload);
      if (result.success === false) throw new Error(result.error);

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
      const result = await updateAdminSalon(leadId, updatePayload);
      if (result.success === false) throw new Error(result.error);
      
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

  const handleHeroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, leadId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      toast.loading("Cropping and uploading image...", { id: `upload_${leadId}` });
      const publicUrl = await autoCropAndUpload(file, 1200, 675, "hero");
      await handleSaveCell(leadId, "hero_url", publicUrl);
      toast.success("Image cropped and uploaded!", { id: `upload_${leadId}` });
    } catch (err: any) {
      toast.error("Upload failed: " + err.message, { id: `upload_${leadId}` });
    } finally {
      e.target.value = ""; // reset input
    }
  };

  const handleModalImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: "hero_url" | "logo_url") => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      toast.loading(`Compressing (<100KB) and uploading ${field.replace('_', ' ')}...`, { id: `upload_modal_${field}` });
      
      const targetWidth = field === "hero_url" ? 1200 : 400;
      const targetHeight = field === "hero_url" ? 675 : 400;
      
      const publicUrl = await autoCropAndUpload(file, targetWidth, targetHeight, field);
      setFormData((prev: any) => ({ ...prev, [field]: publicUrl }));
      
      toast.success(`Image uploaded!`, { id: `upload_modal_${field}` });
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

      const result = await createAdminSalonDraft(newLeadPayload);
      if (result.success === false) throw new Error(result.error);
      
      const createdLead = result.salon;
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

        const result = await bulkInsertAdminSalons(leadsToInsert);
        if (result.success === false) throw new Error(result.error);

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

      const actorResult = await fetchAdminActorEmail();
      const actorEmail = actorResult.success ? actorResult.email : "admin@trimma.io";

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
      const result = await deleteAdminSalon(leadId);
      if (result.success === false) throw new Error(result.error);
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

      const result = await publishAdminLead({
        id: lead.id,
        name: lead.name,
        province: selectedProvince || "Western Province",
        district: selectedDistrict || "Colombo",
        city: selectedCity || "Colombo",
        address: lead.address,
      });
      if (result.success === false) throw new Error(result.error);

      const slug = result.slug;
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

      const result = await updateAdminSalon(lead.id, {
          onboarding_status: "ASSIGNED_TO_AGENT"
        });
      if (result.success === false) throw new Error(result.error);

      await notifyAgentOfSalonAssignment(lead.id);

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
    const issues = getSalonVerificationReadinessIssues({
      name: lead.name,
      phone: lead.phone,
      address: lead.address,
      business_info_extended: lead.business_info_extended,
      bank_info: lead.bank_info,
    });

    if (issues.length > 0) {
      const proceed = window.confirm(
        `Verification checklist incomplete:\n• ${issues.join("\n• ")}\n\nOpen Review to inspect documents and bank details. Verify anyway?`
      );
      if (!proceed) {
        handleOpenAssignModal(lead);
        return;
      }
    }

    try {
      setVerifying(true);
      toast.loading(`Verifying "${lead.name}"...`, { id: "verify_salon" });

      const result = await updateAdminSalon(lead.id, {
          onboarding_status: "VERIFIED",
          activation_status: "ACTIVE",
          is_verified: true,
          booking_enabled: true,
          verified_at: new Date().toISOString()
        });
      if (result.success === false) throw new Error(result.error);

      await notifySalonVerifiedByAdmin({
        salonId: lead.id,
        salonName: lead.name,
        ownerPhone: lead.phone,
        ownerEmail: lead.owner_email || lead.owner_gmail || lead.email,
      });

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

      const result = await updateAdminSalon(rejectTarget.id, {
          onboarding_status: "REJECTED",
          rejection_reason: rejectReason
        });
      if (result.success === false) throw new Error(result.error);

      await notifyAdminRejectedSalon({
        salonId: rejectTarget.id,
        salonName: rejectTarget.name,
        ownerEmail: rejectTarget.owner_email || rejectTarget.owner_gmail || rejectTarget.email,
        reason: rejectReason,
      });

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
    
    if (activeTab === "salon-requests") {
      return false;
    } else if (activeTab === "discovery") {
      return status === "DISCOVERED";
    } else if (activeTab === "draft") {
      return ["AUTO_PROVISIONED", "DRAFT_REVIEW"].includes(status);
    } else if (activeTab === "pipeline") {
      return ["ASSIGNED_TO_AGENT", "OWNER_INVITED", "OWNER_ACTIVATED", "PENDING_ADMIN_VERIFICATION"].includes(status);
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
      {activeTab !== "salon-requests" ? (
      <>
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
              {discoveryCategories.map((cat) => (
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
      </>
      ) : (
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search salon requests by name, email, business, or message..."
            className="w-full pl-12 h-14 bg-white border-none shadow-sm rounded-2xl focus:ring-2 focus:ring-brand/20 transition-all font-medium"
          />
        </div>
      )}

      {/* PERMANENT INTERACTIVE SPREADSHEET VIEW WITH ALL DB COLUMNS */}
      <LeadTables
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        leads={leads}
        filteredLeads={filteredLeads}
        loading={loading}
        salonRequestCount={salonRequests.length}
        salonRequestPanel={
          <SalonRequestLeadSheet
            requests={salonRequests}
            loading={salonRequestsLoading}
            agents={agents}
            onAssign={handleAssignSalonRequest}
            onRefresh={() => void fetchSalonRequests()}
            searchTerm={searchTerm}
          />
        }
        editingCell={editingCell}
        setEditingCell={setEditingCell}
        editValue={editValue}
        setEditValue={setEditValue}
        handleSaveCell={handleSaveCell}
        handleStartEdit={handleStartEdit}
        handleHeroImageUpload={handleHeroImageUpload}
        agents={agents}
        handleCreateSalon={handleCreateSalon}
        handleDeleteLead={handleDeleteLead}
        handleOpenAssignModal={handleOpenAssignModal}
        handleSendToAgent={handleSendToAgent}
        handleVerifySalon={handleVerifySalon}
        setRejectTarget={setRejectTarget}
        setShowRejectModal={setShowRejectModal}
        verifying={verifying}
      />

      {/* FULL DATABASE FORM EDITOR MODAL (Covers all columns of salons) */}
      <LeadEditorModal 
        isOpen={isAssignModalOpen}
        onClose={() => { setIsAssignModalOpen(false); setSelectedLead(null); }}
        selectedLead={selectedLead}
        formData={formData}
        setFormData={setFormData}
        updating={updating}
        onSave={handleSaveChanges}
        handleModalImageUpload={handleModalImageUpload}
        discoveryCategories={discoveryCategories}
        agents={agents}
        modalServices={modalServices}
        modalStaff={modalStaff}
        handleDeleteModalService={handleDeleteModalService}
        handleDeleteModalStaff={handleDeleteModalStaff}
        editingStaffId={editingStaffId}
        setEditingStaffId={setEditingStaffId}
        staffEditData={staffEditData}
        setStaffEditData={setStaffEditData}
        globalRoles={globalRoles}
        handleSaveModalStaff={handleSaveModalStaff}
        handleEditModalStaff={handleEditModalStaff}
        servicePicker={
          servicePickerData
            ? {
                allowedCategories: servicePickerData.allowedCategories || [],
                maxServices: servicePickerData.maxServices || 6,
                planName: servicePickerData.planName || "Free",
                globalServices: servicePickerData.services || [],
                existingGlobalServiceIds: servicePickerData.existingGlobalServiceIds || [],
                selectedCategory: servicePickerCategory,
                onCategoryChange: setServicePickerCategory,
                selectedServiceIds: selectedImportServices,
                onToggleService: (serviceId, enabled) =>
                  setSelectedImportServices((prev) => ({ ...prev, [serviceId]: enabled })),
                onImport: handleImportModalServices,
                importing: importingServices,
              }
            : null
        }
      />

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
