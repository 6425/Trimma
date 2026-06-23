"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  MessageSquare,
  Sparkles,
  Star,
  Award,
  ArrowRight,
  Loader2,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DashboardModal } from "../../../components/dashboard/DashboardModal";
import {
  fetchSalonCrmPage,
  saveSalonLoyaltyRules,
  type SaveSalonLoyaltyRuleInput,
} from "@/app/actions/salon-loyalty";
import type { LoyaltyTierKey, SalonLoyaltyRule } from "@/lib/salon-loyalty";
import { toast } from "sonner";

function tierEmoji(tierKey: LoyaltyTierKey): string {
  if (tierKey === "royal") return "👑";
  if (tierKey === "elite") return "⭐";
  if (tierKey === "premium") return "💅";
  return "✨";
}

function tierCountColor(tierKey: LoyaltyTierKey): string {
  if (tierKey === "royal") return "text-brand";
  if (tierKey === "elite") return "text-amber-500";
  if (tierKey === "premium") return "text-emerald-500";
  return "text-violet-600";
}

export default function CRMPage() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [rules, setRules] = useState<SalonLoyaltyRule[]>([]);
  const [tierCounts, setTierCounts] = useState<Record<LoyaltyTierKey, number>>({
    premium: 0,
    elite: 0,
    royal: 0,
    vip: 0,
  });
  const [totalClients, setTotalClients] = useState(0);
  const [recentActivity, setRecentActivity] = useState<
    Array<{ client: string; note: string; date: string }>
  >([]);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [draftRules, setDraftRules] = useState<SaveSalonLoyaltyRuleInput[]>([]);
  const [savingRules, setSavingRules] = useState(false);

  const displayRules = useMemo(
    () => rules.filter((rule) => rule.tier_key !== "vip").sort((a, b) => a.sort_order - b.sort_order),
    [rules]
  );
  const vipRule = useMemo(() => rules.find((rule) => rule.tier_key === "vip"), [rules]);

  const loadCrm = useCallback(async () => {
    setLoadError(null);
    const res = await fetchSalonCrmPage();
    if (res.success === false) {
      setLoadError(res.error);
      setLoading(false);
      return;
    }

    setRules(res.rules);
    setTierCounts(res.tierCounts);
    setTotalClients(res.totalClients);
    setRecentActivity(res.recentActivity);
    setLoading(false);
  }, []);

  useEffect(() => {
    void Promise.resolve().then(() => loadCrm());
  }, [loadCrm]);

  function openRulesModal() {
    setDraftRules(
      rules.map((rule) => ({
        tier_key: rule.tier_key,
        min_visits: rule.min_visits,
        enabled: rule.enabled,
      }))
    );
    setShowRulesModal(true);
  }

  async function handleSaveRules() {
    setSavingRules(true);
    const result = await saveSalonLoyaltyRules(draftRules);
    setSavingRules(false);

    if (result.success === false) {
      toast.error(result.error);
      return;
    }

    toast.success("Loyalty visit rules saved.");
    setShowRulesModal(false);
    setLoading(true);
    await loadCrm();
  }

  function updateDraftMinVisits(tierKey: LoyaltyTierKey, value: string) {
    const parsed = Math.max(1, Math.floor(Number(value) || 1));
    setDraftRules((prev) =>
      prev.map((rule) => (rule.tier_key === tierKey ? { ...rule, min_visits: parsed } : rule))
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-brand mb-4" />
        <p className="text-zinc-500 font-medium">Loading CRM data...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-xl mx-auto p-8 text-center space-y-4">
        <h2 className="text-lg font-bold text-zinc-900">CRM could not load</h2>
        <p className="text-sm text-zinc-500">{loadError}</p>
        <Button onClick={() => void loadCrm()} className="rounded-xl font-bold bg-brand text-black">
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
            <MessageSquare className="w-6 h-6 text-brand" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight">CRM & Relationship Center</h1>
            <p className="text-xs text-zinc-500">
              Set visit thresholds for loyalty tiers. VIP badges on Customers follow your rules automatically.
            </p>
          </div>
        </div>

        <Button
          onClick={openRulesModal}
          variant="dark"
          className="h-10 rounded-xl text-xs font-bold gap-1.5 shadow-md"
        >
          <Award className="w-3.5 h-3.5" /> Setup Loyalty Rule
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            <h3 className="text-sm font-bold text-zinc-900 border-b pb-3 flex items-center gap-2">
              <Star className="w-4 h-4 text-brand" />
              Visit-Based Loyalty Rules
            </h3>

            <div className="space-y-4">
              {rules
                .filter((rule) => rule.enabled)
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((rule) => (
                  <div
                    key={rule.tier_key}
                    className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-zinc-100"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center shrink-0 text-lg">
                        {tierEmoji(rule.tier_key)}
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-zinc-800">{rule.tier_label}</h4>
                        <p className="text-[10px] text-zinc-400 mt-0.5">
                          {rule.tier_key === "vip"
                            ? `VIP badge from ${rule.min_visits}+ qualifying visits`
                            : `Display tier from ${rule.min_visits}+ qualifying visits`}
                        </p>
                      </div>
                    </div>

                    <span className="bg-emerald-50 text-emerald-600 font-extrabold text-[8px] tracking-wider uppercase px-2.5 py-1 rounded-full">
                      Active
                    </span>
                  </div>
                ))}
            </div>

            <p className="text-[10px] text-zinc-400 leading-relaxed">
              Qualifying visits exclude cancelled and no-show bookings. Changes apply instantly on Customers and
              here — bookings and payments are not modified.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            <h3 className="text-sm font-bold text-zinc-900 border-b pb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand" />
              Recent Client Activity
            </h3>

            <div className="space-y-4">
              {recentActivity.length === 0 ? (
                <p className="text-xs text-zinc-400">No booking activity yet.</p>
              ) : (
                recentActivity.map((note, idx) => (
                  <div key={idx} className="p-4 bg-zinc-50/50 rounded-2xl border border-zinc-100">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-xs text-zinc-800">{note.client}</span>
                      <span className="text-[9px] text-zinc-400 font-semibold">{note.date}</span>
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-2 leading-relaxed font-sans">{note.note}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-slate-200 text-zinc-900 p-6 rounded-3xl shadow-sm relative overflow-hidden">
            <Award className="absolute -right-6 -bottom-6 w-32 h-32 text-zinc-100 rotate-12" />

            <div className="relative z-10 space-y-6">
              <div>
                <span className="inline-flex bg-zinc-100 text-zinc-600 px-3.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider mb-2">
                  Client Retention
                </span>
                <h3 className="text-base font-bold text-zinc-900">VIP Loyalty Tiers</h3>
                <p className="text-zinc-500 text-[10px] mt-1.5 leading-relaxed">
                  {totalClients} clients tracked · VIP badge at {vipRule?.min_visits ?? "—"}+ visits
                </p>
              </div>

              <div className="space-y-3.5 pt-2">
                {displayRules.map((rule) => (
                  <div key={rule.tier_key} className="flex justify-between items-center text-xs">
                    <span className="text-zinc-600 font-medium">
                      {tierEmoji(rule.tier_key)} {rule.tier_label} ({rule.min_visits}+ visits)
                    </span>
                    <span className={`font-black ${tierCountColor(rule.tier_key)}`}>
                      {tierCounts[rule.tier_key]} clients
                    </span>
                  </div>
                ))}
                <div className="flex justify-between items-center text-xs border-t border-zinc-100 pt-3">
                  <span className="text-zinc-600 font-medium">✨ VIP badge holders</span>
                  <span className="font-black text-violet-600">{tierCounts.vip} clients</span>
                </div>
              </div>

              <Button
                onClick={openRulesModal}
                variant="dark"
                className="w-full font-bold h-11 rounded-xl text-xs gap-1.5"
              >
                View Member Rules <ArrowRight className="w-4 h-4" />
              </Button>

              <Link
                href="/dashboard/customers"
                className="block text-center text-[10px] font-bold text-brand hover:underline"
              >
                Open Customer Database →
              </Link>
            </div>
          </div>
        </div>
      </div>

      <DashboardModal
        open={showRulesModal}
        onClose={() => setShowRulesModal(false)}
        size="md"
        title={
          <span className="flex items-center gap-2">
            <Award className="w-5 h-5 text-brand shrink-0" />
            Loyalty visit rules
          </span>
        }
        description="Set how many qualifying visits a client needs for each tier. VIP badges on the Customers page use the VIP row."
        footer={
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowRulesModal(false)}
              className="rounded-xl font-bold h-11"
            >
              Cancel
            </Button>
              <Button
                type="button"
                onClick={() => void handleSaveRules()}
                disabled={savingRules}
                variant="dark"
                className="rounded-xl font-bold h-11 px-6"
              >
              {savingRules ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Save rules
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {rules
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((rule) => {
              const draft = draftRules.find((row) => row.tier_key === rule.tier_key);
              return (
                <div
                  key={rule.tier_key}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-zinc-100 bg-zinc-50"
                >
                  <div>
                    <p className="text-xs font-bold text-zinc-800">
                      {tierEmoji(rule.tier_key)} {rule.tier_label}
                    </p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">
                      {rule.tier_key === "vip"
                        ? "Shows VIP badge on Customers"
                        : "Highest matching display tier on Customers"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">
                      Min visits
                    </label>
                    <Input
                      type="number"
                      min={1}
                      value={draft?.min_visits ?? rule.min_visits}
                      onChange={(e) => updateDraftMinVisits(rule.tier_key, e.target.value)}
                      className="w-24 h-10 rounded-xl text-center font-bold"
                    />
                  </div>
                </div>
              );
            })}
        </div>
      </DashboardModal>
    </div>
  );
}
