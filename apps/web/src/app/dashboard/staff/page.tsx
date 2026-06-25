/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import { Plus, Users, Loader2, Clock, Pencil, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { fetchSalonStaffPage, fetchSalonServicesPage } from "@/app/actions/salon-dashboard-data";
import {
  deleteSalonStaff,
  insertSalonStaff,
  toggleSalonStaffStatus,
  updateSalonStaff,
  uploadSalonStaffAvatar,
} from "@/app/actions/salon-operations";
import { withTimeout } from "@/lib/promise-timeout";
import { toast } from "sonner";
import { buildStaffWorkingHoursPayload, findSalonServiceForAssignmentId, mapSalonServicesForStaffForm, parseStaffWorkingHours, resolveEffectiveStaffRoles } from "@/lib/salon-staff-insert";
import { isActiveSalonStaff } from "@/lib/staff-allocation";
import { AddProfessionalForm } from "../../../components/forms/AddProfessionalForm";
import { DashboardModal } from "../../../components/dashboard/DashboardModal";

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
  const [globalServices, setGlobalServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  
  // Subscription Plan Limits
  const [maxStaffLimit, setMaxStaffLimit] = useState(2);
  const [subscriptionName, setSubscriptionName] = useState("Free");

  // Modal Open States
  const [staffModalMode, setStaffModalMode] = useState<"add" | "edit" | null>(null);
  const [editingStaffMember, setEditingStaffMember] = useState<any | null>(null);
  const [globalRoles, setGlobalRoles] = useState<any[]>([]);
  const [refreshingForm, setRefreshingForm] = useState(false);

  const defaultSchedule = {
    monday: { isWorking: true, start: "09:00", end: "18:00" },
    tuesday: { isWorking: true, start: "09:00", end: "18:00" },
    wednesday: { isWorking: true, start: "09:00", end: "18:00" },
    thursday: { isWorking: true, start: "09:00", end: "18:00" },
    friday: { isWorking: true, start: "09:00", end: "18:00" },
    saturday: { isWorking: true, start: "09:00", end: "18:00" },
    sunday: { isWorking: false, start: "09:00", end: "18:00" },
  };

  const [salonWorkingHours, setSalonWorkingHours] = useState(defaultSchedule);

  const staffFormServices = mapSalonServicesForStaffForm(salonServices, globalServices);
  const effectiveStaffRoles = resolveEffectiveStaffRoles(globalRoles);
  const staffFormKey = `${staffModalMode || "closed"}-${editingStaffMember?.id || "new"}-${staffFormServices.map((s) => s.id).join(",")}`;

  useEffect(() => {
    void Promise.resolve().then(() => {
      fetchStaff();
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadSalonServiceRows(
    staffResult?: Awaited<ReturnType<typeof fetchSalonStaffPage>>,
    servicesResult?: Awaited<ReturnType<typeof fetchSalonServicesPage>>
  ) {
    let servicesData: any[] = [];
    let globals: any[] = [];

    if (staffResult?.success) {
      servicesData = staffResult.salonServices || [];
      globals = staffResult.globalServices || [];
    }

    if (servicesData.length === 0) {
      const servicesPageResult =
        servicesResult ??
        (await withTimeout(fetchSalonServicesPage(), 20000, "Loading timed out."));
      if (servicesPageResult.success) {
        servicesData = (servicesPageResult.services || []).filter((service: { status?: string | null }) => {
          const status = (service.status || "active").toLowerCase();
          return status !== "deleted";
        });
        if (!globals.length) globals = servicesPageResult.globalServices || [];
      }
    }

    setSalonServices(servicesData);
    if (globals.length) setGlobalServices(globals);

    return mapSalonServicesForStaffForm(servicesData, globals).length;
  }

  async function refreshStaffData(options?: { showPageLoading?: boolean }) {
    const showPageLoading = options?.showPageLoading ?? false;
    try {
      if (showPageLoading) setLoading(true);
      else setRefreshingForm(true);

      const [staffResult, servicesResult] = await Promise.all([
        withTimeout(fetchSalonStaffPage(), 20000, "Loading timed out."),
        withTimeout(fetchSalonServicesPage(), 20000, "Loading timed out."),
      ]);

      if (staffResult.success === false) throw new Error(staffResult.error);

      const salonData = staffResult.salon as any;
      if (salonData?.id) setSalonId(salonData.id);
      if (!salonData) {
        setStaff([]);
        await loadSalonServiceRows(staffResult, servicesResult.success ? servicesResult : undefined);
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

      const planData = staffResult.subscriptionPlan as any;
      if (planData) {
        setSubscriptionName(planData.name || "Free");
        setMaxStaffLimit(planData.max_staff || 2);
      }

      await loadSalonServiceRows(staffResult, servicesResult.success ? servicesResult : undefined);

      setStaff(
        (staffResult.staff || []).map((member: any) => ({
          ...member,
          working_hours: parseStaffWorkingHours(member.working_hours) || member.working_hours,
        }))
      );

      setGlobalRoles(resolveEffectiveStaffRoles(staffResult.globalStaffRoles || []));
    } catch (err) {
      console.error("Failed to fetch staff:", err);
      throw err;
    } finally {
      if (showPageLoading) setLoading(false);
      else setRefreshingForm(false);
    }
  }

  async function fetchStaff() {
    try {
      await refreshStaffData({ showPageLoading: true });
    } catch (err: any) {
      toast.error(err?.message || "Failed to load staff directory.");
    }
  }

  const validateStaffSchedule = (schedule: typeof defaultSchedule) => {
    for (const day of Object.keys(schedule)) {
      const staffDay = schedule[day as keyof typeof defaultSchedule];
      const salonDay = salonWorkingHours[day as keyof typeof salonWorkingHours];

      if (staffDay.isWorking && !salonDay.isWorking) {
        toast.error(`Stylist cannot work on ${day} as the salon is closed.`);
        return false;
      }

      if (staffDay.isWorking && salonDay.isWorking) {
        if (staffDay.start < salonDay.start || staffDay.end > salonDay.end) {
          toast.error(`Stylist hours on ${day} exceed the salon's operational hours (${salonDay.start} - ${salonDay.end}).`);
          return false;
        }
      }
    }
    return true;
  };

  const closeStaffModal = () => {
    setStaffModalMode(null);
    setEditingStaffMember(null);
  };

  const openStaffModal = async (mode: "add" | "edit", member?: any) => {
    if (mode === "add" && staff.length >= maxStaffLimit) {
      toast.error(`Staff limit reached! Your ${subscriptionName} plan allows up to ${maxStaffLimit} members. Upgrade to add more!`);
      window.location.href = "/dashboard/billing";
      return;
    }

    try {
      await refreshStaffData({ showPageLoading: false });
    } catch (err: any) {
      toast.error(err?.message || "Failed to refresh staff form data.");
      return;
    }

    if (mode === "add") {
      setEditingStaffMember(null);
      setStaffModalMode("add");
      return;
    }

    if (!member) return;
    setEditingStaffMember(member);
    setStaffModalMode("edit");
  };

  const startEditing = (member: any) => {
    void openStaffModal("edit", member);
  };

  const handleAddStaffFormSubmit = async (data: {
    name: string;
    email: string;
    role: string;
    commission_rate: number;
    general_buffer_time: number;
    schedule: typeof defaultSchedule;
    services: Record<string, { enabled?: boolean; commission?: string; buffer?: string; duration?: string }>;
    avatarBlob?: Blob | null;
  }) => {
    if (!data.name) {
      toast.error("Staff name is required.");
      return;
    }
    if (!data.role) {
      toast.error("Please select a role.");
      return;
    }
    if (staff.length >= maxStaffLimit) {
      toast.error(`Stylist capacity reached! Your active plan only allows up to ${maxStaffLimit} staff members. Upgrade your subscription to unlock more slots!`);
      return;
    }

    try {
      setAdding(true);
      if (!salonId) throw new Error("Salon profile not configured.");
      if (!validateStaffSchedule(data.schedule)) {
        setAdding(false);
        return;
      }

      const workingHoursPayload = buildStaffWorkingHoursPayload(
        data.schedule,
        data.general_buffer_time,
        data.services,
        staffFormServices
      );

      const insertResult = await insertSalonStaff({
        name: data.name,
        email: data.email || null,
        role: data.role,
        commission_rate: data.commission_rate || 0,
        working_hours: workingHoursPayload,
        status: "active",
      });

      if (insertResult.success === false) throw new Error(insertResult.error);
      const newStaffId = insertResult.staffId;

      if (data.avatarBlob && newStaffId) {
        try {
          const base64 = await blobToBase64(data.avatarBlob);
          const avatarResult = await uploadSalonStaffAvatar(newStaffId, base64);
          if (avatarResult.success === false) throw new Error(avatarResult.error);
        } catch (uploadErr) {
          console.error("Avatar upload failed:", uploadErr);
          toast.error("Staff created, but failed to upload avatar.");
        }
      }

      toast.success(`${data.name} added successfully to your staff directory! 🌟`);
      closeStaffModal();
      fetchStaff();
    } catch (err: any) {
      toast.error("Failed to add staff: " + err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleEditStaffSubmit = async (data: {
    id?: string;
    name: string;
    email: string;
    role: string;
    commission_rate: number;
    general_buffer_time: number;
    schedule: typeof defaultSchedule;
    services: Record<string, { enabled?: boolean; commission?: string; buffer?: string; duration?: string }>;
    avatarBlob?: Blob | null;
    avatar_url?: string | null;
  }) => {
    if (!data.name) {
      toast.error("Staff name is required.");
      return;
    }
    if (!editingStaffMember?.id) {
      toast.error("No staff member selected.");
      return;
    }

    try {
      setAdding(true);

      if (!validateStaffSchedule(data.schedule)) {
        setAdding(false);
        return;
      }

      const workingHoursPayload = buildStaffWorkingHoursPayload(
        data.schedule,
        data.general_buffer_time,
        data.services,
        staffFormServices
      );

      let updatedAvatarUrl = data.avatar_url || editingStaffMember.avatar_url || null;
      if (data.avatarBlob) {
        try {
          const base64 = await blobToBase64(data.avatarBlob);
          const avatarResult = await uploadSalonStaffAvatar(editingStaffMember.id, base64);
          if (avatarResult.success === false) throw new Error(avatarResult.error);
          updatedAvatarUrl = avatarResult.publicUrl;
        } catch (uploadErr) {
          console.error("Avatar upload failed:", uploadErr);
          toast.error("Failed to upload avatar.");
        }
      }

      const updateResult = await updateSalonStaff(editingStaffMember.id, {
        name: data.name,
        email: data.email || null,
        role: data.role,
        commission_rate: data.commission_rate || 0,
        working_hours: workingHoursPayload,
        avatar_url: updatedAvatarUrl,
      });

      if (updateResult.success === false) throw new Error(updateResult.error);

      toast.success(`Stylist settings for ${data.name} updated successfully! 🌟`);
      closeStaffModal();
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

  const activeStaffCount = staff.filter((member) => isActiveSalonStaff(member)).length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 relative text-black [&_button]:text-black [&_svg]:text-black">
      
      {/* Dynamic Plan Header Badge */}
      <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center text-black font-bold">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-black">Active Membership Tier</p>
            <h3 className="font-extrabold text-black text-base">{subscriptionName}</h3>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-black">Allowed Staff:</span>
            <Badge variant="outline" className="bg-white border-zinc-200 text-black font-black px-2 py-0.5 text-[10px]">
              {activeStaffCount} active · {staff.length} / {maxStaffLimit}
            </Badge>
          </div>
          <Button 
            onClick={() => window.location.href = '/dashboard/billing'}
            className="ml-0 sm:ml-2 h-8 text-[10px] bg-white hover:bg-zinc-50 text-black border border-zinc-200 rounded-lg font-bold uppercase tracking-wider"
          >
            Upgrade Plan
          </Button>
        </div>
      </div>

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-black tracking-tight">Staff Directory</h1>
          <p className="text-sm text-black mt-1">Manage your barbers, stylists, and professional commissions.</p>
        </div>
        <Button 
          onClick={() => void openStaffModal("add")}
          disabled={loading || refreshingForm}
          className="bg-brand text-black hover:bg-brand-hover rounded-xl font-bold px-6 h-11 shadow-md shadow-brand/20 self-start sm:self-auto border border-zinc-200"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Professional
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 min-h-[300px] shadow-sm overflow-hidden">
        {loading ? (
           <div className="flex flex-col items-center justify-center h-[300px]">
             <Loader2 className="w-8 h-8 animate-spin text-black mb-4" />
             <p className="text-black">Loading staff directory...</p>
           </div>
        ) : staff.length === 0 ? (
           <div className="flex flex-col items-center justify-center text-center p-8 h-[300px]">
             <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
               <Users className="w-8 h-8 text-black" />
             </div>
             <h3 className="text-lg font-semibold text-black">No staff members yet</h3>
             <p className="text-black max-w-xs mx-auto mt-1">
               Add your stylists and barbers to manage their schedules and performance.
             </p>
             <Button onClick={() => void openStaffModal("add")} variant="outline" className="mt-6 rounded-xl h-10 px-5 font-bold text-black border-zinc-200">
               <Plus className="w-4 h-4 mr-2" /> Add Professional
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
                       <h3 className="font-bold text-black text-lg flex items-center gap-2">
                         {member.name}
                         <Badge className="border-none px-2.5 py-0.5 text-[10px] rounded-full font-bold uppercase tracking-wider bg-zinc-100 text-black">
                           {member.status === 'active' ? 'Active' : 'Inactive'}
                         </Badge>
                       </h3>
                       <p className="text-xs text-black font-bold uppercase tracking-widest mt-0.5">{member.role}</p>
                       
                       {/* Display certified services and commissions */}
                       {member.working_hours?.assigned_services && member.working_hours.assigned_services.length > 0 && (
                         <div className="flex flex-wrap gap-1 mt-2">
                           {member.working_hours.assigned_services.map((as: any) => {
                             const matchedServ = findSalonServiceForAssignmentId(staffFormServices, as.service_id);
                             return (
                               <Badge key={as.service_id} className="bg-black !text-white border-none font-bold text-[9px] py-1 px-2.5 rounded-md shadow-sm">
                                 {matchedServ?.name || "Service"} ({as.commission_rate ?? member.commission_rate ?? 0}%)
                               </Badge>
                             );
                           })}
                         </div>
                       )}

                       <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-black mt-2.5">
                          <span className="flex items-center gap-1 font-semibold text-black">
                            <Clock className="w-3.5 h-3.5" /> 
                            {member.working_hours?.schedule 
                              ? `${Object.values(member.working_hours.schedule).filter((d: any) => d.isWorking).length} Working Days`
                              : member.working_hours?.hours_description || "No schedule"}
                          </span>
                         {member.working_hours?.general_buffer_time > 0 && (
                           <span className="flex items-center gap-1 font-semibold text-black">⏱️ {member.working_hours.general_buffer_time}m Buffer</span>
                         )}
                       </div>
                     </div>
                   </div>

                   {/* Listing Action buttons */}
                   <div className="flex items-center justify-between sm:flex-col sm:items-end w-full sm:w-auto mt-4 sm:mt-0 gap-3">
                      <div className="text-xs text-black bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm font-semibold">
                        {member.email || 'No email provided'}
                      </div>
                      <div className="flex gap-2">
                        {/* EDIT BUTTON INTEGRATION */}
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => startEditing(member)}
                          className="rounded-lg h-9 font-bold text-xs border-zinc-200 text-black hover:bg-zinc-50 hover:text-black hover:border-zinc-300 flex items-center gap-1"
                        >
                          <Pencil className="w-3 h-3" /> Edit Info
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleToggleStatus(member.id, member.status)}
                          className="rounded-lg h-9 font-semibold text-xs border-zinc-200 text-black hover:bg-zinc-50 hover:text-black"
                        >
                          Toggle Status
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDeleteStaff(member.id)}
                          className="text-black hover:text-black hover:bg-zinc-100 h-9 w-9 rounded-lg"
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

      <DashboardModal
        open={Boolean(staffModalMode)}
        onClose={closeStaffModal}
        size="md"
        panelClassName="text-black [&_h2]:text-black [&_p]:text-black [&_button]:text-black"
        bodyClassName="text-black [&_*]:text-black [&_button]:text-black [&_input]:text-black [&_select]:text-black [&_option]:text-black [&_label]:text-black [&_span]:text-black [&_h3]:text-black [&_p]:text-black"
        title={staffModalMode === "edit" ? "Edit Professional" : "Add Professional"}
        description={
          staffModalMode === "edit"
            ? "Update hours, services, and commission settings for this team member."
            : "Register a new professional with custom hours and service commissions."
        }
      >
        {refreshingForm ? (
          <div className="flex flex-col items-center gap-4 py-12">
            <Loader2 className="w-8 h-8 animate-spin text-black" />
            <p className="text-sm font-semibold text-black">Loading staff form...</p>
          </div>
        ) : (
          <AddProfessionalForm
            key={staffFormKey}
            embedded
            formClassName="text-black [&_button]:!text-black [&_label]:!text-black [&_span]:!text-black [&_p]:!text-black [&_h3]:!text-black [&_input]:!text-black [&_select]:!text-black [&_option]:!text-black [&_svg]:!text-black"
            onCancel={closeStaffModal}
            onSubmit={staffModalMode === "add" ? handleAddStaffFormSubmit : handleEditStaffSubmit}
            globalRoles={effectiveStaffRoles}
            salonServices={staffFormServices}
            adding={adding}
            initialStaff={
              staffModalMode === "edit" && editingStaffMember
                ? {
                    id: editingStaffMember.id,
                    name: editingStaffMember.name,
                    email: editingStaffMember.email,
                    role: editingStaffMember.role,
                    commission_rate: editingStaffMember.commission_rate,
                    general_buffer_time:
                      parseStaffWorkingHours(editingStaffMember.working_hours)?.general_buffer_time ??
                      editingStaffMember.working_hours?.general_buffer_time,
                    avatar_url: editingStaffMember.avatar_url,
                    working_hours:
                      parseStaffWorkingHours(editingStaffMember.working_hours) ||
                      editingStaffMember.working_hours,
                  }
                : null
            }
            title={staffModalMode === "edit" ? "Edit Professional" : "Add Professional"}
            submitLabel={staffModalMode === "edit" ? "Save Changes" : "Save Stylist"}
          />
        )}
      </DashboardModal>

    </div>
  );
}
