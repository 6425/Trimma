"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Share2,
  Facebook,
  MessageCircle,
  Check,
  Play,
  Settings,
  Loader2,
  Send,
  Calendar,
  Copy,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  createFacebookConnectUrl,
  disconnectFacebookIntegration,
  getFacebookConnectStatus,
  publishFacebookPagePost,
  saveFacebookIntegrationSettings,
  selectFacebookPage,
} from "@/app/actions/facebook-connect";
import { DashboardModal } from "../../../components/dashboard/DashboardModal";

type FacebookStatus = {
  configured: boolean;
  connected: boolean;
  pageId: string | null;
  pageName: string | null;
  pageUrl: string | null;
  connectedAt: string | null;
  needsPageSelection: boolean;
  pendingPages: Array<{ id: string; name: string; category: string | null }>;
  bookingCtaEnabled: boolean;
  bookingCtaLabel: string;
  autoPublishPromos: boolean;
  salonBookingUrl: string;
  scopes: string[];
};

export default function SocialMediaPage() {
  const searchParams = useSearchParams();
  const [facebookStatus, setFacebookStatus] = useState<FacebookStatus | null>(null);
  const [facebookLoading, setFacebookLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [postMessage, setPostMessage] = useState("");
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [showPageModal, setShowPageModal] = useState(false);
  const [selectingPageId, setSelectingPageId] = useState<string | null>(null);

  const [facebookPageUrl, setFacebookPageUrl] = useState("");
  const [bookingCtaEnabled, setBookingCtaEnabled] = useState(true);
  const [bookingCtaLabel, setBookingCtaLabel] = useState("Book Now");
  const [autoPublishPromos, setAutoPublishPromos] = useState(false);

  const applyFacebookStatus = useCallback((result: Exclude<Awaited<ReturnType<typeof getFacebookConnectStatus>>, { success: false }>) => {
    setFacebookStatus({
      configured: result.configured,
      connected: result.connected,
      pageId: result.pageId,
      pageName: result.pageName,
      pageUrl: result.pageUrl,
      connectedAt: result.connectedAt,
      needsPageSelection: result.needsPageSelection,
      pendingPages: result.pendingPages,
      bookingCtaEnabled: result.bookingCtaEnabled,
      bookingCtaLabel: result.bookingCtaLabel,
      autoPublishPromos: result.autoPublishPromos,
      salonBookingUrl: result.salonBookingUrl,
      scopes: result.scopes,
    });
    setFacebookPageUrl(result.pageUrl || "");
    setBookingCtaEnabled(result.bookingCtaEnabled);
    setBookingCtaLabel(result.bookingCtaLabel || "Book Now");
    setAutoPublishPromos(result.autoPublishPromos);
    if (result.needsPageSelection) setShowPageModal(true);
  }, []);

  const loadFacebookStatus = useCallback(async () => {
    setFacebookLoading(true);
    const result = await getFacebookConnectStatus();
    if (result.success === false) {
      toast.error(result.error);
      setFacebookLoading(false);
      return;
    }
    applyFacebookStatus(result);
    setFacebookLoading(false);
  }, [applyFacebookStatus]);

  useEffect(() => {
    void Promise.resolve().then(() => loadFacebookStatus());
  }, [loadFacebookStatus]);

  useEffect(() => {
    const facebookParam = searchParams.get("facebook");
    const message = searchParams.get("message");
    const page = searchParams.get("page");

    void Promise.resolve().then(() => {
      if (facebookParam === "connected") {
        toast.success(page ? `Facebook connected to ${page}` : "Facebook Page connected.");
        setShowSettingsModal(true);
        void loadFacebookStatus();
      } else if (facebookParam === "select_page") {
        toast.message("Select which Facebook Page to connect.");
        setShowPageModal(true);
        setShowSettingsModal(true);
        void loadFacebookStatus();
      } else if (facebookParam === "error") {
        toast.error(message || "Facebook connection failed.");
        setShowSettingsModal(true);
      }
    });
  }, [searchParams, loadFacebookStatus]);

  function openFacebookSettings() {
    setShowSettingsModal(true);
  }

  async function handleSaveSettings() {
    setSavingSettings(true);
    const result = await saveFacebookIntegrationSettings({
      facebookPageUrl,
      bookingCtaEnabled,
      bookingCtaLabel,
      autoPublishPromos,
    });
    setSavingSettings(false);

    if (result.success === false) {
      toast.error(result.error);
      return;
    }

    toast.success("Facebook settings saved.");
    await loadFacebookStatus();
  }

  async function handleConnectFacebook() {
    setConnecting(true);
    const result = await createFacebookConnectUrl();
    setConnecting(false);

    if (result.success === false) {
      toast.error(result.error);
      return;
    }

    window.location.href = result.url;
  }

  async function handleDisconnectFacebook() {
    if (!confirm("Disconnect Facebook from this salon? Scheduled posts already on Facebook will remain.")) {
      return;
    }

    setDisconnecting(true);
    const result = await disconnectFacebookIntegration();
    setDisconnecting(false);

    if (result.success === false) {
      toast.error(result.error);
      return;
    }

    toast.success("Facebook disconnected.");
    await loadFacebookStatus();
  }

  async function handleSelectPage(pageId: string) {
    setSelectingPageId(pageId);
    const result = await selectFacebookPage(pageId);
    setSelectingPageId(null);

    if (result.success === false) {
      toast.error(result.error);
      return;
    }

    toast.success(`Connected to ${result.pageName}`);
    setShowPageModal(false);
    await loadFacebookStatus();
  }

  async function handlePublishPost() {
    if (!postMessage.trim()) {
      toast.error("Write a post message first.");
      return;
    }

    setPublishing(true);
    const result = await publishFacebookPagePost({
      message: postMessage,
      scheduledAt: scheduleEnabled ? scheduledAt : undefined,
    });
    setPublishing(false);

    if (result.success === false) {
      toast.error(result.error);
      return;
    }

    toast.success(
      result.scheduled
        ? `Post scheduled on ${result.pageName}.`
        : `Post published on ${result.pageName}.`
    );
    setShowPostModal(false);
    setPostMessage("");
    setScheduleEnabled(false);
    setScheduledAt("");
  }

  async function copyBookingLink() {
    if (!facebookStatus?.salonBookingUrl) return;
    try {
      await navigator.clipboard.writeText(facebookStatus.salonBookingUrl);
      toast.success("Trimma booking link copied.");
    } catch {
      toast.error("Could not copy link.");
    }
  }

  const facebookConnected = facebookStatus?.connected === true;
  const facebookPartial =
    !facebookConnected && Boolean(facebookStatus?.pageUrl || facebookPageUrl.trim());

  const socialChannels: {
    key: string;
    name: string;
    desc: string;
    connected: boolean;
    loading?: boolean;
    icon: React.ReactNode;
    iconWrapClass?: string;
    actions?: React.ReactNode;
  }[] = [
    {
      key: "facebook",
      name: "Facebook Booking Page",
      desc: facebookConnected
        ? `Connected to ${facebookStatus?.pageName}. Use settings to manage your booking button link and publish salon updates.`
        : facebookPartial
          ? "Page details saved. Connect with Facebook to authorize posting and sync your Trimma booking link."
          : "Link your Facebook Business Page and add your Trimma booking URL as the page call-to-action.",
      connected: facebookConnected,
      loading: facebookLoading,
      icon: <Facebook className="w-6 h-6 text-blue-600" />,
      actions: (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="w-9 h-9 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-zinc-600"
            onClick={openFacebookSettings}
            title="Facebook settings"
          >
            <Settings className="w-4 h-4" />
          </Button>
          {facebookConnected ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="w-9 h-9 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-zinc-600"
                onClick={() => setShowPostModal(true)}
                title="Create post"
              >
                <Send className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                className="rounded-xl border-zinc-200 hover:bg-zinc-50 font-bold text-xs h-9 px-4"
                onClick={() => void handleDisconnectFacebook()}
                disabled={disconnecting}
              >
                {disconnecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Disconnect"}
              </Button>
            </>
          ) : (
            <Button
              className="rounded-xl bg-brand hover:bg-brand-hover text-black font-bold text-xs h-10 px-5 shadow-sm flex items-center gap-1.5"
              onClick={openFacebookSettings}
              disabled={facebookLoading}
            >
              <Play className="w-3.5 h-3.5" /> Setup Sync
            </Button>
          )}
        </div>
      ),
    },
    {
      key: "whatsapp",
      name: "WhatsApp Automated Agent",
      desc: "Auto-send booking notifications, reminders, and invoice receipts directly through your WhatsApp business account.",
      connected: true,
      icon: <MessageCircle className="w-6 h-6 text-emerald-600" />,
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 text-zinc-900 flex items-center justify-center">
            <Share2 className="w-6 h-6 text-brand" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Social Media & Integrations</h1>
            <p className="text-xs text-zinc-500">
              <strong className="font-semibold text-zinc-700">Facebook Booking Page</strong> is managed here only — not on Profile.
              Connect your Page, booking link, and posts from the card below.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {socialChannels.map((channel) => (
          <div
            key={channel.key}
            className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between space-y-6 relative overflow-hidden group"
          >
            {channel.loading ? (
              <span className="absolute top-4 right-4 bg-zinc-100 text-zinc-500 font-extrabold text-[8px] tracking-wider uppercase px-3 py-1 rounded-full flex items-center gap-1">
                <Loader2 className="w-2.5 h-2.5 animate-spin" /> Checking
              </span>
            ) : channel.connected ? (
              <span className="absolute top-4 right-4 bg-emerald-50 text-emerald-600 font-extrabold text-[8px] tracking-wider uppercase px-3 py-1 rounded-full border border-emerald-100 flex items-center gap-1">
                <Check className="w-2.5 h-2.5" /> Connected
              </span>
            ) : channel.key === "facebook" && facebookPartial ? (
              <span className="absolute top-4 right-4 bg-amber-50 text-amber-700 font-extrabold text-[8px] tracking-wider uppercase px-3 py-1 rounded-full border border-amber-100">
                Setup started
              </span>
            ) : (
              <span className="absolute top-4 right-4 bg-zinc-100 text-zinc-400 font-extrabold text-[8px] tracking-wider uppercase px-3 py-1 rounded-full">
                Not Synced
              </span>
            )}

            <div className="space-y-4 pt-4 flex items-start gap-4">
              <div
                className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 ${
                  channel.iconWrapClass || "bg-zinc-50 border-zinc-100"
                }`}
              >
                {channel.icon}
              </div>
              <div className="space-y-1 pr-16">
                <h3 className="font-extrabold text-base text-[#1A1C29] tracking-tight">{channel.name}</h3>
                <p className="text-xs text-zinc-500 leading-relaxed font-sans">{channel.desc}</p>
                {channel.key === "facebook" && facebookStatus?.connectedAt ? (
                  <p className="text-[10px] text-zinc-400">
                    Connected {new Date(facebookStatus.connectedAt).toLocaleString()}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-50">
              {channel.actions ? (
                channel.actions
              ) : channel.connected ? (
                <>
                  <Button variant="ghost" size="icon" className="w-9 h-9 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-zinc-600">
                    <Settings className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" className="rounded-xl border-zinc-200 hover:bg-zinc-50 font-bold text-xs h-9 px-4">
                    Disconnect
                  </Button>
                </>
              ) : (
                <Button className="rounded-xl bg-brand hover:bg-brand-hover text-black font-bold text-xs h-10 px-5 shadow-sm flex items-center gap-1.5">
                  <Play className="w-3.5 h-3.5" /> Setup Sync
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <DashboardModal
        open={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        size="lg"
        title={
          <span className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-brand shrink-0" />
            Facebook Booking Page
          </span>
        }
        description="Add your public Facebook Page details, connect with Meta OAuth, and set the Trimma booking link for your page button."
        footer={
          <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 w-full">
            <div className="flex gap-2">
              {facebookConnected ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void handleDisconnectFacebook()}
                  disabled={disconnecting}
                  className="rounded-xl font-bold text-xs"
                >
                  {disconnecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Disconnect"}
                </Button>
              ) : null}
            </div>
            <div className="flex flex-col-reverse sm:flex-row gap-2">
              <Button variant="ghost" onClick={() => setShowSettingsModal(false)} className="rounded-xl font-bold">
                Close
              </Button>
              <Button
                onClick={() => void handleSaveSettings()}
                disabled={savingSettings}
                className="rounded-xl bg-brand text-black font-bold"
              >
                {savingSettings ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Save settings
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-5">
          <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 space-y-3">
            <p className="text-xs font-bold text-blue-900">Step 1 — Your Facebook Page</p>
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">
                Facebook Page URL
              </label>
              <Input
                value={facebookPageUrl}
                onChange={(e) => setFacebookPageUrl(e.target.value)}
                placeholder="https://facebook.com/your-salon-page"
                className="mt-1.5 h-11 rounded-xl"
              />
              <p className="text-[10px] text-zinc-500 mt-1">
                Public link to your salon&apos;s Facebook Business Page.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-100 bg-zinc-50/80 p-4 space-y-3">
            <p className="text-xs font-bold text-zinc-900">Step 2 — Trimma booking link</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                readOnly
                value={facebookStatus?.salonBookingUrl || ""}
                className="h-11 rounded-xl bg-white text-xs font-mono"
              />
              <Button type="button" variant="outline" onClick={() => void copyBookingLink()} className="rounded-xl font-bold h-11 shrink-0">
                <Copy className="w-4 h-4 mr-1.5" /> Copy
              </Button>
            </div>
            <p className="text-[10px] text-zinc-500">
              In Meta Business Suite → your Page → <strong>Action button</strong>, set this Trimma URL as your booking
              link. Use the label below.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="inline-flex items-center gap-2 text-xs font-bold text-zinc-700 rounded-xl border border-zinc-200 bg-white px-4 py-3">
                <input
                  type="checkbox"
                  checked={bookingCtaEnabled}
                  onChange={(e) => setBookingCtaEnabled(e.target.checked)}
                  className="accent-black"
                />
                Enable booking button
              </label>
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Button label</label>
                <Input
                  value={bookingCtaLabel}
                  onChange={(e) => setBookingCtaLabel(e.target.value)}
                  placeholder="Book Now"
                  className="mt-1.5 h-11 rounded-xl"
                  disabled={!bookingCtaEnabled}
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-100 p-4 space-y-3">
            <p className="text-xs font-bold text-zinc-900">Step 3 — Connect with Facebook</p>
            {facebookConnected ? (
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs text-emerald-800">
                <p className="font-bold">{facebookStatus?.pageName}</p>
                <p className="text-[10px] mt-1 text-emerald-700">Page ID: {facebookStatus?.pageId}</p>
                {facebookStatus?.pageUrl ? (
                  <a
                    href={facebookStatus.pageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] font-bold mt-2 text-emerald-700 hover:underline"
                  >
                    View Page <ExternalLink className="w-3 h-3" />
                  </a>
                ) : null}
              </div>
            ) : (
              <>
                <p className="text-[11px] text-zinc-500">
                  Authorize Trimma to manage posts on your Page. Required permissions:{" "}
                  {(facebookStatus?.scopes || []).join(", ")}.
                </p>
                <Button
                  type="button"
                  onClick={() => void handleConnectFacebook()}
                  disabled={connecting || facebookStatus?.configured === false}
                  className="rounded-xl bg-[#1877F2] hover:bg-[#166FE5] text-white font-bold h-11"
                >
                  {connecting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Facebook className="w-4 h-4 mr-2" />
                  )}
                  Connect with Facebook
                </Button>
                {facebookStatus?.configured === false ? (
                  <p className="text-[10px] text-amber-700">
                    Facebook login is temporarily unavailable on this environment. You can still save your Page URL and
                    booking link below; connect will work once Trimma enables Meta for beta/live.
                  </p>
                ) : null}
              </>
            )}
          </div>

          <label className="inline-flex items-center gap-2 text-xs font-bold text-zinc-700 rounded-xl border border-zinc-200 px-4 py-3">
            <input
              type="checkbox"
              checked={autoPublishPromos}
              onChange={(e) => setAutoPublishPromos(e.target.checked)}
              className="accent-black"
            />
            Auto-publish promotion packages to Facebook when marked live
          </label>
        </div>
      </DashboardModal>

      <DashboardModal
        open={showPageModal}
        onClose={() => setShowPageModal(false)}
        size="md"
        title="Select Facebook Page"
        description="Choose which Page Trimma should publish posts to."
        footer={
          <Button variant="ghost" onClick={() => setShowPageModal(false)} className="rounded-xl font-bold">
            Cancel
          </Button>
        }
      >
        <div className="space-y-3">
          {(facebookStatus?.pendingPages || []).map((page) => (
            <button
              key={page.id}
              type="button"
              onClick={() => void handleSelectPage(page.id)}
              disabled={selectingPageId === page.id}
              className="w-full text-left rounded-2xl border border-zinc-100 hover:border-brand/40 hover:bg-rose-50/40 p-4 transition-all"
            >
              <div className="font-bold text-sm text-zinc-900">{page.name}</div>
              <div className="text-[10px] text-zinc-500 mt-1">
                Page ID: {page.id}
                {page.category ? ` · ${page.category}` : ""}
              </div>
              {selectingPageId === page.id ? (
                <div className="text-[10px] text-brand font-bold mt-2 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Connecting...
                </div>
              ) : null}
            </button>
          ))}
        </div>
      </DashboardModal>

      <DashboardModal
        open={showPostModal}
        onClose={() => setShowPostModal(false)}
        size="lg"
        title="Publish to Facebook Page"
        description={
          facebookStatus?.pageName
            ? `Posting as ${facebookStatus.pageName}.`
            : "Connect a Facebook Page first."
        }
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowPostModal(false)} className="rounded-xl font-bold">
              Cancel
            </Button>
            <Button
              onClick={() => void handlePublishPost()}
              disabled={publishing}
              className="rounded-xl bg-brand text-black font-bold"
            >
              {publishing ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : scheduleEnabled ? (
                <Calendar className="w-4 h-4 mr-2" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              {scheduleEnabled ? "Schedule post" : "Publish now"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Post message</label>
            <Textarea
              value={postMessage}
              onChange={(e) => setPostMessage(e.target.value)}
              placeholder="Share a salon update, promo, or booking link..."
              className="mt-1.5 rounded-xl min-h-[140px]"
            />
          </div>

          <label className="inline-flex items-center gap-2 text-xs font-bold text-zinc-700">
            <input
              type="checkbox"
              checked={scheduleEnabled}
              onChange={(e) => setScheduleEnabled(e.target.checked)}
              className="accent-black"
            />
            Schedule for later
          </label>

          {scheduleEnabled ? (
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Publish time</label>
              <Input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="mt-1.5 h-11 rounded-xl"
              />
              <p className="text-[10px] text-zinc-400 mt-1">
                Facebook requires scheduled posts to be at least 10 minutes ahead (max 75 days).
              </p>
            </div>
          ) : null}
        </div>
      </DashboardModal>
    </div>
  );
}
