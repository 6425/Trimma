"use client";

import React, { useEffect, useState } from "react";
import { Users, Loader2, Percent, Building2, Wallet, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { getAgentTeamData, updateSubAgentSplitPercent, type SubAgentTeamRow } from "@/app/actions/agent-team";
import { formatCommissionLKR } from "@/lib/commission-ledger-format";

export default function RegionalHeadTeamPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subAgents, setSubAgents] = useState<SubAgentTeamRow[]>([]);
  const [draftSplits, setDraftSplits] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const loadTeam = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getAgentTeamData();
      if (!result.success) {
        setError(result.error);
        if (result.error?.includes("authenticated")) {
          router.replace("/login?redirectTo=/regional-head/team");
        }
        return;
      }
      setSubAgents(result.subAgents);
      setDraftSplits(
        Object.fromEntries(result.subAgents.map((row) => [row.id, String(row.splitPercent)]))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load team.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(() => loadTeam());
  }, []);

  const handleSaveSplit = async (subAgentId: string) => {
    const raw = draftSplits[subAgentId];
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
      toast.error("Split must be between 0 and 100.");
      return;
    }

    setSavingId(subAgentId);
    try {
      const result = await updateSubAgentSplitPercent(subAgentId, parsed);
      if (!result.success) throw new Error(result.error);
      toast.success("Sub-agent commission split updated.");
      await loadTeam();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed.");
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-zinc-500 gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        Loading team...
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-zinc-100 p-8 text-center space-y-3">
        <Users className="w-10 h-10 text-zinc-300 mx-auto" />
        <h1 className="text-xl font-bold text-zinc-900">Team Management</h1>
        <p className="text-sm text-zinc-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 tracking-tight">My Sub-Agents</h1>
          <p className="text-sm text-zinc-500 mt-1">
            View field agents on your team and set what share they receive from your agent commission.
          </p>
        </div>
        <Badge className="bg-[#F5B700]/15 text-[#9A7200] border-none font-bold">
          {subAgents.length} sub-agent{subAgents.length === 1 ? "" : "s"}
        </Badge>
      </div>

      {subAgents.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-100 p-10 text-center text-zinc-500">
          No sub-agents assigned yet. Ask an admin to create field agents under your regional head account.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 text-[10px] uppercase tracking-wider text-zinc-500 font-bold">
                <tr>
                  <th className="text-left px-4 py-3">Sub-Agent</th>
                  <th className="text-center px-4 py-3">Salons</th>
                  <th className="text-right px-4 py-3">Booking Gross</th>
                  <th className="text-right px-4 py-3">Sub-Agent Earns</th>
                  <th className="text-right px-4 py-3">Subscription Gross</th>
                  <th className="text-center px-4 py-3">Split %</th>
                  <th className="text-right px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {subAgents.map((row) => (
                  <tr key={row.id} className="border-t border-zinc-50 hover:bg-zinc-50/60">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-zinc-900">{row.email}</div>
                      <div className="text-xs text-zinc-500 capitalize">{row.status}</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 text-zinc-700">
                        <Building2 className="w-3.5 h-3.5 text-zinc-400" />
                        {row.salonCount}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-zinc-700">
                      {formatCommissionLKR(row.bookingGross)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-700">
                      {formatCommissionLKR(row.bookingEarnings)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-zinc-700">
                      {formatCommissionLKR(row.subscriptionGross)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1 max-w-[120px] mx-auto">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={draftSplits[row.id] ?? String(row.splitPercent)}
                          onChange={(e) =>
                            setDraftSplits((prev) => ({ ...prev, [row.id]: e.target.value }))
                          }
                          className="h-9 text-center font-bold"
                        />
                        <Percent className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={savingId === row.id}
                        onClick={() => void handleSaveSplit(row.id)}
                        className="font-bold"
                      >
                        {savingId === row.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Save className="w-3.5 h-3.5 mr-1" />
                            Save
                          </>
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-zinc-100 bg-zinc-50 text-xs text-zinc-500 flex items-start gap-2">
            <Wallet className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Sub-agents receive their split from your gross agent commission. You keep the remainder.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
