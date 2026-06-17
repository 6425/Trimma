"use client";

import { useEffect, useState } from "react";
import {
  MessageSquare,
  PlayCircle,
  RefreshCw,
  Save,
  Send,
  Eye,
  EyeOff,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  getTelegramConfig,
  saveTelegramSettings,
  testTelegramConnection,
  validateTelegramCredentials,
} from "@/app/actions/telegram";
import { TELEGRAM_TRIGGER_CATALOG } from "@/lib/telegram-templates";
import { LkPhoneInput } from "@/components/ui/LkPhoneInput";

export function TelegramSettingsPanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [apiId, setApiId] = useState("");
  const [apiHash, setApiHash] = useState("");
  const [productionDc, setProductionDc] = useState("2");
  const [productionPublicKey, setProductionPublicKey] = useState("");
  const [botToken, setBotToken] = useState("");
  const [tokenFromEnv, setTokenFromEnv] = useState(false);
  const [configSource, setConfigSource] = useState("database");
  const [adminAlertChatId, setAdminAlertChatId] = useState("");
  const [adminAlertPhone, setAdminAlertPhone] = useState("");
  const [showBotToken, setShowBotToken] = useState(false);
  const [testChatId, setTestChatId] = useState("");
  const [tokenStatus, setTokenStatus] = useState<{
    valid: boolean;
    error?: string;
    botUsername?: string;
  } | null>(null);

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

  useEffect(() => {
    void Promise.resolve().then(async () => {
      const config = await getTelegramConfig();
      setEnabled(config.enabled);
      setApiId(config.apiId);
      setApiHash(config.apiHash);
      setProductionDc(config.productionDc || "2");
      setProductionPublicKey(config.productionPublicKey || "");
      setBotToken(config.tokenFromEnv ? "" : config.botToken);
      setTokenFromEnv(Boolean(config.tokenFromEnv));
      setAdminAlertChatId(config.adminAlertChatId || "");
      setAdminAlertPhone(config.adminAlertPhone || "");
      setConfigSource(config.credentialsSource || config.source);
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

      const validation = await validateTelegramCredentials();
      setTokenStatus(
        validation.valid
          ? { valid: true, botUsername: validation.botUsername }
          : { valid: false, error: validation.error }
      );
      setLoading(false);
    });
  }, []);

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await saveTelegramSettings(
        apiId,
        apiHash,
        productionDc,
        productionPublicKey,
        botToken,
        enabled,
        adminAlertChatId,
        adminAlertPhone,
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
        templateBookingCreatedCustomer,
        templateBookingCreatedOwner,
        templateAgentApprovalOwner,
        templateAgentApprovalAdmin,
        templateAdminApprovalOwner,
        templateAdminApprovalAdmin,
        welcomeCustomerEnabled,
        agentLeadAssignedEnabled,
        templateWelcomeCustomer,
        templateAgentLeadAssigned
      );
      if (!res.success) throw new Error(res.error);
      toast.success("Telegram configuration saved successfully.");
      setConfigSource("database");
      const validation = await validateTelegramCredentials();
      setTokenStatus(
        validation.valid
          ? { valid: true, botUsername: validation.botUsername }
          : { valid: false, error: validation.error }
      );
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save Telegram settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleTestSend = async () => {
    if (!testChatId.trim()) {
      toast.error("Enter a Telegram chat ID for the test message.");
      return;
    }
    setTesting(true);
    try {
      const res = await testTelegramConnection(testChatId.trim());
      if (!res.success) throw new Error(res.error);
      toast.success("Test Telegram message sent.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Telegram test failed.");
    } finally {
      setTesting(false);
    }
  };

  const shownToggleKeys = new Set<string>();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-3">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sky-500" />
        <p className="text-sm text-zinc-500 font-bold">Loading Telegram settings...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <form
          onSubmit={handleSave}
          className="bg-white text-zinc-900 rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm"
        >
          <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
            <h3 className="font-extrabold text-zinc-900 text-base flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-sky-500" />
              Telegram Messaging Channel
            </h3>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500" />
              <span className="ml-2 text-xs font-bold text-zinc-700 uppercase tracking-wider">
                Enable Telegram
              </span>
            </label>
          </div>

          {configSource === "vercel" && (
            <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-sky-800 font-medium leading-relaxed">
                <strong>Using Vercel credentials.</strong> Production reads{" "}
                <code>TELEGRAM_BOT_TOKEN</code>, <code>TELEGRAM_API_ID</code>, and{" "}
                <code>TELEGRAM_API_HASH</code> from Vercel first. Save here to sync templates and
                keys to the database.
              </p>
            </div>
          )}

          {tokenStatus?.valid && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-emerald-800 font-medium leading-relaxed">
                <strong>Bot connected.</strong>
                {tokenStatus.botUsername ? ` @${tokenStatus.botUsername}` : " Telegram bot validated."}
              </p>
            </div>
          )}

          {tokenStatus && !tokenStatus.valid && enabled && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
                <strong>Bot token not validated yet.</strong> {tokenStatus.error || "Add your bot token to send messages."}
              </p>
            </div>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="telegram_api_id" className="text-xs font-black uppercase tracking-wider text-zinc-500">
                  App API ID
                </Label>
                <Input
                  id="telegram_api_id"
                  value={apiId}
                  onChange={(e) => setApiId(e.target.value)}
                  placeholder="12345678"
                  className="h-11 border-slate-200 rounded-xl text-sm"
                />
                <p className="text-[10px] text-zinc-500">From my.telegram.org → API development tools</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="telegram_api_hash" className="text-xs font-black uppercase tracking-wider text-zinc-500">
                  App API Hash
                </Label>
                <Input
                  id="telegram_api_hash"
                  value={apiHash}
                  onChange={(e) => setApiHash(e.target.value)}
                  placeholder="0123456789abcdef0123456789abcdef"
                  className="h-11 border-slate-200 rounded-xl text-sm font-mono"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="telegram_production_dc" className="text-xs font-black uppercase tracking-wider text-zinc-500">
                Production DC
              </Label>
              <Input
                id="telegram_production_dc"
                value={productionDc}
                onChange={(e) => setProductionDc(e.target.value)}
                placeholder="2"
                className="h-11 border-slate-200 rounded-xl text-sm max-w-[120px]"
              />
              <p className="text-[10px] text-zinc-500">Usually DC 2 for production Telegram servers.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="telegram_public_key" className="text-xs font-black uppercase tracking-wider text-zinc-500">
                Production Public Key
              </Label>
              <textarea
                id="telegram_public_key"
                value={productionPublicKey}
                onChange={(e) => setProductionPublicKey(e.target.value)}
                rows={4}
                placeholder="-----BEGIN RSA PUBLIC KEY-----..."
                className="w-full p-3 bg-white text-zinc-900 border border-slate-200 rounded-xl text-xs font-mono focus:border-zinc-950 focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telegram_bot_token" className="text-xs font-black uppercase tracking-wider text-zinc-500">
                Bot Token (for sending)
              </Label>
              <div className="relative flex items-center">
                <Input
                  id="telegram_bot_token"
                  type={showBotToken ? "text" : "password"}
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                  placeholder={tokenFromEnv ? "Using TELEGRAM_BOT_TOKEN from Vercel" : "123456:ABC-DEF..."}
                  className="h-11 border-slate-200 pr-12 rounded-xl text-sm font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowBotToken(!showBotToken)}
                  className="absolute right-3 text-zinc-500 hover:text-zinc-700"
                >
                  {showBotToken ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-[10px] text-zinc-500">
                From @BotFather. Required to dispatch messages via Telegram Bot API.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="telegram_admin_chat_id" className="text-xs font-black uppercase tracking-wider text-zinc-500">
                  Platform Admin Alert Chat ID
                </Label>
                <Input
                  id="telegram_admin_chat_id"
                  value={adminAlertChatId}
                  onChange={(e) => setAdminAlertChatId(e.target.value)}
                  placeholder="123456789"
                  className="h-11 border-slate-200 rounded-xl text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telegram_admin_phone" className="text-xs font-black uppercase tracking-wider text-zinc-500">
                  Platform Admin Alert Phone (fallback lookup)
                </Label>
                <LkPhoneInput
                  id="telegram_admin_phone"
                  theme="light"
                  value={adminAlertPhone}
                  onChange={setAdminAlertPhone}
                  className="h-11 rounded-xl"
                  inputClassName="h-11 text-sm"
                />
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 space-y-6">
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-800">
                  Automated Notification Trigger Events & Templates
                </h4>
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  Same 14 triggers as WhatsApp. Messages send in parallel when Telegram is enabled.
                </p>
              </div>

              <div className="space-y-6">
                {TELEGRAM_TRIGGER_CATALOG.map((trigger) => {
                  const toggleKey = trigger.toggleKey;
                  const templateKey = trigger.templateKey;
                  const isEnabled = toggleValues[toggleKey] !== false;
                  const showToggle =
                    !("sharesToggleWith" in trigger && trigger.sharesToggleWith) ||
                    !shownToggleKeys.has(toggleKey);
                  if (showToggle) shownToggleKeys.add(toggleKey);

                  return (
                    <div
                      key={trigger.id}
                      className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="text-xs font-extrabold text-zinc-800">
                            {trigger.order}. {trigger.title}
                          </div>
                          <div className="text-[10px] text-zinc-500 mt-0.5">{trigger.whenFired}</div>
                        </div>
                        {showToggle ? (
                          <label className="relative inline-flex items-center cursor-pointer shrink-0">
                            <input
                              type="checkbox"
                              checked={isEnabled}
                              onChange={(e) => setToggleValue(toggleKey, e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-500" />
                          </label>
                        ) : null}
                      </div>

                      {isEnabled && (
                        <div className="space-y-2 pt-2 border-t border-slate-200/50">
                          <Label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
                            Template Text
                          </Label>
                          <textarea
                            value={templateValues[templateKey] || ""}
                            onChange={(e) => setTemplateValue(templateKey, e.target.value)}
                            rows={trigger.mergeTags.length > 5 ? 6 : 5}
                            className="w-full p-3 bg-white text-zinc-900 border border-slate-200 rounded-xl text-xs font-mono focus:border-zinc-950 focus:outline-none leading-relaxed"
                          />
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
          </div>

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
                  <Save className="w-4 h-4" /> Save Telegram Settings
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      <div>
        <div className="bg-white rounded-2xl p-6 text-zinc-900 space-y-6 shadow-md border border-slate-200">
          <div className="space-y-2">
            <h3 className="font-extrabold text-base flex items-center gap-2">
              <PlayCircle className="w-5 h-5 text-sky-500" />
              Live Telegram Tester
            </h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Send a test message to a Telegram chat ID. The user must have started your bot first.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="test_chat_id" className="text-[10px] font-black uppercase tracking-wider text-zinc-500">
              Recipient Chat ID
            </Label>
            <Input
              id="test_chat_id"
              value={testChatId}
              onChange={(e) => setTestChatId(e.target.value)}
              placeholder="123456789"
              className="h-10 rounded-xl bg-slate-50 text-xs"
            />
          </div>

          <Button
            type="button"
            onClick={handleTestSend}
            disabled={testing || !enabled}
            className="w-full bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold text-xs h-10 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {testing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Dispatching...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" /> Send Test Telegram
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
