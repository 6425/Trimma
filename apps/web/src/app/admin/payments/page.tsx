"use client";

import React, { useState, useEffect } from "react";
import {
  CreditCard,
  Save,
  Settings,
  Zap,
  Loader2,
  Lock,
  AlertTriangle,
  Play,
  Database,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { fetchAdminPaymentsPage } from "@/app/actions/admin-list-data";
import {
  fetchStripeConnectionStatus,
  saveStripePaymentSettings,
  simulateAdminTestPayment,
} from "@/app/actions/admin-operations";
import { STRIPE_ENV_DOCS } from "@/lib/stripe-env";
import { withTimeout } from "@/lib/promise-timeout";

type StripeConnection = Awaited<ReturnType<typeof fetchStripeConnectionStatus>>["connection"];

export default function AdminPayments() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"keys" | "transactions">("keys");
  const [stripeEnvironment, setStripeEnvironment] = useState<"sandbox" | "live">("sandbox");
  const [stripeEnabled, setStripeEnabled] = useState(true);
  const [showStripeSecret, setShowStripeSecret] = useState(false);
  const [stripePublishableKeySandbox, setStripePublishableKeySandbox] = useState("");
  const [stripePublishableKeyLive, setStripePublishableKeyLive] = useState("");
  const [stripeSecretKeySandbox, setStripeSecretKeySandbox] = useState("");
  const [stripeSecretKeyLive, setStripeSecretKeyLive] = useState("");
  const [connection, setConnection] = useState<StripeConnection | null>(null);
  const [realPayments, setRealPayments] = useState<any[]>([]);
  const [loadingRealPayments, setLoadingRealPayments] = useState(false);

  const activeConnection =
    stripeEnvironment === "live" ? connection?.live : connection?.sandbox;
  const keysReady =
    Boolean(activeConnection?.publishableConfigured) &&
    Boolean(activeConnection?.secretConfigured);
  const envOverridesActiveMode =
    activeConnection?.publishableSource === "env" ||
    activeConnection?.secretSource === "env";

  const applySettingsFromDb = (data: Record<string, unknown> | null | undefined) => {
    if (!data) return;
    setStripeEnvironment(data.stripe_environment === "live" ? "live" : "sandbox");
    setStripeEnabled(data.stripe_enabled !== false);
    setStripePublishableKeySandbox(String(data.stripe_publishable_key_sandbox || ""));
    setStripePublishableKeyLive(String(data.stripe_publishable_key_live || ""));
    setStripeSecretKeySandbox(String(data.stripe_secret_key_sandbox || ""));
    setStripeSecretKeyLive(String(data.stripe_secret_key_live || ""));
  };

  const fetchPaymentSettings = async () => {
    try {
      setLoading(true);
      const [pageResult, connectionResult] = await Promise.all([
        withTimeout(
          fetchAdminPaymentsPage(),
          20000,
          "Loading timed out. Check Vercel env (SUPABASE_SERVICE_ROLE_KEY) and refresh."
        ),
        fetchStripeConnectionStatus(),
      ]);

      if (pageResult.success === false) {
        throw new Error(pageResult.error);
      }

      const data = pageResult.settings;
      applySettingsFromDb(data);

      if (connectionResult.success) {
        setConnection(connectionResult.connection);
      }
    } catch (err: any) {
      console.warn("Failed to load payment settings:", err.message || err);
      toast.error(err?.message || "Failed to load payment settings.");
    } finally {
      setLoading(false);
    }
  };

  const fetchRealPayments = async () => {
    try {
      setLoadingRealPayments(true);
      const result = await withTimeout(
        fetchAdminPaymentsPage(),
        20000,
        "Loading timed out. Check Vercel env (SUPABASE_SERVICE_ROLE_KEY) and refresh."
      );

      if (result.success === false) {
        throw new Error(result.error);
      }

      setRealPayments(result.payments || []);
    } catch (err: any) {
      console.warn("Failed to fetch real payments:", err.message);
    } finally {
      setLoadingRealPayments(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(() => {
      fetchPaymentSettings();
      fetchRealPayments();
    });
  }, []);

  const handleSaveSettings = async () => {
    try {
      setSaving(true);

      const result = await saveStripePaymentSettings({
        stripe_enabled: stripeEnabled,
        stripe_environment: stripeEnvironment,
        stripe_publishable_key_sandbox: stripePublishableKeySandbox,
        stripe_publishable_key_live: stripePublishableKeyLive,
        stripe_secret_key_sandbox: stripeSecretKeySandbox,
        stripe_secret_key_live: stripeSecretKeyLive,
      });
      if (result.success === false) throw new Error(result.error);

      const connectionResult = await fetchStripeConnectionStatus();
      if (connectionResult.success) {
        setConnection(connectionResult.connection);
        applySettingsFromDb(connectionResult.settings as Record<string, unknown>);
      }

      toast.success("Stripe payment settings saved.");
    } catch (err: any) {
      toast.error("Failed to save settings: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const simulateTestTransaction = async () => {
    try {
      const result = await simulateAdminTestPayment();
      if (result.success === false) throw new Error(result.error);
      await fetchRealPayments();
      toast.success("Stripe sandbox simulation logged to database.");
    } catch (e: any) {
      toast.error("Simulation warning: " + e.message);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto p-4 sm:p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-100 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1C29] tracking-tight">Stripe Payments</h1>
          <p className="text-zinc-500 text-sm mt-1">
            Edit and save Stripe API keys below. Checkout uses Vercel env vars when set; otherwise saved database keys.
          </p>
        </div>
        <Badge
          className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border-none shadow-sm ${
            stripeEnvironment === "sandbox"
              ? "bg-amber-500 text-zinc-900"
              : "bg-emerald-600 text-white"
          }`}
        >
          {stripeEnvironment === "sandbox" ? "Sandbox Mode" : "Live Production"}
        </Badge>
      </div>

      <div className="flex border-b border-zinc-200">
        <button
          onClick={() => setActiveTab("keys")}
          className={`pb-4 px-6 font-bold text-sm border-b-2 transition-all ${
            activeTab === "keys"
              ? "border-brand text-brand"
              : "border-transparent text-zinc-500 hover:text-zinc-600"
          }`}
        >
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4" /> Configuration
          </div>
        </button>

        <button
          onClick={() => setActiveTab("transactions")}
          className={`pb-4 px-6 font-bold text-sm border-b-2 transition-all ${
            activeTab === "transactions"
              ? "border-brand text-brand"
              : "border-transparent text-zinc-500 hover:text-zinc-600"
          }`}
        >
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4" /> Payments Ledger ({realPayments.length})
          </div>
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border border-zinc-100">
          <Loader2 className="w-8 h-8 animate-spin text-brand mb-4" />
          <p className="text-zinc-500 font-bold text-sm">Loading Stripe payment settings…</p>
        </div>
      ) : activeTab === "keys" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-xs space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 text-[#1A1C29] font-extrabold text-sm uppercase tracking-wider">
                  <div className="w-7 h-7 rounded-lg bg-zinc-50 border flex items-center justify-center font-black text-xs text-indigo-600">
                    S
                  </div>
                  <span>Stripe API Keys</span>
                </div>
                <Badge className="bg-emerald-50 text-emerald-700 border-none text-[9px] font-black uppercase tracking-wider">
                  Editable
                </Badge>
              </div>

              <p className="text-xs text-zinc-500 font-medium">
                Type your keys here and click <strong>Save Settings</strong>. Fields are always editable — update anytime.
              </p>

              {envOverridesActiveMode && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
                  <span className="font-bold">Vercel env vars are active</span> for {stripeEnvironment} mode and override saved keys at checkout. Remove env vars in Vercel to use the values you save here.
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <KeyField
                  label="Publishable Key (Sandbox)"
                  value={stripePublishableKeySandbox}
                  onChange={setStripePublishableKeySandbox}
                  placeholder="pk_test_..."
                />
                <KeyField
                  label="Publishable Key (Live)"
                  value={stripePublishableKeyLive}
                  onChange={setStripePublishableKeyLive}
                  placeholder="pk_live_..."
                />
                <KeyField
                  label="Secret Key (Sandbox)"
                  value={stripeSecretKeySandbox}
                  onChange={setStripeSecretKeySandbox}
                  placeholder="sk_test_..."
                  secret
                  showSecret={showStripeSecret}
                  onToggleSecret={() => setShowStripeSecret(!showStripeSecret)}
                />
                <KeyField
                  label="Secret Key (Live)"
                  value={stripeSecretKeyLive}
                  onChange={setStripeSecretKeyLive}
                  placeholder="sk_live_..."
                  secret
                  showSecret={showStripeSecret}
                />
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-xs space-y-4">
              <div className="flex items-center gap-3 text-[#1A1C29] font-extrabold text-sm uppercase tracking-wider">
                <Settings className="w-5 h-5 text-brand" />
                <span>Stripe Environment</span>
              </div>
              <p className="text-xs text-zinc-500 font-medium">
                Choose sandbox or live mode. Keys can be saved here or set via Vercel environment variables (env takes priority).
              </p>

              <div className="grid grid-cols-2 gap-3 p-1 bg-zinc-50 rounded-2xl border border-zinc-100">
                <button
                  type="button"
                  onClick={() => setStripeEnvironment("sandbox")}
                  className={`py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                    stripeEnvironment === "sandbox"
                      ? "bg-white text-zinc-900 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-600"
                  }`}
                >
                  Sandbox Mode
                </button>
                <button
                  type="button"
                  onClick={() => setStripeEnvironment("live")}
                  className={`py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                    stripeEnvironment === "live"
                      ? "bg-white text-zinc-900 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-600"
                  }`}
                >
                  Live Production
                </button>
              </div>

              {stripeEnvironment === "sandbox" ? (
                <div className="bg-amber-50/50 border border-amber-100/50 rounded-2xl p-4 flex gap-3 text-amber-800 text-xs font-medium">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                  <div>
                    <span className="font-bold">Test mode.</span> Use Stripe test cards only. Set sandbox keys in Vercel / local <code className="text-[10px] bg-amber-100/80 px-1 rounded">.env</code>.
                  </div>
                </div>
              ) : (
                <div className="bg-rose-50/50 border border-rose-100/50 rounded-2xl p-4 flex gap-3 text-rose-800 text-xs font-medium">
                  <Lock className="w-5 h-5 text-rose-600 shrink-0" />
                  <div>
                    <span className="font-bold">Live mode.</span> Real charges will be processed. Ensure live keys are configured before saving.
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-xs space-y-4">
              <div className="flex items-center gap-3 text-[#1A1C29] font-extrabold text-sm uppercase tracking-wider">
                <CreditCard className="w-5 h-5 text-brand" />
                <span>Checkout Gateway</span>
              </div>

              <label
                className={`flex items-start gap-4 p-4 rounded-2xl border-2 cursor-pointer select-none transition-all ${
                  stripeEnabled
                    ? "border-brand/20 bg-rose-50/10"
                    : "border-zinc-100 bg-white hover:border-zinc-200"
                }`}
              >
                <input
                  type="checkbox"
                  checked={stripeEnabled}
                  onChange={(e) => setStripeEnabled(e.target.checked)}
                  className="w-5 h-5 rounded border-zinc-300 text-zinc-950 focus:ring-zinc-950 mt-1 cursor-pointer"
                />
                <div>
                  <div className="text-xs font-black text-zinc-800 uppercase tracking-wider">
                    Enable Stripe Checkout
                  </div>
                  <p className="text-[10px] text-zinc-500 font-bold mt-1">
                    Embedded Stripe checkout for booking deposits and subscription upgrades.
                  </p>
                </div>
              </label>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-xs space-y-4">
              <div className="flex items-center gap-3 text-[#1A1C29] font-extrabold text-sm uppercase tracking-wider">
                <div className="w-7 h-7 rounded-lg bg-zinc-50 border flex items-center justify-center font-black text-xs text-indigo-600">
                  S
                </div>
                <span>Connection Status</span>
              </div>
              <p className="text-xs text-zinc-500">Read-only preview of which keys checkout will use (env first, then saved keys).</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <StatusRow
                  label="Sandbox publishable key"
                  configured={connection?.sandbox.publishableConfigured}
                  preview={connection?.sandbox.publishablePreview}
                />
                <StatusRow
                  label="Sandbox secret key"
                  configured={connection?.sandbox.secretConfigured}
                  preview={connection?.sandbox.secretPreview}
                />
                <StatusRow
                  label="Live publishable key"
                  configured={connection?.live.publishableConfigured}
                  preview={connection?.live.publishablePreview}
                />
                <StatusRow
                  label="Live secret key"
                  configured={connection?.live.secretConfigured}
                  preview={connection?.live.secretPreview}
                />
              </div>

              <div className="rounded-2xl bg-zinc-50 border border-zinc-100 p-4 space-y-2">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                  Required environment variables
                </p>
                <ul className="text-xs text-zinc-600 font-mono space-y-1">
                  {STRIPE_ENV_DOCS.map((name) => (
                    <li key={name}>{name}</li>
                  ))}
                </ul>
                <p className="text-[10px] text-zinc-500 pt-1">
                  Optional Vercel env vars override saved keys when set.
                </p>
              </div>

              {!keysReady && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
                  Active mode ({stripeEnvironment}) is missing keys. Save sandbox publishable + secret keys above, or add them to Vercel env.
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3">
              <Button
                type="button"
                disabled={saving}
                onClick={handleSaveSettings}
                className="bg-zinc-900 text-white font-bold h-12 rounded-2xl px-8 hover:bg-zinc-800 shadow-md flex items-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Settings
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white text-zinc-900 p-6 rounded-3xl relative overflow-hidden shadow-xl border border-zinc-100">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-extrabold text-sm uppercase tracking-widest text-zinc-500">
                    Checkout Simulator
                  </h3>
                  <p className="text-lg font-black mt-1">Stripe test row</p>
                </div>
                <Badge className="bg-slate-100 text-zinc-900 border-none font-bold uppercase tracking-wider text-[8px]">
                  Developer Kit
                </Badge>
              </div>

              <p className="text-xs text-zinc-500 leading-relaxed mb-6">
                Insert a sample Stripe payment row to verify the payments ledger and admin reporting.
              </p>

              <Button
                type="button"
                onClick={simulateTestTransaction}
                className="w-full bg-brand hover:bg-brand-hover text-zinc-900 font-bold h-11 rounded-xl shadow-lg shadow-brand/20 flex items-center justify-center gap-2 text-xs"
              >
                <Play className="w-4 h-4 fill-white" />
                Trigger Test Payment
              </Button>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-xs space-y-3">
              <div className="flex items-center gap-3 text-[#1A1C29] font-extrabold text-xs uppercase tracking-wider border-b border-zinc-50 pb-3">
                <Zap className="w-4 h-4 text-emerald-500" />
                <span>Active Mode Health</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-600">Stripe enabled</span>
                <span className={stripeEnabled ? "text-emerald-600 font-bold" : "text-amber-600 font-bold"}>
                  {stripeEnabled ? "Yes" : "No"}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-600">Keys for {stripeEnvironment}</span>
                <span className={keysReady ? "text-emerald-600 font-bold" : "text-amber-600 font-bold"}>
                  {keysReady ? "Ready" : "Missing"}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden animate-in fade-in duration-300">
          <div className="p-6 border-b border-zinc-100 flex justify-between items-center">
            <div>
              <h3 className="font-extrabold text-[#1A1C29] text-base">Recorded Transactions</h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Stripe checkout payments logged in the database.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchRealPayments}
              disabled={loadingRealPayments}
              className="h-9 rounded-xl font-bold"
            >
              {loadingRealPayments ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Reload Payments
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50/50 text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-100">
                  <th className="px-8 py-5">Clearing ID</th>
                  <th className="px-8 py-5">Partner Establishment</th>
                  <th className="px-8 py-5">Gateway</th>
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
                      <p className="text-zinc-500 text-xs font-semibold">Accessing live ledger…</p>
                    </td>
                  </tr>
                ) : realPayments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-20 text-center text-zinc-500">
                      <Database className="w-12 h-12 mx-auto mb-4 opacity-20" />
                      <p className="font-medium text-sm">No Stripe payment rows recorded yet.</p>
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
                        <Badge className="text-[9px] font-black uppercase tracking-widest border-none bg-indigo-50 text-indigo-600">
                          Stripe
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
                      <td className="px-8 py-5 text-right text-xs text-zinc-500 font-semibold">
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

function KeyField({
  label,
  value,
  onChange,
  placeholder,
  secret,
  showSecret,
  onToggleSecret,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  secret?: boolean;
  showSecret?: boolean;
  onToggleSecret?: () => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{label}</label>
        {secret && onToggleSecret && (
          <button
            type="button"
            onClick={onToggleSecret}
            className="text-[10px] text-zinc-500 font-extrabold hover:text-zinc-600 flex items-center gap-1 uppercase"
          >
            {showSecret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            {showSecret ? "Hide" : "Show"}
          </button>
        )}
      </div>
      <input
        type={secret && !showSecret ? "password" : "text"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
        readOnly={false}
        disabled={false}
        className="flex h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
      />
    </div>
  );
}

function StatusRow({
  label,
  configured,
  preview,
}: {
  label: string;
  configured?: boolean;
  preview?: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-100 bg-zinc-50/60 p-4 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{label}</p>
        {configured ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
        ) : (
          <XCircle className="w-4 h-4 text-amber-500 shrink-0" />
        )}
      </div>
      <p className="text-xs font-mono text-zinc-700 break-all">{preview || "Not configured"}</p>
    </div>
  );
}
