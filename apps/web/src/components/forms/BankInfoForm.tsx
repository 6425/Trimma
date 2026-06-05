"use client";

import React, { useState, useEffect } from "react";
import { Loader2, CheckCircle2, Landmark, ShieldCheck, Mail, FileText, Upload, Building2, CreditCard, Smartphone, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function BankInfoForm({
  salon,
  onSave
}: {
  salon: any;
  onSave: (payload: any) => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  
  const ext = salon?.bank_info || {};
  
  // Section A
  const [accName, setAccName] = useState(ext.account_holder_name || "");
  const [bankName, setBankName] = useState(ext.bank_name || "");
  const [branchName, setBranchName] = useState(ext.branch_name || "");
  const [accNumber, setAccNumber] = useState(ext.account_number || "");
  const [accType, setAccType] = useState(ext.account_type || "");

  // Section B
  const [paymentMethod, setPaymentMethod] = useState(ext.preferred_payment_method || "");
  const [settlementFreq, setSettlementFreq] = useState(ext.settlement_frequency || "Weekly");
  const [settlementEmail, setSettlementEmail] = useState(ext.settlement_email || salon?.email || "");

  // Section C
  const [walletNumber, setWalletNumber] = useState(ext.mobile_wallet_number || "");
  const [walletProvider, setWalletProvider] = useState(ext.wallet_provider || "");
  const [receiverName, setReceiverName] = useState(ext.payment_receiver_name || "");

  // Section D
  const [tinNumber, setTinNumber] = useState(ext.tin_number || "");
  const [vatRegistered, setVatRegistered] = useState(ext.vat_registered || "No");
  const [vatNumber, setVatNumber] = useState(ext.vat_number || "");

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!salon) return;
    const newExt = salon.bank_info || {};
    setAccName(newExt.account_holder_name || "");
    setBankName(newExt.bank_name || "");
    setBranchName(newExt.branch_name || "");
    setAccNumber(newExt.account_number || "");
    setAccType(newExt.account_type || "");
    setPaymentMethod(newExt.preferred_payment_method || "");
    setSettlementFreq(newExt.settlement_frequency || "Weekly");
    setSettlementEmail(newExt.settlement_email || salon.email || "");
    setWalletNumber(newExt.mobile_wallet_number || "");
    setWalletProvider(newExt.wallet_provider || "");
    setReceiverName(newExt.payment_receiver_name || "");
    setTinNumber(newExt.tin_number || "");
    setVatRegistered(newExt.vat_registered || "No");
    setVatNumber(newExt.vat_number || "");
  }, [salon]);

  // Section E
  // Bank verification doc upload usually handles by supabase storage, we will store a URL or reference.
  const [verificationDocUrl, setVerificationDocUrl] = useState(ext.verification_document_url || "");
  const bankVerifiedStatus = ext.bank_verified_status || "Pending";

  const bankOptions = [
    "Commercial Bank",
    "Hatton National Bank (HNB)",
    "Sampath Bank",
    "Bank of Ceylon (BOC)",
    "People's Bank",
    "Seylan Bank",
    "NDB Bank",
    "Nations Trust Bank (NTB)",
    "Pan Asia Bank",
    "DFCC Bank",
    "Other"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        bank_info: {
          account_holder_name: accName,
          bank_name: bankName,
          branch_name: branchName,
          account_number: accNumber,
          account_type: accType,
          preferred_payment_method: paymentMethod,
          settlement_frequency: settlementFreq,
          settlement_email: settlementEmail,
          mobile_wallet_number: walletNumber,
          wallet_provider: walletProvider,
          payment_receiver_name: receiverName,
          tin_number: tinNumber,
          vat_registered: vatRegistered,
          vat_number: vatRegistered === "Yes" ? vatNumber : "",
          verification_document_url: verificationDocUrl,
          bank_verified_status: bankVerifiedStatus,
          last_updated_by: "Owner",
          updated_at: new Date().toISOString()
        }
      };
      await onSave(payload);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      
      {/* Section A */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-4">
          <Building2 className="w-5 h-5 text-emerald-500" /> Section A: Bank Account Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5 md:col-span-2">
            <Label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Account Holder Name *</Label>
            <Input required value={accName} onChange={e => setAccName(e.target.value)} className="h-11 rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Bank Name *</Label>
            <select required value={bankName} onChange={e => setBankName(e.target.value)} className="w-full h-11 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-zinc-950 font-medium text-sm bg-white">
              <option value="" disabled>Select Bank</option>
              {bankOptions.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Branch Name *</Label>
            <Input required value={branchName} onChange={e => setBranchName(e.target.value)} className="h-11 rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Account Number *</Label>
            <Input required value={accNumber} onChange={e => setAccNumber(e.target.value)} className="h-11 rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Account Type *</Label>
            <select required value={accType} onChange={e => setAccType(e.target.value)} className="w-full h-11 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-zinc-950 font-medium text-sm bg-white">
              <option value="" disabled>Select Type</option>
              <option value="Savings">Savings</option>
              <option value="Current">Current</option>
            </select>
          </div>
        </div>
      </div>

      {/* Section B */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-4">
          <CreditCard className="w-5 h-5 text-emerald-500" /> Section B: Settlement Preferences
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Preferred Payment Method *</Label>
            <select required value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="w-full h-11 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-zinc-950 font-medium text-sm bg-white">
              <option value="" disabled>Select Method</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cheque">Cheque</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Settlement Frequency *</Label>
            <select required value={settlementFreq} onChange={e => setSettlementFreq(e.target.value)} className="w-full h-11 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-zinc-950 font-medium text-sm bg-white">
              <option value="Weekly">Weekly</option>
              <option value="Monthly">Monthly</option>
            </select>
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Settlement Email *</Label>
            <Input required type="email" value={settlementEmail} onChange={e => setSettlementEmail(e.target.value)} className="h-11 rounded-xl" />
          </div>
        </div>
      </div>

      {/* Section C */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-4">
          <Smartphone className="w-5 h-5 text-emerald-500" /> Section C: Mobile & Digital Payments
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Wallet Provider</Label>
            <select value={walletProvider} onChange={e => setWalletProvider(e.target.value)} className="w-full h-11 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-zinc-950 font-medium text-sm bg-white">
              <option value="">None</option>
              <option value="eZ Cash">eZ Cash</option>
              <option value="mCash">mCash</option>
              <option value="PayHere Wallet">PayHere Wallet</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Mobile Wallet Number</Label>
            <Input value={walletNumber} onChange={e => setWalletNumber(e.target.value)} className="h-11 rounded-xl" />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Payment Receiver Name</Label>
            <Input value={receiverName} onChange={e => setReceiverName(e.target.value)} className="h-11 rounded-xl" />
          </div>
        </div>
      </div>

      {/* Section D & E */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-4">
            <FileCheck className="w-5 h-5 text-emerald-500" /> Tax & Compliance
          </h3>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">VAT Registered</Label>
              <select value={vatRegistered} onChange={e => setVatRegistered(e.target.value)} className="w-full h-11 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-zinc-950 font-medium text-sm bg-white">
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>
            {vatRegistered === "Yes" && (
              <div className="space-y-1.5 animate-in slide-in-from-top-2">
                <Label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">VAT Number *</Label>
                <Input required value={vatNumber} onChange={e => setVatNumber(e.target.value)} className="h-11 rounded-xl" />
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">TIN Number</Label>
              <Input value={tinNumber} onChange={e => setTinNumber(e.target.value)} className="h-11 rounded-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-4">
            <ShieldCheck className="w-5 h-5 text-emerald-500" /> Verification Status
          </h3>
          <div className="flex flex-col items-center justify-center h-32 bg-slate-50 rounded-xl border border-slate-100">
            <div className={`px-4 py-2 rounded-full font-bold text-sm ${bankVerifiedStatus === 'Verified' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
              {bankVerifiedStatus}
            </div>
            <p className="text-xs text-zinc-400 mt-2 text-center max-w-[200px]">
              {bankVerifiedStatus === 'Verified' ? 'Your bank details have been verified by Trimma admins.' : 'Your details are pending verification.'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-8">
        <Button 
          type="submit" 
          disabled={loading}
          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-12 px-8 font-black text-sm w-full md:w-auto flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-5 h-5" /> Save Bank Info</>}
        </Button>
      </div>

    </form>
  );
}
