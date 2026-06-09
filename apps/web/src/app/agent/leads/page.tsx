/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, Suspense, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search, Phone, MapPin, Loader2, Target, Globe, Star, X, CheckCircle2, Mail, ClipboardList, Send, Building2, UploadCloud, Map, Tag, Users, Plus, Trash2 } from "lucide-react";
import { AddProfessionalForm, StaffPayload } from "../../../components/forms/AddProfessionalForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LkPhoneInput } from "@/components/ui/LkPhoneInput";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { supabase } from "@/config/supabase";
import { toast } from "sonner";
import { sendOnboardingInviteAlert, sendAgentApprovalAlerts } from "../../actions/whatsapp";
import { normalizeEmail } from "@/lib/normalize-email";
import { CategoryMultiSelect } from "@/components/ui/CategoryMultiSelect";
import { saveAgentLeadData, convertManualLeadToSalon, fetchAgentGlobals } from "../../actions/agent-leads-update";
import {
  fetchAgentAssignedLeads,
  fetchAgentManualLeads,
  fetchAgentLeadEditorData,
  fetchAgentSalonServiceIds,
} from "../../actions/agent-lead-editor-data";
import {
  tryAgentData,
  fetchAgentAssignedLeadsClient,
  fetchAgentManualLeadsClient,
  fetchAgentLeadEditorDataClient,
  fetchAgentGlobalsClient,
} from "@/lib/agent-client-data";
import { parseSalonAmenityValue } from "@/lib/salon-amenities";


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
    void Promise.resolve().then(() => {
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
    });
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
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              className={`text-[10px] font-bold px-4 py-1.5 rounded-lg transition-all ${isOpen ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'}`}
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

export default function AgentLeadsPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
      </div>
    }>
      <AgentLeads />
    </Suspense>
  );
}

function AgentLeads() {
  const searchParams = useSearchParams();
  const openSalonId = searchParams.get("open");
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [agentEmail, setAgentEmail] = useState("");
  const [agentName, setAgentName] = useState("");
  const [activeTab, setActiveTab] = useState<'all' | 'assigned' | 'verified' | 'invited'>('all');
  const openedSalonRef = useRef<string | null>(null);

  const [manualLeads, setManualLeads] = useState<any[]>([]);
  const [mainTab, setMainTab] = useState<'google' | 'manual'>('google');
  const [isManualLead, setIsManualLead] = useState(false);

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

  // category as array for the multi-select
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  
  // Services & Staff globals
  const [globalServices, setGlobalServices] = useState<any[]>([]);
  const [globalStaffRoles, setGlobalStaffRoles] = useState<any[]>([]);
  const [selectedServices, setSelectedServices] = useState<{[key: string]: { enabled: boolean, price: string, duration: string, category: string }}>({});
  const [staffToAdd, setStaffToAdd] = useState<StaffPayload[]>([]);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [globalAmenities, setGlobalAmenities] = useState<any[]>([]);
  const [salonAmenities, setSalonAmenities] = useState<Record<string, { has_amenity: boolean, quantity: number | null }>>({});



  const fetchLeads = async () => {
    try {
      setLoading(true);
      const [res, manualRes] = await Promise.all([
        tryAgentData(fetchAgentAssignedLeads, fetchAgentAssignedLeadsClient),
        tryAgentData(fetchAgentManualLeads, fetchAgentManualLeadsClient)
      ]);

      if (!res.success) {
        toast.error(res.error || "Failed to load leads.");
        return;
      }
      setAgentEmail(res.agentEmail);
      setAgentName(res.agentName);
      setLeads(res.leads);

      if (manualRes.success) {
        setManualLeads(manualRes.leads);
      }
    } catch (error: any) {
      toast.error("Failed to load your assigned salons: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = async (lead: any, isManual = false) => {
    setIsManualLead(isManual);
    setSelectedLead(lead);

    let mappedAddress = lead.address || "";
    if (isManual) {
      const parts = [lead.address, lead.city, lead.district, lead.province].filter(Boolean);
      mappedAddress = parts.join(", ");
    }

    setFormData({
      id: lead.id || "",
      place_id: lead.place_id || "",
      name: lead.name || "",
      address: mappedAddress,
      rating: lead.rating !== null && lead.rating !== undefined ? String(lead.rating) : "",
      phone: lead.whatsapp_number || lead.phone || "",
      website: lead.website || "",
      map_url: lead.map_url || "",
      category: lead.category || "",
      working_hours: typeof lead.working_hours === 'string' ? lead.working_hours : (lead.working_hours ? JSON.stringify(lead.working_hours, null, 2) : "[]"),
      latitude: lead.latitude !== null && lead.latitude !== undefined ? String(lead.latitude) : "",
      longitude: lead.longitude !== null && lead.longitude !== undefined ? String(lead.longitude) : "",
      price_level: lead.price_level || "",
      summary: lead.summary || "",
      hero_url: lead.hero_url || "",
      onboarding_status: lead.onboarding_status || "ASSIGNED_TO_AGENT",
      activation_status: lead.activation_status || "INACTIVE",
      owner_gmail: lead.owner_email || lead.owner_gmail || "",
      agent_notes: lead.agent_notes || (isManual && lead.owner_name ? `Owner Name: ${lead.owner_name}` : ""),
      admin_notes: lead.admin_notes || ""
    });
    setSelectedCategories((lead.category || "").split(",").map((s: string) => s.trim()).filter(Boolean));
    setIsModalOpen(true);

    if (isManual) {
      setSelectedServices({});
      setSalonAmenities({});
      return;
    }

    try {
      const editorRes = await tryAgentData(
        () => fetchAgentLeadEditorData(lead.id),
        () => fetchAgentLeadEditorDataClient(lead.id)
      );
      if (!editorRes.success) {
        toast.error(editorRes.error);
        return;
      }
      const svcMap: any = {};
      (editorRes.services || []).forEach((s) => {
        if (s.global_service_id) {
          svcMap[s.global_service_id] = {
            enabled: true,
            price: s.price?.toString() || "0",
            duration: s.duration_min?.toString() || "30",
            category: s.category || "",
          };
        }
      });
      setSelectedServices(svcMap);

      const amMap: any = {};
      (editorRes.amenities || []).forEach((sa: any) => {
        const globalAmenity = Array.isArray(sa.global_amenities)
          ? sa.global_amenities[0]
          : sa.global_amenities;
        const parsed = parseSalonAmenityValue(globalAmenity?.type || "boolean", sa.value);
        if (parsed.has_amenity) {
          amMap[sa.amenity_id] = parsed;
        }
      });
      setSalonAmenities(amMap);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchGlobals = async () => {
    try {
      const res = await tryAgentData(fetchAgentGlobals, fetchAgentGlobalsClient);
      if (res.success) {
        setGlobalServices(res.services);
        setGlobalStaffRoles(res.staffRoles);
        setGlobalAmenities(res.amenities);
      }
    } catch (e) {
      console.error("Failed to load globals:", e);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(() => {
      fetchLeads();
      fetchGlobals();
    });
  }, []);

  useEffect(() => {
    if (!openSalonId || loading || leads.length === 0) return;
    if (openedSalonRef.current === openSalonId) return;
    const lead = leads.find((item) => item.id === openSalonId);
    if (lead) {
      openedSalonRef.current = openSalonId;
      void Promise.resolve().then(() => handleOpenModal(lead));
    }
  }, [openSalonId, loading, leads]);



  const prepareServicesAndStaff = async (salonId: string) => {
    const existingSvcRes = await fetchAgentSalonServiceIds(salonId);
    if (!existingSvcRes.success) {
      throw new Error(existingSvcRes.error);
    }
    const existingSvc = existingSvcRes.services || [];
    
    const existingSvcIds = existingSvc.map(s => s.global_service_id).filter(Boolean);
    const selectedSvcIds = Object.keys(selectedServices).filter(id => selectedServices[id].enabled);
    
    const svcsToAddIds = selectedSvcIds.filter(id => !existingSvcIds.includes(id));
    const svcsToRemoveIds = existingSvc.filter(s => !selectedSvcIds.includes(s.global_service_id!)).map(s => s.id);
    
    let svcsToAdd: any[] = [];
    if (svcsToAddIds.length > 0) {
      svcsToAdd = svcsToAddIds.map(id => {
        const gs = globalServices.find(g => g.id === id);
        const override = selectedServices[id];
        return {
          salon_id: salonId,
          global_service_id: id,
          name: gs?.name || "Service",
          category: override.category || gs?.category || "Other",
          duration_min: parseInt(override.duration) || gs?.default_duration || 30,
          price: parseFloat(override.price) || gs?.default_price || 0,
          image_url: gs?.icon_image_url || null
        };
      });
    }

    let finalStaffToAdd: any[] = [];
    if (staffToAdd.length > 0) {
      for (const st of staffToAdd) {
        let finalAvatarUrl = null;
        if (st.avatarBlob) {
          const fileName = `${salonId}-${Date.now()}.jpg`;
          const { error: uploadError } = await supabase.storage.from("staff-avatars").upload(fileName, st.avatarBlob, {
            contentType: 'image/jpeg',
            upsert: true
          });
          if (!uploadError) {
            const { data } = supabase.storage.from("staff-avatars").getPublicUrl(fileName);
            finalAvatarUrl = data.publicUrl;
          }
        }
        
        finalStaffToAdd.push({
          salon_id: salonId,
          name: st.name,
          email: st.email || null,
          role: st.role,
          commission_rate: st.commission_rate,
          status: 'active',
          avatar_url: finalAvatarUrl,
          working_hours: {
            schedule: st.schedule,
            general_buffer_time: st.general_buffer_time,
            assigned_services: Object.keys(st.services).filter(id => st.services[id].enabled).map(id => ({
              service_id: id, 
              commission_rate: st.services[id].commission,
              buffer_time: st.services[id].buffer
            }))
          }
        });
      }
    }
    
    return {
      servicesData: { svcsToAdd, svcsToRemoveIds },
      staffToAdd: finalStaffToAdd
    };
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingImage(true);
      const ext = file.name.split('.').pop();
      const fileName = `salons/${selectedLead?.id}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("salon-images").upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("salon-images").getPublicUrl(fileName);
      setFormData({ ...formData, hero_url: data.publicUrl });
      toast.success("Image uploaded successfully!");
    } catch (err: any) {
      toast.error("Upload failed: " + err.message);
    } finally {
      setUploadingImage(false);
    }
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
        category: selectedCategories.join(", ") || null,
        working_hours: parsedHours,
        latitude: formData.latitude === "" ? null : parseFloat(formData.latitude),
        longitude: formData.longitude === "" ? null : parseFloat(formData.longitude),
        price_level: formData.price_level || null,
        summary: formData.summary || null,
        hero_url: formData.hero_url || null,
        owner_gmail: formData.owner_gmail ? normalizeEmail(formData.owner_gmail) : null,
        agent_notes: formData.agent_notes || null
      };

      const { servicesData, staffToAdd: finalStaffToAdd } = await prepareServicesAndStaff(selectedLead.id);
      
      let success = false, error = null;
      if (isManualLead) {
        const res = await convertManualLeadToSalon(
          selectedLead.id,
          updatePayload,
          servicesData,
          finalStaffToAdd,
          salonAmenities,
          agentEmail,
          "DRAFT"
        );
        success = res.success;
        error = res.error;
      } else {
        const res = await saveAgentLeadData(
          selectedLead.id,
          updatePayload,
          servicesData,
          finalStaffToAdd,
          agentEmail,
          null,
          salonAmenities,
          "DRAFT"
        );
        success = res.success;
        error = res.error;
      }
      
      if (!success) throw new Error(error || "Failed to save via Server Action");

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

  const handleSendToOwner = async () => {
    if (!selectedLead) return;
    if (!formData.owner_gmail?.trim()) {
      toast.error("Owner Gmail is required to send for review. They need it to claim the salon.");
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
        category: selectedCategories.join(", ") || null,
        working_hours: parsedHours,
        latitude: formData.latitude === "" ? null : parseFloat(formData.latitude),
        longitude: formData.longitude === "" ? null : parseFloat(formData.longitude),
        price_level: formData.price_level || null,
        summary: formData.summary || null,
        hero_url: formData.hero_url || null,
        owner_gmail: formData.owner_gmail ? normalizeEmail(formData.owner_gmail) : null,
        agent_notes: formData.agent_notes || null
      };

      const { servicesData, staffToAdd: finalStaffToAdd } = await prepareServicesAndStaff(selectedLead.id);
      
      let success = false, error = null, targetSalonId = selectedLead.id;
      if (isManualLead) {
        const res = await convertManualLeadToSalon(
          selectedLead.id,
          updatePayload,
          servicesData,
          finalStaffToAdd,
          salonAmenities,
          agentEmail,
          "REVIEW"
        );
        success = res.success;
        error = res.error;
        if (res.success && res.salonId) targetSalonId = res.salonId;
      } else {
        const res = await saveAgentLeadData(
          selectedLead.id,
          updatePayload,
          servicesData,
          finalStaffToAdd,
          agentEmail,
          null,
          salonAmenities,
          "REVIEW"
        );
        success = res.success;
        error = res.error;
      }
      
      if (!success) throw new Error(error || "Failed to send to owner");

      const apiRes = await fetch("/api/invite-owner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salonId: targetSalonId,
          ownerEmail: formData.owner_gmail,
          actorEmail: agentEmail,
        }),
      });
      
      if (!apiRes.ok) {
        const err = await apiRes.json();
        throw new Error(err.error || "Failed to send email invite");
      }

      if (formData.phone) {
        const waRes = await sendOnboardingInviteAlert(
          targetSalonId, 
          formData.phone, 
          formData.owner_gmail, 
          formData.name || selectedLead.name,
          selectedLead.slug || "salon"
        );
        if (!waRes.success) {
          console.warn("WhatsApp notification failed:", waRes.error);
        }
      }

      toast.success("Sent to Salon Owner and Invites Delivered!");

      setIsModalOpen(false);
      setSelectedLead(null);
      fetchLeads();
    } catch (error: any) {
      toast.error("Failed to send: " + error.message);
    } finally {
      setUpdating(false);
    }
  };


  const handleSendInvitation = async () => {
    if (!selectedLead) return;
    if (!formData.owner_gmail) {
      toast.error("Owner Gmail is required to send an invitation.");
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
        category: selectedCategories.join(", ") || null,
        working_hours: parsedHours,
        latitude: formData.latitude === "" ? null : parseFloat(formData.latitude),
        longitude: formData.longitude === "" ? null : parseFloat(formData.longitude),
        price_level: formData.price_level || null,
        summary: formData.summary || null,
        hero_url: formData.hero_url || null,
        owner_gmail: formData.owner_gmail ? normalizeEmail(formData.owner_gmail) : null,
        agent_notes: formData.agent_notes || null,
        onboarding_status: "OWNER_INVITED",
      };

      const { servicesData, staffToAdd: finalStaffToAdd } = await prepareServicesAndStaff(selectedLead.id);

      const { success, error } = await saveAgentLeadData(
        selectedLead.id,
        updatePayload,
        servicesData,
        finalStaffToAdd,
        agentEmail,
        "OWNER_INVITED",
        salonAmenities
      );
      if (!success) throw new Error(error || "Failed to update status");

      const res = await fetch("/api/invite-owner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salonId: selectedLead.id,
          ownerEmail: formData.owner_gmail,
          actorEmail: agentEmail,
        }),
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to send email invite");
      }

      if (formData.phone) {
        const waRes = await sendOnboardingInviteAlert(
          selectedLead.id, 
          formData.phone, 
          formData.owner_gmail, 
          formData.name || selectedLead.name,
          selectedLead.slug
        );
        if (!waRes.success) {
          console.warn("WhatsApp notification failed:", waRes.error);
        }
      }
      
      toast.success("Invites sent to owner!");
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
        onboarding_status: "PENDING_ADMIN_VERIFICATION",
        booking_enabled: true
      };

      const { success, error } = await saveAgentLeadData(
        selectedLead.id,
        updatePayload,
        null,
        null,
        agentEmail,
        "PENDING_ADMIN_VERIFICATION",
        salonAmenities
      );
      if (!success) throw new Error(error || "Failed to save via Server Action");

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
      
      toast.success("Salon approved and sent to Admin for Verification! (Booking enabled)");
      setIsModalOpen(false);
      setSelectedLead(null);
      fetchLeads();
    } catch (error: any) {
      toast.error("Error: " + error.message);
    } finally {
      setUpdating(false);
    }
  };

  const tabLeads = leads.filter(l => {
    if (activeTab === "all") return true;
    if (activeTab === "assigned") return l.onboarding_status === "ASSIGNED_TO_AGENT";
    if (activeTab === "verified") return l.onboarding_status === "PUBLISHED_UNBOOKABLE";
    if (activeTab === "invited") return ["OWNER_INVITED", "OWNER_ACTIVATED", "PENDING_ADMIN_VERIFICATION", "VERIFIED"].includes(l.onboarding_status);
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#1A1C29] tracking-tight">Salon Creation</h1>
          <p className="text-zinc-500 text-sm mt-1">Verify salon details, set owner Gmail, and send invites. See all assigned salons in <Link href="/agent/salons" className="text-brand font-semibold hover:underline">My Salons</Link>.</p>
        </div>
      </div>

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
            <p className="text-xl font-black text-[#1A1C29]">{leads.filter(l => ["PUBLISHED_UNBOOKABLE","OWNER_INVITED","OWNER_ACTIVATED","PENDING_ADMIN_VERIFICATION","VERIFIED"].includes(l.onboarding_status)).length}</p>
          </div>
        </Card>
        <Card className="p-4 border-none shadow-sm flex items-center gap-4 bg-white rounded-2xl">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Owner Invited</p>
            <p className="text-xl font-black text-[#1A1C29]">{leads.filter(l => ["OWNER_INVITED","OWNER_ACTIVATED","PENDING_ADMIN_VERIFICATION","VERIFIED"].includes(l.onboarding_status)).length}</p>
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

      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={() => setMainTab("google")}
          className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${
            mainTab === "google" ? "bg-[#1A1C29] text-white shadow-md" : "bg-white text-zinc-500 hover:text-zinc-900 border border-zinc-200"
          }`}
        >
          Google Leads
        </button>
        <button
          onClick={() => setMainTab("manual")}
          className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${
            mainTab === "manual" ? "bg-[#1A1C29] text-white shadow-md" : "bg-white text-zinc-500 hover:text-zinc-900 border border-zinc-200"
          }`}
        >
          Salon Leads (Manual)
          {manualLeads.length > 0 && (
            <span className={`ml-2 text-[10px] px-2 py-0.5 rounded-full ${mainTab === "manual" ? "bg-white text-[#1A1C29]" : "bg-brand-pink text-white"}`}>{manualLeads.length}</span>
          )}
        </button>
      </div>

      <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
        {mainTab === 'google' ? (
          <>
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
                  onClick={() => setActiveTab("verified")}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                    // @ts-ignore
                    activeTab === "verified" ? "bg-white text-brand shadow-sm" : "text-zinc-500 hover:text-zinc-950"
                  }`}
                >
                  Published
                </button>
                <button
                  onClick={() => setActiveTab("invited")}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                    // @ts-ignore
                    activeTab === "invited" ? "bg-white text-brand shadow-sm" : "text-zinc-500 hover:text-zinc-950"
                  }`}
                >
                  Invited/Owner Action
                </button>
              </div>
            </div>

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

                        {lead.admin_notes && (
                          <div className="bg-amber-50 border border-amber-200 rounded-xl p-2 mb-2">
                            <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wide mb-0.5">Admin Notes</p>
                            <p className="text-xs text-amber-800">{lead.admin_notes}</p>
                          </div>
                        )}

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
          </>
        ) : (
          <div className="p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-[#1A1C29] text-base">Manual Salon Leads</h3>
                <p className="text-zinc-400 text-xs mt-0.5">These are leads captured from the onboarding form. Click Edit to process and convert them to Salons.</p>
              </div>
            </div>
            {manualLeads.length === 0 ? (
              <div className="text-center py-20 text-zinc-300">
                <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">No manual salon leads pending.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-zinc-100 shadow-sm">
                <table className="w-full text-left text-sm text-zinc-600">
                  <thead className="text-xs text-zinc-400 uppercase bg-zinc-50">
                    <tr>
                      <th className="px-4 py-4 font-medium">Business Name</th>
                      <th className="px-4 py-4 font-medium">Owner</th>
                      <th className="px-4 py-4 font-medium">Location</th>
                      <th className="px-4 py-4 font-medium">Contact</th>
                      <th className="px-4 py-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {manualLeads.map(lead => (
                      <tr key={lead.id} className="hover:bg-zinc-50/50 transition-colors bg-white">
                        <td className="px-4 py-4 font-medium text-zinc-900">{lead.name}</td>
                        <td className="px-4 py-4">
                          <div className="font-medium text-zinc-800">{lead.owner_name}</div>
                          <div className="text-xs text-zinc-400">{lead.owner_email}</div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="font-medium text-zinc-800">{lead.city}, {lead.district}</div>
                          <div className="text-xs text-zinc-400 truncate max-w-[200px]">{lead.address}</div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="font-medium text-zinc-800">{lead.whatsapp_number || lead.phone}</div>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <Button size="sm" className="text-xs h-8 bg-brand hover:bg-brand/90 text-white shadow-sm font-bold" onClick={() => handleOpenModal(lead, true)}>
                            Edit / Process
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </Card>

      {isModalOpen && selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-3xl w-full shadow-2xl relative border border-zinc-100 flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
            
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

            {formData.admin_notes && (
              <div className="mt-4 bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-start gap-3">
                <ClipboardList className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wide">Admin Instructions</p>
                  <p className="text-xs text-amber-800 mt-0.5">{formData.admin_notes}</p>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto py-5 space-y-6 pr-1 text-xs">

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
                  <div className="space-y-2">
                    <label className="font-bold text-zinc-500 uppercase text-[9px] tracking-wide">Category</label>
                    <CategoryMultiSelect
                      value={selectedCategories}
                      onChange={(cats) => {
                        setSelectedCategories(cats);
                        setFormData({ ...formData, category: cats.join(", ") });
                      }}
                      maxCategories={2}
                      theme="light"
                      showUpgradeLink={false}
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
                    <label className="font-bold text-zinc-500 uppercase text-[9px] tracking-wide">WhatsApp Number <span className="text-rose-500">*</span></label>
                    <LkPhoneInput
                      value={formData.phone}
                      onChange={(phone) => setFormData({...formData, phone})}
                      theme="light"
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="font-bold text-zinc-500 uppercase text-[9px] tracking-wide flex items-center gap-1.5">
                      <Mail className="w-3 h-3 text-emerald-600" /> Owner Email (Creates Invite)
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
                    <label className="font-bold text-zinc-500 uppercase text-[9px] tracking-wide">Hero Image</label>
                    <div className="flex items-center gap-2">
                      <Input
                        value={formData.hero_url}
                        onChange={(e) => setFormData({...formData, hero_url: e.target.value})}
                        placeholder="https://..."
                        className="h-10 rounded-xl bg-zinc-50 border-zinc-200 focus:ring-2 focus:ring-emerald-500/20 flex-1"
                      />
                      <Button type="button" variant="outline" className="h-10 px-4 rounded-xl relative overflow-hidden bg-white hover:bg-zinc-50 text-zinc-600 font-bold text-xs" disabled={uploadingImage}>
                        {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <><UploadCloud className="w-4 h-4 mr-2" /> Upload</>}
                        <input 
                          type="file" 
                          accept="image/*"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          onChange={handleImageUpload}
                          disabled={uploadingImage}
                        />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-zinc-500 uppercase text-[9px] tracking-wide">Price Level</label>
                    <Input
                      value={formData.price_level}
                      onChange={(e) => setFormData({...formData, price_level: e.target.value})}
                      placeholder="LKR, LKR LKR, LKR LKR LKR"
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

              <div className="space-y-3">
                <h4 className="font-extrabold uppercase tracking-widest text-emerald-600 text-[10px] border-b border-emerald-100 pb-1 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5" /> 2. Agent Field Data
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1 md:col-span-2">
                    <label className="font-bold text-zinc-500 uppercase text-[9px] tracking-wide">Agent Field Notes</label>
                    <textarea
                      value={formData.agent_notes}
                      onChange={(e) => setFormData({...formData, agent_notes: e.target.value})}
                      placeholder="e.g. Spoke with manager, salon is open 7 days, interested in Premium plan..."
                      className="w-full min-h-[80px] p-3 rounded-xl bg-zinc-50 border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-xs font-medium leading-relaxed"
                    />
                  </div>
                  <div className="space-y-4 md:col-span-2">
                    <label className="font-bold text-zinc-500 uppercase text-[9px] tracking-wide flex items-center justify-between">
                      <span>Working Hours</span>
                    </label>
                    <WorkingHoursEditor 
                      value={formData.working_hours} 
                      onChange={(val) => setFormData({...formData, working_hours: val})} 
                    />
                  </div>
                  
                  <div className="space-y-1 md:col-span-2">
                    <label className="font-bold text-zinc-500 uppercase text-[9px] tracking-wide flex items-center gap-1.5">
                      <Map className="w-3.5 h-3.5" /> Captured Location (Lat/Lng)
                    </label>
                    <div className="flex gap-2">
                      <Input
                        value={formData.latitude}
                        onChange={(e) => setFormData({...formData, latitude: e.target.value})}
                        placeholder="Latitude"
                        className="h-10 rounded-xl bg-zinc-50 border-zinc-200"
                      />
                      <Input
                        value={formData.longitude}
                        onChange={(e) => setFormData({...formData, longitude: e.target.value})}
                        placeholder="Longitude"
                        className="h-10 rounded-xl bg-zinc-50 border-zinc-200"
                      />
                    </div>
                    {formData.map_url && (
                      <p className="text-[10px] text-zinc-400 mt-1">
                        <a href={formData.map_url} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline flex items-center gap-1">
                          Open in Google Maps
                        </a>
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-3 md:col-span-2 pt-2">
                    <h4 className="font-extrabold uppercase tracking-widest text-emerald-600 text-[10px] border-b border-emerald-100 pb-1 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5" /> 3. Included Services
                    </h4>
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] text-zinc-500 font-medium">Select up to 6 services based on your category.</p>
                      <span className="text-[10px] font-bold text-zinc-400">
                        {Object.values(selectedServices).filter(s => s.enabled).length} / 6 SELECTED
                      </span>
                    </div>
                    <div className="flex flex-col gap-2 max-h-60 overflow-y-auto p-2 bg-zinc-50 rounded-xl border border-zinc-100 custom-scrollbar">
                      {selectedCategories.length === 0 ? (
                        <span className="text-[10px] text-zinc-400 font-medium p-1">Please select a category first to view available services.</span>
                      ) : globalServices.filter(s => selectedCategories.includes(s.category)).length === 0 ? (
                        <span className="text-[10px] text-zinc-400 font-medium p-1">No services available for the selected categories.</span>
                      ) : (
                        globalServices.filter(s => selectedCategories.includes(s.category)).map(s => {
                          const config = selectedServices[s.id] || { enabled: false, price: s.default_price?.toString() || "0", duration: s.default_duration?.toString() || "30", category: s.category || "" };
                          return (
                            <div 
                              key={s.id}
                              className={`p-3 rounded-xl border transition-colors ${
                                config.enabled ? 'bg-white border-emerald-200 shadow-sm' : 'bg-white border-zinc-200 opacity-70 hover:opacity-100'
                              }`}
                            >
                              <label className="flex items-center gap-2 cursor-pointer mb-2">
                                <input 
                                  type="checkbox"
                                  checked={config.enabled}
                                  onChange={(e) => {
                                    const currentlySelected = Object.values(selectedServices).filter(svc => svc.enabled).length;
                                    if (e.target.checked && currentlySelected >= 6) {
                                      toast.error("You can only select up to 6 services. Owners can upgrade later to add more.");
                                      return;
                                    }
                                    setSelectedServices(prev => ({ ...prev, [s.id]: { ...config, enabled: e.target.checked } }));
                                  }}
                                  className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                                />
                                <span className="text-xs font-bold text-zinc-800">{s.name} <span className="text-zinc-400 font-normal">({s.category})</span></span>
                              </label>
                              {config.enabled && (
                                <div className="flex gap-3 pl-6 mt-2">
                                  <div className="space-y-1">
                                    <label className="text-[9px] font-bold text-zinc-400 uppercase">Price</label>
                                    <input 
                                      type="number" 
                                      value={config.price} 
                                      onChange={e => setSelectedServices(prev => ({ ...prev, [s.id]: { ...config, price: e.target.value } }))}
                                      className="h-8 w-24 px-2 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:border-emerald-500"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[9px] font-bold text-zinc-400 uppercase">Duration (m)</label>
                                    <input 
                                      type="number" 
                                      value={config.duration} 
                                      onChange={e => setSelectedServices(prev => ({ ...prev, [s.id]: { ...config, duration: e.target.value } }))}
                                      className="h-8 w-24 px-2 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:border-emerald-500"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-3 md:col-span-2 pt-2">
                    <h4 className="font-extrabold uppercase tracking-widest text-emerald-600 text-[10px] border-b border-emerald-100 pb-1 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" /> 4. Add Staff
                    </h4>
                    {staffToAdd.length > 0 && (
                      <div className="grid grid-cols-1 gap-2 mb-3">
                        {staffToAdd.map((st, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-xs uppercase">
                                {st.name.substring(0,2)}
                              </div>
                              <div>
                                <h5 className="text-xs font-bold text-indigo-900">{st.name}</h5>
                                <p className="text-[10px] text-indigo-600 font-medium">{st.role}</p>
                              </div>
                            </div>
                            <button onClick={() => setStaffToAdd(prev => prev.filter((_, i) => i !== idx))} className="text-indigo-400 hover:text-red-500 p-1">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        if (staffToAdd.length >= 2) {
                          toast.error("You can only add up to 2 staff members. Owners can upgrade later to add more.");
                          return;
                        }
                        setIsStaffModalOpen(true);
                      }}
                      className="w-full border-dashed border-2 border-zinc-200 text-zinc-500 font-bold hover:bg-zinc-50 hover:border-zinc-300 h-12"
                    >
                      <Plus className="w-4 h-4 mr-2" /> Add Professional
                    </Button>
                  </div>
                </div>
                
                {/* 5. Amenities Section */}
                <div className="space-y-3 pt-4 border-t border-zinc-100">
                  <h4 className="font-extrabold uppercase tracking-widest text-emerald-600 text-[10px] border-b border-emerald-100 pb-1 flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-[8px]">5</span> 
                    Amenities & Facilities
                  </h4>
                  <div className="bg-zinc-50/50 border border-slate-100 rounded-2xl p-4">
                    <p className="text-[10px] text-zinc-500 mb-4 font-medium">Select the amenities and facilities available at this salon.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                      {globalAmenities.map((amenity) => {
                        const isChecked = salonAmenities[amenity.id]?.has_amenity || false;
                        const qty = salonAmenities[amenity.id]?.quantity || "";
                        
                        return (
                          <div key={amenity.id} className={`flex flex-col gap-2 p-3 rounded-xl border transition-all ${isChecked ? 'border-brand bg-rose-50/30' : 'border-zinc-200 bg-white'}`}>
                            <div className="flex items-center gap-3">
                              <input 
                                type="checkbox" 
                                id={`amenity-${amenity.id}`}
                                checked={isChecked}
                                onChange={(e) => {
                                  setSalonAmenities(prev => ({
                                    ...prev,
                                    [amenity.id]: {
                                      has_amenity: e.target.checked,
                                      quantity: e.target.checked ? (amenity.type === 'number' ? 1 : null) : null
                                    }
                                  }));
                                }}
                                className="w-4 h-4 rounded border-zinc-300 text-brand focus:ring-brand cursor-pointer"
                              />
                              <label htmlFor={`amenity-${amenity.id}`} className="text-xs font-bold text-zinc-900 cursor-pointer flex-1">
                                {amenity.name}
                              </label>
                            </div>
                            {isChecked && amenity.type === "number" && (
                              <div className="pl-7 flex items-center gap-2 mt-1">
                                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Quantity:</span>
                                <Input 
                                  type="number" 
                                  min="1"
                                  value={qty}
                                  onChange={(e) => {
                                    setSalonAmenities(prev => ({
                                      ...prev,
                                      [amenity.id]: {
                                        has_amenity: true,
                                        quantity: parseInt(e.target.value) || 1
                                      }
                                    }));
                                  }}
                                  className="h-7 w-16 px-2 rounded-lg bg-white border-zinc-200 text-xs font-bold"
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

              </div>

            </div>

            <div className="pt-4 border-t border-zinc-100 space-y-3">
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
                  <Button
                    onClick={() => handleSave()}
                    disabled={updating}
                    variant="outline"
                    className="rounded-xl font-bold h-10 px-4 border-zinc-200 text-xs"
                  >
                    {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                  </Button>

                  {["ASSIGNED_TO_AGENT", "DISCOVERED"].includes(formData.onboarding_status) && (
                    <Button
                      onClick={handleSendToOwner}
                      disabled={updating || !formData.phone || !formData.owner_gmail}
                      className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold h-10 px-4 text-xs flex items-center gap-2"
                    >
                      <Send className="w-4 h-4" /> Send to Salon Owner for Review
                    </Button>
                  )}
                  
                  {["PUBLISHED_UNBOOKABLE"].includes(formData.onboarding_status) && (
                    <Button
                      onClick={handleSendInvitation}
                      disabled={updating || !formData.phone || !formData.owner_gmail}
                      className="bg-brand hover:bg-emerald-700 text-white rounded-xl font-bold h-10 px-4 text-xs flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Send Invitation
                    </Button>
                  )}

                  {formData.onboarding_status === "OWNER_ACTIVATED" && (
                    <Button
                      onClick={handleAgentApproval}
                      disabled={updating}
                      className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold h-10 px-4 text-xs flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Enable Booking & Send to Admin
                    </Button>
                  )}

                  {/* Pending status display */}
                  {["OWNER_INVITED"].includes(formData.onboarding_status) && (
                    <div className="flex items-center gap-2">
                      <Badge className="bg-amber-50 text-amber-600 border border-amber-200 font-bold text-[10px] px-3 py-2">
                        ⏳ Owner Invited
                      </Badge>
                      <Button
                        onClick={handleSendInvitation}
                        disabled={updating || !formData.phone || !formData.owner_gmail}
                        variant="outline"
                        className="text-amber-600 border-amber-200 hover:bg-amber-50 rounded-xl font-bold h-10 px-4 text-xs flex items-center gap-2"
                      >
                        <Send className="w-3.5 h-3.5" /> Resend Invitation
                      </Button>
                    </div>
                  )}

                  {["PENDING_ADMIN_VERIFICATION", "VERIFIED"].includes(formData.onboarding_status) && (
                    <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-200 font-bold text-[10px] px-3 py-2">
                      ✅ Booking Enabled
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Sub-modal for Add Professional */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto py-10">
          <AddProfessionalForm
            onCancel={() => setIsStaffModalOpen(false)}
            onSubmit={(staffData) => {
              setStaffToAdd(prev => [...prev, staffData]);
              setIsStaffModalOpen(false);
            }}
            globalRoles={globalStaffRoles}
            salonServices={Object.keys(selectedServices).filter(id => selectedServices[id].enabled).map(id => {
              const gs = globalServices.find(g => g.id === id);
              return {
                id,
                name: gs?.name || "Service",
                duration_min: selectedServices[id].duration
              };
            })}
          />
        </div>
      )}
    </div>
  );
}
