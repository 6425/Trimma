"use client";

import { Building2, Landmark, ShieldCheck } from "lucide-react";
import {
  isBankInfoComplete,
  isBusinessInfoComplete,
  type SalonOnboardingSnapshot,
} from "@/lib/salon-onboarding-progress";
import { SalonVerificationDocumentsPanel } from "@/components/salon/SalonVerificationDocumentsPanel";

type SalonOnboardingReviewPanelProps = {
  salonId: string;
  salon?: {
    name?: string | null;
    phone?: string | null;
    address?: string | null;
    bank_info?: Record<string, unknown> | null;
    business_info_extended?: Record<string, unknown> | null;
  } | null;
  className?: string;
};

function maskAccountNumber(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return "—";
  const trimmed = value.trim();
  if (trimmed.length <= 4) return trimmed;
  return `•••• ${trimmed.slice(-4)}`;
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="text-sm font-semibold text-zinc-900 break-words">{value || "—"}</p>
    </div>
  );
}

function StatusChip({ complete, label }: { complete: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${
        complete
          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
          : "bg-amber-100 text-amber-800 border border-amber-200"
      }`}
    >
      {complete ? "✓" : "○"} {label}
    </span>
  );
}

export function SalonOnboardingReviewPanel({
  salonId,
  salon,
  className = "",
}: SalonOnboardingReviewPanelProps) {
  const bank = (salon?.bank_info || {}) as Record<string, unknown>;
  const business = (salon?.business_info_extended || {}) as Record<string, unknown>;
  const snapshot: SalonOnboardingSnapshot = {
    name: salon?.name || undefined,
    phone: salon?.phone || undefined,
    address: salon?.address || undefined,
    business_info_extended: salon?.business_info_extended || null,
    bank_info: salon?.bank_info || null,
  };

  const businessComplete = isBusinessInfoComplete(snapshot);
  const bankComplete = isBankInfoComplete(snapshot);

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-indigo-600" />
              Owner Verification Review
            </h3>
            <p className="mt-1 text-xs font-medium text-zinc-500">
              Review business details, settlement bank account, and uploaded documents before booking
              approval or the verification badge.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusChip complete={businessComplete} label="Business info" />
            <StatusChip complete={bankComplete} label="Bank & docs" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 space-y-3">
            <h4 className="text-[11px] font-black uppercase tracking-widest text-zinc-700 flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5" />
              Business Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ReadOnlyField
                label="Legal business name"
                value={String(business.legal_business_name || "")}
              />
              <ReadOnlyField label="Business type" value={String(business.business_type || "")} />
              <ReadOnlyField label="Owner full name" value={String(business.owner_full_name || "")} />
              <ReadOnlyField label="Owner NIC" value={String(business.nic || "")} />
              <ReadOnlyField
                label="Registration no."
                value={String(business.business_registration_number || "")}
              />
              <ReadOnlyField label="Trading name" value={String(salon?.name || "")} />
            </div>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4 space-y-3">
            <h4 className="text-[11px] font-black uppercase tracking-widest text-zinc-700 flex items-center gap-1.5">
              <Landmark className="h-3.5 w-3.5" />
              Bank & Settlement Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ReadOnlyField
                label="Account holder"
                value={String(bank.account_holder_name || "")}
              />
              <ReadOnlyField label="Bank" value={String(bank.bank_name || "")} />
              <ReadOnlyField label="Branch" value={String(bank.branch_name || "")} />
              <ReadOnlyField
                label="Account number"
                value={maskAccountNumber(bank.account_number)}
              />
              <ReadOnlyField label="Account type" value={String(bank.account_type || "")} />
              <ReadOnlyField
                label="Settlement email"
                value={String(bank.settlement_email || "")}
              />
              <ReadOnlyField label="TIN" value={String(bank.tin_number || "")} />
              <ReadOnlyField
                label="Bank verified status"
                value={String(bank.bank_verified_status || "Pending")}
              />
            </div>
          </div>
        </div>
      </div>

      <SalonVerificationDocumentsPanel salonId={salonId} compact />
    </div>
  );
}
