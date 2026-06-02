/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Users, Loader2, X, Clock, Tag, Pencil, Sparkles, Trash2, Upload } from "lucide-react";
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { fetchSalonStaffPage } from "@/app/actions/salon-dashboard-data";
import {
  deleteSalonStaff,
  insertSalonStaff,
  toggleSalonStaffStatus,
  updateSalonStaff,
  uploadSalonStaffAvatar,
} from "@/app/actions/salon-operations";
import { withTimeout } from "@/lib/promise-timeout";
import { toast } from "sonner";

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.includes(",") ? result.split(",")[1] : result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export default function DashboardStaff() {
  const [salonId, setSalonId] = useState<string | null>(null);
  const [staff, setStaff] = useState<any[]>([]);
  const [salonServices, setSalonServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  
  // Subscription Plan Limits
  const [maxStaffLimit, setMaxStaffLimit] = useState(2);
  const [subscriptionName, setSubscriptionName] = useState("Free");

  // Modal Open States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [globalRoles, setGlobalRoles] = useState<any[]>([]);

  // Avatar Upload & Crop States
  const [imgSrc, setImgSrc] = useState('');
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [avatarBlob, setAvatarBlob] = useState<Blob | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState('');
  const [existingAvatarUrl, setExistingAvatarUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ADD FORM STATES
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newRole, setNewRole] = useState("");
  const [newCommission, setNewCommission] = useState("10");
  const defaultSchedule = {
    monday: { isWorking: true, start: "09:00", end: "18:00" },
    tuesday: { isWorking: true, start: "09:00", end: "18:00" },
    wednesday: { isWorking: true, start: "09:00", end: "18:00" },
    thursday: { isWorking: true, start: "09:00", end: "18:00" },
    friday: { isWorking: true, start: "09:00", end: "18:00" },
    saturday: { isWorking: true, start: "09:00", end: "18:00" },
    sunday: { isWorking: false, start: "09:00", end: "18:00" },
  };

  const [newSchedule, setNewSchedule] = useState(defaultSchedule);
  const [generalBufferTime, setGeneralBufferTime] = useState("15");
  const [selectedServices, setSelectedServices] = useState<{[key: string]: { enabled: boolean, commission: string, buffer: string, duration: string }}>({});

  // EDIT FORM STATES
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editRole, setEditRole] = useState("stylist");
  const [editCommission, setEditCommission] = useState("10");
  const [editSchedule, setEditSchedule] = useState(defaultSchedule);
  const [editBufferTime, setEditBufferTime] = useState("15");
  const [editSelectedServices, setEditSelectedServices] = useState<{[key: string]: { enabled: boolean, commission: string, buffer: string, duration: string }}>({});

  const [salonWorkingHours, setSalonWorkingHours] = useState(defaultSchedule);

  useEffect(() => {
    void Promise.resolve().then(() => {
      fetchStaff();
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchStaff() {
    try {
      setLoading(true);
      const result = await withTimeout(fetchSalonStaffPage(), 20000, "Loading timed out.");
      if (result.success === false) throw new Error(result.error);

      const salonData = result.salon as any;
      if (salonData?.id) setSalonId(salonData.id);
      if (!salonData) {
        setStaff([]);
        return;
      }

      if (salonData.working_hours) {
        try {
          const parsedHours = typeof salonData.working_hours === 'string' ? JSON.parse(salonData.working_hours) : salonData.working_hours;
          if (!Array.isArray(parsedHours) && parsedHours.monday) {
            setSalonWorkingHours(parsedHours);
          } else if (Array.isArray(parsedHours) && parsedHours.length > 0 && parsedHours[0].open) {
            const mapped = { ...defaultSchedule };
            const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
            parsedHours.forEach((slot: any) => {
              if (slot.open && slot.close) {
                const dayName = days[slot.open.day];
                if (dayName) {
                  const formatTime = (t: string) => t.length === 4 ? `${t.substring(0, 2)}:${t.substring(2, 4)}` : t;
                  mapped[dayName as keyof typeof defaultSchedule] = {
                    isWorking: true,
                    start: formatTime(slot.open.time),
                    end: formatTime(slot.close.time)
                  };
                }
              }
            });
            setSalonWorkingHours(mapped);
          }
        } catch (e) {
          console.warn("Could not parse salon working hours", e);
        }
      }

      // 2. Fetch Subscription Plan Details & Limits
      const planData = result.subscriptionPlan as any;
      if (planData) {
        setSubscriptionName(planData.name || "Free");
        setMaxStaffLimit(planData.max_staff || 2);
      }

      const servicesData = result.salonServices || [];
      let prePopServices: any = {};
      if (servicesData.length) {
        setSalonServices(servicesData);
        servicesData.forEach((s: any) => {
          prePopServices[s.id] = { enabled: false, commission: "10", buffer: "15", duration: s.duration_min?.toString() || "30" };
        });
        setSelectedServices(prePopServices);
      }

      setStaff(result.staff || []);

      const rolesData = result.globalStaffRoles || [];
      if (rolesData.length > 0) {
        setGlobalRoles(rolesData);
      } else {
        setGlobalRoles([
          { role_name: "Stylist", category: "Operational" },
          { role_name: "Barber", category: "Operational" },
          { role_name: "Therapist", category: "Operational" },
          { role_name: "Manager", category: "Admin" },
          { role_name: "Reception", category: "Admin" },
        ]);
      }
    } catch (err) {
      console.error("Failed to fetch staff:", err);
    } finally {
      setLoading(false);
    }
  }

  // ADD MODULE SERVICES HANDLERS
  const handleServiceCheckboxChange = (serviceId: string, checked: boolean) => {
    setSelectedServices(prev => ({
      ...prev,
      [serviceId]: {
        ...prev[serviceId],
        enabled: checked,
        commission: prev[serviceId]?.commission || newCommission,
        buffer: prev[serviceId]?.buffer || generalBufferTime,
        duration: prev[serviceId]?.duration || salonServices.find(s => s.id === serviceId)?.duration_min?.toString() || "30"
      }
    }));
  };

  const handleServiceDurationChange = (serviceId: string, val: string) => {
    setSelectedServices(prev => ({
      ...prev,
      [serviceId]: {
        ...prev[serviceId],
        duration: val
      }
    }));
  };

  const handleServiceCommissionChange = (serviceId: string, val: string) => {
    setSelectedServices(prev => ({
      ...prev,
      [serviceId]: {
        ...prev[serviceId],
        commission: val
      }
    }));
  };

  const handleServiceBufferChange = (serviceId: string, val: string) => {
    setSelectedServices(prev => ({
      ...prev,
      [serviceId]: {
        ...prev[serviceId],
        buffer: val
      }
    }));
  };

  // EDIT MODULE SERVICES HANDLERS
  const handleEditServiceCheckboxChange = (serviceId: string, checked: boolean) => {
    setEditSelectedServices(prev => ({
      ...prev,
      [serviceId]: {
        ...prev[serviceId],
        enabled: checked,
        commission: prev[serviceId]?.commission || editCommission,
        buffer: prev[serviceId]?.buffer || editBufferTime,
        duration: prev[serviceId]?.duration || salonServices.find(s => s.id === serviceId)?.duration_min?.toString() || "30"
      }
    }));
  };

  const handleEditServiceDurationChange = (serviceId: string, val: string) => {
    setEditSelectedServices(prev => ({
      ...prev,
      [serviceId]: {
        ...prev[serviceId],
        duration: val
      }
    }));
  };

  const handleEditServiceCommissionChange = (serviceId: string, val: string) => {
    setEditSelectedServices(prev => ({
      ...prev,
      [serviceId]: {
        ...prev[serviceId],
        commission: val
      }
    }));
  };

  const handleEditServiceBufferChange = (serviceId: string, val: string) => {
    setEditSelectedServices(prev => ({
      ...prev,
      [serviceId]: {
        ...prev[serviceId],
        buffer: val
      }
    }));
  };

  // START EDITING POPULATOR
  const startEditing = (member: any) => {
    setEditingStaffId(member.id);
    setEditName(member.name || "");
    setEditEmail(member.email || "");
    const foundCategory = globalRoles.find(r => r.role_name?.toLowerCase() === (member.role || "stylist").toLowerCase())?.category || "";
    setEditCategory(foundCategory);
    setEditRole(member.role || "stylist");
    setEditCommission(member.commission_rate?.toString() || "10");
    setEditBufferTime(member.working_hours?.general_buffer_time?.toString() || "15");
    
    // Reset avatar states for editing
    setAvatarBlob(null);
    setAvatarPreviewUrl('');
    setExistingAvatarUrl(member.avatar_url || '');
    if (member.working_hours?.schedule) {
      setEditSchedule(member.working_hours.schedule);
    } else {
      setEditSchedule(defaultSchedule);
    }

    // Populate service checkboxes configs
    const editConfigs: any = {};
    salonServices.forEach(s => {
      const assigned = member.working_hours?.assigned_services?.find((as: any) => as.service_id === s.id);
      if (assigned) {
        editConfigs[s.id] = {
          enabled: true,
          commission: assigned.commission_rate?.toString() || "10",
          buffer: assigned.buffer_time?.toString() || "15",
          duration: assigned.service_time?.toString() || s.duration_min?.toString() || "30"
        };
      } else {
        editConfigs[s.id] = {
          enabled: false,
          commission: "10",
          buffer: "15",
          duration: s.duration_min?.toString() || "30"
        };
      }
    });
    setEditSelectedServices(editConfigs);
    setIsEditModalOpen(true);
  };

  // ADD STYLIST SUBMITTER
  const handleAddStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) {
      toast.error("Staff name is required.");
      return;
    }

    if (staff.length >= maxStaffLimit) {
      toast.error(`Stylist capacity reached! Your active plan only allows up to ${maxStaffLimit} staff members. Upgrade your subscription to unlock more slots!`);
      return;
    }

    try {
      setAdding(true);
      if (!salonId) throw new Error("Salon profile not configured.");

      // Validate bounds against Salon Operational Hours
      for (const day of Object.keys(newSchedule)) {
        const staffDay = newSchedule[day as keyof typeof newSchedule];
        const salonDay = salonWorkingHours[day as keyof typeof salonWorkingHours];
        
        if (staffDay.isWorking && !salonDay.isWorking) {
          toast.error(`Stylist cannot work on ${day} as the salon is closed.`);
          setAdding(false);
          return;
        }
        
        if (staffDay.isWorking && salonDay.isWorking) {
          if (staffDay.start < salonDay.start || staffDay.end > salonDay.end) {
            toast.error(`Stylist hours on ${day} exceed the salon's operational hours (${salonDay.start} - ${salonDay.end}).`);
            setAdding(false);
            return;
          }
        }
      }

      const assignedServicesConfig = Object.entries(selectedServices)
        .filter(([_, cfg]) => cfg.enabled)
        .map(([serviceId, cfg]) => ({
          service_id: serviceId,
          commission_rate: parseFloat(cfg.commission) || 0,
          buffer_time: parseInt(cfg.buffer) || 0,
          service_time: parseInt(cfg.duration) || 30
        }));

      const workingHoursPayload = {
        schedule: newSchedule,
        general_buffer_time: parseInt(generalBufferTime) || 15,
        assigned_services: assignedServicesConfig
      };

      const insertResult = await insertSalonStaff({
          name: newName,
          email: newEmail || null,
          role: newRole,
          commission_rate: parseFloat(newCommission) || 0,
          working_hours: workingHoursPayload,
          status: "active",
        });

      if (insertResult.success === false) throw new Error(insertResult.error);
      const newStaffId = insertResult.staffId;
      
      if (avatarBlob && newStaffId) {
        try {
          const base64 = await blobToBase64(avatarBlob);
          const avatarResult = await uploadSalonStaffAvatar(newStaffId, base64);
          if (avatarResult.success === false) throw new Error(avatarResult.error);
        } catch (uploadErr) {
          console.error("Avatar upload failed:", uploadErr);
          toast.error("Staff created, but failed to upload avatar.");
        }
      }

      toast.success(`${newName} added successfully to your staff directory! 🌟`);
      setIsAddModalOpen(false);
      setNewName("");
      setNewEmail("");
      setNewCategory("");
      setNewRole("");
      setNewCommission("10");
      setNewSchedule(defaultSchedule);
      setGeneralBufferTime("15");
      
      const resetConfigs: any = {};
      salonServices.forEach(s => {
        resetConfigs[s.id] = { enabled: false, commission: "10", buffer: "15", duration: s.duration_min?.toString() || "30" };
      });
      setSelectedServices(resetConfigs);
      
      fetchStaff();
    } catch(err: any) {
      toast.error("Failed to add staff: " + err.message);
    } finally {
      setAdding(false);
    }
  };

  // EDIT STYLIST SUBMITTER
  const handleEditStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName) {
      toast.error("Staff name is required.");
      return;
    }

    try {
      setAdding(true);

      // Validate bounds against Salon Operational Hours
      for (const day of Object.keys(editSchedule)) {
        const staffDay = editSchedule[day as keyof typeof editSchedule];
        const salonDay = salonWorkingHours[day as keyof typeof salonWorkingHours];
        
        if (staffDay.isWorking && !salonDay.isWorking) {
          toast.error(`Stylist cannot work on ${day} as the salon is closed.`);
          setAdding(false);
          return;
        }
        
        if (staffDay.isWorking && salonDay.isWorking) {
          if (staffDay.start < salonDay.start || staffDay.end > salonDay.end) {
            toast.error(`Stylist hours on ${day} exceed the salon's operational hours (${salonDay.start} - ${salonDay.end}).`);
            setAdding(false);
            return;
          }
        }
      }

      const assignedServicesConfig = Object.entries(editSelectedServices)
        .filter(([_, cfg]) => cfg.enabled)
        .map(([serviceId, cfg]) => ({
          service_id: serviceId,
          commission_rate: parseFloat(cfg.commission) || 0,
          buffer_time: parseInt(cfg.buffer) || 0,
          service_time: parseInt(cfg.duration) || 30
        }));

      const workingHoursPayload = {
        schedule: editSchedule,
        general_buffer_time: parseInt(editBufferTime) || 15,
        assigned_services: assignedServicesConfig
      };

      let updatedAvatarUrl = existingAvatarUrl;
      if (avatarBlob && editingStaffId) {
        try {
          const base64 = await blobToBase64(avatarBlob);
          const avatarResult = await uploadSalonStaffAvatar(editingStaffId, base64);
          if (avatarResult.success === false) throw new Error(avatarResult.error);
          updatedAvatarUrl = avatarResult.publicUrl;
        } catch (uploadErr) {
          console.error("Avatar upload failed:", uploadErr);
          toast.error("Failed to upload avatar.");
        }
      }

      const updateResult = await updateSalonStaff(editingStaffId!, {
          name: editName,
          email: editEmail || null,
          role: editRole,
          commission_rate: parseFloat(editCommission) || 0,
          working_hours: workingHoursPayload,
          avatar_url: updatedAvatarUrl || null,
        });

      if (updateResult.success === false) throw new Error(updateResult.error);

      toast.success(`Stylist settings for ${editName} updated successfully! 🌟`);
      setIsEditModalOpen(false);
      setEditingStaffId(null);
      fetchStaff();
    } catch (err: any) {
      toast.error("Failed to update staff: " + err.message);
    } finally {
      setAdding(false);
    }
  };

  // TOGGLE STATUS DIRECT PERSIST
  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === "active" ? "inactive" : "active";
    try {
      const result = await toggleSalonStaffStatus(id, nextStatus);
      if (result.success === false) throw new Error(result.error);
      toast.success("Staff member status updated.");
      fetchStaff();
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    }
  };

  const handleDeleteStaff = async (id: string) => {
    if (!confirm("Are you sure you want to completely remove this staff member? This action cannot be undone.")) return;
    try {
      setLoading(true);
      const result = await deleteSalonStaff(id);
      if (result.success === false) throw new Error(result.error);
      toast.success("Staff member removed successfully.");
      fetchStaff();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete staff member");
    } finally {
      setLoading(false);
    }
  };

  // --- IMAGE CROP HELPERS ---
  function onSelectFile(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      setCrop(undefined); // Makes crop preview update between images
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

    ctx.drawImage(
      imgRef.current,
      cropX, cropY, cropWidth, cropHeight,
      0, 0, 250, 250
    );

    canvas.toBlob((blob) => {
      if (!blob) return;
      setAvatarBlob(blob);
      setAvatarPreviewUrl(URL.createObjectURL(blob));
      setIsCropModalOpen(false);
    }, 'image/jpeg', 0.9);
  }

  // -------------------------;

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 relative">
      
      {/* Dynamic Plan Header Badge */}
      <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center text-brand font-bold">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-rose-500">Active Membership Tier</p>
            <h3 className="font-extrabold text-[#1A1C29] text-base">{subscriptionName}</h3>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-500">Allowed Staff:</span>
            <Badge variant="outline" className="bg-white border-zinc-200 text-brand font-black px-2 py-0.5 text-[10px]">
              {staff.length} / {maxStaffLimit}
            </Badge>
          </div>
          <Button 
            onClick={() => window.location.href = '/dashboard/billing'}
            className="ml-0 sm:ml-2 h-8 text-[10px] bg-zinc-900 hover:bg-black text-white rounded-lg font-bold uppercase tracking-wider"
          >
            Upgrade Plan
          </Button>
        </div>
      </div>

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Staff Directory</h1>
          <p className="text-sm text-zinc-500 mt-1">Manage your barbers, stylists, and professional commissions.</p>
        </div>
        <Button 
          onClick={() => {
            if (staff.length >= maxStaffLimit) {
              toast.error(`Staff limit reached! Your ${subscriptionName} plan allows up to ${maxStaffLimit} members. Upgrade to add more!`);
              window.location.href = '/dashboard/billing';
              return;
            }
            setIsAddModalOpen(true);
          }}
          className="bg-brand text-white hover:bg-brand-hover rounded-xl font-bold px-6 h-11 shadow-md shadow-brand/20 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Custom Staff
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 min-h-[300px] shadow-sm overflow-hidden">
        {loading ? (
           <div className="flex flex-col items-center justify-center h-[300px]">
             <Loader2 className="w-8 h-8 animate-spin text-zinc-400 mb-4" />
             <p className="text-zinc-500">Loading staff directory...</p>
           </div>
        ) : staff.length === 0 ? (
           <div className="flex flex-col items-center justify-center text-center p-8 h-[300px]">
             <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
               <Users className="w-8 h-8 text-slate-400" />
             </div>
             <h3 className="text-lg font-semibold text-zinc-900">No staff members yet</h3>
             <p className="text-zinc-500 max-w-xs mx-auto mt-1">
               Add your stylists and barbers to manage their schedules and performance.
             </p>
             <Button onClick={() => setIsAddModalOpen(true)} variant="outline" className="mt-6 rounded-xl h-10 px-5 font-bold">
               <Plus className="w-4 h-4 mr-2" /> Add first member
             </Button>
           </div>
        ) : (
          <div className="divide-y divide-zinc-100 animate-in fade-in duration-300">
             {staff.map(member => (
                <div key={member.id} className="p-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between hover:bg-zinc-50/50 transition-colors">
                   <div className="flex items-center gap-4">
                     <Avatar className="w-16 h-16 border-2 border-slate-100 shadow-sm rounded-full">
                       {member.avatar_url ? (
                         <AvatarImage src={member.avatar_url} className="object-cover" />
                       ) : (
                         <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(member.name)}`} />
                       )}
                       <AvatarFallback>{member.name[0]}</AvatarFallback>
                     </Avatar>
                     <div>
                       <h3 className="font-bold text-zinc-900 text-lg flex items-center gap-2">
                         {member.name}
                         <Badge className={`border-none px-2.5 py-0.5 text-[10px] rounded-full font-bold uppercase tracking-wider ${
                           member.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                         }`}>
                           {member.status === 'active' ? 'Active' : 'Inactive'}
                         </Badge>
                       </h3>
                       <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mt-0.5">{member.role}</p>
                       
                       {/* Display certified services and commissions */}
                       {member.working_hours?.assigned_services && member.working_hours.assigned_services.length > 0 && (
                         <div className="flex flex-wrap gap-1 mt-2">
                           {member.working_hours.assigned_services.map((as: any) => {
                             const matchedServ = salonServices.find(s => s.id === as.service_id);
                             return (
                               <Badge key={as.service_id} className="bg-rose-50 text-brand border-none font-bold text-[9px] py-0 px-2 rounded">
                                 {matchedServ?.name || "Service"} ({as.commission_rate}%)
                               </Badge>
                             );
                           })}
                         </div>
                       )}

                       <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400 mt-2.5">
                          <span className="flex items-center gap-1 font-semibold text-zinc-600">
                            <Clock className="w-3.5 h-3.5" /> 
                            {member.working_hours?.schedule 
                              ? `${Object.values(member.working_hours.schedule).filter((d: any) => d.isWorking).length} Working Days`
                              : member.working_hours?.hours_description || "No schedule"}
                          </span>
                         {member.working_hours?.general_buffer_time && (
                           <span className="flex items-center gap-1 font-semibold text-zinc-500">⏱️ {member.working_hours.general_buffer_time}m Buffer</span>
                         )}
                       </div>
                     </div>
                   </div>

                   {/* Listing Action buttons */}
                   <div className="flex items-center justify-between sm:flex-col sm:items-end w-full sm:w-auto mt-4 sm:mt-0 gap-3">
                      <div className="text-xs text-zinc-500 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm font-semibold">
                        {member.email || 'No email provided'}
                      </div>
                      <div className="flex gap-2">
                        {/* EDIT BUTTON INTEGRATION */}
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => startEditing(member)}
                          className="rounded-lg h-9 font-bold text-xs border-zinc-200 text-zinc-700 hover:bg-brand/5 hover:text-brand hover:border-brand/20 flex items-center gap-1"
                        >
                          <Pencil className="w-3 h-3" /> Edit Info
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleToggleStatus(member.id, member.status)}
                          className="rounded-lg h-9 font-semibold text-xs border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                        >
                          Toggle Status
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDeleteStaff(member.id)}
                          className="text-zinc-400 hover:text-red-500 hover:bg-red-50 h-9 w-9 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                   </div>
                </div>
             ))}
          </div>
        )}
      </div>

      {/* POPUP MODAL DIALOG - ADD PROFESSIONAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto py-10">
          <form 
            onSubmit={handleAddStaffSubmit}
            className="bg-white rounded-3xl border border-slate-100 shadow-2xl p-8 max-w-lg w-full mx-4 space-y-6 animate-in slide-in-from-bottom-6 duration-300 relative overflow-hidden my-auto max-h-[85vh] overflow-y-auto"
          >
            <div className="absolute top-0 inset-x-0 h-2.5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600"></div>

            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-black text-zinc-900">Add Professional</h2>
                <p className="text-xs text-zinc-500 mt-1">Register a new professional with custom hours and service commissions.</p>
              </div>
              <button 
                type="button"
                onClick={() => setIsAddModalOpen(false)}
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
                      required
                    >
                      <option value="" disabled>Select Category (Optional Filter)</option>
                      {Array.from(new Set(globalRoles.map(r => r.category || 'Other'))).map(c => (
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
                        const foundCat = globalRoles.find(r => r.role_name === selectedRole)?.category;
                        if (foundCat) setNewCategory(foundCat);
                      }}
                      className="w-full h-11 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-zinc-950 font-medium text-sm bg-white"
                      required
                    >
                      <option value="" disabled>Select Role Name</option>
                      {globalRoles
                        .filter(r => !newCategory || (r.category || 'Other') === newCategory)
                        .map(r => (
                        <option key={r.id || r.role_name} value={r.role_name}>{r.role_name}</option>
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
                      onChange={(e) => setGeneralBufferTime(e.target.value)}
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
                      onChange={(e) => setNewCommission(e.target.value)}
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
                onClick={() => setIsAddModalOpen(false)}
                className="flex-1 rounded-xl h-11 font-bold text-xs border-zinc-200"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={adding}
                className="flex-1 bg-brand hover:bg-brand-hover text-white rounded-xl h-11 font-bold text-xs shadow-md shadow-brand/10"
              >
                {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Stylist"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* POPUP MODAL DIALOG - EDIT PROFESSIONAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto py-10">
          <form 
            onSubmit={handleEditStaffSubmit}
            className="bg-white rounded-3xl border border-slate-100 shadow-2xl p-8 max-w-lg w-full mx-4 space-y-6 animate-in slide-in-from-bottom-6 duration-300 relative overflow-hidden my-auto max-h-[85vh] overflow-y-auto"
          >
            <div className="absolute top-0 inset-x-0 h-2.5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600"></div>

            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-black text-zinc-900">Edit Professional</h2>
                <p className="text-xs text-zinc-500 mt-1">Modify stylist operational rules, working hours, and commissions.</p>
              </div>
              <button 
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingStaffId(null);
                }}
                className="text-zinc-400 hover:text-zinc-600 p-1.5 rounded-full hover:bg-zinc-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              
              {/* Identity details */}
              <div className="space-y-4 bg-zinc-50/50 p-4 rounded-2xl border border-zinc-100">
                <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                   <Users className="w-4 h-4 text-brand" /> Personal Identity
                </h3>
                <div className="flex flex-col items-center gap-2 mb-2">
                  <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <Avatar className="w-24 h-24 border-4 border-white shadow-md">
                      {avatarPreviewUrl ? (
                        <AvatarImage src={avatarPreviewUrl} className="object-cover" />
                      ) : existingAvatarUrl ? (
                        <AvatarImage src={existingAvatarUrl} className="object-cover" />
                      ) : (
                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(editName || 'New')}`} />
                      )}
                      <AvatarFallback>SP</AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Upload className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={onSelectFile} />
                  <p className="text-[10px] text-zinc-400 font-semibold uppercase">Click to change photo</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest">Stylist Name *</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. Michael Scofield"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:outline-none focus:border-zinc-950 font-medium text-sm transition-all"
                    />
                  </div>

                  <div className="space-y-1.5 col-span-2">
                    <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest">Email Address</label>
                    <input 
                      type="email"
                      placeholder="michael@example.com"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:outline-none focus:border-zinc-950 font-medium text-sm transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest">Category</label>
                    <select 
                      value={editCategory}
                      onChange={(e) => { setEditCategory(e.target.value); setEditRole(""); }}
                      className="w-full h-11 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-zinc-950 font-medium text-sm bg-white"
                      required
                    >
                      <option value="" disabled>Select Category (Optional Filter)</option>
                      {Array.from(new Set(globalRoles.map(r => r.category || 'Other'))).map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest">Role Name</label>
                    <select 
                      value={editRole}
                      onChange={(e) => {
                        const selectedRole = e.target.value;
                        setEditRole(selectedRole);
                        const foundCat = globalRoles.find(r => r.role_name === selectedRole)?.category;
                        if (foundCat) setEditCategory(foundCat);
                      }}
                      className="w-full h-11 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-zinc-950 font-medium text-sm bg-white"
                      required
                    >
                      <option value="" disabled>Select Role Name</option>
                      {globalRoles
                        .filter(r => !editCategory || (r.category || 'Other') === editCategory)
                        .map(r => (
                        <option key={r.id || r.role_name} value={r.role_name}>{r.role_name}</option>
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
                  {Object.entries(editSchedule).map(([day, scheduleObj]: [string, any]) => (
                    <div key={day} className="flex items-center gap-3 bg-white border border-slate-100 rounded-xl p-2 px-3">
                      <div className="w-20">
                        <span className="text-xs font-bold text-zinc-800 capitalize">{day}</span>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setEditSchedule(prev => ({ ...prev, [day]: { ...prev[day as keyof typeof defaultSchedule], isWorking: !prev[day as keyof typeof defaultSchedule].isWorking } }))}
                        className={`h-8 w-14 px-0 text-[10px] font-bold rounded-lg border-none transition-colors ${scheduleObj.isWorking ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'}`}
                      >
                        {scheduleObj.isWorking ? 'IN' : 'OUT'}
                      </Button>
                      <div className="flex flex-1 items-center gap-2">
                        <input 
                          type="time" 
                          disabled={!scheduleObj.isWorking}
                          value={scheduleObj.start}
                          onChange={(e) => setEditSchedule(prev => ({ ...prev, [day]: { ...prev[day as keyof typeof defaultSchedule], start: e.target.value } }))}
                          className="h-8 w-full px-2 rounded-lg border border-slate-200 text-xs focus:border-zinc-900 focus:outline-none disabled:opacity-30 disabled:bg-slate-50 transition-all"
                        />
                        <span className="text-zinc-300 text-xs">-</span>
                        <input 
                          type="time" 
                          disabled={!scheduleObj.isWorking}
                          value={scheduleObj.end}
                          onChange={(e) => setEditSchedule(prev => ({ ...prev, [day]: { ...prev[day as keyof typeof defaultSchedule], end: e.target.value } }))}
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
                      value={editBufferTime}
                      onChange={(e) => setEditBufferTime(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:outline-none focus:border-zinc-950 font-medium text-sm transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest">Base Commission Rate (%)</label>
                    <input 
                      type="number"
                      required
                      placeholder="10"
                      value={editCommission}
                      onChange={(e) => setEditCommission(e.target.value)}
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
                      const config = editSelectedServices[service.id] || { enabled: false, commission: "10", buffer: "15" };
                      return (
                        <div key={service.id} className="bg-white border border-slate-100 rounded-xl p-3 space-y-2 shadow-sm">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={config.enabled}
                              onChange={(e) => handleEditServiceCheckboxChange(service.id, e.target.checked)}
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
                                  placeholder={editCommission}
                                  value={config.commission}
                                  onChange={(e) => handleEditServiceCommissionChange(service.id, e.target.value)}
                                  className="w-full h-8 px-2 rounded-lg border border-slate-200 focus:outline-none focus:border-zinc-950 text-xs font-medium"
                                />
                              </div>
                              <div className="space-y-1">
                                <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider block">Buffer Time (mins)</span>
                                <input 
                                  type="number"
                                  placeholder={editBufferTime}
                                  value={config.buffer}
                                  onChange={(e) => handleEditServiceBufferChange(service.id, e.target.value)}
                                  className="w-full h-8 px-2 rounded-lg border border-slate-200 focus:outline-none focus:border-zinc-950 text-xs font-medium"
                                />
                              </div>
                              <div className="space-y-1">
                                <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider block">Service Time (mins)</span>
                                <input 
                                  type="number"
                                  placeholder="30"
                                  value={config.duration}
                                  onChange={(e) => handleEditServiceDurationChange(service.id, e.target.value)}
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
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingStaffId(null);
                }}
                className="flex-1 rounded-xl h-11 font-bold text-xs border-zinc-200"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={adding}
                className="flex-1 bg-brand hover:bg-brand-hover text-white rounded-xl h-11 font-bold text-xs shadow-md shadow-brand/10"
              >
                {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
              </Button>
            </div>
          </form>
        </div>
      )}
      {/* IMAGE CROP MODAL */}
      {isCropModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg text-zinc-900">Crop Profile Photo</h3>
              <button onClick={() => setIsCropModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 bg-zinc-100 p-1.5 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="relative bg-zinc-950 rounded-xl overflow-hidden flex items-center justify-center min-h-[300px]">
              {imgSrc ? (
                <ReactCrop
                  crop={crop}
                  onChange={(_, percentCrop) => setCrop(percentCrop)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={1}
                  circularCrop
                >
                  <img
                    ref={imgRef}
                    alt="Crop me"
                    src={imgSrc}
                    onLoad={onImageLoad}
                    className="max-h-[60vh] w-auto object-contain"
                  />
                </ReactCrop>
              ) : (
                <Loader2 className="w-8 h-8 animate-spin text-white" />
              )}
            </div>

            <div className="flex gap-3">
              <Button onClick={() => setIsCropModalOpen(false)} variant="outline" className="flex-1 rounded-xl h-11 font-bold">Cancel</Button>
              <Button onClick={generateCroppedImage} className="flex-1 rounded-xl h-11 font-bold bg-brand hover:bg-brand-hover text-white">Save Photo</Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
