"use client";

import React, { useState, useEffect } from "react";
import { 
  Building2, UserCheck, ShieldCheck, Activity, 
  Calculator, FileText, Plus, RefreshCw, Layers, 
  Pencil, Save, X, Loader2, Check
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/config/supabase";
import { toast } from "sonner";

export default function CommissionManagement() {
  const [simAmount, setSimAmount] = useState(10000);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Live DB state
  const [bookingConfig, setBookingConfig] = useState<any>(null);
  const [subscriptionConfig, setSubscriptionConfig] = useState<any>(null);
  const [agentTiers, setAgentTiers] = useState<any[]>([]);

  // Edit mode flags
  const [editBooking, setEditBooking] = useState(false);
  const [editSubscription, setEditSubscription] = useState(false);
  const [editTiers, setEditTiers] = useState(false);

  // Edit form state
  const [bookingForm, setBookingForm] = useState({ platform: 0, salon: 0, payhere: 0 });
  const [subscriptionForm, setSubscriptionForm] = useState({ platform: 0, agent: 0 });
  const [tiersForm, setTiersForm] = useState<any[]>([]);

  // Load data from Supabase
  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      setLoading(true);

      // Fetch active booking commission
      const { data: bookingData } = await supabase
        .from("commission_master")
        .select("*")
        .eq("commission_type", "booking")
        .eq("active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (bookingData) {
        setBookingConfig(bookingData);
        setBookingForm({ platform: bookingData.platform_percentage, salon: bookingData.salon_percentage, payhere: bookingData.payhere_percentage || 3 });
      } else {
        setBookingForm({ platform: 10, salon: 10, payhere: 3 });
      }

      // Fetch active subscription commission
      const { data: subData } = await supabase
        .from("commission_master")
        .select("*")
        .eq("commission_type", "subscription")
        .eq("active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (subData) {
        setSubscriptionConfig(subData);
        setSubscriptionForm({ platform: subData.platform_percentage, agent: subData.agent_percentage });
      } else {
        setSubscriptionForm({ platform: 80, agent: 20 });
      }

      // Fetch agent tiers
      const { data: tierData } = await supabase
        .from("agent_tiers")
        .select("*")
        .order("subscription_percentage");

      if (tierData) {
        setAgentTiers(tierData);
        setTiersForm(tierData.map(t => ({ ...t })));
      }

    } catch (err) {
      console.error("Failed to load commission data:", err);
    } finally {
      setLoading(false);
    }
  }

  // Save Booking Commission (creates new immutable version)
  async function saveBookingCommission() {
    if (bookingForm.platform + bookingForm.salon + bookingForm.payhere !== 23) {
      toast.error("Platform + Salon + PayHere must equal 23% (The Reservation Fee)");
      return;
    }
    setSaving(true);
    try {
      // Deactivate old version
      if (bookingConfig?.id) {
        await supabase.from("commission_master").update({ active: false, effective_to: new Date().toISOString() }).eq("id", bookingConfig.id);
      }
      // Insert new version
      const { error } = await supabase.from("commission_master").insert({
        commission_type: "booking",
        platform_percentage: bookingForm.platform,
        salon_percentage: bookingForm.salon,
        payhere_percentage: bookingForm.payhere,
        agent_percentage: 0,
        active: true,
        effective_from: new Date().toISOString(),
      });
      if (error) throw error;
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
      if (subscriptionConfig?.id) {
        await supabase.from("commission_master").update({ active: false, effective_to: new Date().toISOString() }).eq("id", subscriptionConfig.id);
      }
      const { error } = await supabase.from("commission_master").insert({
        commission_type: "subscription",
        platform_percentage: subscriptionForm.platform,
        salon_percentage: 0,
        agent_percentage: subscriptionForm.agent,
        active: true,
        effective_from: new Date().toISOString(),
      });
      if (error) throw error;
      toast.success("Subscription commission updated. New ledger version activated.");
      setEditSubscription(false);
      await loadData();
    } catch (err: any) {
      toast.error("Failed to save: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  // Save Agent Tiers
  async function saveAgentTiers() {
    setSaving(true);
    try {
      for (const tier of tiersForm) {
        const { error } = await supabase.from("agent_tiers").update({
          subscription_percentage: tier.subscription_percentage,
          booking_percentage: tier.booking_percentage,
        }).eq("id", tier.id);
        if (error) throw error;
      }
      toast.success("Agent tiers updated successfully.");
      setEditTiers(false);
      await loadData();
    } catch (err: any) {
      toast.error("Failed to save tiers: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  // Derived simulator values
  const simPlatform = simAmount * (bookingForm.platform / 100);
  const simSalon = simAmount * (bookingForm.salon / 100);
  const simPayhere = simAmount * (bookingForm.payhere / 100);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-zinc-400">
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
           <Button className="bg-zinc-950 hover:bg-zinc-800 text-white font-bold rounded-xl shadow-md h-10 px-4 flex items-center gap-2">
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
                     <Button size="sm" onClick={saveBookingCommission} disabled={saving} className="h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5">
                       {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save
                     </Button>
                     <Button variant="outline" size="sm" onClick={() => { setEditBooking(false); if(bookingConfig) setBookingForm({ platform: bookingConfig.platform_percentage, salon: bookingConfig.salon_percentage, payhere: bookingConfig.payhere_percentage || 3 }); }} className="h-8 rounded-lg border-slate-200 text-zinc-600 font-bold text-xs gap-1.5">
                       <X className="w-3.5 h-3.5" /> Cancel
                     </Button>
                   </div>
                 )}
               </div>
             </div>
             
             <div className="grid grid-cols-2 gap-4">
               <div className="bg-zinc-50 rounded-2xl p-4 border border-slate-100 relative overflow-hidden">
                 <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Platform Share</p>
                 {editBooking ? (
                   <div className="flex items-baseline gap-1">
                     <input 
                       type="number" step="0.1" min="0" max="23"
                       value={bookingForm.platform}
                       onChange={(e) => {
                         const v = Number(e.target.value);
                         setBookingForm(prev => ({ ...prev, platform: v }));
                       }}
                       className="w-full text-2xl font-black text-zinc-900 bg-transparent border-none p-0 focus:ring-0" 
                     />
                     <span className="text-xl font-black text-zinc-400">%</span>
                   </div>
                 ) : (
                   <p className="text-3xl font-black text-zinc-900">{bookingForm.platform}%</p>
                 )}
                 <Building2 className="absolute right-4 bottom-4 w-12 h-12 text-zinc-200/50" />
               </div>
               <div className="bg-zinc-50 rounded-2xl p-4 border border-slate-100 relative overflow-hidden">
                 <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Salon Share</p>
                 {editBooking ? (
                   <div className="flex items-baseline gap-1">
                     <input 
                       type="number" step="0.1" min="0" max="23"
                       value={bookingForm.salon}
                       onChange={(e) => {
                         const v = Number(e.target.value);
                         setBookingForm(prev => ({ ...prev, salon: v }));
                       }}
                       className="w-full text-2xl font-black text-emerald-600 bg-transparent border-none p-0 focus:ring-0" 
                     />
                     <span className="text-xl font-black text-zinc-400">%</span>
                   </div>
                 ) : (
                   <p className="text-3xl font-black text-zinc-900">{bookingForm.salon}%</p>
                 )}
                 <ShieldCheck className="absolute right-4 bottom-4 w-12 h-12 text-zinc-200/50" />
               </div>
               {editBooking && (
                <div className="bg-zinc-50 rounded-2xl p-4 border border-slate-100 relative overflow-hidden mt-4 col-span-2">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">PayHere Fee</p>
                  <div className="flex items-baseline gap-1">
                     <input 
                       type="number" step="0.1" min="0" max="23"
                       value={bookingForm.payhere}
                       onChange={(e) => {
                         const v = Number(e.target.value);
                         setBookingForm(prev => ({ ...prev, payhere: v }));
                       }}
                       className="w-full text-2xl font-black text-amber-600 bg-transparent border-none p-0 focus:ring-0" 
                     />
                     <span className="text-sm font-bold text-zinc-400">%</span>
                  </div>
                </div>
              )}
              
              {!editBooking && (
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-zinc-500 font-medium col-span-2">
                  <span>PayHere Fee Tracked: <span className="font-bold text-amber-600">{bookingConfig?.payhere_percentage || 3}%</span></span>
                  <span>Total Reservation: <span className="font-bold text-zinc-900">23%</span></span>
                </div>
              )}
             </div>
             {editBooking && (bookingForm.platform + bookingForm.salon + bookingForm.payhere !== 23) && (
               <p className="text-xs font-bold text-rose-500 mt-3">⚠ Total must equal 23% (Currently {bookingForm.platform + bookingForm.salon + bookingForm.payhere}%)</p>
             )}
             {editBooking && (bookingForm.platform + bookingForm.salon + bookingForm.payhere === 23) && (
               <p className="text-xs font-bold text-emerald-600 mt-3 flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Validated: Total is 23%</p>
             )}
             <div className="mt-4 text-xs font-semibold text-zinc-400 flex items-center justify-between">
                <span>Effective: {bookingConfig?.effective_from ? new Date(bookingConfig.effective_from).toLocaleDateString() : "Pending"}</span>
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
                     <Button size="sm" onClick={saveSubscriptionCommission} disabled={saving} className="h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5">
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
                 <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Platform Retains</p>
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
                     <span className="text-xl font-black text-zinc-400">%</span>
                   </div>
                 ) : (
                   <p className="text-2xl font-black text-zinc-900">{subscriptionForm.platform}%</p>
                 )}
               </div>
               <div className="bg-zinc-50 rounded-2xl p-4 border border-slate-100">
                 <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Agent (Default)</p>
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
                     <span className="text-xl font-black text-zinc-400">%</span>
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
                   <h2 className="font-bold text-zinc-900">Agent Tiers Overview</h2>
                   <p className="text-xs text-zinc-500 font-medium">Rank-based commission distribution overrides</p>
                 </div>
               </div>
               {!editTiers ? (
                 <Button variant="outline" size="sm" onClick={() => setEditTiers(true)} className="h-8 rounded-lg border-slate-200 text-zinc-600 font-bold text-xs gap-1.5">
                   <Pencil className="w-3.5 h-3.5" /> Edit Tiers
                 </Button>
               ) : (
                 <div className="flex gap-1.5">
                   <Button size="sm" onClick={saveAgentTiers} disabled={saving} className="h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5">
                     {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save
                   </Button>
                   <Button variant="outline" size="sm" onClick={() => { setEditTiers(false); setTiersForm(agentTiers.map(t => ({ ...t }))); }} className="h-8 rounded-lg border-slate-200 text-zinc-600 font-bold text-xs gap-1.5">
                     <X className="w-3.5 h-3.5" /> Cancel
                   </Button>
                 </div>
               )}
             </div>
             
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="pb-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Tier Name</th>
                      <th className="pb-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">SaaS Comm %</th>
                      <th className="pb-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Booking % (Ref)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tiersForm.map((tier, idx) => {
                      const tierColors: Record<string, string> = {
                        Bronze: "bg-[#cd7f32]/10 text-[#cd7f32]",
                        Silver: "bg-slate-200 text-slate-700",
                        Gold: "bg-amber-100 text-amber-700",
                      };
                      return (
                        <tr key={tier.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                          <td className="py-4">
                            <Badge className={`${tierColors[tier.name] || "bg-zinc-100 text-zinc-600"} border-none font-black shadow-sm`}>{tier.name}</Badge>
                          </td>
                          <td className="py-4">
                            {editTiers ? (
                              <input
                                type="number" step="0.5" min="0" max="100"
                                value={tier.subscription_percentage}
                                onChange={(e) => {
                                  const updated = [...tiersForm];
                                  updated[idx] = { ...updated[idx], subscription_percentage: Number(e.target.value) };
                                  setTiersForm(updated);
                                }}
                                className="w-20 h-9 text-sm font-bold text-zinc-900 bg-white border border-rose-200 rounded-lg px-2 focus:outline-none focus:border-rose-500 transition-colors"
                              />
                            ) : (
                              <span className="text-sm font-bold text-zinc-700">{tier.subscription_percentage}%</span>
                            )}
                          </td>
                          <td className="py-4">
                            {editTiers ? (
                              <input
                                type="number" step="0.1" min="0" max="100"
                                value={tier.booking_percentage}
                                onChange={(e) => {
                                  const updated = [...tiersForm];
                                  updated[idx] = { ...updated[idx], booking_percentage: Number(e.target.value) };
                                  setTiersForm(updated);
                                }}
                                className="w-20 h-9 text-sm font-bold text-zinc-900 bg-white border border-rose-200 rounded-lg px-2 focus:outline-none focus:border-rose-500 transition-colors"
                              />
                            ) : (
                              <span className="text-sm font-bold text-zinc-700">{tier.booking_percentage}%</span>
                            )}
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
           <div className="bg-[#1A1C29] rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden sticky top-24">
              <Calculator className="absolute -right-8 -bottom-8 w-48 h-48 text-white/5 rotate-12 pointer-events-none" />
              
              <div className="flex items-center gap-3 mb-6 relative z-10">
                 <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                   <Activity className="w-5 h-5 text-rose-400" />
                 </div>
                 <div>
                   <h2 className="font-bold text-white text-lg">Commission Simulator</h2>
                   <p className="text-[10px] text-white/50 uppercase tracking-widest font-bold">Ledger Sandbox</p>
                 </div>
              </div>

              <div className="space-y-6 relative z-10">
                <div>
                  <label className="text-xs font-bold text-white/60 mb-2 block">Customer Paid (LKR)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-bold">LKR</span>
                    <input 
                      type="number" 
                      value={simAmount}
                      onChange={(e) => setSimAmount(Number(e.target.value))}
                      className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 text-xl font-black text-white focus:outline-none focus:border-rose-500/50 transition-colors"
                    />
                  </div>
                </div>

                <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent my-6"></div>

                <div className="space-y-4">
                   <div className="flex items-center justify-between">
                     <span className="text-sm font-semibold text-white/60 flex items-center gap-2"><Building2 className="w-4 h-4" /> Platform Wallet ({bookingForm.platform}%)</span>
                     <span className="text-lg font-black text-emerald-400">+{simPlatform.toLocaleString()}</span>
                   </div>
                   <div className="flex items-center justify-between">
                     <span className="text-sm font-semibold text-white/60 flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Salon Wallet ({bookingForm.salon}%)</span>
                     <span className="text-lg font-black text-white">+{simSalon.toLocaleString()}</span>
                   </div>
                   <div className="flex items-center justify-between opacity-50">
                     <span className="text-sm font-semibold text-white/60 flex items-center gap-2"><UserCheck className="w-4 h-4" /> Agent Wallet (0%)</span>
                     <span className="text-lg font-black text-white">+0</span>
                   </div>
                </div>

                <div className="bg-white/5 rounded-2xl p-4 border border-white/10 mt-6">
                   <div className="flex justify-between items-center mb-1">
                     <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Net Settlement</span>
                     <span className="text-xs font-black text-rose-400">Total Validated</span>
                   </div>
                   <div className="text-2xl font-black text-white">LKR {simAmount.toLocaleString()}</div>
                </div>

                <Button className="w-full h-12 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold border border-white/5 mt-4">
                  Run Full Reconciliation Test
                </Button>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}
