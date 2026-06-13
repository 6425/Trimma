/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useRef } from "react";
import { buildStaffServicesConfigFromMember, resolveEffectiveStaffRoles } from "@/lib/salon-staff-insert";
import { Upload, Users, Clock, Tag, X, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

const defaultSchedule = {
  monday: { isWorking: true, start: "09:00", end: "18:00" },
  tuesday: { isWorking: true, start: "09:00", end: "18:00" },
  wednesday: { isWorking: true, start: "09:00", end: "18:00" },
  thursday: { isWorking: true, start: "09:00", end: "18:00" },
  friday: { isWorking: true, start: "09:00", end: "18:00" },
  saturday: { isWorking: true, start: "09:00", end: "18:00" },
  sunday: { isWorking: false, start: "09:00", end: "18:00" },
};

export interface StaffPayload {
  name: string;
  email: string;
  role: string;
  skill_level: string;
  commission_rate: number;
  general_buffer_time: number;
  schedule: any;
  services: any;
  avatarBlob?: Blob | null;
}

export interface AddProfessionalFormProps {
  onCancel: () => void;
  onSubmit: (data: any) => void;
  globalRoles: any[];
  globalSkillGrades?: any[];
  salonServices: any[];
  adding?: boolean;
  initialStaff?: Partial<StaffPayload> & {
    id?: string;
    avatar_url?: string | null;
    working_hours?: {
      schedule?: typeof defaultSchedule;
      general_buffer_time?: number;
      assigned_services?: Array<{
        service_id: string;
        commission_rate?: number | null;
        buffer_time?: number | null;
        service_time?: number | null;
      }>;
    } | null;
  } | null;
  title?: string;
  submitLabel?: string;
}

export function AddProfessionalForm({
  onCancel,
  onSubmit,
  globalRoles,
  globalSkillGrades,
  salonServices,
  adding,
  initialStaff = null,
  title = "Add Professional",
  submitLabel = "Add Professional",
}: AddProfessionalFormProps) {
  // Avatar Upload & Crop States
  const [imgSrc, setImgSrc] = useState('');
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [avatarBlob, setAvatarBlob] = useState<Blob | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const effectiveRoles = resolveEffectiveStaffRoles(globalRoles);

  const buildServicesConfig = (
    staff: AddProfessionalFormProps["initialStaff"],
    services: AddProfessionalFormProps["salonServices"]
  ) => buildStaffServicesConfigFromMember(staff || {}, services);

  // ADD FORM STATES — initialized from initialStaff when editing (parent should pass a stable key to remount)
  const [newName, setNewName] = useState(() => initialStaff?.name || "");
  const [newEmail, setNewEmail] = useState(() => initialStaff?.email || "");
  const [newRole, setNewRole] = useState(() => {
    const role = initialStaff?.role;
    if (!role) return "";
    const matched = effectiveRoles.find(
      (r) => r.role_name?.toLowerCase() === role.toLowerCase()
    );
    return matched?.role_name || role;
  });
  const [newCategory, setNewCategory] = useState(() => {
    const role = initialStaff?.role;
    if (!role) return "";
    return (
      effectiveRoles.find((r) => r.role_name?.toLowerCase() === role.toLowerCase())?.category || ""
    );
  });
  const [newCommission, setNewCommission] = useState(
    () => initialStaff?.commission_rate?.toString() || "10"
  );
  const [newSchedule, setNewSchedule] = useState(
    () => initialStaff?.schedule || initialStaff?.working_hours?.schedule || defaultSchedule
  );
  const [generalBufferTime, setGeneralBufferTime] = useState(
    () =>
      initialStaff?.general_buffer_time?.toString() ||
      initialStaff?.working_hours?.general_buffer_time?.toString() ||
      "15"
  );
  const [selectedServices, setSelectedServices] = useState<any>(() =>
    buildServicesConfig(initialStaff, salonServices)
  );
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState(() => initialStaff?.avatar_url || "");

  const handleServiceCheckboxChange = (serviceId: string, checked: boolean) => {
    setSelectedServices((prev: any) => ({
      ...prev,
      [serviceId]: {
        ...prev[serviceId],
        enabled: checked,
        commission: prev[serviceId]?.commission || newCommission,
        buffer: prev[serviceId]?.buffer || generalBufferTime,
        duration: prev[serviceId]?.duration || salonServices.find(s => s.id === serviceId)?.duration_min?.toString() || salonServices.find(s => s.id === serviceId)?.duration?.toString() || "30"
      }
    }));
  };

  const handleServiceDurationChange = (serviceId: string, val: string) => {
    setSelectedServices((prev: any) => ({ ...prev, [serviceId]: { ...prev[serviceId], duration: val } }));
  };

  const handleServiceCommissionChange = (serviceId: string, val: string) => {
    setSelectedServices((prev: any) => ({ ...prev, [serviceId]: { ...prev[serviceId], commission: val } }));
  };

  const handleServiceBufferChange = (serviceId: string, val: string) => {
    setSelectedServices((prev: any) => ({ ...prev, [serviceId]: { ...prev[serviceId], buffer: val } }));
  };

  // --- IMAGE CROP HELPERS ---
  function onSelectFile(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      setCrop(undefined);
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImgSrc(reader.result?.toString() || '');
        setIsCropModalOpen(true);
      });
      reader.readAsDataURL(e.target.files[0]);
    }
  }

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    const crop = centerCrop(
      makeAspectCrop({ unit: '%', width: 90 }, 1, width, height),
      width,
      height
    );
    setCrop(crop);
  }

  async function generateCroppedImage() {
    if (!completedCrop || !imgRef.current) return;
    const canvas = document.createElement('canvas');
    const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
    const scaleY = imgRef.current.naturalHeight / imgRef.current.height;
    
    canvas.width = 250;
    canvas.height = 250;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingQuality = 'high';
    
    const cropX = completedCrop.x * scaleX;
    const cropY = completedCrop.y * scaleY;
    const cropWidth = completedCrop.width * scaleX;
    const cropHeight = completedCrop.height * scaleY;

    ctx.drawImage(imgRef.current, cropX, cropY, cropWidth, cropHeight, 0, 0, 250, 250);

    canvas.toBlob((blob) => {
      if (!blob) return;
      setAvatarBlob(blob);
      setAvatarPreviewUrl(URL.createObjectURL(blob));
      setIsCropModalOpen(false);
    }, 'image/jpeg', 0.9);
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      id: initialStaff?.id,
      name: newName,
      email: newEmail,
      role: newRole,
      commission_rate: parseFloat(newCommission) || 0,
      general_buffer_time: parseFloat(generalBufferTime) || 0,
      schedule: newSchedule,
      services: selectedServices,
      avatarBlob,
      avatar_url: initialStaff?.avatar_url || null,
    });
  };

  return (
    <>
      <form 
        onSubmit={handleSubmit}
        className="bg-white rounded-3xl border border-slate-100 shadow-2xl p-8 max-w-lg w-full mx-auto space-y-6 animate-in slide-in-from-bottom-6 duration-300 relative overflow-hidden max-h-[85vh] overflow-y-auto custom-scrollbar"
      >
        <div className="absolute top-0 inset-x-0 h-2.5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600"></div>

        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-black text-zinc-900">{title}</h2>
            <p className="text-xs text-zinc-500 mt-1">
              {initialStaff?.id
                ? "Update this professional's hours, services, and commission settings."
                : "Register a new professional with custom hours and service commissions."}
            </p>
          </div>
          <button 
            type="button"
            onClick={onCancel}
            className="text-zinc-400 hover:text-zinc-600 p-1.5 rounded-full hover:bg-zinc-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Identity fields */}
          <div className="space-y-4 bg-zinc-50/50 p-4 rounded-2xl border border-zinc-100">
            <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
               <Users className="w-4 h-4 text-brand" /> Personal Identity
            </h3>
            <div className="flex flex-col items-center gap-2 mb-2">
              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <Avatar className="w-24 h-24 border-4 border-white shadow-md">
                  {avatarPreviewUrl ? (
                    <AvatarImage src={avatarPreviewUrl} className="object-cover" />
                  ) : (
                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(newName || 'New')}`} />
                  )}
                  <AvatarFallback>SP</AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Upload className="w-6 h-6 text-white" />
                </div>
              </div>
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={onSelectFile} />
              <p className="text-[10px] text-zinc-400 font-semibold uppercase">Click to upload photo</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2">
                <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest">Stylist Name *</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Michael Scofield"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:outline-none focus:border-zinc-950 font-medium text-sm transition-all"
                />
              </div>

              <div className="space-y-1.5 col-span-2">
                <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest">Email Address</label>
                <input 
                  type="email"
                  placeholder="michael@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:outline-none focus:border-zinc-950 font-medium text-sm transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest">Category</label>
                <select 
                  value={newCategory}
                  onChange={(e) => { setNewCategory(e.target.value); setNewRole(""); }}
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-zinc-950 font-medium text-sm bg-white"
                >
                  <option value="" disabled>Select Category (Optional Filter)</option>
                  {Array.from(new Set(effectiveRoles.map(r => r.category || 'Other'))).map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest">Role Name</label>
                <select 
                  value={newRole}
                  onChange={(e) => {
                    const selectedRole = e.target.value;
                    setNewRole(selectedRole);
                    const foundCat = effectiveRoles.find(r => r.role_name === selectedRole)?.category;
                    if (foundCat) setNewCategory(foundCat);
                  }}
                  className="w-full h-11 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-zinc-950 font-medium text-sm bg-white"
                  required
                >
                  <option value="" disabled>Select Role Name</option>
                  {effectiveRoles
                    .filter(r => !newCategory || (r.category || 'Other') === newCategory)
                    .map(r => (
                    <option key={(r as { id?: string }).id || r.role_name} value={r.role_name}>{r.role_name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Working attributes */}
          <div className="space-y-4 bg-zinc-50/50 p-4 rounded-2xl border border-zinc-100">
            <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
               <Clock className="w-4 h-4 text-brand" /> Operational Scheduling & Rates
            </h3>
            
            <div className="space-y-2">
              <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest block mb-2">7-Day Schedule</label>
              {Object.entries(newSchedule).map(([day, scheduleObj]: [string, any]) => (
                <div key={day} className="flex items-center gap-3 bg-white border border-slate-100 rounded-xl p-2 px-3">
                  <div className="w-20">
                    <span className="text-xs font-bold text-zinc-800 capitalize">{day}</span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setNewSchedule(prev => ({ ...prev, [day]: { ...prev[day as keyof typeof defaultSchedule], isWorking: !prev[day as keyof typeof defaultSchedule].isWorking } }))}
                    className={`h-8 w-14 px-0 text-[10px] font-bold rounded-lg border-none transition-colors ${scheduleObj.isWorking ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'}`}
                  >
                    {scheduleObj.isWorking ? 'IN' : 'OUT'}
                  </Button>
                  <div className="flex flex-1 items-center gap-2">
                    <input 
                      type="time" 
                      disabled={!scheduleObj.isWorking}
                      value={scheduleObj.start}
                      onChange={(e) => setNewSchedule(prev => ({ ...prev, [day]: { ...prev[day as keyof typeof defaultSchedule], start: e.target.value } }))}
                      className="h-8 w-full px-2 rounded-lg border border-slate-200 text-xs focus:border-zinc-900 focus:outline-none disabled:opacity-30 disabled:bg-slate-50 transition-all"
                    />
                    <span className="text-zinc-300 text-xs">-</span>
                    <input 
                      type="time" 
                      disabled={!scheduleObj.isWorking}
                      value={scheduleObj.end}
                      onChange={(e) => setNewSchedule(prev => ({ ...prev, [day]: { ...prev[day as keyof typeof defaultSchedule], end: e.target.value } }))}
                      className="h-8 w-full px-2 rounded-lg border border-slate-200 text-xs focus:border-zinc-900 focus:outline-none disabled:opacity-30 disabled:bg-slate-50 transition-all"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest">General Buffer Time (mins)</label>
                <input 
                  type="number"
                  required
                  placeholder="15"
                  value={generalBufferTime}
                  onChange={(e) => {
                    const newBuf = e.target.value;
                    setGeneralBufferTime(newBuf);
                    setSelectedServices((prev: any) => {
                      const updated = { ...prev };
                      Object.keys(updated).forEach(k => {
                        updated[k].buffer = newBuf;
                      });
                      return updated;
                    });
                  }}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:outline-none focus:border-zinc-950 font-medium text-sm transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest">Base Commission Rate (%)</label>
                <input 
                  type="number"
                  required
                  placeholder="10"
                  value={newCommission}
                  onChange={(e) => {
                    const newComm = e.target.value;
                    setNewCommission(newComm);
                    setSelectedServices((prev: any) => {
                      const updated = { ...prev };
                      Object.keys(updated).forEach(k => {
                        updated[k].commission = newComm;
                      });
                      return updated;
                    });
                  }}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:outline-none focus:border-zinc-950 font-medium text-sm transition-all"
                />
              </div>
            </div>
          </div>

          {/* Certified services checklist */}
          <div className="space-y-4 bg-zinc-50/50 p-4 rounded-2xl border border-zinc-100">
            <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
               <Tag className="w-4 h-4 text-brand" /> Certify Shop Services
            </h3>

            {salonServices.length === 0 ? (
              <p className="text-xs text-zinc-400 italic">No active services registered for this salon. Stylist will have access to all.</p>
            ) : (
              <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                {salonServices.map((service) => {
                  const config = selectedServices[service.id] || { enabled: false, commission: "10", buffer: "15" };
                  return (
                    <div key={service.id} className="bg-white border border-slate-100 rounded-xl p-3 space-y-2 shadow-sm">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={config.enabled}
                          onChange={(e) => handleServiceCheckboxChange(service.id, e.target.checked)}
                          className="rounded border-zinc-300 text-brand focus:ring-brand"
                        />
                        <span className="text-xs font-bold text-zinc-800">{service.name}</span>
                      </label>

                      {config.enabled && (
                        <div className="grid grid-cols-3 gap-3 pl-6 animate-in slide-in-from-top-1 duration-200">
                          <div className="space-y-1">
                            <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider block">Service Comm Rate (%)</span>
                            <input 
                              type="number"
                              placeholder={newCommission}
                              value={config.commission}
                              onChange={(e) => handleServiceCommissionChange(service.id, e.target.value)}
                              className="w-full h-8 px-2 rounded-lg border border-slate-200 focus:outline-none focus:border-zinc-950 text-xs font-medium"
                            />
                          </div>
                          <div className="space-y-1">
                            <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider block">Buffer Time (mins)</span>
                            <input 
                              type="number"
                              placeholder={generalBufferTime}
                              value={config.buffer}
                              onChange={(e) => handleServiceBufferChange(service.id, e.target.value)}
                              className="w-full h-8 px-2 rounded-lg border border-slate-200 focus:outline-none focus:border-zinc-950 text-xs font-medium"
                            />
                          </div>
                          <div className="space-y-1">
                            <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider block">Service Time (mins)</span>
                            <input 
                              type="number"
                              placeholder="30"
                              value={config.duration}
                              onChange={(e) => handleServiceDurationChange(service.id, e.target.value)}
                              className="w-full h-8 px-2 rounded-lg border border-slate-200 focus:outline-none focus:border-zinc-950 text-xs font-medium"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            className="flex-1 rounded-xl h-11 font-bold text-xs border-zinc-200"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={adding}
            className="flex-1 bg-brand hover:bg-brand-hover text-black rounded-xl h-11 font-bold text-xs shadow-md shadow-brand/10"
          >
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : submitLabel}
          </Button>
        </div>
      </form>

      {/* POPUP MODAL DIALOG - CROP */}
      {isCropModalOpen && !!imgSrc && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full mx-auto shadow-2xl relative">
            <h3 className="text-lg font-black text-zinc-900 mb-4">Position your photo</h3>
            <div className="bg-slate-100 rounded-xl overflow-hidden flex justify-center items-center h-64 mb-6">
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={1}
                circularCrop
                className="max-h-full"
              >
                <img
                  ref={imgRef}
                  alt="Crop me"
                  src={imgSrc}
                  onLoad={onImageLoad}
                  className="max-h-64 object-contain"
                />
              </ReactCrop>
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setIsCropModalOpen(false)} className="flex-1 rounded-xl h-11 font-bold text-xs">
                Cancel
              </Button>
              <Button type="button" onClick={generateCroppedImage} className="flex-1 rounded-xl h-11 font-bold text-xs bg-zinc-900 text-white hover:bg-black">
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
