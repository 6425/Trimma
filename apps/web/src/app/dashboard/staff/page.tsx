"use client";

import { useState, useEffect } from "react";
import { Plus, MoreHorizontal, Users, Loader2, Star, X, Check, ShieldAlert, Clock, ShieldCheck, Tag, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/config/supabase";
import { toast } from "sonner";

export default function DashboardStaff() {
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

  // ADD FORM STATES
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("stylist");
  const [newSkill, setNewSkill] = useState("Senior Stylist");
  const [newCommission, setNewCommission] = useState("10");
  const [workingHoursString, setWorkingHoursString] = useState("Mon - Sun: 9:00 AM - 6:00 PM");
  const [generalBufferTime, setGeneralBufferTime] = useState("15");
  const [selectedServices, setSelectedServices] = useState<{[key: string]: { enabled: boolean, commission: string, buffer: string }}>({});

  // EDIT FORM STATES
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState("stylist");
  const [editSkill, setEditSkill] = useState("Senior Stylist");
  const [editCommission, setEditCommission] = useState("10");
  const [editHoursString, setEditHoursString] = useState("Mon - Sun: 9:00 AM - 6:00 PM");
  const [editBufferTime, setEditBufferTime] = useState("15");
  const [editSelectedServices, setEditSelectedServices] = useState<{[key: string]: { enabled: boolean, commission: string, buffer: string }}>({});

  useEffect(() => {
    fetchStaff();
  }, []);

  async function fetchStaff() {
    try {
      setLoading(true);
      // 1. Resolve Salon ID dynamically from active user session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Unauthorized");

      const { data: salonData } = await supabase
        .from("salons")
        .select("*")
        .eq("owner_email", session.user.email)
        .maybeSingle();

      if (!salonData) {
        setStaff([]);
        setLoading(false);
        return;
      }

      // 2. Fetch Subscription Plan Details & Limits
      if (salonData.subscription_plan_id) {
        const { data: planData } = await supabase
          .from("subscription_plans")
          .select("name, max_staff")
          .eq("id", salonData.subscription_plan_id)
          .maybeSingle();
        if (planData) {
          setSubscriptionName(planData.name || "Free");
          setMaxStaffLimit(planData.max_staff || 2);
        }
      }

      // 3. Fetch all active services available for this specific shop/salon
      const { data: servicesData } = await supabase
        .from("services")
        .select("*")
        .eq("salon_id", salonData.id)
        .eq("status", "active");

      let prePopServices: any = {};
      if (servicesData) {
        setSalonServices(servicesData);
        servicesData.forEach(s => {
          prePopServices[s.id] = { enabled: false, commission: "10", buffer: "15" };
        });
        setSelectedServices(prePopServices);
      }

      // 4. Fetch Staff for this Salon directly from Supabase
      const { data: staffData } = await supabase
        .from("salon_staff")
        .select("*")
        .eq("salon_id", salonData.id);

      if (staffData) {
        setStaff(staffData);
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
        buffer: prev[serviceId]?.buffer || generalBufferTime
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
        buffer: prev[serviceId]?.buffer || editBufferTime
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
    setEditRole(member.role || "stylist");
    setEditSkill(member.skill_level || "Senior Stylist");
    setEditCommission(member.commission_rate?.toString() || "10");
    setEditHoursString(member.working_hours?.hours_description || "Mon - Sun: 9:00 AM - 6:00 PM");
    setEditBufferTime(member.working_hours?.general_buffer_time?.toString() || "15");

    // Populate service checkboxes configs
    const editConfigs: any = {};
    salonServices.forEach(s => {
      const assigned = member.working_hours?.assigned_services?.find((as: any) => as.service_id === s.id);
      if (assigned) {
        editConfigs[s.id] = {
          enabled: true,
          commission: assigned.commission_rate?.toString() || "10",
          buffer: assigned.buffer_time?.toString() || "15"
        };
      } else {
        editConfigs[s.id] = {
          enabled: false,
          commission: "10",
          buffer: "15"
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Unauthorized session");

      const { data: salonData } = await supabase
        .from("salons")
        .select("id")
        .eq("owner_email", session.user.email)
        .maybeSingle();

      if (!salonData) throw new Error("Salon profile not configured.");

      const assignedServicesConfig = Object.entries(selectedServices)
        .filter(([_, cfg]) => cfg.enabled)
        .map(([serviceId, cfg]) => ({
          service_id: serviceId,
          commission_rate: parseFloat(cfg.commission) || 0,
          buffer_time: parseInt(cfg.buffer) || 0
        }));

      const workingHoursPayload = {
        hours_description: workingHoursString || "Mon - Sun: 9:00 AM - 6:00 PM",
        general_buffer_time: parseInt(generalBufferTime) || 15,
        assigned_services: assignedServicesConfig
      };

      const { error } = await supabase
        .from("salon_staff")
        .insert({
          salon_id: salonData.id,
          name: newName,
          email: newEmail || null,
          role: newRole,
          skill_level: newSkill,
          commission_rate: parseFloat(newCommission) || 0,
          working_hours: workingHoursPayload,
          status: "active"
        });

      if (error) throw error;

      toast.success(`${newName} added successfully to your staff directory! 🌟`);
      setIsAddModalOpen(false);
      setNewName("");
      setNewEmail("");
      setNewRole("stylist");
      setNewSkill("Senior Stylist");
      setNewCommission("10");
      setWorkingHoursString("Mon - Sun: 9:00 AM - 6:00 PM");
      setGeneralBufferTime("15");
      
      const resetConfigs: any = {};
      salonServices.forEach(s => {
        resetConfigs[s.id] = { enabled: false, commission: "10", buffer: "15" };
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

      const assignedServicesConfig = Object.entries(editSelectedServices)
        .filter(([_, cfg]) => cfg.enabled)
        .map(([serviceId, cfg]) => ({
          service_id: serviceId,
          commission_rate: parseFloat(cfg.commission) || 0,
          buffer_time: parseInt(cfg.buffer) || 0
        }));

      const workingHoursPayload = {
        hours_description: editHoursString || "Mon - Sun: 9:00 AM - 6:00 PM",
        general_buffer_time: parseInt(editBufferTime) || 15,
        assigned_services: assignedServicesConfig
      };

      const { error } = await supabase
        .from("salon_staff")
        .update({
          name: editName,
          email: editEmail || null,
          role: editRole,
          skill_level: editSkill,
          commission_rate: parseFloat(editCommission) || 0,
          working_hours: workingHoursPayload
        })
        .eq("id", editingStaffId);

      if (error) throw error;

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
      const { error } = await supabase
        .from("salon_staff")
        .update({ status: nextStatus })
        .eq("id", id);

      if (error) throw error;
      toast.success(`Staff status updated successfully.`);
      fetchStaff();
    } catch (err: any) {
      toast.error("Status update failed: " + err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 relative">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Staff</h1>
            <Badge className="bg-rose-50 text-[#D81E5B] hover:bg-rose-50/80 border-none font-bold text-[10px] rounded-full py-0.5 px-2.5">
               {subscriptionName} Package
            </Badge>
          </div>
          <p className="text-sm text-zinc-500 mt-1">Manage your barbers, stylists, and professional commissions.</p>
        </div>
        <Button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-[#D81E5B] text-white hover:bg-[#BF1A50] rounded-xl font-bold px-6 h-11 shadow-md shadow-[#D81E5B]/20 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Staff
        </Button>
      </div>

      {/* Capacity utilization banner */}
      <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-4 flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-zinc-600">
          <Users className="w-4 h-4 text-zinc-400" />
          <span>Workforce Utilization: <span className="font-bold text-zinc-900">{staff.length}</span> of <span className="font-bold text-zinc-900">{maxStaffLimit}</span> active slots occupied.</span>
        </div>
        {staff.length >= maxStaffLimit && (
          <span className="text-xs font-bold text-[#D81E5B] flex items-center gap-1">
             <ShieldAlert className="w-3.5 h-3.5" /> Threshold Reached
          </span>
        )}
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
                       <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(member.name)}`} />
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
                       <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mt-0.5">{member.role} • {member.skill_level || 'Junior'}</p>
                       
                       {/* Display certified services and commissions */}
                       {member.working_hours?.assigned_services && member.working_hours.assigned_services.length > 0 && (
                         <div className="flex flex-wrap gap-1 mt-2">
                           {member.working_hours.assigned_services.map((as: any) => {
                             const matchedServ = salonServices.find(s => s.id === as.service_id);
                             return (
                               <Badge key={as.service_id} className="bg-rose-50 text-[#D81E5B] border-none font-bold text-[9px] py-0 px-2 rounded">
                                 {matchedServ?.name || "Service"} ({as.commission_rate}%)
                               </Badge>
                             );
                           })}
                         </div>
                       )}

                       <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400 mt-2.5">
                         {member.working_hours?.hours_description && (
                           <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {member.working_hours.hours_description}</span>
                         )}
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
                          className="rounded-lg h-9 font-bold text-xs border-zinc-200 text-zinc-700 hover:bg-[#D81E5B]/5 hover:text-[#D81E5B] hover:border-[#D81E5B]/20 flex items-center gap-1"
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
                        <Button variant="ghost" size="icon" className="text-zinc-400 h-9 w-9">
                          <MoreHorizontal className="w-4 h-4" />
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
            <div className="absolute top-0 inset-x-0 h-2.5 bg-gradient-to-r from-rose-500 via-purple-600 to-amber-500"></div>

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
                   <Users className="w-4 h-4 text-[#D81E5B]" /> Personal Identity
                </h3>
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
                    <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest">Role Type</label>
                    <select 
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                      className="w-full h-11 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-zinc-950 font-medium text-sm bg-white"
                    >
                      <option value="stylist">Stylist</option>
                      <option value="barber">Barber</option>
                      <option value="therapist">Therapist</option>
                      <option value="manager">Manager</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest">Skill Grade</label>
                    <select 
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      className="w-full h-11 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-zinc-950 font-medium text-sm bg-white"
                    >
                      <option value="Junior Stylist">Junior Stylist</option>
                      <option value="Senior Stylist">Senior Stylist</option>
                      <option value="Stylist Partner">Stylist Partner</option>
                      <option value="Master Barber">Master Barber</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Working attributes */}
              <div className="space-y-4 bg-zinc-50/50 p-4 rounded-2xl border border-zinc-100">
                <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                   <Clock className="w-4 h-4 text-[#D81E5B]" /> Operational Scheduling & Rates
                </h3>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest">Working Hours Description</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Mon - Sun: 9:00 AM - 6:00 PM"
                    value={workingHoursString}
                    onChange={(e) => setWorkingHoursString(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:outline-none focus:border-zinc-950 font-medium text-sm transition-all"
                  />
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
                   <Tag className="w-4 h-4 text-[#D81E5B]" /> Certify Shop Services
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
                              className="rounded border-zinc-300 text-[#D81E5B] focus:ring-[#D81E5B]"
                            />
                            <span className="text-xs font-bold text-zinc-800">{service.name}</span>
                          </label>

                          {config.enabled && (
                            <div className="grid grid-cols-2 gap-3 pl-6 animate-in slide-in-from-top-1 duration-200">
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
                className="flex-1 bg-[#D81E5B] hover:bg-[#BF1A50] text-white rounded-xl h-11 font-bold text-xs shadow-md shadow-[#D81E5B]/10"
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
            <div className="absolute top-0 inset-x-0 h-2.5 bg-gradient-to-r from-rose-500 via-purple-600 to-amber-500"></div>

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
                   <Users className="w-4 h-4 text-[#D81E5B]" /> Personal Identity
                </h3>
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
                    <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest">Role Type</label>
                    <select 
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value)}
                      className="w-full h-11 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-zinc-950 font-medium text-sm bg-white"
                    >
                      <option value="stylist">Stylist</option>
                      <option value="barber">Barber</option>
                      <option value="therapist">Therapist</option>
                      <option value="manager">Manager</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest">Skill Grade</label>
                    <select 
                      value={editSkill}
                      onChange={(e) => setEditSkill(e.target.value)}
                      className="w-full h-11 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-zinc-950 font-medium text-sm bg-white"
                    >
                      <option value="Junior Stylist">Junior Stylist</option>
                      <option value="Senior Stylist">Senior Stylist</option>
                      <option value="Stylist Partner">Stylist Partner</option>
                      <option value="Master Barber">Master Barber</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Working attributes */}
              <div className="space-y-4 bg-zinc-50/50 p-4 rounded-2xl border border-zinc-100">
                <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                   <Clock className="w-4 h-4 text-[#D81E5B]" /> Operational Scheduling & Rates
                </h3>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest">Working Hours Description</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Mon - Sun: 9:00 AM - 6:00 PM"
                    value={editHoursString}
                    onChange={(e) => setEditHoursString(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:outline-none focus:border-zinc-950 font-medium text-sm transition-all"
                  />
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
                   <Tag className="w-4 h-4 text-[#D81E5B]" /> Certify Shop Services
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
                              className="rounded border-zinc-300 text-[#D81E5B] focus:ring-[#D81E5B]"
                            />
                            <span className="text-xs font-bold text-zinc-800">{service.name}</span>
                          </label>

                          {config.enabled && (
                            <div className="grid grid-cols-2 gap-3 pl-6 animate-in slide-in-from-top-1 duration-200">
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
                className="flex-1 bg-[#D81E5B] hover:bg-[#BF1A50] text-white rounded-xl h-11 font-bold text-xs shadow-md shadow-[#D81E5B]/10"
              >
                {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
              </Button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
