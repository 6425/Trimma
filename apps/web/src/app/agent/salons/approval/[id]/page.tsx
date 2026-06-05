"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, CheckCircle2, Store, Clock, CalendarDays, XCircle, ChevronLeft } from "lucide-react";
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
  
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    async function fetchSalon() {
      setLoading(true);
      const { data, error } = await supabase
        .from("salons")
        .select("*, bank_info:bank_info_id(*), ext:ext_info_id(*)") // Note: you might need to adjust joins based on actual schema for bank info if not embedded in `salon`
        .eq("id", id)
        .single();

      if (data && !error) {
        setSalon(data);
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
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm text-center py-20">
            <Store className="w-12 h-12 text-zinc-200 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-zinc-800">Operations Overview</h3>
            <p className="text-sm text-zinc-500 mt-2 max-w-md mx-auto">
              This section usually contains the schedule and amenities. For Agent approval, the most critical verification points are the Business Identity and Bank Information in the other tabs.
            </p>
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
