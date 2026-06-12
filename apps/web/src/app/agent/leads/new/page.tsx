"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ArrowLeft, Building2, Loader2, UserPlus, Tag, Users, Trash2, Plus, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LkPhoneInput } from "@/components/ui/LkPhoneInput";
import { Card } from "@/components/ui/card";
import { supabase } from "@/config/supabase";
import { toast } from "sonner";
import { CategoryMultiSelect } from "@/components/ui/CategoryMultiSelect";
import { getAgentEmailFast } from "@/lib/client-auth";
import { createAgentLeadData, fetchAgentGlobals } from "../../../actions/agent-leads-update";
import { tryAgentData, fetchAgentGlobalsClient, getAgentEmailFromClient } from "@/lib/agent-client-data";
import { AddProfessionalForm, StaffPayload } from "../../../../components/forms/AddProfessionalForm";
import { sendOnboardingInviteAlert } from "../../../actions/whatsapp";

export default function AgentNewLeadPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    address: "",
    phone: "",
    owner_gmail: "",
    website: "",
    summary: "",
    agent_notes: "",
  });
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [agentEmail, setAgentEmail] = useState("");

  // Services, Staff, Amenities state
  const [globalServices, setGlobalServices] = useState<any[]>([]);
  const [globalStaffRoles, setGlobalStaffRoles] = useState<any[]>([]);
  const [globalAmenities, setGlobalAmenities] = useState<any[]>([]);
  const [selectedServices, setSelectedServices] = useState<{[key: string]: { enabled: boolean, price: string, duration: string, category: string }}>({});
  const [staffToAdd, setStaffToAdd] = useState<StaffPayload[]>([]);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [salonAmenities, setSalonAmenities] = useState<Record<string, { has_amenity: boolean, quantity: number | null }>>({});

  useEffect(() => {
    void Promise.resolve().then(async () => {
      try {
        const email = (await getAgentEmailFromClient()) || getAgentEmailFast();
        if (email) {
          setAgentEmail(email);
        }

        const res = await tryAgentData(fetchAgentGlobals, fetchAgentGlobalsClient);
        if (res.success) {
          setGlobalServices(res.services);
          setGlobalStaffRoles(res.staffRoles);
          setGlobalAmenities(res.amenities);
        } else {
          console.error("Failed to load globals via server action");
        }
      } catch (e) {
        console.error("Failed to load globals:", e);
      }
    });
  }, []);

  const prepareServicesAndStaff = async () => {
    const selectedSvcIds = Object.keys(selectedServices).filter(id => selectedServices[id].enabled);
    
    let svcsToAdd: any[] = [];
    if (selectedSvcIds.length > 0) {
      svcsToAdd = selectedSvcIds.map(id => {
        const gs = globalServices.find(g => g.id === id);
        const override = selectedServices[id];
        return {
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
          const fileName = `temp-${Date.now()}.jpg`; // Note: the action can't rename without salonId, so we use temp name
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
      servicesData: { svcsToAdd },
      staffToAdd: finalStaffToAdd
    };
  };

  const [submitAction, setSubmitAction] = useState<"DRAFT" | "REVIEW">("DRAFT");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error("Salon name is required.");
      return;
    }
    if (!agentEmail) {
      toast.error("Please log in as an agent.");
      return;
    }
    if (submitAction === "REVIEW" && (!form.owner_gmail?.trim() || !form.phone?.trim())) {
      toast.error("Both Owner Gmail and WhatsApp number (Phone) are required to send for review.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        ...form,
        category: selectedCategories.join(", ") || null,
      };

      const { servicesData, staffToAdd: finalStaffToAdd } = await prepareServicesAndStaff();

      const { success, error, salonId } = await createAgentLeadData(
        payload,
        servicesData,
        finalStaffToAdd,
        salonAmenities,
        agentEmail,
        submitAction
      );

      if (!success) {
        throw new Error(error || "Failed to create lead.");
      }

      if (submitAction === "REVIEW") {
        const res = await fetch("/api/invite-owner", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            salonId,
            ownerEmail: form.owner_gmail,
            actorEmail: agentEmail,
          }),
        });
        
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to send email invite");
        }

        if (form.phone) {
          const waRes = await sendOnboardingInviteAlert(
            salonId, 
            form.phone, 
            form.owner_gmail, 
            form.name,
            salonId // Note: We might not have the slug immediately available here, so salonId is used
          );
          if (!waRes.success) {
            console.warn("WhatsApp notification failed:", waRes.error);
          }
        }
        toast.success("Lead created, Salon Owner sent review invites!");
      } else {
        toast.success("Manual lead saved as draft successfully.");
      }

      router.push(`/agent/leads?open=${salonId}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to create lead.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300 pb-20">
      <div className="flex items-center gap-3">
        <Link
          href="/agent/leads"
          className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to My Salons
        </Link>
      </div>

      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-zinc-900 tracking-tight">Add Manual Lead</h1>
            <p className="text-sm text-zinc-500 mt-0.5">
              Create a salon you found in the field with full details including services and staff.
            </p>
          </div>
        </div>
      </div>

      <Card className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
        <form onSubmit={handleSubmit} className="divide-y divide-zinc-100">
          
          {/* Section 1: Basic Info */}
          <div className="p-6 space-y-5 bg-white">
            <h4 className="font-extrabold uppercase tracking-widest text-blue-600 text-[10px] flex items-center gap-1.5 mb-4">
              <span className="w-3.5 h-3.5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[8px]">1</span> 
              Basic Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  Salon name <span className="text-rose-500">*</span>
                </label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. City Cuts Barber"
                  className="h-11 bg-zinc-50 border-zinc-200 text-zinc-900 focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  Category <span className="text-zinc-400 font-normal normal-case">(select up to 2)</span>
                </label>
                <CategoryMultiSelect
                  value={selectedCategories}
                  onChange={setSelectedCategories}
                  maxCategories={2}
                  theme="light"
                  showUpgradeLink={false}
                />
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">WhatsApp Number</label>
                <LkPhoneInput
                  value={form.phone}
                  onChange={(phone) => setForm({ ...form, phone })}
                  theme="light"
                  className="h-11 w-full"
                />
              </div>
              
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Address</label>
                <Input
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Street, city, district"
                  className="h-11 bg-zinc-50 border-zinc-200 text-zinc-900 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Owner Gmail</label>
                <Input
                  type="email"
                  value={form.owner_gmail}
                  onChange={(e) => setForm({ ...form, owner_gmail: e.target.value })}
                  placeholder="owner@gmail.com"
                  className="h-11 bg-zinc-50 border-zinc-200 text-zinc-900 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Website</label>
                <Input
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  placeholder="https://..."
                  className="h-11 bg-zinc-50 border-zinc-200 text-zinc-900 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Notes</label>
                <textarea
                  value={form.agent_notes}
                  onChange={(e) => setForm({ ...form, agent_notes: e.target.value })}
                  placeholder="How you found this salon, contact person, interest level..."
                  className="w-full min-h-[96px] p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Services */}
          <div className="p-6 bg-zinc-50/50">
            <h4 className="font-extrabold uppercase tracking-widest text-emerald-600 text-[10px] flex items-center gap-1.5 mb-4">
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-[8px]">2</span> 
              Included Services
            </h4>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] text-zinc-500 font-medium">Select up to 6 services based on your category.</p>
              <span className="text-[10px] font-bold text-zinc-400">
                {Object.values(selectedServices).filter(s => s.enabled).length} / 6 SELECTED
              </span>
            </div>
            <div className="flex flex-col gap-2 max-h-80 overflow-y-auto p-2 bg-white rounded-xl border border-zinc-200 custom-scrollbar">
              {selectedCategories.length === 0 ? (
                <span className="text-[10px] text-zinc-400 font-medium p-1">Please select a category first to view available services.</span>
              ) : globalServices.filter(s => s.category && selectedCategories.includes(s.category)).length === 0 ? (
                <span className="text-[10px] text-zinc-400 font-medium p-1">No services available for the selected categories.</span>
              ) : (
                globalServices.filter(s => s.category && selectedCategories.includes(s.category)).map(s => {
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
                          <label className="text-[9px] font-bold text-zinc-400 uppercase">Price (LKR)</label>
                          <Input 
                            type="number" 
                            value={config.price} 
                            onChange={e => setSelectedServices(prev => ({ ...prev, [s.id]: { ...config, price: e.target.value } }))}
                            className="h-8 w-24 px-2 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-zinc-400 uppercase">Duration (m)</label>
                          <Input 
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

          {/* Section 3: Staff */}
          <div className="p-6 bg-white">
            <h4 className="font-extrabold uppercase tracking-widest text-indigo-600 text-[10px] flex items-center gap-1.5 mb-4">
              <span className="w-3.5 h-3.5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[8px]">3</span> 
              Add Staff
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
              onClick={() => setIsStaffModalOpen(true)}
              className="w-full border-dashed border-2 border-zinc-200 text-zinc-500 font-bold hover:bg-zinc-50 hover:border-zinc-300 h-12 rounded-xl"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Professional
            </Button>
          </div>

          {/* Section 4: Amenities */}
          <div className="p-6 bg-zinc-50/50">
            <h4 className="font-extrabold uppercase tracking-widest text-brand text-[10px] flex items-center gap-1.5 mb-4">
              <span className="w-3.5 h-3.5 rounded-full bg-rose-100 text-brand flex items-center justify-center text-[8px]">4</span> 
              Amenities & Facilities
            </h4>
            <p className="text-[10px] text-zinc-500 mb-4 font-medium">Select the amenities and facilities available at this salon.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto custom-scrollbar pr-2">
              {globalAmenities.length === 0 && (
                <span className="text-[10px] text-zinc-400 font-medium p-1">No amenities available. Loading...</span>
              )}
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

          <div className="p-6 bg-white flex flex-col sm:flex-row gap-3">
            <Button
              type="submit"
              disabled={saving}
              onClick={() => setSubmitAction("DRAFT")}
              className="h-12 flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-bold rounded-xl text-sm border border-zinc-200"
            >
              {saving && submitAction === "DRAFT" ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
              ) : (
                <><Building2 className="w-4 h-4 mr-2 text-zinc-500" /> Save as Draft</>
              )}
            </Button>
            <Button
              type="submit"
              disabled={saving}
              onClick={() => setSubmitAction("REVIEW")}
              className="h-12 flex-1 bg-brand hover:bg-brand-hover text-black font-bold rounded-xl text-sm"
            >
              {saving && submitAction === "REVIEW" ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</>
              ) : (
                <><Send className="w-4 h-4 mr-2" /> Send to Salon Owner for Review</>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/agent/leads")}
              className="h-12 px-6 border-zinc-200 text-zinc-600 hover:bg-zinc-50 rounded-xl font-bold text-sm"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>

      {/* Staff Modal */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between sticky top-0 bg-white z-10 shadow-sm">
              <h2 className="text-xl font-extrabold text-zinc-900">Add New Professional</h2>
              <button 
                onClick={() => setIsStaffModalOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-500 flex items-center justify-center hover:bg-zinc-200 transition-colors"
              >
                ×
              </button>
            </div>
            <div className="p-6 overflow-y-auto bg-zinc-50/30">
              <AddProfessionalForm
                onCancel={() => setIsStaffModalOpen(false)}
                onSubmit={(staffData) => {
                  setStaffToAdd(prev => [...prev, staffData]);
                  setIsStaffModalOpen(false);
                }}
                globalRoles={globalStaffRoles}
                salonServices={Object.keys(selectedServices)
                  .filter(id => selectedServices[id].enabled)
                  .map(id => {
                    const gs = globalServices.find(g => g.id === id);
                    return {
                      id,
                      name: gs?.name || "Service",
                      duration_min: selectedServices[id].duration
                    };
                  })}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
