"use client";

import { useMemo, useState } from "react";
import { Loader2, Mail, MessageSquare, Phone, Store, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { SalonRequestRow } from "@/app/actions/salon-requests";

const STATUS_STYLES: Record<SalonRequestRow["status"], string> = {
  new: "bg-amber-100 text-amber-800",
  reviewing: "bg-blue-100 text-blue-800",
  contacted: "bg-indigo-100 text-indigo-800",
  converted: "bg-emerald-100 text-emerald-800",
  closed: "bg-zinc-200 text-zinc-700",
  spam: "bg-red-100 text-red-800",
};

type AssignableUser = {
  email: string;
  full_name?: string | null;
  global_role?: string | null;
};

type SalonRequestLeadSheetProps = {
  requests: SalonRequestRow[];
  loading: boolean;
  agents: AssignableUser[];
  onAssign: (input: {
    id: string;
    origin: SalonRequestRow["origin"];
    assignToEmail: string;
    adminNotes?: string | null;
  }) => Promise<void>;
  onRefresh: () => void;
  searchTerm: string;
};

function formatDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function roleLabel(role: string | null | undefined) {
  switch ((role || "").toLowerCase()) {
    case "regional_head":
      return "Regional Head";
    case "regional_admin":
      return "Regional Admin";
    case "agent":
      return "Field Agent";
    default:
      return role || "Staff";
  }
}

export function SalonRequestLeadSheet({
  requests,
  loading,
  agents,
  onAssign,
  onRefresh,
  searchTerm,
}: SalonRequestLeadSheetProps) {
  const [assignDrafts, setAssignDrafts] = useState<Record<string, string>>({});
  const [notesDrafts, setNotesDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const assignees = useMemo(
    () =>
      agents.filter((user) =>
        ["agent", "regional_head", "regional_admin"].includes(String(user.global_role || "").toLowerCase())
      ),
    [agents]
  );

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return requests;
    return requests.filter(
      (row) =>
        row.full_name.toLowerCase().includes(q) ||
        row.email.toLowerCase().includes(q) ||
        (row.business_name || "").toLowerCase().includes(q) ||
        row.inquiry_type.toLowerCase().includes(q) ||
        row.message.toLowerCase().includes(q) ||
        (row.assign_to || "").toLowerCase().includes(q)
    );
  }, [requests, searchTerm]);

  async function handleAssign(row: SalonRequestRow) {
    const assignToEmail = assignDrafts[row.id] || row.assign_to || "";
    if (!assignToEmail) return;

    setSavingId(row.id);
    try {
      await onAssign({
        id: row.id,
        origin: row.origin,
        assignToEmail,
        adminNotes: notesDrafts[row.id] ?? row.admin_notes,
      });
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="border-t border-zinc-50">
      <div className="px-5 py-3 border-b border-zinc-50 flex justify-end">
        <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
          Refresh requests
        </Button>
      </div>
      <div className="overflow-x-auto w-full max-h-[600px]">
        <table className="w-full text-left border-collapse min-w-[1200px] text-xs">
          <thead className="bg-zinc-50/50 sticky top-0 backdrop-blur-md border-b border-zinc-100 z-10">
            <tr className="text-zinc-500 font-extrabold uppercase tracking-wider text-[10px] h-11">
              <th className="px-4 py-2 pl-6 w-56">Contact</th>
              <th className="px-4 py-2 w-48">Business</th>
              <th className="px-4 py-2 w-40">Source</th>
              <th className="px-4 py-2 w-72">Message</th>
              <th className="px-4 py-2 w-56">Assign To</th>
              <th className="px-4 py-2 w-28">Status</th>
              <th className="px-4 py-2 w-40">Submitted</th>
              <th className="px-4 py-2 pr-6 w-40 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50 font-medium text-zinc-700">
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center py-20 opacity-40">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-brand" />
                  <span>Loading salon requests...</span>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-20 text-zinc-500">
                  No salon requests yet. Run packages/db/SALON_REQUESTS_PATCH.sql if the table is missing.
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr key={`${row.origin}-${row.id}`} className="hover:bg-zinc-50/50 transition-colors align-top">
                  <td className="px-4 py-4 pl-6">
                    <div className="font-bold text-zinc-900">{row.full_name}</div>
                    <div className="flex items-center gap-1.5 text-zinc-600 mt-1">
                      <Mail className="w-3 h-3" />
                      {row.email}
                    </div>
                    {row.phone ? (
                      <div className="flex items-center gap-1.5 text-zinc-500 mt-1">
                        <Phone className="w-3 h-3" />
                        {row.phone}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-4">
                    {row.business_name ? (
                      <>
                        <div className="flex items-center gap-1.5 font-semibold text-zinc-800">
                          <Store className="w-3 h-3" />
                          {row.business_name}
                        </div>
                        {row.business_type ? (
                          <div className="text-[10px] text-zinc-500 mt-1">{row.business_type}</div>
                        ) : null}
                      </>
                    ) : (
                      <span className="text-zinc-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="font-semibold text-zinc-800">{row.inquiry_type}</div>
                    <div className="text-[10px] uppercase tracking-wider text-zinc-400 mt-1">
                      {row.source.replace(/_/g, " ")}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-start gap-1.5 text-zinc-600">
                      <MessageSquare className="w-3 h-3 mt-0.5 shrink-0" />
                      <span className="line-clamp-4 whitespace-pre-wrap">{row.message}</span>
                    </div>
                    <textarea
                      value={notesDrafts[row.id] ?? row.admin_notes ?? ""}
                      onChange={(e) =>
                        setNotesDrafts((prev) => ({ ...prev, [row.id]: e.target.value }))
                      }
                      rows={2}
                      placeholder="Admin notes..."
                      className="mt-2 w-full rounded-lg border border-zinc-200 px-2 py-1.5 text-[11px] resize-none"
                    />
                  </td>
                  <td className="px-4 py-4">
                    <select
                      value={assignDrafts[row.id] ?? row.assign_to ?? ""}
                      onChange={(e) =>
                        setAssignDrafts((prev) => ({ ...prev, [row.id]: e.target.value }))
                      }
                      className="w-full h-9 rounded-lg border border-zinc-200 px-2 text-[11px] bg-white"
                    >
                      <option value="">Select agent or regional head</option>
                      {assignees.map((user) => (
                        <option key={user.email} value={user.email}>
                          {user.full_name || user.email} ({roleLabel(user.global_role)})
                        </option>
                      ))}
                    </select>
                    {row.assign_to ? (
                      <div className="text-[10px] text-zinc-500 mt-1">Current: {row.assign_to}</div>
                    ) : null}
                  </td>
                  <td className="px-4 py-4">
                    <Badge className={`${STATUS_STYLES[row.status]} border-0 capitalize`}>
                      {row.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-4 text-[11px] text-zinc-500 whitespace-nowrap">
                    {formatDate(row.created_at)}
                  </td>
                  <td className="px-4 py-4 pr-6 text-center">
                    <Button
                      size="sm"
                      className="bg-[#ffde5a] hover:bg-[#ffe680] text-black font-bold h-8"
                      disabled={savingId === row.id}
                      onClick={() => void handleAssign(row)}
                    >
                      {savingId === row.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <>
                          <UserPlus className="w-3.5 h-3.5 mr-1" />
                          Assign
                        </>
                      )}
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
