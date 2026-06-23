"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Plus,
  BarChart3,
  Loader2,
  ExternalLink,
  Users,
  Tag,
  Copy,
  MessageCircle,
  Send,
  Crown,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { DashboardModal } from "../../../components/dashboard/DashboardModal";
import {
  fetchSalonMarketingPage,
  sendVipPromoCampaign,
  type SalonMarketingCampaign,
  type SalonMarketingPackage,
} from "@/app/actions/salon-marketing";
import { buildPromoOfferCopy } from "@/lib/salon-marketing-message";
import {
  getPromotionPeriodLabel,
  getRemainingDaysLabel,
} from "@/lib/promotion-package-dates";

function formatLkr(amount: number): string {
  return `LKR ${amount.toLocaleString()}`;
}

function buildPromoShareMessage(pkg: SalonMarketingPackage, salonName: string, shareUrl: string): string {
  const savings =
    pkg.original_price > pkg.package_price
      ? ` (was ${formatLkr(pkg.original_price)})`
      : "";
  return `Hi! ${salonName} has a special offer: ${pkg.name} — ${formatLkr(pkg.package_price)}${savings}. Book on Trimma: ${shareUrl}`;
}

function formatCampaignChannels(channels: string[]): string {
  return channels
    .map((ch) => (ch === "whatsapp" ? "WhatsApp" : ch === "email" ? "Email" : ch))
    .join(" + ");
}

export default function MarketingPage() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [salonName, setSalonName] = useState("Your salon");
  const [salonSlug, setSalonSlug] = useState("");
  const [packages, setPackages] = useState<SalonMarketingPackage[]>([]);
  const [campaigns, setCampaigns] = useState<SalonMarketingCampaign[]>([]);
  const [vipAudience, setVipAudience] = useState<{ count: number; minVisits: number | null }>({
    count: 0,
    minVisits: null,
  });
  const [stats, setStats] = useState({
    totalPackages: 0,
    livePackages: 0,
    reachableClients: 0,
    promoBookings: 0,
    promoRevenue: 0,
  });
  const [shareLinks, setShareLinks] = useState({ salonPage: "/deals", dealsPage: "/deals" });
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [sendWhatsapp, setSendWhatsapp] = useState(true);
  const [sendEmail, setSendEmail] = useState(true);
  const [sendingCampaign, setSendingCampaign] = useState(false);

  const loadMarketing = useCallback(async () => {
    setLoadError(null);
    const res = await fetchSalonMarketingPage();
    if (res.success === false) {
      setLoadError(res.error);
      setLoading(false);
      return;
    }

    setSalonName(res.salonName);
    setSalonSlug(res.salonSlug);
    setPackages(res.packages);
    setCampaigns(res.campaigns || []);
    setVipAudience(res.vipAudience);
    setStats(res.stats);
    setShareLinks(res.shareLinks);

    const firstLive = res.packages.find((pkg) => pkg.isLive)?.id || res.packages[0]?.id || "";
    setSelectedPackageId((current) => current || firstLive);
    setLoading(false);
  }, []);

  useEffect(() => {
    void Promise.resolve().then(() => loadMarketing());
  }, [loadMarketing]);

  const origin = typeof window !== "undefined" ? window.location.origin : "https://trimma.io";
  const salonShareUrl = `${origin}${shareLinks.salonPage}`;
  const dealsShareUrl = `${origin}${shareLinks.dealsPage}`;

  const selectedPackage = useMemo(
    () => packages.find((pkg) => pkg.id === selectedPackageId) || null,
    [packages, selectedPackageId]
  );

  const previewCopy = useMemo(() => {
    if (!selectedPackage) return null;
    return buildPromoOfferCopy({
      customerName: "Valued Client",
      salonName,
      packageName: selectedPackage.name,
      packagePrice: selectedPackage.package_price,
      originalPrice: selectedPackage.original_price,
      shareUrl: salonShareUrl,
      packageDescription: selectedPackage.description,
    });
  }, [selectedPackage, salonName, salonShareUrl]);

  async function copyText(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied.`);
    } catch {
      toast.error("Could not copy to clipboard.");
    }
  }

  function openCampaignModal(packageId?: string) {
    if (packageId) setSelectedPackageId(packageId);
    setShowCampaignModal(true);
  }

  async function handleSendVipCampaign() {
    if (!selectedPackageId) {
      toast.error("Select a promotion package.");
      return;
    }
    if (!sendWhatsapp && !sendEmail) {
      toast.error("Select at least one channel.");
      return;
    }
    if (vipAudience.count === 0) {
      toast.error(
        vipAudience.minVisits != null
          ? `No VIP clients yet (${vipAudience.minVisits}+ visits required — set in CRM).`
          : "No VIP clients found yet."
      );
      return;
    }

    setSendingCampaign(true);
    const result = await sendVipPromoCampaign(selectedPackageId, {
      whatsapp: sendWhatsapp,
      email: sendEmail,
    });
    setSendingCampaign(false);

    if (result.success === false) {
      toast.error(result.error);
      return;
    }

    toast.success(result.message);
    if (result.warning) toast.message(result.warning);
    setShowCampaignModal(false);
    setLoading(true);
    await loadMarketing();
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-brand mb-4" />
        <p className="text-zinc-500 font-medium">Loading marketing data...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-xl mx-auto p-8 text-center space-y-4">
        <h2 className="text-lg font-bold text-zinc-900">Marketing could not load</h2>
        <p className="text-sm text-zinc-500">{loadError}</p>
        <Button onClick={() => void loadMarketing()} className="rounded-xl font-bold bg-brand text-black">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 text-zinc-900 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-brand" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight">Marketing & Promotions</h1>
            <p className="text-xs text-zinc-500">
              Send package promos to VIP clients via WhatsApp and Email. VIP rules come from CRM.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={() => openCampaignModal()}
            disabled={packages.length === 0 || vipAudience.count === 0}
            className="h-10 rounded-xl bg-brand hover:bg-brand-hover text-black font-bold text-xs flex items-center gap-1.5 shadow-md"
          >
            <Send className="w-3.5 h-3.5" /> Send promo to VIPs
          </Button>
          <Button
            asChild
            className="h-10 rounded-xl bg-black hover:bg-zinc-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
          >
            <Link href="/dashboard/packages">
              <Plus className="w-3.5 h-3.5" /> Create package
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Live promotions</span>
          <h3 className="text-xl font-black text-[#1A1C29] mt-1">{stats.livePackages}</h3>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">VIP clients</span>
          <h3 className="text-xl font-black text-[#1A1C29] mt-1">{vipAudience.count}</h3>
          <span className="text-[9px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full mt-2 inline-block">
            {vipAudience.minVisits != null ? `${vipAudience.minVisits}+ visits` : "CRM rules"}
          </span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Reachable clients</span>
          <h3 className="text-xl font-black text-[#1A1C29] mt-1">{stats.reachableClients}</h3>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Promo bookings</span>
          <h3 className="text-xl font-black text-[#1A1C29] mt-1">{stats.promoBookings}</h3>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Promo revenue</span>
          <h3 className="text-xl font-black text-brand mt-1">{formatLkr(stats.promoRevenue)}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm lg:col-span-2">
          <h3 className="text-sm font-bold text-zinc-900 mb-3">Share your salon offers</h3>
          <p className="text-xs text-zinc-500 mb-4">
            Active packages appear on{" "}
            <a href={dealsShareUrl} target="_blank" rel="noopener noreferrer" className="text-brand font-bold hover:underline">
              Trimma Deals
            </a>{" "}
            and your public salon page.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" className="rounded-xl text-xs font-bold h-9" onClick={() => void copyText("Salon link", salonShareUrl)}>
              <Copy className="w-3.5 h-3.5 mr-1.5" /> Copy salon link
            </Button>
            <Button type="button" variant="outline" className="rounded-xl text-xs font-bold h-9" onClick={() => void copyText("Deals link", dealsShareUrl)}>
              <Copy className="w-3.5 h-3.5 mr-1.5" /> Copy deals link
            </Button>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-500" /> VIP audience
          </h3>
          <p className="text-xs text-zinc-500">
            {vipAudience.count} clients qualify as VIP from your CRM visit rules.
          </p>
          <Button asChild variant="outline" className="w-full rounded-xl font-bold h-10 text-xs">
            <Link href="/dashboard/crm">Edit VIP rules</Link>
          </Button>
          <Button asChild variant="outline" className="w-full rounded-xl font-bold h-10 text-xs">
            <Link href="/dashboard/customers">
              <Users className="w-3.5 h-3.5 mr-1.5" /> View customers
            </Link>
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
          <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-brand" />
            Campaign log
          </h3>
        </div>

        {campaigns.length === 0 ? (
          <p className="text-xs text-zinc-400 py-8 text-center">
            No campaigns sent yet. Use &quot;Send promo to VIPs&quot; to broadcast a package offer.
          </p>
        ) : (
          <div className="overflow-x-auto border border-zinc-100 rounded-2xl">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-zinc-50 text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-200">
                  <th className="px-6 py-4">Campaign</th>
                  <th className="px-6 py-4">Channels</th>
                  <th className="px-6 py-4">VIP recipients</th>
                  <th className="px-6 py-4">WhatsApp</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4 text-right">Sent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {campaigns.map((campaign) => (
                  <tr key={campaign.id} className="text-xs font-semibold text-zinc-600">
                    <td className="px-6 py-4">
                      <div className="font-bold text-zinc-800">{campaign.campaign_name}</div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">
                        {new Date(campaign.created_at).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">{formatCampaignChannels(campaign.channels)}</td>
                    <td className="px-6 py-4">{campaign.recipients_targeted}</td>
                    <td className="px-6 py-4">
                      <span className="text-emerald-600">{campaign.whatsapp_sent} sent</span>
                      {campaign.whatsapp_skipped + campaign.whatsapp_failed > 0 ? (
                        <span className="text-zinc-400 block text-[10px]">
                          {campaign.whatsapp_skipped} skipped · {campaign.whatsapp_failed} failed
                        </span>
                      ) : null}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-emerald-600">{campaign.email_sent} sent</span>
                      {campaign.email_skipped + campaign.email_failed > 0 ? (
                        <span className="text-zinc-400 block text-[10px]">
                          {campaign.email_skipped} skipped · {campaign.email_failed} failed
                        </span>
                      ) : null}
                    </td>
                    <td className="px-6 py-4 text-right font-black text-brand">
                      {campaign.whatsapp_sent + campaign.email_sent}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
          <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
            <Tag className="w-4 h-4 text-brand" />
            Promotion packages
          </h3>
          <Button asChild variant="outline" className="rounded-xl text-xs font-bold h-9">
            <Link href="/dashboard/packages">Manage packages</Link>
          </Button>
        </div>

        {packages.length === 0 ? (
          <div className="py-12 text-center">
            <Button asChild className="rounded-xl bg-black text-white hover:bg-zinc-800 font-bold">
              <Link href="/dashboard/packages">Create your first package</Link>
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto border border-zinc-100 rounded-2xl">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-zinc-50 text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-200">
                  <th className="px-6 py-4">Package</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4">Bookings</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {packages.map((pkg) => {
                  const message = buildPromoShareMessage(pkg, salonName, salonShareUrl);
                  return (
                    <tr key={pkg.id} className="text-xs font-semibold text-zinc-600">
                      <td className="px-6 py-4 font-bold text-zinc-800">{pkg.name}</td>
                      <td className="px-6 py-4">
                        <Badge className={pkg.isLive ? "bg-emerald-50 text-emerald-700 border-none" : "bg-zinc-100 text-zinc-500 border-none"}>
                          {pkg.isLive ? "Live" : pkg.status || "draft"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">{formatLkr(pkg.package_price)}</td>
                      <td className="px-6 py-4">{pkg.bookingsCount}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="outline" size="sm" className="h-8 rounded-lg text-[10px] font-bold" onClick={() => void copyText("Promo message", message)}>
                            <Copy className="w-3 h-3 mr-1" /> Copy
                          </Button>
                          <Button type="button" size="sm" className="h-8 rounded-lg text-[10px] font-bold bg-brand text-black" onClick={() => openCampaignModal(pkg.id)}>
                            <Send className="w-3 h-3 mr-1" /> VIP send
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <DashboardModal
        open={showCampaignModal}
        onClose={() => setShowCampaignModal(false)}
        size="lg"
        title={
          <span className="flex items-center gap-2">
            <Send className="w-5 h-5 text-brand shrink-0" />
            Send promotion to VIP clients
          </span>
        }
        description={
          <>
            Sends to <strong>{vipAudience.count}</strong> VIP clients
            {vipAudience.minVisits != null ? ` (${vipAudience.minVisits}+ qualifying visits)` : ""}.
            WhatsApp needs a phone on the customer profile; email uses booking email.
          </>
        }
        footer={
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setShowCampaignModal(false)} className="rounded-xl font-bold h-11">
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void handleSendVipCampaign()}
              disabled={sendingCampaign}
              className="rounded-xl font-bold h-11 bg-black text-white hover:bg-zinc-800"
            >
              {sendingCampaign ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
              Send campaign
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Promotion package</label>
            <select
              value={selectedPackageId}
              onChange={(e) => setSelectedPackageId(e.target.value)}
              className="mt-1.5 w-full h-11 border border-zinc-200 bg-white px-4 rounded-xl text-xs font-semibold"
            >
              {packages.map((pkg) => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.name} — {formatLkr(pkg.package_price)}
                  {pkg.isLive ? " (live)" : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-3">
            <label className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 px-4 py-3 text-xs font-bold cursor-pointer">
              <input type="checkbox" checked={sendWhatsapp} onChange={(e) => setSendWhatsapp(e.target.checked)} className="accent-black" />
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </label>
            <label className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 px-4 py-3 text-xs font-bold cursor-pointer">
              <input type="checkbox" checked={sendEmail} onChange={(e) => setSendEmail(e.target.checked)} className="accent-black" />
              <Mail className="w-4 h-4" /> Email
            </label>
          </div>

          {previewCopy ? (
            <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide mb-2">Message preview</p>
              <pre className="text-[11px] text-zinc-600 whitespace-pre-wrap font-sans leading-relaxed max-h-48 overflow-y-auto">
                {previewCopy.whatsappBody}
              </pre>
            </div>
          ) : null}
        </div>
      </DashboardModal>
    </div>
  );
}
