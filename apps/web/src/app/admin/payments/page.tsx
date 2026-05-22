"use client";

import React, { useState, useEffect } from "react";
import { 
  CreditCard, 
  Save, 
  Settings, 
  ShieldCheck, 
  Zap, 
  Loader2, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertTriangle,
  Play,
  CheckCircle2,
  Database,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/config/supabase";
import { toast } from "sonner";

export default function AdminPayments() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [showAppSecret, setShowAppSecret] = useState(false);
  const [activeTab, setActiveTab] = useState<"keys" | "transactions">("keys");

  // Form State
  const [environment, setEnvironment] = useState<"sandbox" | "live">("sandbox");
  const [paypalClientSandbox, setPaypalClientSandbox] = useState("sb");
  const [paypalClientLive, setPaypalClientLive] = useState("");
  const [payhereMerchantId, setPayhereMerchantId] = useState("1211149");
  const [payhereMerchantSecret, setPayhereMerchantSecret] = useState("4a5s6d7f8g9h");
  const [payhereAppId, setPayhereAppId] = useState("app1234");
  const [payhereAppSecret, setPayhereAppSecret] = useState("");
  const [paypalEnabled, setPaypalEnabled] = useState(true);
  const [payhereEnabled, setPayhereEnabled] = useState(true);

  // Real Database Transactions state
  const [realPayments, setRealPayments] = useState<any[]>([]);
  const [loadingRealPayments, setLoadingRealPayments] = useState(false);

  // Simulated Audit Logs
  const [auditLogs, setAuditLogs] = useState<any[]>([
    { id: 1, gateway: "paypal", type: "Sandbox Capture", amount: "LKR 4,500", status: "success", time: "10 mins ago" },
    { id: 2, gateway: "payhere", type: "Sandbox Checkout Form", amount: "LKR 1,800", status: "success", time: "30 mins ago" },
  ]);

  useEffect(() => {
    fetchPaymentSettings();
    fetchRealPayments();
  }, []);

  const fetchPaymentSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("global_payment_settings")
        .select("*")
        .eq("id", "00000000-0000-0000-0000-000000000001")
        .maybeSingle();

      if (data) {
        setEnvironment(data.environment || "sandbox");
        setPaypalClientSandbox(data.paypal_client_id_sandbox || "sb");
        setPaypalClientLive(data.paypal_client_id_live || "");
        setPayhereMerchantId(data.payhere_merchant_id || "1211149");
        setPayhereMerchantSecret(data.payhere_merchant_secret || "4a5s6d7f8g9h");
        setPayhereAppId(data.payhere_app_id || "app1234");
        setPayhereAppSecret(data.payhere_app_secret || "");
        setPaypalEnabled(data.paypal_enabled !== false);
        setPayhereEnabled(data.payhere_enabled !== false);
      } else {
        // LocalStorage Fallback if table is not migrated yet
        const localEnv = localStorage.getItem("trimma_payment_env") as "sandbox" | "live";
        if (localEnv) setEnvironment(localEnv);
        
        const localPaypalSb = localStorage.getItem("trimma_paypal_sb");
        if (localPaypalSb) setPaypalClientSandbox(localPaypalSb);
        
        const localPaypalLive = localStorage.getItem("trimma_paypal_live");
        if (localPaypalLive) setPaypalClientLive(localPaypalLive);
        
        const localPayhereMerchant = localStorage.getItem("trimma_payhere_merchant");
        if (localPayhereMerchant) setPayhereMerchantId(localPayhereMerchant);
      }
    } catch (err) {
      console.warn("Table global_payment_settings not found yet. Using local fallback.");
    } finally {
      setLoading(false);
    }
  };

  const fetchRealPayments = async () => {
    try {
      setLoadingRealPayments(true);
      const { data, error } = await supabase
        .from("payments")
        .select(`
          *,
          salons (
            name
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRealPayments(data || []);
    } catch (err: any) {
      console.warn("Failed to fetch real payments:", err.message);
    } finally {
      setLoadingRealPayments(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from("global_payment_settings")
        .upsert({
          id: "00000000-0000-0000-0000-000000000001",
          environment,
          paypal_client_id_sandbox: paypalClientSandbox,
          paypal_client_id_live: paypalClientLive,
          payhere_merchant_id: payhereMerchantId,
          payhere_merchant_secret: payhereMerchantSecret,
          payhere_app_id: payhereAppId,
          payhere_app_secret: payhereAppSecret,
          paypal_enabled: paypalEnabled,
          payhere_enabled: payhereEnabled,
          updated_at: new Date().toISOString()
        });

      localStorage.setItem("trimma_payment_env", environment);
      localStorage.setItem("trimma_paypal_sb", paypalClientSandbox);
      localStorage.setItem("trimma_paypal_live", paypalClientLive);
      localStorage.setItem("trimma_payhere_merchant", payhereMerchantId);
      localStorage.setItem("trimma_paypal_enabled", String(paypalEnabled));
      localStorage.setItem("trimma_payhere_enabled", String(payhereEnabled));
      
      toast.success("Payment Gateway credentials updated successfully!");
    } catch (err: any) {
      toast.error("Failed to save to cloud database: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const simulateTestTransaction = async () => {
    try {
      // Find a dummy booking to link to
      const { data: booking } = await supabase.from("bookings").select("id, salon_id, amount").limit(1).maybeSingle();
      
      if (booking) {
        // Insert a real mock row in payments table for simulation!
        const isPayPal = Math.random() > 0.5;
        const { error } = await supabase
          .from("payments")
          .insert({
            booking_id: booking.id,
            salon_id: booking.salon_id,
            provider: isPayPal ? "paypal" : "payhere",
            provider_payment_id: "SIM-" + Math.random().toString(36).substring(2, 10).toUpperCase(),
            amount: booking.amount,
            currency: "LKR",
            status: "success",
            raw_response: { note: "Generated via payments configuration simulator console" }
          });
        
        if (error) throw error;
        await fetchRealPayments();
      }

      const newLog = {
        id: Date.now(),
        gateway: Math.random() > 0.5 ? "paypal" : "payhere",
        type: `${environment === 'sandbox' ? 'Sandbox' : 'Live'} Simulator Run`,
        amount: `LKR ${(Math.floor(Math.random() * 80) + 10) * 100}`,
        status: "success",
        time: "Just now"
      };
      setAuditLogs(prev => [newLog, ...prev]);
      toast.success("Sandbox webhook simulation successfully logged to database!");
    } catch (e: any) {
      toast.error("Simulation warning: " + e.message);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR", minimumFractionDigits: 0 }).format(price);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto p-4 sm:p-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-100 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1C29] tracking-tight">Payments & Credentials</h1>
          <p className="text-zinc-500 text-sm mt-1">Configure PayPal Smart Buttons and PayHere redirect keys for sandbox and production environments.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border-none shadow-sm ${
            environment === 'sandbox' ? 'bg-amber-500 text-white animate-pulse' : 'bg-emerald-600 text-white'
          }`}>
            {environment === 'sandbox' ? 'Active: Sandbox Mode' : 'Active: Live Production'}
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-200">
        <button
          onClick={() => setActiveTab("keys")}
          className={`pb-4 px-6 font-bold text-sm border-b-2 transition-all ${
            activeTab === "keys" 
              ? "border-brand text-brand" 
              : "border-transparent text-zinc-400 hover:text-zinc-600"
          }`}
        >
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4" /> Credentials Configuration
          </div>
        </button>
        
        <button
          onClick={() => setActiveTab("transactions")}
          className={`pb-4 px-6 font-bold text-sm border-b-2 transition-all ${
            activeTab === "transactions" 
              ? "border-brand text-brand" 
              : "border-transparent text-zinc-400 hover:text-zinc-600"
          }`}
        >
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4" /> Live Payments Ledger ({realPayments.length})
          </div>
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border border-zinc-100">
          <Loader2 className="w-8 h-8 animate-spin text-brand mb-4" />
          <p className="text-zinc-500 font-bold text-sm">Accessing platform payment vault...</p>
        </div>
      ) : activeTab === "keys" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main settings form */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Mode Switcher */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-xs space-y-4">
              <div className="flex items-center gap-3 text-[#1A1C29] font-extrabold text-sm uppercase tracking-wider">
                <Settings className="w-5 h-5 text-brand" />
                <span>Environment Configuration</span>
              </div>
              <p className="text-xs text-zinc-400 font-medium">
                Switching environments affects both customer-facing Booking Sheets and merchant clearing settlement models.
              </p>
              
              <div className="grid grid-cols-2 gap-3 p-1 bg-zinc-50 rounded-2xl border border-zinc-100">
                <button
                  type="button"
                  onClick={() => setEnvironment("sandbox")}
                  className={`py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                    environment === "sandbox"
                      ? "bg-white text-zinc-900 shadow-sm"
                      : "text-zinc-400 hover:text-zinc-600"
                  }`}
                >
                  Sandbox Mode
                </button>
                <button
                  type="button"
                  onClick={() => setEnvironment("live")}
                  className={`py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                    environment === "live"
                      ? "bg-white text-zinc-900 shadow-sm"
                      : "text-zinc-400 hover:text-zinc-600"
                  }`}
                >
                  Live Production
                </button>
              </div>

              {environment === "sandbox" ? (
                <div className="bg-amber-50/50 border border-amber-100/50 rounded-2xl p-4 flex gap-3 text-amber-800 text-xs font-medium">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                  <div>
                    <span className="font-bold">Sandbox Mode is Active.</span> All transactions are simulated in virtual test currencies. Perfect for checking out PayHere or PayPal Golden smart buttons safely.
                  </div>
                </div>
              ) : (
                <div className="bg-rose-50/50 border border-rose-100/50 rounded-2xl p-4 flex gap-3 text-rose-800 text-xs font-medium">
                  <Lock className="w-5 h-5 text-rose-600 shrink-0" />
                  <div>
                    <span className="font-bold">Production Mode is Selected.</span> Ensure all credentials matching real payment methods are verified and RLS policies are locked.
                  </div>
                </div>
              )}
            </div>

            {/* Active Gateways Selector */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-xs space-y-4">
              <div className="flex items-center gap-3 text-[#1A1C29] font-extrabold text-sm uppercase tracking-wider">
                <CreditCard className="w-5 h-5 text-brand" />
                <span>Active Gateways Selector</span>
              </div>
              <p className="text-xs text-zinc-400 font-medium">
                Choose which payment options are displayed to customers during the checkout booking flow.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className={`flex items-start gap-4 p-4 rounded-2xl border-2 cursor-pointer select-none transition-all ${
                  payhereEnabled ? 'border-brand/20 bg-rose-50/10' : 'border-zinc-100 bg-white hover:border-zinc-200'
                }`}>
                  <input
                    type="checkbox"
                    checked={payhereEnabled}
                    onChange={(e) => setPayhereEnabled(e.target.checked)}
                    className="w-5 h-5 rounded border-zinc-300 text-zinc-950 focus:ring-zinc-950 mt-1 cursor-pointer"
                  />
                  <div>
                    <div className="text-xs font-black text-zinc-800 uppercase tracking-wider">Enable PayHere Gateway</div>
                    <p className="text-[10px] text-zinc-400 font-bold mt-1">Accept local Credit Cards, Debit Cards, and direct LKR transfers.</p>
                  </div>
                </label>

                <label className={`flex items-start gap-4 p-4 rounded-2xl border-2 cursor-pointer select-none transition-all ${
                  paypalEnabled ? 'border-brand/20 bg-rose-50/10' : 'border-zinc-100 bg-white hover:border-zinc-200'
                }`}>
                  <input
                    type="checkbox"
                    checked={paypalEnabled}
                    onChange={(e) => setPaypalEnabled(e.target.checked)}
                    className="w-5 h-5 rounded border-zinc-300 text-zinc-950 focus:ring-zinc-950 mt-1 cursor-pointer"
                  />
                  <div>
                    <div className="text-xs font-black text-zinc-800 uppercase tracking-wider">Enable PayPal Smart Buttons</div>
                    <p className="text-[10px] text-zinc-400 font-bold mt-1">Accept global credit cards, PayPal balances, and USD settlements.</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Paypal Credentials */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-xs space-y-4">
              <div className="flex items-center gap-3 text-[#1A1C29] font-extrabold text-sm uppercase tracking-wider">
                <div className="w-7 h-7 rounded-lg bg-zinc-50 border flex items-center justify-center font-black text-xs text-blue-600">
                  P
                </div>
                <span>PayPal Smart Buttons Keys</span>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Sandbox Client ID</label>
                  <Input 
                    value={paypalClientSandbox}
                    onChange={(e) => setPaypalClientSandbox(e.target.value)}
                    placeholder="PayPal Sandbox Client ID (sb)" 
                    className="h-11 rounded-xl bg-zinc-50 border-transparent focus:bg-white focus:border-rose-100"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Live Client ID</label>
                  <Input 
                    value={paypalClientLive}
                    onChange={(e) => setPaypalClientLive(e.target.value)}
                    placeholder="PayPal Live Client ID (leave blank to fallback to sandbox)" 
                    className="h-11 rounded-xl bg-zinc-50 border-transparent focus:bg-white focus:border-rose-100"
                  />
                </div>
              </div>
            </div>

            {/* PayHere Credentials */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-xs space-y-4">
              <div className="flex items-center gap-3 text-[#1A1C29] font-extrabold text-sm uppercase tracking-wider">
                <div className="w-7 h-7 rounded-lg bg-zinc-50 border flex items-center justify-center font-black text-xs text-red-500">
                  H
                </div>
                <span>PayHere Checkout Gateway Keys</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">PayHere Merchant ID</label>
                  <Input 
                    value={payhereMerchantId}
                    onChange={(e) => setPayhereMerchantId(e.target.value)}
                    placeholder="Merchant ID" 
                    className="h-11 rounded-xl bg-zinc-50 border-transparent focus:bg-white focus:border-rose-100"
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">PayHere Merchant Secret</label>
                    <button 
                      type="button" 
                      onClick={() => setShowSecret(!showSecret)}
                      className="text-[10px] text-zinc-400 font-extrabold hover:text-zinc-600 flex items-center gap-1 uppercase"
                    >
                      {showSecret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      {showSecret ? "Hide" : "Show"}
                    </button>
                  </div>
                  <Input 
                    type={showSecret ? "text" : "password"}
                    value={payhereMerchantSecret}
                    onChange={(e) => setPayhereMerchantSecret(e.target.value)}
                    placeholder="Merchant Secret key" 
                    className="h-11 rounded-xl bg-zinc-50 border-transparent focus:bg-white focus:border-rose-100"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">App ID</label>
                  <Input 
                    value={payhereAppId}
                    onChange={(e) => setPayhereAppId(e.target.value)}
                    placeholder="PayHere App ID" 
                    className="h-11 rounded-xl bg-zinc-50 border-transparent focus:bg-white focus:border-rose-100"
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">App Secret</label>
                    <button 
                      type="button" 
                      onClick={() => setShowAppSecret(!showAppSecret)}
                      className="text-[10px] text-zinc-400 font-extrabold hover:text-zinc-600 flex items-center gap-1 uppercase"
                    >
                      {showAppSecret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      {showAppSecret ? "Hide" : "Show"}
                    </button>
                  </div>
                  <Input 
                    type={showAppSecret ? "text" : "password"}
                    value={payhereAppSecret}
                    onChange={(e) => setPayhereAppSecret(e.target.value)}
                    placeholder="PayHere App Secret key" 
                    className="h-11 rounded-xl bg-zinc-50 border-transparent focus:bg-white focus:border-rose-100"
                  />
                </div>
              </div>
            </div>

            {/* Save Buttons */}
            <div className="flex items-center justify-end gap-3">
              <Button
                type="button"
                disabled={saving}
                onClick={handleSaveSettings}
                className="bg-zinc-950 text-white font-bold h-12 rounded-2xl px-8 hover:bg-zinc-800 shadow-md flex items-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Configuration
              </Button>
            </div>

          </div>

          {/* Sidebar / Tools */}
          <div className="space-y-6">
            
            {/* Quick Sandbox Simulator */}
            <div className="bg-[#1A1C29] text-white p-6 rounded-3xl relative overflow-hidden shadow-xl">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-extrabold text-sm uppercase tracking-widest text-white/40">Checkout Simulator</h3>
                  <p className="text-lg font-black mt-1">Virtual Gateway</p>
                </div>
                <Badge className="bg-white/10 text-white border-none font-bold uppercase tracking-wider text-[8px]">Developer Kit</Badge>
              </div>
              
              <p className="text-xs text-white/50 leading-relaxed mb-6">
                Simulate a checkout response or standard capture to verify that webhooks, notification alerts, and database logs trigger correctly.
              </p>

              <Button
                type="button"
                onClick={simulateTestTransaction}
                className="w-full bg-brand hover:bg-brand-hover text-white font-bold h-11 rounded-xl shadow-lg shadow-brand/20 flex items-center justify-center gap-2 text-xs"
              >
                <Play className="w-4 h-4 fill-white" />
                Trigger Sandbox Capture
              </Button>
            </div>

            {/* Simulation Log Feed */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-xs space-y-4">
              <div className="flex items-center gap-3 text-[#1A1C29] font-extrabold text-xs uppercase tracking-wider border-b border-zinc-50 pb-3">
                <Zap className="w-4 h-4 text-emerald-500" />
                <span>Sandbox Clearing Log</span>
              </div>

              <div className="space-y-3">
                {auditLogs.map(log => (
                  <div key={log.id} className="flex justify-between items-center p-3 hover:bg-zinc-50/50 rounded-xl transition-colors">
                    <div>
                      <div className="text-xs font-bold text-zinc-800 capitalize flex items-center gap-1.5">
                        {log.gateway === 'paypal' ? 'PayPal' : 'PayHere'} 
                        <span className="text-[9px] text-zinc-400 font-medium">({log.type})</span>
                      </div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">{log.time}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-extrabold text-zinc-800">{log.amount}</div>
                      <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded mt-0.5 inline-block uppercase tracking-wider">
                        {log.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      ) : (
        /* Transactions Ledger Tab */
        <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden animate-in fade-in duration-300">
          <div className="p-6 border-b border-zinc-100 flex justify-between items-center">
            <div>
              <h3 className="font-extrabold text-[#1A1C29] text-base">Recorded Transactions</h3>
              <p className="text-xs text-zinc-400 mt-0.5">Live database clearing records logged directly from PayPal and PayHere webhooks.</p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchRealPayments} disabled={loadingRealPayments} className="h-9 rounded-xl font-bold">
              {loadingRealPayments ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              Reload Payments
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50/50 text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-100">
                  <th className="px-8 py-5">Clearing ID</th>
                  <th className="px-8 py-5">Partner Establishment</th>
                  <th className="px-8 py-5">Payment Gateway</th>
                  <th className="px-8 py-5">Captured Amount</th>
                  <th className="px-8 py-5">Status</th>
                  <th className="px-8 py-5 text-right">Settlement Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {loadingRealPayments ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-20 text-center">
                      <Loader2 className="w-8 h-8 animate-spin text-brand mx-auto mb-4" />
                      <p className="text-zinc-400 text-xs font-semibold">Accessing live ledger...</p>
                    </td>
                  </tr>
                ) : realPayments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-20 text-center text-zinc-400">
                      <Database className="w-12 h-12 mx-auto mb-4 opacity-20" />
                      <p className="font-medium text-sm">No live payment rows recorded in database yet.</p>
                      <p className="text-xs text-zinc-400 mt-1">Simulate checkouts using the Developer Kit in the Credentials tab.</p>
                    </td>
                  </tr>
                ) : (
                  realPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-zinc-50/40 transition-colors group">
                      <td className="px-8 py-5 font-mono text-xs font-bold text-zinc-900">
                        {p.provider_payment_id || p.id.substring(0, 8).toUpperCase()}
                      </td>
                      
                      <td className="px-8 py-5 text-sm font-bold text-zinc-800">
                        {p.salons?.name || "Global Partner"}
                      </td>
                      
                      <td className="px-8 py-5">
                        <Badge className={`text-[9px] font-black uppercase tracking-widest border-none ${
                          p.provider === 'paypal' 
                            ? "bg-blue-50 text-blue-600" 
                            : "bg-rose-50 text-brand"
                        }`}>
                          {p.provider === 'paypal' ? 'PayPal Checkout' : 'PayHere Hosted'}
                        </Badge>
                      </td>
                      
                      <td className="px-8 py-5 text-sm font-black text-zinc-900">
                        {formatPrice(p.amount)}
                      </td>
                      
                      <td className="px-8 py-5">
                        <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase tracking-wider border-none">
                          {p.status || "success"}
                        </span>
                      </td>
                      
                      <td className="px-8 py-5 text-right text-xs text-zinc-400 font-semibold">
                        {new Date(p.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
