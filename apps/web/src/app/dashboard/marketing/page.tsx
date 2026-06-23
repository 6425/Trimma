"use client";

import React, { useCallback, useEffect, useState } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  fetchSalonMarketingPage,
  type SalonMarketingPackage,
} from "@/app/actions/salon-marketing";
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

export default function MarketingPage() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [salonName, setSalonName] = useState("Your salon");
  const [salonSlug, setSalonSlug] = useState("");
  const [packages, setPackages] = useState<SalonMarketingPackage[]>([]);
  const [stats, setStats] = useState({
    totalPackages: 0,
    livePackages: 0,
    reachableClients: 0,
    promoBookings: 0,
    promoRevenue: 0,
  });
  const [shareLinks, setShareLinks] = useState({ salonPage: "/deals", dealsPage: "/deals" });

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
    setStats(res.stats);
    setShareLinks(res.shareLinks);
    setLoading(false);
  }, []);

  useEffect(() => {
    void Promise.resolve().then(() => loadMarketing());
  }, [loadMarketing]);

  const origin = typeof window !== "undefined" ? window.location.origin : "https://trimma.io";
  const salonShareUrl = `${origin}${shareLinks.salonPage}`;
  const dealsShareUrl = `${origin}${shareLinks.dealsPage}`;

  async function copyText(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied.`);
    } catch {
      toast.error("Could not copy to clipboard.");
    }
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
              Promote your packages on Trimma Deals, then share offers with clients via Customers or CRM.
            </p>
          </div>
        </div>

        <Button
          asChild
          className="h-10 rounded-xl bg-black hover:bg-zinc-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
        >
          <Link href="/dashboard/packages">
            <Plus className="w-3.5 h-3.5" /> Create promotion package
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Live promotions</span>
          <h3 className="text-xl font-black text-[#1A1C29] mt-1">{stats.livePackages}</h3>
          <span className="text-[9px] font-semibold text-zinc-500 bg-zinc-50 px-2 py-0.5 rounded-full mt-2 inline-block">
            {stats.totalPackages} total packages
          </span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Reachable clients</span>
          <h3 className="text-xl font-black text-[#1A1C29] mt-1">{stats.reachableClients}</h3>
          <span className="text-[9px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mt-2 inline-block">
            From booking history
          </span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Promo bookings</span>
          <h3 className="text-xl font-black text-[#1A1C29] mt-1">{stats.promoBookings}</h3>
          <span className="text-[9px] font-semibold text-brand bg-rose-50 px-2 py-0.5 rounded-full mt-2 inline-block">
            Linked to packages
          </span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Promo revenue</span>
          <h3 className="text-xl font-black text-brand mt-1">{formatLkr(stats.promoRevenue)}</h3>
          <span className="text-[9px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mt-2 inline-block">
            Confirmed & completed
          </span>
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
            and your public salon page when status is active and dates are valid.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl text-xs font-bold h-9"
              onClick={() => void copyText("Salon link", salonShareUrl)}
            >
              <Copy className="w-3.5 h-3.5 mr-1.5" /> Copy salon page link
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl text-xs font-bold h-9"
              onClick={() => void copyText("Deals link", dealsShareUrl)}
            >
              <Copy className="w-3.5 h-3.5 mr-1.5" /> Copy deals page link
            </Button>
            {salonSlug ? (
              <Button asChild variant="outline" className="rounded-xl text-xs font-bold h-9">
                <a href={salonShareUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Preview salon page
                </a>
              </Button>
            ) : null}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-zinc-900">Promote to clients</h3>
          <p className="text-xs text-zinc-500">
            Copy a ready-made message, then contact clients from Customers using WhatsApp or Gmail.
          </p>
          <Button asChild className="w-full rounded-xl bg-brand text-black font-bold h-10 text-xs">
            <Link href="/dashboard/customers">
              <Users className="w-3.5 h-3.5 mr-1.5" /> Open customer list
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full rounded-xl font-bold h-10 text-xs">
            <Link href="/dashboard/crm">
              <MessageCircle className="w-3.5 h-3.5 mr-1.5" /> Loyalty tiers (CRM)
            </Link>
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
          <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-brand" />
            Promotion packages & performance
          </h3>
          <Button asChild variant="outline" className="rounded-xl text-xs font-bold h-9">
            <Link href="/dashboard/packages">
              <Tag className="w-3.5 h-3.5 mr-1.5" /> Manage packages
            </Link>
          </Button>
        </div>

        {packages.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm font-semibold text-zinc-700">No promotion packages yet</p>
            <p className="text-xs text-zinc-400 mt-2 max-w-md mx-auto">
              Create a package under Packages — it will show here for sharing and track bookings linked to that promo.
            </p>
            <Button asChild className="mt-6 rounded-xl bg-black text-white hover:bg-zinc-800 font-bold">
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
                  <th className="px-6 py-4">Period</th>
                  <th className="px-6 py-4">Bookings</th>
                  <th className="px-6 py-4 text-right">Revenue</th>
                  <th className="px-6 py-4 text-right">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {packages.map((pkg) => {
                  const message = buildPromoShareMessage(pkg, salonName, salonShareUrl);
                  const remaining = getRemainingDaysLabel(pkg.end_date);
                  return (
                    <tr key={pkg.id} className="hover:bg-zinc-50/50 transition-colors text-xs font-semibold text-zinc-600">
                      <td className="px-6 py-4">
                        <div className="font-bold text-zinc-800">{pkg.name}</div>
                        {pkg.promotion_type ? (
                          <div className="text-[10px] text-zinc-400 mt-0.5">{pkg.promotion_type}</div>
                        ) : null}
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          className={
                            pkg.isLive
                              ? "bg-emerald-50 text-emerald-700 border-none"
                              : "bg-zinc-100 text-zinc-500 border-none"
                          }
                        >
                          {pkg.isLive ? "Live on Deals" : (pkg.status || "draft")}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 font-bold text-zinc-800">{formatLkr(pkg.package_price)}</td>
                      <td className="px-6 py-4">
                        <div>{getPromotionPeriodLabel(pkg.start_date, pkg.end_date)}</div>
                        {remaining ? <div className="text-[10px] text-zinc-400 mt-0.5">{remaining}</div> : null}
                      </td>
                      <td className="px-6 py-4 font-bold text-zinc-800">{pkg.bookingsCount}</td>
                      <td className="px-6 py-4 text-right text-brand font-black">{formatLkr(pkg.revenue)}</td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 rounded-lg text-[10px] font-bold"
                          onClick={() => void copyText("Promo message", message)}
                        >
                          <Copy className="w-3 h-3 mr-1" /> Copy message
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-[10px] text-zinc-400 text-center leading-relaxed max-w-2xl mx-auto">
        Bulk WhatsApp/email campaign logging and automated win-back sends can be added next. Today, packages + Deals +
        Customers give you a full promote-and-track loop without changing bookings or checkout.
      </p>
    </div>
  );
}
