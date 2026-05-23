"use client";

import { useState, useEffect, Suspense } from "react";
import { MessageSquare, PlayCircle, Settings2, Eye, EyeOff, Save, RefreshCw, Send, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  getWhatsAppConfig, saveWhatsAppSettings, testWhatsAppConnection 
} from "../../actions/whatsapp";

function SettingsPanelContent() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  // WhatsApp form state
  const [phoneId, setPhoneId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [bookingConfirmedEnabled, setBookingConfirmedEnabled] = useState(true);
  const [bookingRescheduledEnabled, setBookingRescheduledEnabled] = useState(true);
  const [bookingCancelledEnabled, setBookingCancelledEnabled] = useState(true);
  const [bookingReviewEnabled, setBookingReviewEnabled] = useState(true);
  const [onboardingInviteEnabled, setOnboardingInviteEnabled] = useState(true);
  const [configSource, setConfigSource] = useState("database");

  // Dynamic template states
  const [templateConfirmed, setTemplateConfirmed] = useState("");
  const [templateRescheduled, setTemplateRescheduled] = useState("");
  const [templateCancelled, setTemplateCancelled] = useState("");
  const [templateReview, setTemplateReview] = useState("");
  const [templateOnboardingInvite, setTemplateOnboardingInvite] = useState("");

  // Show/Hide Access Token
  const [showToken, setShowToken] = useState(false);

  // Test message state
  const [testPhone, setTestPhone] = useState("+94 71 113 0179");

  useEffect(() => {
    async function loadConfig() {
      const config = await getWhatsAppConfig();
      setPhoneId(config.phoneId);
      setAccessToken(config.accessToken);
      setEnabled(config.enabled);
      setBookingConfirmedEnabled(config.bookingConfirmedEnabled !== false);
      setBookingRescheduledEnabled(config.bookingRescheduledEnabled !== false);
      setBookingCancelledEnabled(config.bookingCancelledEnabled !== false);
      setBookingReviewEnabled(config.bookingReviewEnabled !== false);
      setOnboardingInviteEnabled(config.onboardingInviteEnabled !== false);
      setTemplateConfirmed(config.templateConfirmed || "");
      setTemplateRescheduled(config.templateRescheduled || "");
      setTemplateCancelled(config.templateCancelled || "");
      setTemplateReview(config.templateReview || "");
      setTemplateOnboardingInvite(config.templateOnboardingInvite || "");
      setConfigSource(config.source);
      setLoading(false);
    }
    loadConfig();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await saveWhatsAppSettings(
        phoneId, 
        accessToken, 
        enabled,
        bookingConfirmedEnabled,
        bookingRescheduledEnabled,
        bookingCancelledEnabled,
        bookingReviewEnabled,
        onboardingInviteEnabled,
        templateConfirmed,
        templateRescheduled,
        templateCancelled,
        templateReview,
        templateOnboardingInvite
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

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
      
      {/* HEADER CARD */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-zinc-900 tracking-tight flex items-center gap-2.5">
            <Settings2 className="w-8 h-8 text-emerald-600" />
            Global Settings
          </h1>
          <p className="text-sm text-zinc-500 mt-1">Configure and manage third-party system integrations.</p>
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

              {configSource === "env" && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
                    <strong>Note:</strong> Loaded from static <code>.env</code> file configuration. Saving values in this dashboard will securely override it with hot-reloadable database values.
                  </p>
                </div>
              )}

              {/* INPUT FIELDS */}
              <div className="space-y-4">
                
                {/* PHONE NUMBER ID */}
                <div className="space-y-2">
                  <Label htmlFor="phone_id" className="text-xs font-black uppercase tracking-wider text-zinc-500">
                    Phone Number ID
                  </Label>
                  <Input 
                    id="phone_id"
                    value={phoneId}
                    onChange={(e) => setPhoneId(e.target.value)}
                    required
                    placeholder="Enter 15-digit Phone ID"
                    className="h-11 border-slate-200 focus:border-zinc-950 rounded-xl text-sm text-zinc-900"
                  />
                  <p className="text-[10px] text-zinc-500">
                    Your official Meta WhatsApp Developer Sandbox or Business Phone Number ID.
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
                      required
                      placeholder="Paste EAASjC... Access Token"
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
                    Ensure this matches your Meta dashboard access token (temporary Sandbox tokens last for 23 hours).
                  </p>
                </div>

                {/* AUTOMATED TRIGGERS CONTAINER */}
                <div className="pt-6 border-t border-slate-100 space-y-6">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-zinc-800">
                      Automated Notification Trigger Events & Templates
                    </h4>
                    <p className="text-[10px] text-zinc-500 mt-0.5">
                      Configure active dispatches and customize message copy using dynamic placeholders.
                    </p>
                  </div>
                  
                  <div className="space-y-6">
                    
                    {/* CONFIRMED */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs font-extrabold text-zinc-800">1. Booking Confirmed Receipt</div>
                          <div className="text-[10px] text-zinc-500">Send deposit receipt + salon location details on success.</div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={bookingConfirmedEnabled} 
                            onChange={(e) => setBookingConfirmedEnabled(e.target.checked)} 
                            className="sr-only peer" 
                          />
                          <div className="w-9 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                        </label>
                      </div>
                      
                      {bookingConfirmedEnabled && (
                        <div className="space-y-2 pt-2 border-t border-slate-200/50">
                          <Label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Template Text</Label>
                          <textarea
                            value={templateConfirmed}
                            onChange={(e) => setTemplateConfirmed(e.target.value)}
                            rows={6}
                            className="w-full p-3 bg-white text-zinc-900 border border-slate-200 rounded-xl text-xs font-mono focus:border-zinc-950 focus:outline-none leading-relaxed"
                            placeholder="Enter template content..."
                          />
                          <div className="text-[9px] text-zinc-500 leading-relaxed">
                            💡 <strong>Merge Tags:</strong> <code>{"{customer_name}"}</code>, <code>{"{salon_name}"}</code>, <code>{"{booking_date}"}</code>, <code>{"{booking_time}"}</code>, <code>{"{service_name}"}</code>, <code>{"{total_price}"}</code>, <code>{"{deposit_paid}"}</code>, <code>{"{balance_to_pay}"}</code>, <code>{"{salon_address}"}</code>, <code>{"{maps_link}"}</code>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* RESCHEDULED */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs font-extrabold text-zinc-800">2. Booking Rescheduled Alert</div>
                          <div className="text-[10px] text-zinc-500">Send automated date/time shift notifications.</div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={bookingRescheduledEnabled} 
                            onChange={(e) => setBookingRescheduledEnabled(e.target.checked)} 
                            className="sr-only peer" 
                          />
                          <div className="w-9 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                        </label>
                      </div>
                      
                      {bookingRescheduledEnabled && (
                        <div className="space-y-2 pt-2 border-t border-slate-200/50">
                          <Label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Template Text</Label>
                          <textarea
                            value={templateRescheduled}
                            onChange={(e) => setTemplateRescheduled(e.target.value)}
                            rows={6}
                            className="w-full p-3 bg-white text-zinc-900 border border-slate-200 rounded-xl text-xs font-mono focus:border-zinc-950 focus:outline-none leading-relaxed"
                            placeholder="Enter template content..."
                          />
                          <div className="text-[9px] text-zinc-500 leading-relaxed">
                            💡 <strong>Merge Tags:</strong> <code>{"{customer_name}"}</code>, <code>{"{salon_name}"}</code>, <code>{"{booking_date}"}</code>, <code>{"{booking_time}"}</code>, <code>{"{service_name}"}</code>, <code>{"{salon_address}"}</code>, <code>{"{maps_link}"}</code>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* CANCELLED */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs font-extrabold text-zinc-800">3. Booking Cancelled Alert</div>
                          <div className="text-[10px] text-zinc-500">Send cancellation confirmation + refund trace link.</div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={bookingCancelledEnabled} 
                            onChange={(e) => setBookingCancelledEnabled(e.target.checked)} 
                            className="sr-only peer" 
                          />
                          <div className="w-9 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                        </label>
                      </div>
                      
                      {bookingCancelledEnabled && (
                        <div className="space-y-2 pt-2 border-t border-slate-200/50">
                          <Label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Template Text</Label>
                          <textarea
                            value={templateCancelled}
                            onChange={(e) => setTemplateCancelled(e.target.value)}
                            rows={6}
                            className="w-full p-3 bg-white text-zinc-900 border border-slate-200 rounded-xl text-xs font-mono focus:border-zinc-950 focus:outline-none leading-relaxed"
                            placeholder="Enter template content..."
                          />
                          <div className="text-[9px] text-zinc-500 leading-relaxed">
                            💡 <strong>Merge Tags:</strong> <code>{"{customer_name}"}</code>, <code>{"{salon_name}"}</code>, <code>{"{booking_date}"}</code>, <code>{"{booking_time}"}</code>, <code>{"{service_name}"}</code>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* REVIEW PROMPT */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs font-extrabold text-zinc-800">4. Feedback Review Prompt</div>
                          <div className="text-[10px] text-zinc-500">Request review + rating link 2 hours post-completion.</div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={bookingReviewEnabled} 
                            onChange={(e) => setBookingReviewEnabled(e.target.checked)} 
                            className="sr-only peer" 
                          />
                          <div className="w-9 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                        </label>
                      </div>
                      
                      {bookingReviewEnabled && (
                        <div className="space-y-2 pt-2 border-t border-slate-200/50">
                          <Label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Template Text</Label>
                          <textarea
                            value={templateReview}
                            onChange={(e) => setTemplateReview(e.target.value)}
                            rows={5}
                            className="w-full p-3 bg-white text-zinc-900 border border-slate-200 rounded-xl text-xs font-mono focus:border-zinc-950 focus:outline-none leading-relaxed"
                            placeholder="Enter template content..."
                          />
                          <div className="text-[9px] text-zinc-500 leading-relaxed">
                            💡 <strong>Merge Tags:</strong> <code>{"{customer_name}"}</code>, <code>{"{salon_name}"}</code>, <code>{"{review_link}"}</code>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* ONBOARDING INVITE */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs font-extrabold text-zinc-800">5. Salon Onboarding Invitation</div>
                          <div className="text-[10px] text-zinc-500">Send Google login link to successfully verified salons.</div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={onboardingInviteEnabled} 
                            onChange={(e) => setOnboardingInviteEnabled(e.target.checked)} 
                            className="sr-only peer" 
                          />
                          <div className="w-9 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                        </label>
                      </div>
                      
                      {onboardingInviteEnabled && (
                        <div className="space-y-2 pt-2 border-t border-slate-200/50">
                          <Label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Template Text</Label>
                          <textarea
                            value={templateOnboardingInvite}
                            onChange={(e) => setTemplateOnboardingInvite(e.target.value)}
                            rows={5}
                            className="w-full p-3 bg-white text-zinc-900 border border-slate-200 rounded-xl text-xs font-mono focus:border-zinc-950 focus:outline-none leading-relaxed"
                            placeholder="Enter template content..."
                          />
                          <div className="text-[9px] text-zinc-500 leading-relaxed">
                            💡 <strong>Merge Tags:</strong> <code>{"{salon_name}"}</code>, <code>{"{owner_gmail}"}</code>, <code>{"{login_link}"}</code>
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                </div>

              </div>

              {/* ACTION */}
              <div className="flex justify-end pt-4 border-t border-slate-100">
                <Button 
                  type="submit"
                  disabled={saving}
                  className="bg-slate-50 hover:bg-zinc-800 text-zinc-900 rounded-xl font-bold h-11 px-5 flex items-center gap-2"
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
                  <Input 
                    id="test_phone"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    required
                    placeholder="+94 77 123 4567"
                    className="h-10 bg-slate-50 border-zinc-800 focus:border-emerald-500 rounded-xl text-zinc-900 placeholder-zinc-600 text-xs"
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
