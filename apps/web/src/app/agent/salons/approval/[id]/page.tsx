"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, CheckCircle2, Store, Clock, CalendarDays, XCircle, ChevronLeft, Users, Scissors, Armchair, Tag, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/config/supabase";
import { BusinessInfoForm } from "../../../../../components/forms/BusinessInfoForm";
import { BankInfoForm } from "../../../../../components/forms/BankInfoForm";
import { approveSalon, rejectSalon } from "@/app/actions/agent-approval";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function AgentSalonApprovalReview() {
  const { id } = useParams();
  const router = useRouter();
  const [salon, setSalon] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"operations" | "business" | "bank">("operations");
  const [counts, setCounts] = useState({ staff: 0, services: 0, seats: 0, photos: 0, promotions: 0 });
  
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    async function fetchSalon() {
      setLoading(true);
      const [salonRes, staffRes, servicesRes, amenitiesRes, promotionsRes] = await Promise.all([
        supabase.from("salons").select("*").eq("id", id).single(),
        supabase.from("salon_staff").select("id", { count: "exact", head: true }).eq("salon_id", id),
        supabase.from("services").select("id", { count: "exact", head: true }).eq("salon_id", id),
        supabase
          .from("salon_amenities")
          .select("value, global_amenities!inner(name, type)")
          .eq("salon_id", id)
          .eq("global_amenities.name", "Number of Chairs")
          .maybeSingle(),
        supabase.from("salon_promotion_packages").select("id", { count: "exact", head: true }).eq("salon_id", id)
      ]);

      if (salonRes.data && !salonRes.error) {
        setSalon(salonRes.data);
        
        let seatsCount = 0;
        if (amenitiesRes.data?.value) {
          seatsCount = parseInt(String(amenitiesRes.data.value), 10) || 0;
        }

        setCounts({
          staff: staffRes.count || 0,
          services: servicesRes.count || 0,
          seats: seatsCount,
          photos: Array.isArray(salonRes.data.featured_images) ? salonRes.data.featured_images.length : 0,
          promotions: promotionsRes.count || 0,
        });
      } else {
        toast.error("Salon not found");
        router.push("/agent/salons/approval");
      }
      setLoading(false);
    }
    fetchSalon();
  }, [id, router]);;

  const handleApprove = async () => {
    setActionLoading(true);
    const result = await approveSalon(salon.id);
    if (result.success) {
      toast.success("Salon approved successfully!");
      router.push("/agent/salons/approval");
    } else {
      toast.error("Failed to approve salon");
    }
    setActionLoading(false);
  };

  const handleRejectSubmit = async () => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }
    setActionLoading(true);
    const result = await rejectSalon(salon.id, rejectionReason);
    if (result.success) {
      toast.success("Salon rejected. Notification sent to owner.");
      router.push("/agent/salons/approval");
    } else {
      toast.error("Failed to reject salon");
    }
    setActionLoading(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-zinc-400">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-brand" />
        <p className="text-sm font-medium">Loading salon data...</p>
      </div>
    );
  }

  if (!salon) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link href="/agent/salons/approval" className="inline-flex items-center text-xs font-bold text-zinc-400 hover:text-brand mb-2 transition-colors">
            <ChevronLeft className="w-3 h-3 mr-1" /> Back to Queue
          </Link>
          <h1 className="text-2xl font-black text-[#1A1C29] tracking-tight">{salon.name}</h1>
          <p className="text-sm text-zinc-500 font-medium mt-1">
            Submitted for approval by {salon.owner_email}
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline"
            className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={() => setIsRejecting(true)}
          >
            <XCircle className="w-4 h-4 mr-2" /> Reject
          </Button>
          <Button 
            className="bg-emerald-600 text-white hover:bg-emerald-700"
            onClick={handleApprove}
            disabled={actionLoading}
          >
            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4 mr-2" /> Approve Salon</>}
          </Button>
        </div>
      </div>

      {/* Rejection Modal */}
      {isRejecting && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-black text-zinc-900">Reject Salon Profile</h3>
            <p className="text-sm text-zinc-500">
              Please provide a detailed reason for rejection. This will be sent to the salon owner via email and WhatsApp.
            </p>
            <textarea 
              className="w-full h-32 p-3 border border-zinc-200 rounded-xl focus:ring-1 focus:ring-red-500 focus:border-red-500 text-sm"
              placeholder="e.g. Bank details do not match the legal business name..."
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
            />
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsRejecting(false)}>Cancel</Button>
              <Button 
                className="bg-red-600 text-white hover:bg-red-700" 
                onClick={handleRejectSubmit}
                disabled={actionLoading}
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Rejection"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 p-1 bg-zinc-100 rounded-xl w-full max-w-3xl">
        <button
          onClick={() => setActiveTab("operations")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all ${
            activeTab === "operations" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
          }`}
        >
          <Store className="w-4 h-4" /> Operations
        </button>
        <button
          onClick={() => setActiveTab("business")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all ${
            activeTab === "business" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
          }`}
        >
          <CalendarDays className="w-4 h-4" /> Business Info
        </button>
        <button
          onClick={() => setActiveTab("bank")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all ${
            activeTab === "bank" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
          }`}
        >
          <Clock className="w-4 h-4" /> Bank Info
        </button>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === "operations" && (
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                <Store className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-900 tracking-tight">Operations Summary</h3>
                <p className="text-xs text-zinc-500 font-medium">Quick overview of the salon&apos;s operational scale.</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-zinc-50 rounded-2xl p-4 flex flex-col items-center justify-center text-center border border-zinc-100">
                <Armchair className="w-6 h-6 text-emerald-500 mb-2" />
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Seats</p>
                <p className="text-2xl font-black text-zinc-800">{counts.seats}</p>
              </div>
              
              <div className="bg-zinc-50 rounded-2xl p-4 flex flex-col items-center justify-center text-center border border-zinc-100">
                <Users className="w-6 h-6 text-blue-500 mb-2" />
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Staff</p>
                <p className="text-2xl font-black text-zinc-800">{counts.staff}</p>
              </div>
              
              <div className="bg-zinc-50 rounded-2xl p-4 flex flex-col items-center justify-center text-center border border-zinc-100">
                <Scissors className="w-6 h-6 text-rose-500 mb-2" />
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Services</p>
                <p className="text-2xl font-black text-zinc-800">{counts.services}</p>
              </div>
              
              <div className="bg-zinc-50 rounded-2xl p-4 flex flex-col items-center justify-center text-center border border-zinc-100">
                <ImageIcon className="w-6 h-6 text-purple-500 mb-2" />
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Images</p>
                <p className="text-2xl font-black text-zinc-800">{counts.photos}</p>
              </div>

              <div className="bg-zinc-50 rounded-2xl p-4 flex flex-col items-center justify-center text-center border border-zinc-100">
                <Tag className="w-6 h-6 text-amber-500 mb-2" />
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Promotions</p>
                <p className="text-2xl font-black text-zinc-800">{counts.promotions}</p>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === "business" && (
          <BusinessInfoForm 
            salon={salon} 
            readOnly={true} 
            onSave={async () => {}} 
          />
        )}
        
        {activeTab === "bank" && (
          <BankInfoForm 
            salon={salon} 
            readOnly={true} 
            onSave={async () => {}} 
          />
        )}
      </div>
    </div>
  );
}
