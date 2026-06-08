"use client";

import React, { useState, useEffect } from "react";
import { Building2, UserCheck, ShieldCheck, Activity, Calculator, FileText, RefreshCw, Layers, Pencil, Save, X, Loader2, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { fetchAdminCommissionsPage } from "@/app/actions/admin-list-data";
import {
  saveBookingCommissionMaster,
  saveCommissionRules,
  saveSubscriptionCommissionMaster,
} from "@/app/actions/commission-master";
import { withTimeout } from "@/lib/promise-timeout";

export default function CommissionManagement() {
  const [simAmount, setSimAmount] = useState(10000);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Live DB state
  const [bookingConfig, setBookingConfig] = useState<any>(null);
  const [subscriptionConfig, setSubscriptionConfig] = useState<any>(null);
  const [commissionRules, setCommissionRules] = useState<any[]>([]);

  // Edit mode flags
  const [editBooking, setEditBooking] = useState(false);
  const [editSubscription, setEditSubscription] = useState(false);
  const [editTiers, setEditTiers] = useState(false);

  // Edit form state
  const [bookingForm, setBookingForm] = useState({ platform: 0, salon: 0 });
  const [subscriptionForm, setSubscriptionForm] = useState({ platform: 0, agent: 0 });
  const [tiersForm, setTiersForm] = useState<any[]>([]);

  // Load data from Supabase
  useEffect(() => {
 void Promise.resolve().then(() => {
   loadData();
 });
  }, []);

  async function loadData() {
    try {
      setLoading(true);

      const result = await withTimeout(
        fetchAdminCommissionsPage(),
        20000,
        "Loading timed out. Check Vercel env (SUPABASE_SERVICE_ROLE_KEY) and refresh."
      );

      if (result.success === false) {
        throw new Error(result.error);
      }

      const commissionMaster = result.commissionMaster || [];
      const rulesData = result.commissionRules || [];

      const defaultRules = [
        { id: "default-bronze", name: "Bronze", rule_type: "PERCENTAGE", rate: 10, tier_min: 0, tier_max: 49999 },
        { id: "default-silver", name: "Silver", rule_type: "PERCENTAGE", rate: 12, tier_min: 50000, tier_max: 99999 },
        { id: "default-gold", name: "Gold", rule_type: "PERCENTAGE", rate: 15, tier_min: 100000, tier_max: null },
      ];

      const bookingData = commissionMaster
        .filter((c) => c.commission_type === "booking" && c.active)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

      if (bookingData) {
        setBookingConfig(bookingData);
        setBookingForm({ platform: bookingData.platform_percentage, salon: bookingData.salon_percentage });
      } else {
        setBookingForm({ platform: 10, salon: 10 });
      }

      const subData = commissionMaster
        .filter((c) => c.commission_type === "subscription" && c.active)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

      if (subData) {
        setSubscriptionConfig(subData);
        setSubscriptionForm({ platform: subData.platform_percentage, agent: subData.agent_percentage });
      } else {
        setSubscriptionForm({ platform: 80, agent: 20 });
      }

      if (rulesData.length > 0) {
        setCommissionRules(rulesData);
        setTiersForm(rulesData.map((t: any) => ({ ...t })));
      } else {
        setCommissionRules(defaultRules);
        setTiersForm(defaultRules.map((t) => ({ ...t })));
      }

    } catch (err: any) {
      console.error("Failed to load commission data:", err);
      toast.error("Failed to load commission data: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  }

  // Save Booking Commission (creates new immutable version)
  async function saveBookingCommission() {
    if (bookingForm.platform + bookingForm.salon !== 20) {
      toast.error("Platform + Salon must equal 20% (The Reservation Fee)");
      return;
    }
    setSaving(true);
    try {
      const result = await saveBookingCommissionMaster({
        platform: bookingForm.platform,
        salon: bookingForm.salon,
        previousId: bookingConfig?.id,
      });
      if (result.success === false) throw new Error(result.error);
      toast.success("Booking commission updated. New ledger version activated.");
      setEditBooking(false);
      await loadData();
    } catch (err: any) {
      toast.error("Failed to save: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  // Save Subscription Commission (creates new immutable version)
  async function saveSubscriptionCommission() {
    if (subscriptionForm.platform + subscriptionForm.agent !== 100) {
      toast.error("Platform + Agent must equal 100%");
      return;
    }
    setSaving(true);
    try {
      const result = await saveSubscriptionCommissionMaster({
        platform: subscriptionForm.platform,
        agent: subscriptionForm.agent,
        previousId: subscriptionConfig?.id,
      });
      if (result.success === false) throw new Error(result.error);
      toast.success("Subscription commission updated. New ledger version activated.");
      setEditSubscription(false);
      await loadData();
    } catch (err: any) {
      toast.error("Failed to save: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function saveAgentTiers() {
    setSaving(true);
    try {
      const result = await saveCommissionRules(tiersForm);
      if (result.success === false) throw new Error(result.error);
      toast.success("Commission rules updated successfully.");
      setEditTiers(false);
      await loadData();
    } catch (err: any) {
      toast.error("Failed to save rules: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  // Derived simulator values
  const simPlatform = simAmount * (bookingForm.platform / 100);
  const simSalon = simAmount * (bookingForm.salon / 100);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-zinc-500">
        <Loader2 className="w-10 h-10 animate-spin text-brand mb-4" />
        <p className="text-sm font-bold">Loading Commission Engine...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1C29] tracking-tight">Commission Engine</h1>
          <p className="text-zinc-500 text-sm mt-1">Manage global financial ledger rules, agent tiers, and settlement logic.</p>
        </div>
        <div className="flex gap-2">
           <Button className="bg-white hover:bg-zinc-800 text-zinc-900 font-bold rounded-xl shadow-md h-10 px-4 flex items-center gap-2">
             <FileText className="w-4 h-4" /> Audit Logs
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Configurations */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* ─── Booking Commission ─── */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
             <div className="flex items-center justify-between mb-6">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                   <Activity className="w-5 h-5 text-indigo-600" />
                 </div>
                 <div>
                   <h2 className="font-bold text-zinc-900">Booking Commission (Marketplace)</h2>
                   <p className="text-xs text-zinc-500 font-medium">Global default split for customer reservations</p>
                 </div>
               </div>
               <div className="flex items-center gap-2">
                 <Badge className="bg-emerald-50 text-emerald-600 border-none font-bold">Active</Badge>
                 {!editBooking ? (
                   <Button variant="outline" size="sm" onClick={() => setEditBooking(true)} className="h-8 rounded-lg border-slate-200 text-zinc-600 font-bold text-xs gap-1.5">
                     <Pencil className="w-3.5 h-3.5" /> Edit
                   </Button>
                 ) : (
                   <div className="flex gap-1.5">
                     <Button size="sm" onClick={saveBookingCommission} disabled={saving} className="h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-zinc-900 font-bold text-xs gap-1.5">
                       {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save
                     </Button>
                     <Button variant="outline" size="sm" onClick={() => { setEditBooking(false); if(bookingConfig) setBookingForm({ platform: bookingConfig.platform_percentage, salon: bookingConfig.salon_percentage }); }} className="h-8 rounded-lg border-slate-200 text-zinc-600 font-bold text-xs gap-1.5">
                       <X className="w-3.5 h-3.5" /> Cancel
                     </Button>
                   </div>
                 )}
               </div>
             </div>
             
             <div className="grid grid-cols-2 gap-4">
               <div className="bg-zinc-50 rounded-2xl p-4 border border-slate-100 relative overflow-hidden">
                 <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Platform Share</p>
                 {editBooking ? (
                   <div className="flex items-baseline gap-1">
                     <input 
                       type="number" step="0.1" min="0" max="20"
                       value={bookingForm.platform}
                       onChange={(e) => {
                         const v = Number(e.target.value);
                         setBookingForm(prev => ({ ...prev, platform: v }));
                       }}
                       className="w-full text-2xl font-black text-zinc-900 bg-transparent border-none p-0 focus:ring-0" 
                     />
                     <span className="text-xl font-black text-zinc-500">%</span>
                   </div>
                 ) : (
                   <p className="text-3xl font-black text-zinc-900">{bookingForm.platform}%</p>
                 )}
                 <Building2 className="absolute right-4 bottom-4 w-12 h-12 text-zinc-800/50" />
               </div>
               <div className="bg-zinc-50 rounded-2xl p-4 border border-slate-100 relative overflow-hidden">
                 <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Salon Share</p>
                 {editBooking ? (
                   <div className="flex items-baseline gap-1">
                     <input 
                       type="number" step="0.1" min="0" max="20"
                       value={bookingForm.salon}
                       onChange={(e) => {
                         const v = Number(e.target.value);
                         setBookingForm(prev => ({ ...prev, salon: v }));
                       }}
                       className="w-full text-2xl font-black text-emerald-600 bg-transparent border-none p-0 focus:ring-0" 
                     />
                     <span className="text-xl font-black text-zinc-500">%</span>
                   </div>
                 ) : (
                   <p className="text-3xl font-black text-zinc-900">{bookingForm.salon}%</p>
                 )}
                 <ShieldCheck className="absolute right-4 bottom-4 w-12 h-12 text-zinc-800/50" />
               </div>
               {!editBooking && (
                 <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-zinc-500 font-medium col-span-2">
                   <span>Total Reservation: <span className="font-bold text-zinc-900">20%</span></span>
                 </div>
               )}
              </div>
              {editBooking && (bookingForm.platform + bookingForm.salon !== 20) && (
                <p className="text-xs font-bold text-rose-500 mt-3">⚠ Total must equal 20% (Currently {bookingForm.platform + bookingForm.salon}%)</p>
              )}
              {editBooking && (bookingForm.platform + bookingForm.salon === 20) && (
                <p className="text-xs font-bold text-emerald-600 mt-3 flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Validated: Total is 20%</p>
              )}
             <div className="mt-4 text-xs font-semibold text-zinc-500 flex items-center justify-between">
                <span>Last updated: {bookingConfig?.created_at ? new Date(bookingConfig.created_at).toLocaleDateString() : "Pending"}</span>
                <span className="text-indigo-600 cursor-pointer hover:underline">View History</span>
             </div>
          </div>

          {/* ─── Subscription Commission ─── */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
             <div className="flex items-center justify-between mb-6">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                   <RefreshCw className="w-5 h-5 text-amber-600" />
                 </div>
                 <div>
                   <h2 className="font-bold text-zinc-900">Subscription Sales (SaaS)</h2>
                   <p className="text-xs text-zinc-500 font-medium">Commission split for agent-sold Pro plans</p>
                 </div>
               </div>
               <div className="flex items-center gap-2">
                 {!editSubscription ? (
                   <Button variant="outline" size="sm" onClick={() => setEditSubscription(true)} className="h-8 rounded-lg border-slate-200 text-zinc-600 font-bold text-xs gap-1.5">
                     <Pencil className="w-3.5 h-3.5" /> Edit
                   </Button>
                 ) : (
                   <div className="flex gap-1.5">
                     <Button size="sm" onClick={saveSubscriptionCommission} disabled={saving} className="h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-zinc-900 font-bold text-xs gap-1.5">
                       {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save
                     </Button>
                     <Button variant="outline" size="sm" onClick={() => { setEditSubscription(false); if(subscriptionConfig) setSubscriptionForm({ platform: subscriptionConfig.platform_percentage, agent: subscriptionConfig.agent_percentage }); }} className="h-8 rounded-lg border-slate-200 text-zinc-600 font-bold text-xs gap-1.5">
                       <X className="w-3.5 h-3.5" /> Cancel
                     </Button>
                   </div>
                 )}
               </div>
             </div>
             
             <div className="grid grid-cols-2 gap-4">
               <div className="bg-zinc-50 rounded-2xl p-4 border border-slate-100">
                 <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Platform Retains</p>
                 {editSubscription ? (
                   <div className="flex items-baseline gap-1">
                     <input 
                       type="number" step="1" min="0" max="100"
                       value={subscriptionForm.platform}
                       onChange={(e) => {
                         const v = Number(e.target.value);
                         setSubscriptionForm({ platform: v, agent: Math.round((100 - v) * 10) / 10 });
                       }}
                       className="w-24 h-12 text-2xl font-black text-zinc-900 bg-white border border-amber-200 rounded-xl px-3 focus:outline-none focus:border-amber-500 transition-colors"
                     />
                     <span className="text-xl font-black text-zinc-500">%</span>
                   </div>
                 ) : (
                   <p className="text-2xl font-black text-zinc-900">{subscriptionForm.platform}%</p>
                 )}
               </div>
               <div className="bg-zinc-50 rounded-2xl p-4 border border-slate-100">
                 <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Agent (Default)</p>
                 {editSubscription ? (
                   <div className="flex items-baseline gap-1">
                     <input 
                       type="number" step="1" min="0" max="100"
                       value={subscriptionForm.agent}
                       onChange={(e) => {
                         const v = Number(e.target.value);
                         setSubscriptionForm({ agent: v, platform: Math.round((100 - v) * 10) / 10 });
                       }}
                       className="w-24 h-12 text-2xl font-black text-zinc-900 bg-white border border-amber-200 rounded-xl px-3 focus:outline-none focus:border-amber-500 transition-colors"
                     />
                     <span className="text-xl font-black text-zinc-500">%</span>
                   </div>
                 ) : (
                   <p className="text-2xl font-black text-zinc-900">{subscriptionForm.agent}%</p>
                 )}
               </div>
             </div>
             {editSubscription && (subscriptionForm.platform + subscriptionForm.agent !== 100) && (
               <p className="text-xs font-bold text-rose-500 mt-3">⚠ Platform + Agent must equal 100% (Currently {subscriptionForm.platform + subscriptionForm.agent}%)</p>
             )}
             {editSubscription && (subscriptionForm.platform + subscriptionForm.agent === 100) && (
               <p className="text-xs font-bold text-emerald-600 mt-3 flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Validated: Total is 100%</p>
             )}
          </div>
          
          {/* ─── Agent Tiers ─── */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
             <div className="flex items-center justify-between mb-6">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                   <Layers className="w-5 h-5 text-rose-600" />
                 </div>
                 <div>
                   <h2 className="font-bold text-zinc-900">Commission Rules Overview</h2>
                   <p className="text-xs text-zinc-500 font-medium">Tier rules from commission_rules (read-only defaults if table is empty)</p>
                 </div>
               </div>
               {!editTiers ? (
                 <Button variant="outline" size="sm" onClick={() => setEditTiers(true)} className="h-8 rounded-lg border-slate-200 text-zinc-600 font-bold text-xs gap-1.5">
                   <Pencil className="w-3.5 h-3.5" /> Edit Tiers
                 </Button>
               ) : (
                 <div className="flex gap-1.5">
                   <Button size="sm" onClick={saveAgentTiers} disabled={saving} className="h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-zinc-900 font-bold text-xs gap-1.5">
                     {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save
                   </Button>
                   <Button variant="outline" size="sm" onClick={() => { setEditTiers(false); setTiersForm(commissionRules.map(t => ({ ...t }))); }} className="h-8 rounded-lg border-slate-200 text-zinc-600 font-bold text-xs gap-1.5">
                     <X className="w-3.5 h-3.5" /> Cancel
                   </Button>
                 </div>
               )}
             </div>
             
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="pb-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Rule Name</th>
                      <th className="pb-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Type</th>
                      <th className="pb-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Rate %</th>
                      <th className="pb-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Tier Range</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tiersForm.map((tier, idx) => {
                      const tierColors: Record<string, string> = {
                        Bronze: "bg-[#cd7f32]/10 text-[#cd7f32]",
                        Silver: "bg-slate-200 text-slate-700",
                        Gold: "bg-amber-100 text-amber-700",
                      };
                      const isReadOnly = String(tier.id).startsWith("default-");
                      return (
                        <tr key={tier.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                          <td className="py-4">
                            <Badge className={`${tierColors[tier.name] || "bg-zinc-100 text-zinc-600"} border-none font-black shadow-sm`}>{tier.name}</Badge>
                          </td>
                          <td className="py-4">
                            {editTiers && !isReadOnly ? (
                              <input
                                type="text"
                                value={tier.rule_type || "PERCENTAGE"}
                                onChange={(e) => {
                                  const updated = [...tiersForm];
                                  updated[idx] = { ...updated[idx], rule_type: e.target.value };
                                  setTiersForm(updated);
                                }}
                                className="w-28 h-9 text-sm font-bold text-zinc-900 bg-white border border-rose-200 rounded-lg px-2 focus:outline-none focus:border-rose-500 transition-colors"
                              />
                            ) : (
                              <span className="text-sm font-bold text-zinc-700">{tier.rule_type || "PERCENTAGE"}</span>
                            )}
                          </td>
                          <td className="py-4">
                            {editTiers && !isReadOnly ? (
                              <input
                                type="number" step="0.5" min="0" max="100"
                                value={tier.rate}
                                onChange={(e) => {
                                  const updated = [...tiersForm];
                                  updated[idx] = { ...updated[idx], rate: Number(e.target.value) };
                                  setTiersForm(updated);
                                }}
                                className="w-20 h-9 text-sm font-bold text-zinc-900 bg-white border border-rose-200 rounded-lg px-2 focus:outline-none focus:border-rose-500 transition-colors"
                              />
                            ) : (
                              <span className="text-sm font-bold text-zinc-700">{tier.rate}%</span>
                            )}
                          </td>
                          <td className="py-4">
                            <span className="text-sm font-bold text-zinc-700">
                              {tier.tier_min ?? 0}
                              {tier.tier_max != null ? ` – ${tier.tier_max}` : "+"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
             </div>
          </div>

        </div>

        {/* Right Col: Simulator */}
        <div className="lg:col-span-1">
           <div className="bg-white rounded-3xl p-6 text-zinc-900 shadow-2xl relative overflow-hidden sticky top-24">
              <Calculator className="absolute -right-8 -bottom-8 w-48 h-48 text-zinc-900/5 rotate-12 pointer-events-none" />
              
              <div className="flex items-center gap-3 mb-6 relative z-10">
                 <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center backdrop-blur-md">
                   <Activity className="w-5 h-5 text-rose-400" />
                 </div>
                 <div>
                   <h2 className="font-bold text-zinc-900 text-lg">Commission Simulator</h2>
                   <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Ledger Sandbox</p>
                 </div>
              </div>

              <div className="space-y-6 relative z-10">
                <div>
                  <label className="text-xs font-bold text-zinc-500 mb-2 block">Customer Paid (LKR)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">LKR</span>
                    <input 
                      type="number" 
                      value={simAmount}
                      onChange={(e) => setSimAmount(Number(e.target.value))}
                      className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 text-xl font-black text-zinc-900 focus:outline-none focus:border-rose-500/50 transition-colors"
                    />
                  </div>
                </div>

                <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent my-6"></div>

                <div className="space-y-4">
                   <div className="flex items-center justify-between">
                     <span className="text-sm font-semibold text-zinc-500 flex items-center gap-2"><Building2 className="w-4 h-4" /> Platform Wallet ({bookingForm.platform}%)</span>
                     <span className="text-lg font-black text-emerald-400">+{simPlatform.toLocaleString()}</span>
                   </div>
                   <div className="flex items-center justify-between">
                     <span className="text-sm font-semibold text-zinc-500 flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Salon Wallet ({bookingForm.salon}%)</span>
                     <span className="text-lg font-black text-zinc-900">+{simSalon.toLocaleString()}</span>
                   </div>
                   <div className="flex items-center justify-between opacity-50">
                     <span className="text-sm font-semibold text-zinc-500 flex items-center gap-2"><UserCheck className="w-4 h-4" /> Agent Wallet (0%)</span>
                     <span className="text-lg font-black text-zinc-900">+0</span>
                   </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 mt-6">
                   <div className="flex justify-between items-center mb-1">
                     <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Net Settlement</span>
                     <span className="text-xs font-black text-rose-400">Total Validated</span>
                   </div>
                   <div className="text-2xl font-black text-zinc-900">LKR {simAmount.toLocaleString()}</div>
                </div>

                <Button className="w-full h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-zinc-900 font-bold border border-slate-100 mt-4">
                  Run Full Reconciliation Test
                </Button>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}
