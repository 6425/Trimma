"use client";

import { useEffect, useState } from "react";
import { Mail, PlayCircle, RefreshCw, Save, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  getEmailConfig,
  saveEmailSettings,
  testEmailConnection,
  type EmailConfig,
} from "@/app/actions/email-settings";
import { isEmailSendFailure } from "@/lib/email/result";
import { EMAIL_TRIGGER_CATALOG } from "@/lib/email-templates";

export function EmailSettingsPanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [config, setConfig] = useState<EmailConfig | null>(null);
  const [testEmail, setTestEmail] = useState("");

  useEffect(() => {
    void Promise.resolve().then(async () => {
      const loaded = await getEmailConfig();
      setConfig(loaded);
      setLoading(false);
    });
  }, []);

  const updateConfig = (patch: Partial<EmailConfig>) => {
    setConfig((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;
    setSaving(true);
    try {
      const res = await saveEmailSettings(config);
      if (!res.success) throw new Error(res.error);
      toast.success("Email templates saved successfully.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save email settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleTestSend = async () => {
    if (!testEmail.trim()) {
      toast.error("Enter a recipient email for the test.");
      return;
    }
    setTesting(true);
    try {
      const res = await testEmailConnection(testEmail.trim());
      if (isEmailSendFailure(res)) throw new Error(res.error);
      toast.success("Test email sent via Resend.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Test email failed.");
    } finally {
      setTesting(false);
    }
  };

  if (loading || !config) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-3">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand" />
        <p className="text-sm text-zinc-500 font-bold">Loading email templates...</p>
      </div>
    );
  }

  const configRecord = config as Record<string, string | boolean>;
  const shownToggleKeys = new Set<string>();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-8 border-t border-slate-200">
      <div className="lg:col-span-2">
        <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm">
          <div className="border-b border-slate-100 pb-4 flex items-center justify-between gap-4">
            <div>
              <h3 className="font-extrabold text-zinc-900 text-base flex items-center gap-2">
                <Mail className="w-5 h-5 text-brand" />
                Resend Email Templates
              </h3>
              <p className="text-[10px] text-zinc-500 mt-1">
                From: {config.fromEmail} · English subject + trilingual body (EN / SI / TA)
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={(e) => updateConfig({ enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-zinc-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand" />
              <span className="ml-2 text-xs font-bold text-zinc-700 uppercase tracking-wider">Enable Email</span>
            </label>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-black uppercase tracking-wider text-zinc-500">
              Platform Admin Alert Email
            </Label>
            <Input
              value={config.adminAlertEmail}
              onChange={(e) => updateConfig({ adminAlertEmail: e.target.value })}
              placeholder="admin@trimma.io"
              className="h-11 border-slate-200 rounded-xl"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-4">
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-zinc-800">
                Email Trigger Events & Templates
              </h4>
              <p className="text-[10px] text-zinc-500 mt-0.5">
                14 triggers · Each email includes English (default), Sinhala, and Tamil sections when filled in.
              </p>
            </div>

            <div className="space-y-6">
              {EMAIL_TRIGGER_CATALOG.map((trigger) => {
                const isEnabled = configRecord[trigger.toggleKey] !== false;
                const showToggle =
                  !("sharesToggleWith" in trigger && trigger.sharesToggleWith) ||
                  !shownToggleKeys.has(trigger.toggleKey);
                if (showToggle) shownToggleKeys.add(trigger.toggleKey);

                return (
                  <div key={trigger.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-xs font-extrabold text-zinc-800">
                          {trigger.order}. {trigger.title}
                        </div>
                        <div className="text-[10px] font-semibold text-brand mt-0.5">To: {trigger.recipient}</div>
                        <div className="text-[10px] text-zinc-500 mt-0.5">{trigger.whenFired}</div>
                      </div>
                      {showToggle ? (
                        <label className="relative inline-flex items-center cursor-pointer shrink-0">
                          <input
                            type="checkbox"
                            checked={isEnabled}
                            onChange={(e) =>
                              updateConfig({ [trigger.toggleKey]: e.target.checked } as Partial<EmailConfig>)
                            }
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-zinc-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand" />
                        </label>
                      ) : null}
                    </div>

                    {isEnabled && (
                      <div className="space-y-3 pt-2 border-t border-slate-200/50">
                        <div className="space-y-1.5">
                          <Label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
                            Subject line (English)
                          </Label>
                          <Input
                            value={String(configRecord[trigger.subjectKey] || "")}
                            onChange={(e) =>
                              updateConfig({ [trigger.subjectKey]: e.target.value } as Partial<EmailConfig>)
                            }
                            className="h-10 bg-white border-slate-200 rounded-xl text-xs"
                          />
                        </div>

                        {(
                          [
                            { key: trigger.bodyKey, label: "English body" },
                            { key: trigger.bodyKeySi, label: "Sinhala body (සිංහල)" },
                            { key: trigger.bodyKeyTa, label: "Tamil body (தமிழ்)" },
                          ] as const
                        ).map(({ key, label }) => (
                          <div key={key} className="space-y-1.5">
                            <Label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
                              {label}
                            </Label>
                            <textarea
                              value={String(configRecord[key] || "")}
                              onChange={(e) => updateConfig({ [key]: e.target.value } as Partial<EmailConfig>)}
                              rows={label.startsWith("English") ? 7 : 5}
                              className="w-full p-3 bg-white text-zinc-900 border border-slate-200 rounded-xl text-xs font-mono focus:border-zinc-950 focus:outline-none leading-relaxed"
                            />
                          </div>
                        ))}

                        <div className="text-[9px] text-zinc-500 leading-relaxed">
                          Merge tags:{" "}
                          {trigger.mergeTags.map((tag) => (
                            <code key={tag} className="mr-1">
                              {tag}
                            </code>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <Button type="submit" disabled={saving} className="rounded-xl font-bold h-11 px-5">
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" /> Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" /> Save Email Templates
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      <div>
        <div className="bg-white rounded-2xl p-6 border border-slate-200 space-y-5 shadow-sm sticky top-6">
          <div>
            <h3 className="font-extrabold text-base flex items-center gap-2">
              <PlayCircle className="w-5 h-5 text-brand" />
              Test Email
            </h3>
            <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
              Sends the Welcome email template (trilingual) through Resend.
            </p>
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-wider text-zinc-500">
              Recipient email
            </Label>
            <Input
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="you@example.com"
              className="h-10 rounded-xl text-xs"
            />
          </div>
          <Button
            type="button"
            onClick={handleTestSend}
            disabled={testing || !config.enabled}
            className="w-full bg-brand hover:bg-brand-hover text-zinc-900 rounded-xl font-bold text-xs h-10"
          >
            {testing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin mr-2" /> Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" /> Send Test Email
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
