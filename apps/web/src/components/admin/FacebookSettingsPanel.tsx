"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Eye, EyeOff, Facebook, RefreshCw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  getFacebookPlatformConfig,
  saveFacebookPlatformSettings,
  validateFacebookPlatformCredentials,
  validateStoredFacebookPlatformCredentials,
} from "@/app/actions/facebook-settings";

export function FacebookSettingsPanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [appId, setAppId] = useState("");
  const [appSecret, setAppSecret] = useState("");
  const [redirectUri, setRedirectUri] = useState("");
  const [secretConfigured, setSecretConfigured] = useState(false);
  const [source, setSource] = useState<"database" | "env" | "none">("none");
  const [showSecret, setShowSecret] = useState(false);
  const [validation, setValidation] = useState<{
    valid: boolean;
    error?: string;
    appName?: string;
  } | null>(null);

  useEffect(() => {
    void Promise.resolve().then(async () => {
      try {
        const config = await getFacebookPlatformConfig();
        setAppId(config.appId);
        setRedirectUri(config.redirectUri);
        setSecretConfigured(config.secretConfigured);
        setSource(config.source);

        if (config.appId && config.secretConfigured) {
          const result = await validateStoredFacebookPlatformCredentials();
          setValidation(
            result.valid === true
              ? { valid: true, appName: result.appName }
              : { valid: false, error: result.error }
          );
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load Facebook settings.");
      } finally {
        setLoading(false);
      }
    });
  }, []);

  const handleValidate = async () => {
    if (!appId.trim()) {
      toast.error("Enter FACEBOOK_APP_ID first.");
      return;
    }
    if (!appSecret.trim() && !secretConfigured) {
      toast.error("Enter FACEBOOK_APP_SECRET to validate.");
      return;
    }

    if (!appSecret.trim() && secretConfigured) {
      const result = await validateStoredFacebookPlatformCredentials();
      setValidation(
        result.valid === true
          ? { valid: true, appName: result.appName }
          : { valid: false, error: result.error }
      );
      if (result.valid === true) {
        toast.success(
          result.appName
            ? `Stored credentials valid — ${result.appName}`
            : "Stored Facebook credentials are valid."
        );
      } else {
        toast.error(result.error);
      }
      return;
    }

    const result = await validateFacebookPlatformCredentials(appId, appSecret);
    setValidation(
      result.valid === true
        ? { valid: true, appName: result.appName }
        : { valid: false, error: result.error }
    );

    if (result.valid === true) {
      toast.success(result.appName ? `Connected to Meta app: ${result.appName}` : "Facebook credentials look valid.");
    } else {
      toast.error(result.error);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const result = await saveFacebookPlatformSettings({
        appId,
        appSecret,
        redirectUri,
      });

      if (result.success === false) {
        throw new Error(result.error);
      }

      setSecretConfigured(true);
      setAppSecret("");
      setSource("database");
      setValidation(result.appName ? { valid: true, appName: result.appName } : { valid: true });

      if (result.envFileSynced) {
        toast.success(
          `Facebook credentials saved. Local .env updated (${result.envFilePaths.length} file${result.envFilePaths.length === 1 ? "" : "s"}).`
        );
      } else {
        toast.success("Facebook credentials saved to Supabase. Salon owners can connect on /dashboard/social.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save Facebook settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-md flex items-center justify-center min-h-[180px]">
        <RefreshCw className="w-5 h-5 animate-spin text-[#1877F2]" />
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSave}
      className="bg-white rounded-2xl p-6 text-zinc-900 space-y-5 shadow-md border border-slate-200"
    >
      <div className="space-y-2">
        <h3 className="font-extrabold text-base flex items-center gap-2">
          <Facebook className="w-5 h-5 text-[#1877F2]" />
          Meta Facebook App
        </h3>
        <p className="text-xs text-zinc-500 leading-relaxed">
          Platform credentials for salon Facebook Page OAuth on{" "}
          <code className="text-[10px] bg-slate-100 px-1 rounded">/dashboard/social</code>. Saved to
          Supabase and synced to local <code className="text-[10px] bg-slate-100 px-1 rounded">.env</code> when
          writable.
        </p>
      </div>

      {source === "env" && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
            Loaded from Vercel / <code>.env</code>. Save here to store in the database — no redeploy needed on
            beta/live.
          </p>
        </div>
      )}

      {validation?.valid && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-start gap-2.5">
          <AlertTriangle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <p className="text-[11px] text-emerald-800 font-medium leading-relaxed">
            <strong>Meta app verified.</strong>
            {validation.appName ? ` App name: ${validation.appName}.` : null} Add the redirect URI below to Meta →
            Facebook Login → Valid OAuth Redirect URIs.
          </p>
        </div>
      )}

      {validation && !validation.valid && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2.5">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <p className="text-[11px] text-red-700 font-medium leading-relaxed">
            <strong>Meta rejected the credentials.</strong> {validation.error}
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="facebook_app_id" className="text-[10px] font-black uppercase tracking-wider text-zinc-500">
          FACEBOOK_APP_ID
        </Label>
        <Input
          id="facebook_app_id"
          value={appId}
          onChange={(e) => setAppId(e.target.value)}
          required
          placeholder="1305165038384769"
          className="h-10 border-slate-200 rounded-xl text-xs font-mono"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="facebook_app_secret" className="text-[10px] font-black uppercase tracking-wider text-zinc-500">
          FACEBOOK_APP_SECRET
        </Label>
        <div className="relative">
          <Input
            id="facebook_app_secret"
            type={showSecret ? "text" : "password"}
            value={appSecret}
            onChange={(e) => setAppSecret(e.target.value)}
            required={!secretConfigured}
            placeholder={secretConfigured ? "Leave blank to keep current secret" : "Paste App Secret from Meta"}
            className="h-10 border-slate-200 rounded-xl text-xs font-mono pr-10"
          />
          <button
            type="button"
            onClick={() => setShowSecret((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
          >
            {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="facebook_redirect_uri"
          className="text-[10px] font-black uppercase tracking-wider text-zinc-500"
        >
          FACEBOOK_REDIRECT_URI
        </Label>
        <Input
          id="facebook_redirect_uri"
          value={redirectUri}
          onChange={(e) => setRedirectUri(e.target.value)}
          required
          placeholder="https://beta.trimma.io/facebook/callback/auth"
          className="h-10 border-slate-200 rounded-xl text-xs font-mono"
        />
        <p className="text-[9px] text-zinc-500 leading-relaxed">
          Must match Meta Developer Console exactly. Beta:{" "}
          <code className="bg-slate-100 px-1 rounded">https://beta.trimma.io/facebook/callback/auth</code>
        </p>
      </div>

      <div className="flex flex-col gap-2 pt-1">
        <Button
          type="button"
          variant="outline"
          onClick={() => void handleValidate()}
          className="w-full rounded-xl font-bold text-xs h-10 border-slate-200"
        >
          Validate with Meta
        </Button>
        <Button
          type="submit"
          disabled={saving}
          className="w-full bg-[#1877F2] hover:bg-[#166FE5] text-white rounded-xl font-bold text-xs h-10 flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" /> Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" /> Save Facebook Credentials
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
