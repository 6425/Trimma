/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect } from "react";
import { fetchSalonProfilePage } from "@/app/actions/salon-dashboard-data";
import { saveOwnerVerificationData } from "@/app/actions/salon-operations";
import { toast } from "sonner";
import { Loader2, Globe, Sparkles, MapPin, Map, Building2, ExternalLink, ShieldCheck, Tag, UploadCloud, Users, Trash2, Plus, Star, ClipboardList } from "lucide-react";
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
  if (status === "OWNER_ACTIVATED") return "bg-[#F5B700] text-black";
  return "bg-amber-100 text-amber-700";
}

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
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `public/${fileName}`;
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
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${getStatusBadge(formData.onboarding_status)}`}>
              {(formData.onboarding_status || "ASSIGNED_TO_AGENT").replace(/_/g, " ")}
            </span>
          </div>
          <p className="text-xs text-zinc-400 font-mono">ID: {formData.id}</p>
        </div>
      </div>
      
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
                    <label className="font-bold text-zinc-500 uppercase text-[9px] tracking-wide">Phone <span className="text-rose-500">*</span></label>
                    <LkPhoneInput
                      value={formData.phone}
                      onChange={(phone) => setFormData({...formData, phone})}
                      theme="light"
                      className="h-10"
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

            
      
      <div className="pt-6 border-t border-zinc-100 flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="bg-[#F5B700] hover:bg-[#E5A800] text-black font-bold px-8 h-12 rounded-xl text-sm tracking-wide shadow-md flex items-center gap-2"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
          SEND FOR VERIFICATION
        </Button>
      </div>
    </div>
  );
}
