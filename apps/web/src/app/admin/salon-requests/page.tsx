"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchAdminSalonRequests,
  updateAdminSalonRequest,
  type SalonRequestRow,
} from "@/app/actions/salon-requests";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Mail, MessageSquare, Phone, RefreshCw, Store } from "lucide-react";
import { toast } from "sonner";

const STATUS_STYLES: Record<SalonRequestRow["status"], string> = {
  new: "bg-amber-100 text-amber-800",
  reviewing: "bg-blue-100 text-blue-800",
  contacted: "bg-indigo-100 text-indigo-800",
  converted: "bg-emerald-100 text-emerald-800",
  closed: "bg-zinc-200 text-zinc-700",
  spam: "bg-red-100 text-red-800",
};

const STATUS_OPTIONS: SalonRequestRow["status"][] = [
  "new",
  "reviewing",
  "contacted",
  "converted",
  "closed",
  "spam",
];

function formatDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function AdminSalonRequestsPage() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<SalonRequestRow[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selected, setSelected] = useState<SalonRequestRow | null>(null);
  const [editStatus, setEditStatus] = useState<SalonRequestRow["status"]>("new");
  const [editNotes, setEditNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchAdminSalonRequests();
      if (result.success === false) {
        toast.error(result.error);
        return;
      }
      setRequests(result.requests);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(() => loadData());
  }, [loadData]);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return requests.filter((row) => {
      if (statusFilter !== "all" && row.status !== statusFilter) return false;
      if (!q) return true;
      return (
        row.full_name.toLowerCase().includes(q) ||
        row.email.toLowerCase().includes(q) ||
        (row.business_name || "").toLowerCase().includes(q) ||
        row.inquiry_type.toLowerCase().includes(q) ||
        row.message.toLowerCase().includes(q)
      );
    });
  }, [requests, statusFilter, searchTerm]);

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: requests.length };
    STATUS_OPTIONS.forEach((s) => {
      map[s] = requests.filter((r) => r.status === s).length;
    });
    return map;
  }, [requests]);

  function openDetail(row: SalonRequestRow) {
    setSelected(row);
    setEditStatus(row.status);
    setEditNotes(row.admin_notes || "");
  }

  function closeDetail() {
    setSelected(null);
  }

  async function handleSave() {
    if (!selected) return;
    setSaving(true);
    try {
      const result = await updateAdminSalonRequest({
        id: selected.id,
        origin: selected.origin,
        status: editStatus,
        admin_notes: editNotes,
      });
      if (result.success === false) {
        toast.error(result.error);
        return;
      }
      toast.success("Request updated.");
      closeDetail();
      await loadData();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-zinc-900">Salon Requests</h1>
          <p className="text-sm text-zinc-500 font-medium mt-1">
            Onboarding requests and contact form submissions from the public site.
          </p>
        </div>
        <Button variant="outline" onClick={() => void loadData()} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {["all", ...STATUS_OPTIONS].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize transition-colors ${
                statusFilter === status
                  ? "bg-[#ffc800] text-black"
                  : "bg-white border border-zinc-200 text-zinc-600 hover:border-zinc-300"
              }`}
            >
              {status}
              {counts[status] !== undefined ? ` (${counts[status]})` : ""}
            </button>
          ))}
        </div>
        <input
          type="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search name, email, business, message..."
          className="h-10 w-full sm:w-72 rounded-xl border border-zinc-200 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#ffc800]/40"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24 text-zinc-500">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Loading salon requests...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center text-zinc-500">
          {requests.length === 0
            ? "No salon requests yet. Run packages/db/SALON_REQUESTS_PATCH.sql in Supabase if the table is missing, then submit a test from /onboarding or /contact."
            : "No requests match your filters."}
        </div>
      ) : (
        <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 border-b border-zinc-200">
                <tr>
                  <th className="text-left px-4 py-3 font-bold text-zinc-600">Contact</th>
                  <th className="text-left px-4 py-3 font-bold text-zinc-600">Business</th>
                  <th className="text-left px-4 py-3 font-bold text-zinc-600">Inquiry</th>
                  <th className="text-left px-4 py-3 font-bold text-zinc-600">Status</th>
                  <th className="text-left px-4 py-3 font-bold text-zinc-600">Submitted</th>
                  <th className="text-right px-4 py-3 font-bold text-zinc-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id} className="border-b border-zinc-100 hover:bg-zinc-50/80">
                    <td className="px-4 py-4">
                      <div className="font-bold text-zinc-900">{row.full_name}</div>
                      <div className="text-xs text-zinc-500">{row.email}</div>
                      {row.phone ? (
                        <div className="text-xs text-zinc-400 mt-0.5">{row.phone}</div>
                      ) : null}
                    </td>
                    <td className="px-4 py-4 text-zinc-700">
                      {row.business_name ? (
                        <>
                          <div className="font-medium">{row.business_name}</div>
                          {row.business_type ? (
                            <div className="text-xs text-zinc-500">{row.business_type}</div>
                          ) : null}
                        </>
                      ) : (
                        <span className="text-zinc-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-medium text-zinc-800">{row.inquiry_type}</div>
                      <div className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold mt-0.5">
                        {row.source.replace(/_/g, " ")}
                      </div>
                      <div className="text-xs text-zinc-500 line-clamp-2 max-w-xs mt-1">{row.message}</div>
                    </td>
                    <td className="px-4 py-4">
                      <Badge className={`${STATUS_STYLES[row.status]} border-0 capitalize`}>
                        {row.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-xs text-zinc-500 whitespace-nowrap">
                      {formatDate(row.created_at)}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Button size="sm" variant="outline" onClick={() => openDetail(row)}>
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && closeDetail()}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {selected ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-black">{selected.full_name}</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center gap-2 text-zinc-700">
                    <Mail className="w-4 h-4 text-zinc-400 shrink-0" />
                    <a href={`mailto:${selected.email}`} className="font-medium hover:underline">
                      {selected.email}
                    </a>
                  </div>
                  {selected.phone ? (
                    <div className="flex items-center gap-2 text-zinc-700">
                      <Phone className="w-4 h-4 text-zinc-400 shrink-0" />
                      <span>{selected.phone}</span>
                    </div>
                  ) : null}
                  {selected.business_name ? (
                    <div className="flex items-start gap-2 text-zinc-700">
                      <Store className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-medium">{selected.business_name}</div>
                        {selected.business_type ? (
                          <div className="text-xs text-zinc-500">{selected.business_type}</div>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                  <div className="flex items-start gap-2 text-zinc-700">
                    <MessageSquare className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-zinc-900">{selected.inquiry_type}</div>
                      <p className="mt-2 text-zinc-600 whitespace-pre-wrap leading-relaxed">
                        {selected.message}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-zinc-400 pt-2 border-t border-zinc-100">
                  Submitted {formatDate(selected.created_at)}
                  {selected.reviewed_by ? (
                    <> · Last updated by {selected.reviewed_by}</>
                  ) : null}
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                    Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as SalonRequestRow["status"])}
                    className="w-full h-10 rounded-xl border border-zinc-200 px-3 text-sm"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                    Admin notes
                  </label>
                  <textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    rows={4}
                    placeholder="Internal notes for your team..."
                    className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm resize-none"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    className="flex-1 bg-[#ffc800] hover:bg-[#ffd633] text-black font-bold"
                    onClick={() => void handleSave()}
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save changes"
                    )}
                  </Button>
                  <Button type="button" variant="outline" onClick={closeDetail}>
                    Close
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
