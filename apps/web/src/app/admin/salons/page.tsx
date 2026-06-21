"use client";

import React, { useState, useEffect } from "react";
import { Store, Search, MapPin, Loader2, ShieldCheck, CheckCircle, XCircle, Eye, Save, Target, X, BadgeAlert, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { fetchAdminSalons, fetchAdminUsers } from "@/app/actions/admin-list-data";
import { approveAdminSalon, verifyAdminSalon, rejectAdminSalon, updateAdminSalon } from "@/app/actions/admin-operations";
import { refreshSalonGooglePlaceImages } from "@/app/actions/salon-google-images";
import { patchAdminSalonViaApi } from "@/lib/admin-salon-api-client";
import { autoCropAndUpload } from "@/lib/auto-crop-upload";
import { withTimeout } from "@/lib/promise-timeout";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { sendOnboardingInviteAlert, sendAdminApprovalAlerts } from "@/app/actions/whatsapp";
import { LkPhoneInput } from "@/components/ui/LkPhoneInput";
import { sendAdminApprovalEmail } from "@/app/actions/email-settings";
import { SalonOnboardingReviewPanel } from "@/components/salon/SalonOnboardingReviewPanel";

export default function Salons() {
  const navigate = useRouter();
  const [salons, setSalons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "pending" | "verification">("all");
  const [agents, setAgents] = useState<any[]>([]);

  // Rejection Modal State
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [salonToReject, setSalonToReject] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Comprehensive View / Edit Modal (Matching the Agent Onboarding Form Layout)
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedSalon, setSelectedSalon] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isRefreshingImage, setIsRefreshingImage] = useState(false);
  const [uploadingImageField, setUploadingImageField] = useState<"cover_url" | "hero_url" | "logo_url" | null>(null);

  const fetchSalons = async () => {
    try {
      setLoading(true);
      const result = await withTimeout(
        fetchAdminSalons(),
        20000,
        "Loading timed out. Check Vercel env (SUPABASE_SERVICE_ROLE_KEY) and refresh."
      );

      if (result.success === false) {
        throw new Error(result.error);
      }

      setSalons(result.salons || []);
    } catch (error: any) {
      toast.error("Failed to load salons: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(async () => {
      await fetchSalons();
      const userRes = await fetchAdminUsers();
      if (userRes.success) {
        setAgents(
          userRes.users.filter(
            (u: any) =>
              u.global_role === "agent" ||
              u.global_role === "regional_head" ||
              u.global_role === "regional_admin"
          )
        );
      }
    });
  }, []);

  const openViewModal = (salon: any) => {
    setSelectedSalon(salon);
    setEditForm({
      name: salon.name || "",
      description: salon.description || "",
      email: salon.owner_email || salon.owner_gmail || salon.email || "",
      phone: salon.phone || "",
      address: salon.address || "",
      city: salon.city || "",
      district: salon.district || "",
      province: salon.province || "",
      latitude: salon.latitude !== null ? String(salon.latitude) : "",
      longitude: salon.longitude !== null ? String(salon.longitude) : "",
      rating: salon.rating !== null ? String(salon.rating) : "",
      logo_url: salon.logo_url || "",
      cover_url: salon.cover_url || "",
      hero_url: salon.hero_url || "",
      place_id: salon.place_id || "",
      status: salon.status || "active",
      working_hours:
        typeof salon.working_hours === "string"
          ? salon.working_hours
          : salon.working_hours
            ? JSON.stringify(salon.working_hours, null, 2)
            : "",
      is_verified: salon.is_verified || false,
      assign_to: salon.assign_to || ""
    });
    setViewModalOpen(true);
  };

  const handleRefreshGoogleImage = async () => {
    if (!selectedSalon) return;

    try {
      setIsRefreshingImage(true);
      toast.loading("Fetching real Google Business photo...", { id: "refresh-google-image" });

      const result = await refreshSalonGooglePlaceImages(selectedSalon.id);
      if (!result.success) {
        throw new Error(result.error);
      }

      setEditForm((prev: any) => ({
        ...prev,
        cover_url: result.cover_url,
        hero_url: result.hero_url,
        place_id: result.place_id,
      }));
      setSelectedSalon({
        ...selectedSalon,
        cover_url: result.cover_url,
        hero_url: result.hero_url,
        place_id: result.place_id,
      });

      toast.success("Salon image updated from Google.", { id: "refresh-google-image" });
      fetchSalons();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to refresh salon image.";
      toast.error(message, { id: "refresh-google-image" });
    } finally {
      setIsRefreshingImage(false);
    }
  };

  const handleAdminImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "cover_url" | "hero_url" | "logo_url"
  ) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    try {
      setUploadingImageField(field);
      toast.loading("Uploading image...", { id: `upload-${field}` });

      const targetWidth = field === "logo_url" ? 500 : field === "cover_url" ? 1200 : 1920;
      const targetHeight = field === "logo_url" ? 500 : field === "cover_url" ? 400 : 680;
      const publicUrl = await autoCropAndUpload(file, targetWidth, targetHeight, field.replace("_url", ""));

      setEditForm((prev: any) => ({ ...prev, [field]: publicUrl }));
      toast.success("Image uploaded. Click Save Changes to apply.", { id: `upload-${field}` });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Image upload failed.";
      toast.error(message, { id: `upload-${field}` });
    } finally {
      setUploadingImageField(null);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedSalon) return;
    try {
      setIsSavingEdit(true);
      toast.loading("Saving salon details...");

      const result = await patchAdminSalonViaApi(selectedSalon.id, editForm);
      if (result.success === false) {
        throw new Error(result.error);
      }

      toast.dismiss();
      toast.success("Salon onboarding details updated!");
      
      setSelectedSalon({
        ...selectedSalon,
        ...editForm,
        owner_email: editForm.email || selectedSalon.owner_email,
        owner_gmail: editForm.email || selectedSalon.owner_gmail,
        phone: editForm.phone,
      });
      fetchSalons(); 
      setViewModalOpen(false);
    } catch (error: unknown) {
      toast.dismiss();
      const message =
        error instanceof Error
          ? error.message
          : "Something went wrong while saving the salon.";
      toast.error("Failed to save changes: " + message);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleApprove = async (salonId: string) => {
    try {
      toast.loading("Approving salon for platform access...");
      // Grant platform access (active) but NOT verified badge yet
      const result = await approveAdminSalon(salonId);
      if (result.success === false) throw new Error(result.error);
      toast.dismiss();
      toast.success("Salon approved! The owner can now log in and complete their profile setup.");
      fetchSalons();
      if (selectedSalon && selectedSalon.id === salonId) {
         setSelectedSalon({ ...selectedSalon, status: 'active', is_verified: false });
         setEditForm({ ...editForm, status: 'active', is_verified: false });
      }
    } catch (error: any) {
      toast.dismiss();
      toast.error("Failed to approve: " + error.message);
    }
  };

  const handleVerify = async (salonId: string) => {
    try {
      toast.loading("Awarding verified badge...");
      // Final verification, awarding the badge
      const result = await verifyAdminSalon(salonId);
      if (result.success === false) throw new Error(result.error);
      
      const salon = salons.find(s => s.id === salonId);
      if (salon && salon.phone) {
        toast.loading("Sending WhatsApp Badge Alerts...");
        const result = await sendAdminApprovalAlerts(salon.id, salon.phone, salon.name);
        if (result.success === false) {
          toast.error("Verified, but WhatsApp alert failed: " + result.error);
        }
        if (salon.owner_email || salon.owner_gmail || salon.email) {
          await sendAdminApprovalEmail(salon.name, salon.owner_email || salon.owner_gmail || salon.email);
        }
      } else {
        toast.warning("Verified, but WhatsApp alert skipped (missing phone).");
        if (salon?.owner_email || salon?.owner_gmail || salon?.email) {
          await sendAdminApprovalEmail(salon.name, salon.owner_email || salon.owner_gmail || salon.email);
        }
      }

      toast.dismiss();
      toast.success("Salon is now fully verified!");
      fetchSalons();
      if (selectedSalon && selectedSalon.id === salonId) {
         setSelectedSalon({ ...selectedSalon, status: 'active', is_verified: true });
         setEditForm({ ...editForm, status: 'active', is_verified: true });
      }
    } catch (error: any) {
      toast.dismiss();
      toast.error("Failed to verify: " + error.message);
    }
  };

  const handleResendInvite = async () => {
    if (!selectedSalon || !editForm.phone || !editForm.email) {
      toast.error("Phone and Email are required to send an invite.");
      return;
    }
    try {
      toast.loading("Resending WhatsApp Invitation...");
      const result = await sendOnboardingInviteAlert(selectedSalon.id, editForm.phone, editForm.email, editForm.name);
      toast.dismiss();
      if (result.success) {
        toast.success("WhatsApp invitation sent successfully!");
      } else {
        toast.error("Failed to send WhatsApp invite: " + result.error);
      }
    } catch (error: any) {
      toast.dismiss();
      toast.error("Error sending invite: " + error.message);
    }
  };

  const handleResendInviteFromTable = async (salon: any) => {
    const ownerEmail = salon.owner_email || salon.owner_gmail || salon.email;
    if (!salon.phone || !ownerEmail) {
      toast.error("Phone and Email are required to send an invite.");
      return;
    }
    try {
      toast.loading("Resending WhatsApp Invitation...");
      const result = await sendOnboardingInviteAlert(salon.id, salon.phone, ownerEmail, salon.name);
      toast.dismiss();
      if (result.success) {
        toast.success("WhatsApp invitation sent successfully!");
      } else {
        toast.error("Failed to send WhatsApp invite: " + result.error);
      }
    } catch (error: any) {
      toast.dismiss();
      toast.error("Error sending invite: " + error.message);
    }
  };

  const openRejectModal = (salon: any) => {
    setSalonToReject(salon);
    setRejectionReason("");
    setRejectModalOpen(true);
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a reason for rejection.");
      return;
    }

    try {
      setIsProcessing(true);
      toast.loading("Rejecting salon...");
      const result = await rejectAdminSalon(salonToReject.id, rejectionReason);
      if (result.success === false) throw new Error(result.error);
      
      toast.dismiss();
      toast.success("Salon has been rejected.");
      setRejectModalOpen(false);
      setSalonToReject(null);
      fetchSalons(); 
      if (selectedSalon && selectedSalon.id === salonToReject.id) {
         setSelectedSalon({ ...selectedSalon, status: 'rejected', is_verified: false, rejection_reason: rejectionReason });
         setEditForm({ ...editForm, status: 'rejected', is_verified: false });
      }
    } catch (error: any) {
      toast.dismiss();
      toast.error("Failed to reject: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredSalons = salons.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (s.city || "").toLowerCase().includes(searchTerm.toLowerCase());
    
    const isPendingVerification = (s.onboarding_status === 'PENDING_ADMIN_VERIFICATION' || s.onboarding_status === 'AGENT_APPROVED') && !s.is_verified;
    const isPendingApproval = (s.status === 'pending' || s.status === 'pending_approval' || !s.status) && !isPendingVerification;

    if (filterMode === "pending") {
       return matchesSearch && isPendingApproval;
    }
    if (filterMode === "verification") {
       return matchesSearch && isPendingVerification;
    }
    return matchesSearch; // for "all"
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1C29] tracking-tight">Salon Directory</h1>
          <p className="text-zinc-500 text-sm mt-1">Manage partner establishments, approvals, and verifications.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-zinc-200 rounded-xl font-bold h-11">
            Export Directory
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name or location..." 
            className="pl-10 h-11 bg-zinc-50 border-transparent focus:bg-white focus:border-rose-100 transition-all rounded-xl" 
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <Badge 
            variant="outline" 
            onClick={() => setFilterMode("all")}
            className={`h-9 px-4 rounded-full border-zinc-200 font-bold cursor-pointer whitespace-nowrap transition-colors ${filterMode === 'all' ? 'bg-slate-50 text-zinc-900' : 'bg-white text-zinc-600 hover:bg-zinc-50'}`}
          >
            All Salons
          </Badge>
          <Badge 
            variant="outline" 
            onClick={() => setFilterMode("pending")}
            className={`h-9 px-4 rounded-full border-zinc-200 font-bold cursor-pointer whitespace-nowrap transition-colors ${filterMode === 'pending' ? 'bg-amber-500 text-zinc-900 border-amber-500' : 'bg-white text-amber-600 hover:bg-amber-50'}`}
          >
            Pending Approval (New Leads)
          </Badge>
          <Badge 
            variant="outline" 
            onClick={() => setFilterMode("verification")}
            className={`h-9 px-4 rounded-full border-zinc-200 font-bold cursor-pointer whitespace-nowrap transition-colors ${filterMode === 'verification' ? 'bg-brand text-black border-brand' : 'bg-white text-brand hover:bg-brand/10'}`}
          >
            Pending Verification (Agent Approved)
          </Badge>
        </div>
      </div>

      {/* Salons Table */}
      <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/50 text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-100">
                <th className="px-8 py-5">Salon Profile</th>
                <th className="px-8 py-5">Location</th>
                <th className="px-8 py-5">Assigned Agent</th>
                <th className="px-8 py-5">Platform Status</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-8 py-24 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-brand mx-auto mb-4" />
                    <p className="text-zinc-500 font-medium font-sans">Accessing salon directory...</p>
                  </td>
                </tr>
              ) : filteredSalons.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-24 text-center text-zinc-500">
                    <Store className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p className="font-medium font-sans">No matching salons found.</p>
                  </td>
                </tr>
              ) : (
                filteredSalons.map((salon) => (
                  <tr key={salon.id} className="hover:bg-zinc-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-brand flex items-center justify-center text-zinc-900 font-bold text-lg shadow-inner">
                          {salon.name[0]}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-[#1A1C29] group-hover:text-brand transition-colors truncate max-w-[250px]">
                            {salon.name}
                          </div>
                          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter flex items-center gap-1">
                            {salon.is_verified ? (
                               <><ShieldCheck className="w-3 h-3 text-emerald-500" /> Verified Partner</>
                            ) : (
                               <><BadgeAlert className="w-3 h-3 text-zinc-500" /> Unverified</>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-sm text-zinc-500 font-medium">
                        <MapPin className="w-4 h-4 text-zinc-700" /> {salon.city || salon.district || "Not Set"}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <select
                        value={salon.assign_to || ""}
                        onChange={async (e) => {
                          const newAgent = e.target.value;
                          toast.loading("Assigning agent...");
                          try {
                            const res = await updateAdminSalon(salon.id, { assign_to: newAgent || null });
                            if (res.success === false) throw new Error((res as any).error);
                            toast.dismiss();
                            toast.success("Agent reassigned successfully");
                            fetchSalons();
                          } catch (err: any) {
                            toast.dismiss();
                            toast.error("Failed to reassign agent: " + err.message);
                          }
                        }}
                        className="w-full max-w-[180px] h-9 px-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 text-xs font-semibold text-zinc-700 cursor-pointer hover:bg-white transition-colors"
                      >
                        <option value="">Unassigned</option>
                        {agents.map(a => (
                          <option key={a.email} value={a.email}>{a.full_name || a.email}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        {salon.status === 'active' && salon.is_verified && (
                          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 shadow-none font-bold">Fully Verified</Badge>
                        )}
                        {salon.status === 'active' && !salon.is_verified && (
                          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 shadow-none font-bold">Setup In Progress</Badge>
                        )}
                        {(salon.onboarding_status === 'PENDING_ADMIN_VERIFICATION' || salon.onboarding_status === 'AGENT_APPROVED') && !salon.is_verified && (
                          <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 shadow-none font-bold">Awaiting Verification</Badge>
                        )}
                        {(salon.status === 'pending' || salon.status === 'pending_approval' || !salon.status) && salon.onboarding_status !== 'PENDING_ADMIN_VERIFICATION' && salon.onboarding_status !== 'AGENT_APPROVED' && (
                          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 shadow-none font-bold">Pending Lead</Badge>
                        )}
                        {salon.status === 'rejected' && (
                          <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 shadow-none font-bold">Rejected</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {(salon.status === 'pending' || salon.status === 'pending_approval' || !salon.status) && salon.onboarding_status !== 'PENDING_ADMIN_VERIFICATION' && salon.onboarding_status !== 'AGENT_APPROVED' && (
                          <Button 
                            onClick={() => handleApprove(salon.id)}
                            variant="outline" 
                            size="sm" 
                            className="text-amber-600 border-amber-200 hover:bg-amber-50 rounded-xl"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" /> Approve Entry
                          </Button>
                        )}
                        {(salon.onboarding_status === 'PENDING_ADMIN_VERIFICATION' || salon.onboarding_status === 'AGENT_APPROVED') && !salon.is_verified && (
                          <Button 
                            onClick={() => handleVerify(salon.id)}
                            variant="outline" 
                            size="sm" 
                            className="text-brand border-brand/30 hover:bg-brand/10 rounded-xl bg-brand/10"
                          >
                            <ShieldCheck className="w-4 h-4 mr-1" /> Verify Profile
                          </Button>
                        )}
                        
                        {((salon.status === 'pending' || salon.status === 'pending_approval' || !salon.status) || ((salon.onboarding_status === 'PENDING_ADMIN_VERIFICATION' || salon.onboarding_status === 'AGENT_APPROVED') && !salon.is_verified)) && (
                          <Button 
                            onClick={() => openRejectModal(salon)}
                            variant="outline" 
                            size="sm" 
                            className="text-rose-600 border-rose-200 hover:bg-rose-50 rounded-xl"
                          >
                            <XCircle className="w-4 h-4 mr-1" /> Reject
                          </Button>
                        )}

                        {salon.is_verified && (
                          <Button 
                            onClick={() => handleResendInviteFromTable(salon)}
                            variant="outline" 
                            size="sm" 
                            className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 rounded-xl"
                          >
                            Resend Invite
                          </Button>
                        )}

                        <Button 
                          onClick={() => openViewModal(salon)}
                          variant="ghost" 
                          size="sm" 
                          className="text-zinc-500 hover:text-brand hover:bg-zinc-100 rounded-xl ml-2 font-medium"
                        >
                          <Pencil className="w-4 h-4 mr-2" /> Edit Profile
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comprehensive Salon Onboarding Form Modal */}
      {viewModalOpen && selectedSalon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-4xl w-full shadow-2xl relative border border-zinc-100 flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
              <div>
                <h3 className="text-lg font-black text-zinc-900 tracking-tight">Salon Full Profile Editor</h3>
                <p className="text-xs text-zinc-500 mt-0.5 font-mono">Salon ID: {selectedSalon.id}</p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => { setViewModalOpen(false); setSelectedSalon(null); }}
                className="rounded-full w-8 h-8 text-zinc-500 hover:text-zinc-600 hover:bg-zinc-100"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Current Status Indicator */}
            <div className="mt-4 p-3 rounded-xl border border-zinc-100 bg-zinc-50 flex items-center justify-between">
               <div>
                  <p className="text-xs font-bold text-zinc-500 uppercase mb-1">Current Platform Status</p>
                  <div className="flex items-center gap-2">
                    {selectedSalon.status === 'active' && selectedSalon.is_verified && <Badge className="bg-emerald-100 text-emerald-700 shadow-none">Fully Verified Partner</Badge>}
                    {selectedSalon.status === 'active' && !selectedSalon.is_verified && <Badge className="bg-blue-100 text-blue-700 shadow-none">Setup In Progress</Badge>}
                    {(selectedSalon.onboarding_status === 'PENDING_ADMIN_VERIFICATION' || selectedSalon.onboarding_status === 'AGENT_APPROVED') && !selectedSalon.is_verified && <Badge className="bg-indigo-100 text-indigo-700 shadow-none animate-pulse">Awaiting Verification Review</Badge>}
                    {(selectedSalon.status === 'pending' || selectedSalon.status === 'pending_approval' || !selectedSalon.status) && selectedSalon.onboarding_status !== 'PENDING_ADMIN_VERIFICATION' && selectedSalon.onboarding_status !== 'AGENT_APPROVED' && <Badge className="bg-amber-100 text-amber-700 shadow-none">Pending Approval</Badge>}
                    {selectedSalon.status === 'rejected' && <Badge className="bg-rose-100 text-rose-700 shadow-none">Rejected</Badge>}
                  </div>
               </div>
               
               <div className="flex items-center gap-2">
                 {(selectedSalon.status === 'pending' || selectedSalon.status === 'pending_approval' || !selectedSalon.status) && selectedSalon.onboarding_status !== 'PENDING_ADMIN_VERIFICATION' && selectedSalon.onboarding_status !== 'AGENT_APPROVED' && (
                    <Button onClick={() => handleApprove(selectedSalon.id)} variant="outline" size="sm" className="text-amber-600 border-amber-200 hover:bg-amber-50 h-9">
                       <CheckCircle className="w-4 h-4 mr-1" /> Approve Access
                    </Button>
                 )}
                 {(selectedSalon.onboarding_status === 'PENDING_ADMIN_VERIFICATION' || selectedSalon.onboarding_status === 'AGENT_APPROVED') && !selectedSalon.is_verified && (
                    <Button onClick={() => handleVerify(selectedSalon.id)} variant="outline" size="sm" className="text-brand border-brand/30 hover:bg-brand/10 h-9 bg-brand/10">
                       <ShieldCheck className="w-4 h-4 mr-1" /> Award Badge
                    </Button>
                 )}
                 {((selectedSalon.status === 'pending' || selectedSalon.status === 'pending_approval' || !selectedSalon.status) || ((selectedSalon.onboarding_status === 'PENDING_ADMIN_VERIFICATION' || selectedSalon.onboarding_status === 'AGENT_APPROVED') && !selectedSalon.is_verified)) && (
                    <Button onClick={() => { setViewModalOpen(false); openRejectModal(selectedSalon); }} variant="outline" size="sm" className="text-rose-600 border-rose-200 hover:bg-rose-50 h-9">
                       <XCircle className="w-4 h-4 mr-1" /> Reject
                    </Button>
                 )}
                 {selectedSalon.is_verified && (
                    <Button onClick={handleResendInvite} variant="outline" size="sm" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 h-9">
                       Resend WhatsApp Invite
                    </Button>
                 )}
               </div>
            </div>

            {/* Modal Body (Scrollable Multi-Section Form) */}
            <div className="flex-1 overflow-y-auto py-5 space-y-6 pr-1 text-xs">
              
              {/* Section 1: Core Business Identity */}
              <div className="space-y-3">
                <h4 className="font-extrabold uppercase tracking-widest text-emerald-600 text-[10px] border-b border-emerald-100 pb-1 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5" /> 1. Core Business Identity
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-zinc-500 uppercase text-[9px] tracking-wide">Salon Name</label>
                    <Input 
                      value={editForm.name}
                      onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                      placeholder="e.g. Elegance Hair Salon"
                      className="h-10 rounded-xl bg-zinc-50 border-zinc-200 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-zinc-500 uppercase text-[9px] tracking-wide">Email</label>
                    <Input 
                      value={editForm.email}
                      onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                      className="h-10 rounded-xl bg-zinc-50 border-zinc-200 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-zinc-500 uppercase text-[9px] tracking-wide">Rating (0.00 - 5.00)</label>
                    <Input 
                      type="number"
                      step="0.01"
                      min="0"
                      max="5"
                      value={editForm.rating}
                      onChange={(e) => setEditForm({...editForm, rating: e.target.value})}
                      placeholder="e.g. 4.8"
                      className="h-10 rounded-xl bg-zinc-50 border-zinc-200 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-zinc-500 uppercase text-[9px] tracking-wide">System Status</label>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                      className="w-full h-10 px-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-sm font-semibold"
                    >
                      <option value="active">ACTIVE</option>
                      <option value="pending">PENDING APPROVAL</option>
                      <option value="rejected">REJECTED</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-zinc-500 uppercase text-[9px] tracking-wide">Assigned Agent</label>
                    <select
                      value={editForm.assign_to}
                      onChange={(e) => setEditForm({...editForm, assign_to: e.target.value})}
                      className="w-full h-10 px-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-sm font-semibold cursor-pointer"
                    >
                      <option value="">Unassigned</option>
                      {agents.map((a) => (
                        <option key={a.email} value={a.email}>
                          {a.full_name || a.email}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="font-bold text-zinc-500 uppercase text-[9px] tracking-wide">Description</label>
                    <Textarea 
                      value={editForm.description}
                      onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                      className="h-20 rounded-xl bg-zinc-50 border-zinc-200 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Contact Details & GPS Location */}
              <div className="space-y-3">
                <h4 className="font-extrabold uppercase tracking-widest text-emerald-600 text-[10px] border-b border-emerald-100 pb-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> 2. Contacts & Geographical Coordinates
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-zinc-500 uppercase text-[9px] tracking-wide">Phone Number</label>
                    <LkPhoneInput
                      theme="light"
                      value={editForm.phone}
                      onChange={(phone) => setEditForm({ ...editForm, phone })}
                      className="h-10 rounded-xl bg-zinc-50"
                      inputClassName="h-10"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <label className="font-bold text-zinc-500 uppercase text-[9px] tracking-wide">Full Physical Address</label>
                    <Input 
                      value={editForm.address}
                      onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                      placeholder="e.g. Street Number, City Name"
                      className="h-10 rounded-xl bg-zinc-50 border-zinc-200 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-zinc-500 uppercase text-[9px] tracking-wide">City</label>
                    <Input 
                      value={editForm.city}
                      onChange={(e) => setEditForm({...editForm, city: e.target.value})}
                      className="h-10 rounded-xl bg-zinc-50 border-zinc-200 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-zinc-500 uppercase text-[9px] tracking-wide">District</label>
                    <Input 
                      value={editForm.district}
                      onChange={(e) => setEditForm({...editForm, district: e.target.value})}
                      className="h-10 rounded-xl bg-zinc-50 border-zinc-200 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-zinc-500 uppercase text-[9px] tracking-wide">Province</label>
                    <Input 
                      value={editForm.province}
                      onChange={(e) => setEditForm({...editForm, province: e.target.value})}
                      className="h-10 rounded-xl bg-zinc-50 border-zinc-200 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-zinc-500 uppercase text-[9px] tracking-wide">GPS Latitude</label>
                    <Input 
                      type="number"
                      step="any"
                      value={editForm.latitude}
                      onChange={(e) => setEditForm({...editForm, latitude: e.target.value})}
                      placeholder="e.g. 6.927079"
                      className="h-10 rounded-xl bg-zinc-50 border-zinc-200 font-mono text-[10px] focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-zinc-500 uppercase text-[9px] tracking-wide">GPS Longitude</label>
                    <Input 
                      type="number"
                      step="any"
                      value={editForm.longitude}
                      onChange={(e) => setEditForm({...editForm, longitude: e.target.value})}
                      placeholder="e.g. 79.861244"
                      className="h-10 rounded-xl bg-zinc-50 border-zinc-200 font-mono text-[10px] focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>
              </div>

              <SalonOnboardingReviewPanel
                salonId={selectedSalon.id}
                salon={selectedSalon}
              />

              <div className="space-y-3">
                <h4 className="font-extrabold uppercase tracking-widest text-emerald-600 text-[10px] border-b border-emerald-100 pb-1 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" /> 3. Salon Images
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1 md:col-span-2">
                    <label className="font-bold text-zinc-500 uppercase text-[9px] tracking-wide">Google Place ID</label>
                    <Input
                      value={editForm.place_id}
                      onChange={(e) => setEditForm({ ...editForm, place_id: e.target.value })}
                      placeholder="Optional — used to fetch the real Google photo"
                      className="h-10 rounded-xl bg-zinc-50 border-zinc-200 focus:ring-2 focus:ring-emerald-500/20 font-mono text-[10px]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-zinc-500 uppercase text-[9px] tracking-wide">Cover Image URL</label>
                    <div className="flex items-center gap-2">
                      <Input
                        value={editForm.cover_url}
                        onChange={(e) => setEditForm({ ...editForm, cover_url: e.target.value })}
                        className="h-10 rounded-xl bg-zinc-50 border-zinc-200 focus:ring-2 focus:ring-emerald-500/20 text-[10px]"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        disabled={uploadingImageField === "cover_url"}
                        className="h-10 px-3 rounded-xl relative overflow-hidden shrink-0 text-xs font-bold"
                      >
                        {uploadingImageField === "cover_url" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Upload"}
                        <input
                          type="file"
                          accept="image/*"
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={(e) => handleAdminImageUpload(e, "cover_url")}
                          disabled={uploadingImageField === "cover_url"}
                        />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-zinc-500 uppercase text-[9px] tracking-wide">Hero Image URL</label>
                    <div className="flex items-center gap-2">
                      <Input
                        value={editForm.hero_url}
                        onChange={(e) => setEditForm({ ...editForm, hero_url: e.target.value })}
                        className="h-10 rounded-xl bg-zinc-50 border-zinc-200 focus:ring-2 focus:ring-emerald-500/20 text-[10px]"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        disabled={uploadingImageField === "hero_url"}
                        className="h-10 px-3 rounded-xl relative overflow-hidden shrink-0 text-xs font-bold"
                      >
                        {uploadingImageField === "hero_url" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Upload"}
                        <input
                          type="file"
                          accept="image/*"
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={(e) => handleAdminImageUpload(e, "hero_url")}
                          disabled={uploadingImageField === "hero_url"}
                        />
                      </Button>
                    </div>
                  </div>
                  {editForm.cover_url ? (
                    <div className="md:col-span-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={editForm.cover_url}
                        alt={`${editForm.name || "Salon"} cover preview`}
                        className="w-full max-h-48 object-cover rounded-xl border border-zinc-200"
                      />
                    </div>
                  ) : null}
                  <div className="md:col-span-2 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleRefreshGoogleImage}
                      disabled={isRefreshingImage}
                      className="rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50 h-10 text-xs font-bold"
                    >
                      {isRefreshingImage ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Eye className="w-4 h-4 mr-2" />
                      )}
                      Sync from Google
                    </Button>
                    <p className="text-[10px] text-zinc-500 self-center">
                      Google is the default source. Upload or paste a URL above to override it.
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100">
              <Button 
                variant="outline" 
                onClick={() => { setViewModalOpen(false); setSelectedSalon(null); }}
                className="rounded-xl font-bold h-11 border-zinc-200 text-zinc-500 hover:bg-slate-50 text-xs"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveEdit}
                disabled={isSavingEdit}
                className="rounded-xl bg-slate-50 hover:bg-zinc-800 hover:text-white text-zinc-900 font-bold px-6 h-11 shadow-lg shadow-zinc-900/20"
              >
                {isSavingEdit ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Changes
              </Button>
            </div>

          </div>
        </div>
      )}

      {/* Reject Modal */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-bold text-xl">Reject Salon Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting <span className="font-bold text-zinc-900">{salonToReject?.name}</span>. This will be recorded in the system.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea 
              placeholder="e.g. Incomplete business documentation, mismatched location, etc." 
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="min-h-[100px] rounded-xl border-zinc-200 focus-visible:ring-rose-500 focus-visible:border-rose-500 font-medium"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl font-bold" onClick={() => setRejectModalOpen(false)}>Cancel</Button>
            <Button disabled={isProcessing} onClick={handleReject} className="bg-rose-500 hover:bg-rose-600 text-zinc-900 rounded-xl font-bold shadow-lg shadow-rose-500/20">
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
    </div>
  );
}
