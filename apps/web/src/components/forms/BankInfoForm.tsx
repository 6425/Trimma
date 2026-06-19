"use client";

import React, { useState, useEffect, useRef } from "react";
import { Loader2, CheckCircle2, Landmark, ShieldCheck, Mail, FileText, Upload, Building2, CreditCard, Smartphone, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadSalonDocument } from "@/app/actions/salon-operations";

const toBase64 = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve((reader.result as string).split(',')[1]);
  reader.onerror = error => reject(error);
});

export function BankInfoForm({
  salon,
  onSave,
  readOnly = false,
  hideVerificationDocuments = false,
  children
}: {
  salon: any;
  onSave: (payload: any) => Promise<void>;
  readOnly?: boolean;
  hideVerificationDocuments?: boolean;
  children?: React.ReactNode;
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



  // Section D
  const [tinNumber, setTinNumber] = useState(ext.tin_number || "");
  const [vatRegistered, setVatRegistered] = useState(ext.vat_registered || "No");
  const [vatNumber, setVatNumber] = useState(ext.vat_number || "");

  // Section E (Verification Documents)
  const bankVerifiedStatus = ext.bank_verified_status || "Pending";

  const [verificationDocUrl, setVerificationDocUrl] = useState(ext.verification_document_url || "");
  const [nicFrontUrl, setNicFrontUrl] = useState(ext.owner_nic_front_url || "");
  const [nicBackUrl, setNicBackUrl] = useState(ext.owner_nic_back_url || "");
  const [bizRegUrl, setBizRegUrl] = useState(ext.business_registration_url || "");

  const [verificationDocFile, setVerificationDocFile] = useState<File | null>(null);
  const [nicFrontFile, setNicFrontFile] = useState<File | null>(null);
  const [nicBackFile, setNicBackFile] = useState<File | null>(null);
  const [bizRegFile, setBizRegFile] = useState<File | null>(null);

  const docInputRef = useRef<HTMLInputElement>(null);
  const nicFrontInputRef = useRef<HTMLInputElement>(null);
  const nicBackInputRef = useRef<HTMLInputElement>(null);
  const bizRegInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!salon) return;
    const newExt = salon.bank_info || {};
    queueMicrotask(() => {
      setAccName(newExt.account_holder_name || "");
      setBankName(newExt.bank_name || "");
      setBranchName(newExt.branch_name || "");
      setAccNumber(newExt.account_number || "");
      setAccType(newExt.account_type || "");
      setPaymentMethod(newExt.preferred_payment_method || "");
      setSettlementFreq(newExt.settlement_frequency || "Weekly");
      setSettlementEmail(newExt.settlement_email || salon.email || "");

      setTinNumber(newExt.tin_number || "");
      setVatRegistered(newExt.vat_registered || "No");
      setVatNumber(newExt.vat_number || "");

      setVerificationDocUrl(newExt.verification_document_url || "");
      setNicFrontUrl(newExt.owner_nic_front_url || "");
      setNicBackUrl(newExt.owner_nic_back_url || "");
      setBizRegUrl(newExt.business_registration_url || "");
    });
  }, [salon]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, setFile: (f: File | null) => void, setUrl: (u: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFile(file);
    setUrl(URL.createObjectURL(file)); // preview only
  };

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
    if (readOnly) return;
    setLoading(true);
    try {
      let finalVerDocUrl = verificationDocUrl;
      let finalNicFrontUrl = nicFrontUrl;
      let finalNicBackUrl = nicBackUrl;
      let finalBizRegUrl = bizRegUrl;

      // Upload files if they were added
      if (verificationDocFile) {
        const b64 = await toBase64(verificationDocFile);
        const res = await uploadSalonDocument("bank_statement", b64, verificationDocFile.type);
        if (res.success) finalVerDocUrl = res.documentUrl;
      }
      if (nicFrontFile) {
        const b64 = await toBase64(nicFrontFile);
        const res = await uploadSalonDocument("nic_front", b64, nicFrontFile.type);
        if (res.success) finalNicFrontUrl = res.documentUrl;
      }
      if (nicBackFile) {
        const b64 = await toBase64(nicBackFile);
        const res = await uploadSalonDocument("nic_back", b64, nicBackFile.type);
        if (res.success) finalNicBackUrl = res.documentUrl;
      }
      if (bizRegFile) {
        const b64 = await toBase64(bizRegFile);
        const res = await uploadSalonDocument("business_registration", b64, bizRegFile.type);
        if (res.success) finalBizRegUrl = res.documentUrl;
      }

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
          tin_number: tinNumber,
          vat_registered: vatRegistered,
          vat_number: vatRegistered === "Yes" ? vatNumber : "",
          verification_document_url: finalVerDocUrl,
          owner_nic_front_url: finalNicFrontUrl,
          owner_nic_back_url: finalNicBackUrl,
          business_registration_url: finalBizRegUrl,
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
            <Input required disabled={readOnly} value={accName} onChange={e => setAccName(e.target.value)} className="h-11 rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Bank Name *</Label>
            <select required disabled={readOnly} value={bankName} onChange={e => setBankName(e.target.value)} className="w-full h-11 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-zinc-950 font-medium text-sm bg-white disabled:bg-slate-50 disabled:opacity-50">
              <option value="" disabled>Select Bank</option>
              {bankOptions.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Branch Name *</Label>
            <Input required disabled={readOnly} value={branchName} onChange={e => setBranchName(e.target.value)} className="h-11 rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Account Number *</Label>
            <Input required disabled={readOnly} value={accNumber} onChange={e => setAccNumber(e.target.value)} className="h-11 rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Account Type *</Label>
            <select required disabled={readOnly} value={accType} onChange={e => setAccType(e.target.value)} className="w-full h-11 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-zinc-950 font-medium text-sm bg-white disabled:bg-slate-50 disabled:opacity-50">
              <option value="Savings">Savings Account</option>
              <option value="Current">Current Account</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-4">
          <CreditCard className="w-5 h-5 text-emerald-500" /> Section B: Settlement Preferences
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Preferred Payment Method *</Label>
            <select required disabled={readOnly} value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="w-full h-11 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-zinc-950 font-medium text-sm bg-white disabled:bg-slate-50 disabled:opacity-50">
              <option value="" disabled>Select Method</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cheque">Cheque</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Settlement Frequency *</Label>
            <select required disabled={readOnly} value={settlementFreq} onChange={e => setSettlementFreq(e.target.value)} className="w-full h-11 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-zinc-950 font-medium text-sm bg-white disabled:bg-slate-50 disabled:opacity-50">
              <option value="Weekly">Weekly</option>
              <option value="Monthly">Monthly</option>
            </select>
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Settlement Email *</Label>
            <Input required disabled={readOnly} type="email" value={settlementEmail} onChange={e => setSettlementEmail(e.target.value)} className="h-11 rounded-xl" />
          </div>
        </div>
      </div>



      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-4">
            <FileCheck className="w-5 h-5 text-emerald-500" /> Tax & Compliance
          </h3>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">VAT Registered</Label>
              <select disabled={readOnly} value={vatRegistered} onChange={e => setVatRegistered(e.target.value)} className="w-full h-11 px-3 rounded-xl border border-slate-200 focus:outline-none focus:border-zinc-950 font-medium text-sm bg-white disabled:bg-slate-50 disabled:opacity-50">
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>
            {vatRegistered === "Yes" && (
              <div className="space-y-1.5 animate-in slide-in-from-top-2">
                <Label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">VAT Number *</Label>
                <Input required disabled={readOnly} value={vatNumber} onChange={e => setVatNumber(e.target.value)} className="h-11 rounded-xl" />
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">TIN Number</Label>
              <Input disabled={readOnly} value={tinNumber} onChange={e => setTinNumber(e.target.value)} className="h-11 rounded-xl" />
            </div>
          </div>
        </div>

        {!hideVerificationDocuments && (
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 mb-4">
              <FileCheck className="w-5 h-5 text-indigo-500" /> Section E: Verification Documents
            </h3>
            <p className="text-xs text-zinc-500 mb-4">
              Upload the documents required for your business type. Agents, regional heads, and Trimma admins can review these securely.
            </p>
            {(() => {
              const businessType = String(salon?.business_info_extended?.business_type || "").toLowerCase();
              const isCompany =
                businessType.includes("company") ||
                businessType.includes("private limited") ||
                businessType.includes("plc");
              return (
                <p className="text-xs text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-xl p-3 mb-4">
                  {isCompany
                    ? "Company account: upload Business Registration (BR) and bank statement. Owner NIC front is recommended."
                    : "Sole proprietor / partnership: upload Owner NIC (front & back), Regional Business Registration (BR), and bank statement."}
                </p>
              );
            })()}

            <div className="space-y-4">
              <DocumentUploadSlot
                title="Owner NIC (Front)"
                url={nicFrontUrl}
                readOnly={readOnly}
                inputRef={nicFrontInputRef}
                onClear={() => { setNicFrontUrl(""); setNicFrontFile(null); }}
                onChange={(e) => handleFileUpload(e, setNicFrontFile, setNicFrontUrl)}
              />

              <DocumentUploadSlot
                title="Owner NIC (Back)"
                url={nicBackUrl}
                readOnly={readOnly}
                inputRef={nicBackInputRef}
                onClear={() => { setNicBackUrl(""); setNicBackFile(null); }}
                onChange={(e) => handleFileUpload(e, setNicBackFile, setNicBackUrl)}
              />

              <DocumentUploadSlot
                title="Business Registration (BR)"
                url={bizRegUrl}
                readOnly={readOnly}
                inputRef={bizRegInputRef}
                onClear={() => { setBizRegUrl(""); setBizRegFile(null); }}
                onChange={(e) => handleFileUpload(e, setBizRegFile, setBizRegUrl)}
              />

              <DocumentUploadSlot
                title="Bank Statement or Passbook"
                url={verificationDocUrl}
                readOnly={readOnly}
                inputRef={docInputRef}
                onClear={() => { setVerificationDocUrl(""); setVerificationDocFile(null); }}
                onChange={(e) => handleFileUpload(e, setVerificationDocFile, setVerificationDocUrl)}
              />
            </div>
          </div>
        )}
      </div>

      {!readOnly && (
        <div className="flex justify-end gap-3 mt-8">
          {children}
          <Button 
            type="submit" 
            disabled={loading}
            className="bg-[#ffc800] hover:bg-[#ffc800]/90 text-black shadow-md shadow-[#ffc800]/20 rounded-xl h-12 px-8 font-black text-sm w-full md:w-auto flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-5 h-5" /> Save Bank Info</>}
          </Button>
        </div>
      )}

    </form>
  );
}

function DocumentUploadSlot({ 
  title, url, readOnly, inputRef, onClear, onChange 
}: { 
  title: string; url: string; readOnly: boolean; inputRef: React.RefObject<HTMLInputElement>; onClear: () => void; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void 
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">{title}</Label>
      {url ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-green-900">Document Uploaded</p>
              {/* Note: In a real app with private buckets, you'd need a presigned URL to view it. 
                  But for now we just show it's uploaded. If it's a blob preview URL, it works. */}
            </div>
          </div>
          {!readOnly && (
            <Button type="button" variant="outline" size="sm" onClick={onClear} className="text-xs font-bold border-green-200 text-green-700 hover:bg-green-100 h-8">
              Replace
            </Button>
          )}
        </div>
      ) : (
        !readOnly ? (
          <div 
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-zinc-200 hover:border-indigo-400 bg-zinc-50/50 hover:bg-indigo-50/30 transition-colors rounded-xl p-4 flex items-center justify-center cursor-pointer text-center group gap-2"
          >
            <Upload className="w-4 h-4 text-zinc-400 group-hover:text-indigo-500" />
            <h4 className="text-xs font-bold text-zinc-600 group-hover:text-indigo-600">Click to upload</h4>
            <input 
              ref={inputRef}
              type="file" 
              className="hidden" 
              accept=".pdf,image/png,image/jpeg"
              onChange={onChange}
            />
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-500 font-medium italic">
            No document provided.
          </div>
        )
      )}
    </div>
  );
}
