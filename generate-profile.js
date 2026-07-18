const fs = require('fs');

const agentFile = 'apps/web/src/app/agent/leads/page.tsx';
const profileFile = 'apps/web/src/app/dashboard/profile/page.tsx';

const agentCode = fs.readFileSync(agentFile, 'utf8');

// Extract WorkingHoursEditor
const whStart = agentCode.indexOf('function WorkingHoursEditor(');
const whEnd = agentCode.indexOf('export default function AgentLeadsPage()');
const workingHoursEditor = agentCode.substring(whStart, whEnd);

// Extract modal contents
const modalStart = agentCode.indexOf('<div className="flex-1 overflow-y-auto py-5 space-y-6 pr-1 text-xs">');
const modalEnd = agentCode.indexOf('<div className="pt-4 border-t border-zinc-100 space-y-3">');
const formContent = agentCode.substring(modalStart, modalEnd);

const newProfileCode = `/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect } from "react";
import { fetchSalonProfilePage } from "@/app/actions/salon-dashboard-data";
import { saveOwnerVerificationData } from "@/app/actions/salon-operations";
import { toast } from "sonner";
import { Loader2, Globe, Sparkles, MapPin, Map, Building2, ExternalLink, ShieldCheck, Tag, UploadCloud, Users, Trash2, Plus, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CategoryMultiSelect } from "@/components/ui/CategoryMultiSelect";
import { LkPhoneInput } from "@/components/ui/LkPhoneInput";
import { AddProfessionalForm } from "../../../components/forms/AddProfessionalForm";
import { supabase } from "@/config/supabase";

function getStatusBadge(status: string) {
  if (status === "ACTIVE") return "bg-emerald-100 text-emerald-700";
  if (status === "OWNER_ACTIVATED") return "bg-[#ffde5a] text-black";
  return "bg-amber-100 text-amber-700";
}

${workingHoursEditor}

export default function SalonProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<any>(null);
  
  const [globalServices, setGlobalServices] = useState<any[]>([]);
  const [globalAmenities, setGlobalAmenities] = useState<any[]>([]);
  const [staffRoles, setStaffRoles] = useState<any[]>([]);
  
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedServices, setSelectedServices] = useState<{[key: string]: { enabled: boolean, price: string, duration: string, category: string }}>({});
  const [salonAmenities, setSalonAmenities] = useState<Record<string, { has_amenity: boolean, quantity: number | null }>>({});
  const [staffToAdd, setStaffToAdd] = useState<any[]>([]);
  
  const [isUploading, setIsUploading] = useState(false);
  
  useEffect(() => {
    async function load() {
      try {
        const res = await fetchSalonProfilePage();
        if (!res.success) throw new Error(res.error);
        
        setFormData({
          id: res.salon.id,
          name: res.salon.name || "",
          category: res.salon.category || "",
          address: res.salon.address || "",
          phone: res.salon.phone || "",
          owner_email: res.salon.owner_email || "",
          website: res.salon.website || "",
          rating: res.salon.rating?.toString() || "",
          hero_url: res.salon.hero_url || "",
          price_level: res.salon.price_level?.toString() || "",
          google_summary: res.salon.google_summary || "",
          admin_notes: res.salon.admin_notes || "",
          working_hours: res.salon.working_hours || "",
          latitude: res.salon.latitude?.toString() || "",
          longitude: res.salon.longitude?.toString() || "",
          map_url: res.salon.map_url || "",
          map_embed_url: res.salon.map_embed_url || "",
          onboarding_status: res.salon.onboarding_status || "DISCOVERED"
        });
        
        setSelectedCategories(res.salon.category ? res.salon.category.split(",").map((c:string)=>c.trim()) : []);
        
        setGlobalServices(res.globalServices || []);
        setGlobalAmenities(res.globalAmenities || []);
        setStaffRoles(res.globalStaffRoles || []);
        
        const svcMap: any = {};
        for (const s of (res.services || [])) {
          svcMap[s.global_service_id] = {
            enabled: true,
            price: s.price?.toString() || "0",
            duration: s.duration_min?.toString() || "30",
            category: s.category || "",
          };
        }
        setSelectedServices(svcMap);
        
        const amMap: any = {};
        for (const a of (res.salonAmenities || [])) {
          amMap[a.amenity_id] = { has_amenity: true, quantity: a.quantity };
        }
        setSalonAmenities(amMap);
        
        setStaffToAdd(res.staff || []);
        
      } catch (err: any) {
        toast.error("Failed to load profile: " + err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const svcsToAdd = [];
      const svcsToRemoveIds: string[] = []; // We will just insert all for now since it's a new flow
      for (const [id, config] of Object.entries(selectedServices)) {
        if (config.enabled) {
          const gs = globalServices.find((g:any) => g.id === id);
          if (gs) {
            svcsToAdd.push({
              global_service_id: id,
              name: gs.name,
              category: config.category,
              category_id: gs.category_id,
              price: parseFloat(config.price) || 0,
              duration_min: parseInt(config.duration) || gs.default_duration || 30,
              status: "active"
            });
          }
        }
      }
      
      const payload = {
         name: formData.name,
         category: formData.category,
         address: formData.address,
         phone: formData.phone,
         owner_email: formData.owner_email,
         website: formData.website,
         rating: parseFloat(formData.rating) || null,
         hero_url: formData.hero_url,
         price_level: parseInt(formData.price_level) || null,
         google_summary: formData.google_summary,
         admin_notes: formData.admin_notes,
         working_hours: formData.working_hours,
         latitude: parseFloat(formData.latitude) || null,
         longitude: parseFloat(formData.longitude) || null,
         map_url: formData.map_url,
         map_embed_url: formData.map_embed_url
      };

      const result = await saveOwnerVerificationData(
        payload,
        { svcsToAdd, svcsToRemoveIds },
        staffToAdd,
        salonAmenities
      );
      
      if (!result.success) throw new Error(result.error);
      
      toast.success("Salon Profile sent for verification successfully!");
      setFormData({ ...formData, onboarding_status: "OWNER_ACTIVATED" });
    } catch (err: any) {
      toast.error("Failed to send for verification: " + err.message);
    } finally {
      setSaving(false);
    }
  };
  
  const handleHeroUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = \`\${Math.random()}.\${fileExt}\`;
      const filePath = \`public/\${fileName}\`;
      const { error: uploadError, data } = await supabase.storage.from("salon-assets").upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("salon-assets").getPublicUrl(filePath);
      setFormData({ ...formData, hero_url: publicUrl });
      toast.success("Image uploaded!");
    } catch (err: any) {
      toast.error("Upload failed: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-zinc-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
        <p className="font-semibold text-sm">Loading field editor...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-black text-zinc-900 tracking-tight">Profile Verification</h3>
            <span className={\`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider \${getStatusBadge(formData.onboarding_status)}\`}>
              {(formData.onboarding_status || "ASSIGNED_TO_AGENT").replace(/_/g, " ")}
            </span>
          </div>
          <p className="text-xs text-zinc-400 font-mono">ID: {formData.id}</p>
        </div>
      </div>
      
      ${formContent}
      
      <div className="pt-6 border-t border-zinc-100 flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="bg-[#ffde5a] hover:bg-[#ffe680] text-black font-bold px-8 h-12 rounded-xl text-sm tracking-wide shadow-md flex items-center gap-2"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
          SEND FOR VERIFICATION
        </Button>
      </div>
    </div>
  );
}
`;

fs.writeFileSync(profileFile, newProfileCode);
console.log("Written successfully!");
