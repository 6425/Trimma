"use client";

import { useState, useEffect, Suspense } from "react";
import { MessageSquare, PlayCircle, Settings2, Eye, EyeOff, Save, RefreshCw, Send, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  getWhatsAppConfig, saveWhatsAppSettings, testWhatsAppConnection, validateWhatsAppCredentials
} from "../../actions/whatsapp";
import { WHATSAPP_TRIGGER_CATALOG } from "@/lib/whatsapp-templates";
import { EmailSettingsPanel } from "../../../components/admin/EmailSettingsPanel";
import { TelegramSettingsPanel } from "../../../components/admin/TelegramSettingsPanel";
import { LkPhoneInput } from "@/components/ui/LkPhoneInput";

function SettingsPanelContent() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  // WhatsApp form state
  const [accountId, setAccountId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [reservationPaidEnabled, setReservationPaidEnabled] = useState(true);
  const [bookingConfirmedEnabled, setBookingConfirmedEnabled] = useState(true);
  const [bookingRescheduledEnabled, setBookingRescheduledEnabled] = useState(true);
  const [bookingCancelledEnabled, setBookingCancelledEnabled] = useState(true);
  const [bookingReviewEnabled, setBookingReviewEnabled] = useState(true);
  const [onboardingInviteEnabled, setOnboardingInviteEnabled] = useState(true);
  const [bookingCreatedEnabled, setBookingCreatedEnabled] = useState(true);
  const [agentApprovalEnabled, setAgentApprovalEnabled] = useState(true);
  const [adminApprovalEnabled, setAdminApprovalEnabled] = useState(true);
  const [welcomeCustomerEnabled, setWelcomeCustomerEnabled] = useState(true);
  const [agentLeadAssignedEnabled, setAgentLeadAssignedEnabled] = useState(true);
  const [adminAlertPhone, setAdminAlertPhone] = useState("");
  const [configSource, setConfigSource] = useState("database");
  const [tokenFromEnv, setTokenFromEnv] = useState(false);

  // Dynamic template states
  const [templateReservationPaid, setTemplateReservationPaid] = useState("");
  const [templateConfirmed, setTemplateConfirmed] = useState("");
  const [templateRescheduled, setTemplateRescheduled] = useState("");
  const [templateCancelled, setTemplateCancelled] = useState("");
  const [templateReview, setTemplateReview] = useState("");
  const [templateOnboardingInvite, setTemplateOnboardingInvite] = useState("");
  const [templateBookingCreatedCustomer, setTemplateBookingCreatedCustomer] = useState("");
  const [templateBookingCreatedOwner, setTemplateBookingCreatedOwner] = useState("");
  const [templateAgentApprovalOwner, setTemplateAgentApprovalOwner] = useState("");
  const [templateAgentApprovalAdmin, setTemplateAgentApprovalAdmin] = useState("");
  const [templateAdminApprovalOwner, setTemplateAdminApprovalOwner] = useState("");
  const [templateAdminApprovalAdmin, setTemplateAdminApprovalAdmin] = useState("");
  const [templateWelcomeCustomer, setTemplateWelcomeCustomer] = useState("");
  const [templateAgentLeadAssigned, setTemplateAgentLeadAssigned] = useState("");
  const [metaTemplateReservationPaid, setMetaTemplateReservationPaid] = useState("");
  const [metaTemplateConfirmed, setMetaTemplateConfirmed] = useState("");
  const [metaTemplateLanguage, setMetaTemplateLanguage] = useState("en_US");

  // Show/Hide Access Token
  const [showToken, setShowToken] = useState(false);

  // Test message state
  const [testPhone, setTestPhone] = useState("+94 71 113 0179");
  const [tokenStatus, setTokenStatus] = useState<{
    valid: boolean;
    error?: string;
    phoneNumberId?: string;
    displayPhoneNumber?: string;
  } | null>(null);

  useEffect(() => {
    void Promise.resolve().then(() => {
      async function loadConfig() {
      const config = await getWhatsAppConfig();
      setAccountId(config.phoneId);
      setAccessToken(config.tokenFromEnv ? "" : config.accessToken);
      setTokenFromEnv(Boolean(config.tokenFromEnv));
      setEnabled(config.enabled);
      setReservationPaidEnabled(config.reservationPaidEnabled !== false);
      setBookingConfirmedEnabled(config.bookingConfirmedEnabled !== false);
      setBookingRescheduledEnabled(config.bookingRescheduledEnabled !== false);
      setBookingCancelledEnabled(config.bookingCancelledEnabled !== false);
      setBookingReviewEnabled(config.bookingReviewEnabled !== false);
      setOnboardingInviteEnabled(config.onboardingInviteEnabled !== false);
      setBookingCreatedEnabled(config.bookingCreatedEnabled !== false);
      setAgentApprovalEnabled(config.agentApprovalEnabled !== false);
      setAdminApprovalEnabled(config.adminApprovalEnabled !== false);
      setWelcomeCustomerEnabled(config.welcomeCustomerEnabled !== false);
      setAgentLeadAssignedEnabled(config.agentLeadAssignedEnabled !== false);
      setAdminAlertPhone(config.adminAlertPhone || "");
      setTemplateReservationPaid(config.templateReservationPaid || "");
      setTemplateConfirmed(config.templateConfirmed || "");
      setTemplateRescheduled(config.templateRescheduled || "");
      setTemplateCancelled(config.templateCancelled || "");
      setTemplateReview(config.templateReview || "");
      setTemplateOnboardingInvite(config.templateOnboardingInvite || "");
      setTemplateBookingCreatedCustomer(config.templateBookingCreatedCustomer || "");
      setTemplateBookingCreatedOwner(config.templateBookingCreatedOwner || "");
      setTemplateAgentApprovalOwner(config.templateAgentApprovalOwner || "");
      setTemplateAgentApprovalAdmin(config.templateAgentApprovalAdmin || "");
      setTemplateAdminApprovalOwner(config.templateAdminApprovalOwner || "");
      setTemplateAdminApprovalAdmin(config.templateAdminApprovalAdmin || "");
      setTemplateWelcomeCustomer(config.templateWelcomeCustomer || "");
      setTemplateAgentLeadAssigned(config.templateAgentLeadAssigned || "");
      setMetaTemplateReservationPaid(config.metaTemplateReservationPaid || "");
      setMetaTemplateConfirmed(config.metaTemplateConfirmed || "");
      setMetaTemplateLanguage(config.metaTemplateLanguage || "en_US");
      setConfigSource(config.credentialsSource || config.source);

      const validation = await validateWhatsAppCredentials();
      setTokenStatus(
        validation.valid
          ? {
              valid: true,
              phoneNumberId: validation.phoneNumberId,
              displayPhoneNumber: validation.displayPhoneNumber,
            }
          : { valid: false, error: validation.error }
      );

      setLoading(false);
      }
      loadConfig();
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await saveWhatsAppSettings(
        accountId, 
        accessToken, 
        enabled,
        reservationPaidEnabled,
        bookingConfirmedEnabled,
        bookingRescheduledEnabled,
        bookingCancelledEnabled,
        bookingReviewEnabled,
        onboardingInviteEnabled,
        templateReservationPaid,
        templateConfirmed,
        templateRescheduled,
        templateCancelled,
        templateReview,
        templateOnboardingInvite,
        bookingCreatedEnabled,
        agentApprovalEnabled,
        adminApprovalEnabled,
        adminAlertPhone,
        templateBookingCreatedCustomer,
        templateBookingCreatedOwner,
        templateAgentApprovalOwner,
        templateAgentApprovalAdmin,
        templateAdminApprovalOwner,
        templateAdminApprovalAdmin,
        welcomeCustomerEnabled,
        agentLeadAssignedEnabled,
        templateWelcomeCustomer,
        templateAgentLeadAssigned,
        metaTemplateReservationPaid,
        metaTemplateConfirmed,
        metaTemplateLanguage
      );
      if (res.success) {
        toast.success("WhatsApp configuration updated successfully!", {
          position: "top-center"
        });
        setConfigSource("database");
      } else {
        throw new Error(res.error);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update configuration", {
        position: "top-center"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestSend = async () => {
    if (!testPhone) {
      toast.error("Please enter a verified recipient phone number.", {
        position: "top-center"
      });
      return;
    }
    setTesting(true);

    try {
      const res = await testWhatsAppConnection(testPhone);
      if (res.success) {
        toast.success("Live Test message dispatched to your WhatsApp! 📱", {
          position: "top-center"
        });
      } else {
        throw new Error(res.error);
      }
    } catch (err: any) {
      toast.error(err.message || "WhatsApp dispatch failed. Verify Sandbox whitelisting.", {
        position: "top-center"
      });
    } finally {
      setTesting(false);
    }
  };

  const toggleValues: Record<string, boolean> = {
    reservationPaidEnabled,
    bookingConfirmedEnabled,
    bookingRescheduledEnabled,
    bookingCancelledEnabled,
    bookingReviewEnabled,
    onboardingInviteEnabled,
    bookingCreatedEnabled,
    agentApprovalEnabled,
    adminApprovalEnabled,
    welcomeCustomerEnabled,
    agentLeadAssignedEnabled,
  };

  const setToggleValue = (key: string, value: boolean) => {
    const setters: Record<string, (value: boolean) => void> = {
      reservationPaidEnabled: setReservationPaidEnabled,
      bookingConfirmedEnabled: setBookingConfirmedEnabled,
      bookingRescheduledEnabled: setBookingRescheduledEnabled,
      bookingCancelledEnabled: setBookingCancelledEnabled,
      bookingReviewEnabled: setBookingReviewEnabled,
      onboardingInviteEnabled: setOnboardingInviteEnabled,
      bookingCreatedEnabled: setBookingCreatedEnabled,
      agentApprovalEnabled: setAgentApprovalEnabled,
      adminApprovalEnabled: setAdminApprovalEnabled,
      welcomeCustomerEnabled: setWelcomeCustomerEnabled,
      agentLeadAssignedEnabled: setAgentLeadAssignedEnabled,
    };
    setters[key]?.(value);
  };

  const metaTemplateValues: Record<string, string> = {
    metaTemplateReservationPaid,
    metaTemplateConfirmed,
  };

  const setMetaTemplateValue = (key: string, value: string) => {
    const setters: Record<string, (value: string) => void> = {
      metaTemplateReservationPaid: setMetaTemplateReservationPaid,
      metaTemplateConfirmed: setMetaTemplateConfirmed,
    };
    setters[key]?.(value);
  };

  const templateValues: Record<string, string> = {
    templateReservationPaid,
    templateConfirmed,
    templateRescheduled,
    templateCancelled,
    templateReview,
    templateOnboardingInvite,
    templateBookingCreatedCustomer,
    templateBookingCreatedOwner,
    templateAgentApprovalOwner,
    templateAgentApprovalAdmin,
    templateAdminApprovalOwner,
    templateAdminApprovalAdmin,
    templateWelcomeCustomer,
    templateAgentLeadAssigned,
  };

  const setTemplateValue = (key: string, value: string) => {
    const setters: Record<string, (value: string) => void> = {
      templateReservationPaid: setTemplateReservationPaid,
      templateConfirmed: setTemplateConfirmed,
      templateRescheduled: setTemplateRescheduled,
      templateCancelled: setTemplateCancelled,
      templateReview: setTemplateReview,
      templateOnboardingInvite: setTemplateOnboardingInvite,
      templateBookingCreatedCustomer: setTemplateBookingCreatedCustomer,
      templateBookingCreatedOwner: setTemplateBookingCreatedOwner,
      templateAgentApprovalOwner: setTemplateAgentApprovalOwner,
      templateAgentApprovalAdmin: setTemplateAgentApprovalAdmin,
      templateAdminApprovalOwner: setTemplateAdminApprovalOwner,
      templateAdminApprovalAdmin: setTemplateAdminApprovalAdmin,
      templateWelcomeCustomer: setTemplateWelcomeCustomer,
      templateAgentLeadAssigned: setTemplateAgentLeadAssigned,
    };
    setters[key]?.(value);
  };

  const shownToggleKeys = new Set<string>();

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
      
      {/* HEADER CARD */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-zinc-900 tracking-tight flex items-center gap-2.5">
            <Settings2 className="w-8 h-8 text-emerald-600" />
            Global Settings
          </h1>
          <p className="text-sm text-zinc-500 mt-1">Configure WhatsApp, Telegram, email templates, and third-party integrations.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full ${
            enabled ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-zinc-100 text-zinc-500 border border-zinc-200'
          }`}>
            <span className={`w-2 h-2 rounded-full ${enabled ? 'bg-emerald-500' : 'bg-zinc-400'}`}></span>
            WhatsApp Notification Agent: {enabled ? 'ACTIVE' : 'OFF'}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
          <p className="text-sm text-zinc-500 font-bold">Loading dashboard settings...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* MAIN SETTINGS PANEL */}
          <div className="lg:col-span-2 space-y-6">
            
            <form onSubmit={handleSave} className="bg-white text-zinc-900 rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm">
              <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                <h3 className="font-extrabold text-zinc-900 text-base flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-zinc-500" />
                  Meta WhatsApp Cloud API
                </h3>
                
                {/* GLOBAL ALERTS TOGGLE */}
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={enabled} 
                    onChange={(e) => setEnabled(e.target.checked)} 
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  <span className="ml-2 text-xs font-bold text-zinc-700 uppercase tracking-wider">Enable WhatsApp</span>
                </label>
              </div>

              {configSource === "vercel" && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-emerald-800 font-medium leading-relaxed">
                    <strong>Using Vercel credentials.</strong> Production reads{" "}
                    <code>WHATSAPP_PHONE_NUMBER_ID</code> and <code>WHATSAPP_ACCESS_TOKEN</code> from Vercel first.
                    Stale Supabase tokens are ignored. Save here to sync templates and phone ID to the database.
                  </p>
                </div>
              )}

              {tokenStatus?.valid && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-emerald-800 font-medium leading-relaxed">
                    <strong>Connected.</strong>{" "}
                    {tokenStatus.displayPhoneNumber
                      ? `Linked WhatsApp number ${tokenStatus.displayPhoneNumber}`
                      : "WhatsApp phone number resolved"}{" "}
                    {tokenStatus.phoneNumberId ? `(Phone ID: ${tokenStatus.phoneNumberId})` : ""}
                  </p>
                </div>
              )}

              {tokenStatus && !tokenStatus.valid && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-red-700 font-medium leading-relaxed">
                    <strong>Meta rejected the credentials.</strong> {tokenStatus.error}
                  </p>
                </div>
              )}

              {/* INPUT FIELDS */}
              <div className="space-y-4">
                
                {/* WHATSAPP_PHONE_NUMBER_ID */}
                <div className="space-y-2">
                  <Label htmlFor="whatsapp_phone_number_id" className="text-xs font-black uppercase tracking-wider text-zinc-500">
                    WHATSAPP_PHONE_NUMBER_ID
                  </Label>
                  <Input 
                    id="whatsapp_phone_number_id"
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    required
                    placeholder="1130184513519892"
                    className="h-11 border-slate-200 focus:border-zinc-950 rounded-xl text-sm font-mono text-zinc-900"
                  />
                  <p className="text-[10px] text-zinc-500">
                    Meta numeric Phone Number ID — not your +94 business number. Same name as the Vercel env var. Production value: <strong>1130184513519892</strong> (Meta → WhatsApp → API Setup).
                  </p>
                </div>

                {/* ACCESS TOKEN */}
                <div className="space-y-2">
                  <Label htmlFor="token" className="text-xs font-black uppercase tracking-wider text-zinc-500">
                    Access Token
                  </Label>
                  <div className="relative flex items-center">
                    <Input 
                      id="token"
                      type={showToken ? "text" : "password"}
                      value={accessToken}
                      onChange={(e) => setAccessToken(e.target.value)}
                      required={!tokenFromEnv}
                      placeholder={tokenFromEnv ? "Using WHATSAPP_ACCESS_TOKEN from Vercel" : "Paste EAASjC... Access Token"}
                      className="h-11 border-slate-200 focus:border-zinc-950 pr-12 rounded-xl text-sm font-mono text-zinc-900"
                    />
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      className="absolute right-3 text-zinc-500 hover:text-zinc-700"
                    >
                      {showToken ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-zinc-500">
                    {tokenFromEnv
                      ? "Permanent token is loaded from Vercel WHATSAPP_ACCESS_TOKEN. Leave blank unless you want to override and save a different token to Supabase."
                      : "Paste your Meta access token here, or set WHATSAPP_ACCESS_TOKEN in Vercel for production."}
                  </p>
                </div>

                {/* ADMIN ALERT PHONE */}
                <div className="space-y-2">
                  <Label htmlFor="admin_alert_phone" className="text-xs font-black uppercase tracking-wider text-zinc-500">
                    Platform Admin Alert Phone
                  </Label>
                  <LkPhoneInput
                    id="admin_alert_phone"
                    theme="light"
                    value={adminAlertPhone}
                    onChange={setAdminAlertPhone}
                    className="h-11 rounded-xl"
                    inputClassName="h-11 text-sm"
                  />
                  <p className="text-[10px] text-zinc-500">
                    Receives internal WhatsApp alerts when agents approve salons or when you grant the Verified badge.
                  </p>
                </div>

                {/* AUTOMATED TRIGGERS CONTAINER */}
                <div className="pt-6 border-t border-slate-100 space-y-6">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-zinc-800">
                      Automated Notification Trigger Events & Templates
                    </h4>
                    <p className="text-[10px] text-zinc-500 mt-0.5">
                      All 14 message templates used by Trimma. For booking alerts (Template 1 &amp; 2), enter your Meta-approved template names — Trimma sends those via Meta Cloud API instead of free text.
                    </p>
                  </div>

                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-3">
                    <p className="text-[11px] text-amber-900 font-medium leading-relaxed">
                      <strong>Meta Business Manager templates.</strong> First booking messages to customers must use approved Meta templates (type: template). Copy the exact template name from Meta → WhatsApp → Message templates. Template text below is only used as fallback if the Meta name is left blank.
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="meta_template_language" className="text-[9px] font-black uppercase tracking-widest text-zinc-600">
                        Meta template language code
                      </Label>
                      <Input
                        id="meta_template_language"
                        value={metaTemplateLanguage}
                        onChange={(e) => setMetaTemplateLanguage(e.target.value)}
                        placeholder="en_US"
                        className="h-9 max-w-[120px] border-amber-200 rounded-lg text-xs font-mono"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    {WHATSAPP_TRIGGER_CATALOG.map((trigger) => {
                      const toggleKey = trigger.toggleKey;
                      const templateKey = trigger.templateKey;
                      const isEnabled = toggleValues[toggleKey] !== false;
                      const showToggle = !("sharesToggleWith" in trigger && trigger.sharesToggleWith) || !shownToggleKeys.has(toggleKey);
                      if (showToggle) shownToggleKeys.add(toggleKey);

                      return (
                        <div key={trigger.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <div className="text-xs font-extrabold text-zinc-800">
                                {trigger.order}. {trigger.title}
                              </div>
                              <div className="text-[10px] text-zinc-500 mt-0.5">{trigger.whenFired}</div>
                              {"sharesToggleWith" in trigger && trigger.sharesToggleWith && (
                                <div className="text-[9px] text-zinc-400 mt-1">
                                  Uses the same on/off switch as trigger #{WHATSAPP_TRIGGER_CATALOG.find((t) => t.id === trigger.sharesToggleWith)?.order}.
                                </div>
                              )}
                            </div>
                            {showToggle ? (
                              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                <input
                                  type="checkbox"
                                  checked={isEnabled}
                                  onChange={(e) => setToggleValue(toggleKey, e.target.checked)}
                                  className="sr-only peer"
                                />
                                <div className="w-9 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                              </label>
                            ) : null}
                          </div>

                          {isEnabled && (
                            <div className="space-y-2 pt-2 border-t border-slate-200/50">
                              {"metaTemplateKey" in trigger && trigger.metaTemplateKey && (
                                <div className="space-y-2 pb-2">
                                  <Label className="text-[9px] font-black uppercase tracking-widest text-emerald-700">
                                    Meta template name (Business Manager)
                                  </Label>
                                  <Input
                                    value={metaTemplateValues[trigger.metaTemplateKey] || ""}
                                    onChange={(e) => setMetaTemplateValue(trigger.metaTemplateKey, e.target.value)}
                                    placeholder="confirmmessage"
                                    className="h-9 border-emerald-200 rounded-lg text-xs font-mono"
                                  />
                                  <p className="text-[9px] text-zinc-500">
                                    Required for customer delivery outside the 24-hour window. Body variables map to merge tags in order ({`{{1}}`} = first tag, etc.).
                                  </p>
                                </div>
                              )}
                              <Label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Fallback template text</Label>
                              <textarea
                                value={templateValues[templateKey] || ""}
                                onChange={(e) => setTemplateValue(templateKey, e.target.value)}
                                rows={trigger.mergeTags.length > 5 ? 6 : 5}
                                className="w-full p-3 bg-white text-zinc-900 border border-slate-200 rounded-xl text-xs font-mono focus:border-zinc-950 focus:outline-none leading-relaxed"
                                placeholder="Enter template content..."
                              />
                              <div className="text-[9px] text-zinc-500 leading-relaxed">
                                💡 <strong>Merge Tags:</strong>{" "}
                                {trigger.mergeTags.map((tag) => (
                                  <code key={tag} className="mr-1">{tag}</code>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* ACTION */}
              <div className="flex justify-end pt-4 border-t border-slate-100">
                <Button 
                  type="submit"
                  disabled={saving}
                  className="bg-slate-50 hover:bg-zinc-800 hover:text-white text-zinc-900 rounded-xl font-bold h-11 px-5 flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" /> Save Integration Keys
                    </>
                  )}
                </Button>
              </div>

            </form>
            
          </div>

          {/* SANDBOX TEST UTILITY PANEL */}
          <div className="space-y-6">
            
            <div className="bg-white rounded-2xl p-6 text-zinc-900 space-y-6 shadow-md border border-slate-200">
              
              <div className="space-y-2">
                <h3 className="font-extrabold text-base flex items-center gap-2">
                  <PlayCircle className="w-5 h-5 text-emerald-500" />
                  Live Sandbox Tester
                </h3>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Fire a test alert directly through the Cloud API to verify connection status and recipient whitelisting.
                </p>
              </div>

              {/* TEST INPUTS */}
              <div className="space-y-4 pt-2">
                
                <div className="space-y-2">
                  <Label htmlFor="test_phone" className="text-[10px] font-black uppercase tracking-wider text-zinc-500">
                    Recipient Phone Number
                  </Label>
                  <LkPhoneInput
                    id="test_phone"
                    theme="light"
                    required
                    value={testPhone}
                    onChange={setTestPhone}
                    className="h-10 rounded-xl bg-slate-50"
                    inputClassName="h-10 text-xs"
                  />
                  <p className="text-[9px] text-zinc-500 leading-normal">
                    This phone number **must** be verified in your Meta Sandbox whitelist list!
                  </p>
                </div>

                <Button 
                  type="button"
                  onClick={handleTestSend}
                  disabled={testing || !enabled}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-zinc-900 rounded-xl font-bold text-xs h-10 flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                >
                  {testing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Dispatching...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" /> Send Test WhatsApp
                    </>
                  )}
                </Button>

              </div>

              {/* WHATEVER TIPS */}
              <div className="border-t border-zinc-800 pt-4 space-y-2">
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block">Sandbox Setup Guides</span>
                <p className="text-[10px] text-zinc-500 leading-relaxed">
                  Sandbox accounts only allow sending to verified test phones. In production, this system will automatically message any salon partner or client worldwide!
                </p>
              </div>

            </div>

          </div>

        </div>
      )}

      {!loading && (
        <div className="space-y-8 pt-4 border-t border-slate-200">
          <div>
            <h2 className="text-xl font-black text-zinc-900 mb-1">Telegram Channel</h2>
            <p className="text-sm text-zinc-500 mb-6">
              Secondary messaging channel — mirrors all WhatsApp notification triggers.
            </p>
            <TelegramSettingsPanel />
          </div>
          <EmailSettingsPanel />
        </div>
      )}

    </div>
  );
}

export default function AdminSettingsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-zinc-500">Loading Configuration Dashboard...</div>}>
      <SettingsPanelContent />
    </Suspense>
  );
}
