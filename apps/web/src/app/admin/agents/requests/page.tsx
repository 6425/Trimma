"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchAdminAgentRequests,
  provisionAgentFromRequest,
  updateAdminAgentRequest,
  type AgentRequestRow,
} from "@/app/actions/agent-requests";
import { listRegionalHeadAgentsForAdmin } from "@/app/actions/admin-operations";
import { LocationHierarchySelect } from "../../../../components/locations/LocationHierarchySelect";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Loader2, Pencil, RefreshCw, UserCheck, X } from "lucide-react";
import { toast } from "sonner";
import { SRI_LANKA_PROVINCES } from "@/lib/sri-lanka-locations";

const STATUS_STYLES: Record<AgentRequestRow["status"], string> = {
  pending: "bg-amber-100 text-amber-800",
  reviewing: "bg-blue-100 text-blue-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
  provisioned: "bg-zinc-900 text-white",
};

type EditForm = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  province: string;
  district: string;
  city: string;
  address: string;
  nic_no: string;
  account_details: string;
  status: AgentRequestRow["status"];
  admin_notes: string;
  assigned_regional_head_id: string;
  commission_rate: string;
  sub_agent_split_percent: string;
  temp_password: string;
};

function toEditForm(row: AgentRequestRow): EditForm {
  return {
    first_name: row.first_name,
    last_name: row.last_name,
    email: row.email,
    phone: row.phone || "",
    province: row.province,
    district: row.district,
    city: row.city || "",
    address: row.address,
    nic_no: row.nic_no,
    account_details: row.account_details,
    status: row.status,
    admin_notes: row.admin_notes || "",
    assigned_regional_head_id: row.assigned_regional_head_id || "",
    commission_rate: String(row.commission_rate ?? 10),
    sub_agent_split_percent: String(row.sub_agent_split_percent ?? 50),
    temp_password: "",
  };
}

export default function AdminAgentRequestsPage() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<AgentRequestRow[]>([]);
  const [regionalHeads, setRegionalHeads] = useState<Array<{ id: string; user_email: string }>>([]);
  const [selected, setSelected] = useState<AgentRequestRow | null>(null);
  const [form, setForm] = useState<EditForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [provisioning, setProvisioning] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [requestsResult, headsResult] = await Promise.all([
        fetchAdminAgentRequests(),
        listRegionalHeadAgentsForAdmin(),
      ]);

      if (requestsResult.success === false) {
        toast.error(requestsResult.error);
        return;
      }
      setRequests(requestsResult.requests);

      if (headsResult.success) {
        setRegionalHeads(headsResult.heads);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(() => loadData());
  }, [loadData]);

  const filtered = useMemo(() => {
    if (statusFilter === "all") return requests;
    return requests.filter((r) => r.status === statusFilter);
  }, [requests, statusFilter]);

  const headEmailById = useMemo(() => {
    const map = new Map<string, string>();
    regionalHeads.forEach((h) => map.set(h.id, h.user_email));
    return map;
  }, [regionalHeads]);

  function openEdit(row: AgentRequestRow) {
    setSelected(row);
    setForm(toEditForm(row));
  }

  function closeEdit() {
    setSelected(null);
    setForm(null);
  }

  async function handleSave() {
    if (!selected || !form) return;
    setSaving(true);
    try {
      const result = await updateAdminAgentRequest({
        id: selected.id,
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        phone: form.phone || null,
        province: form.province,
        district: form.district,
        city: form.city || null,
        address: form.address,
        nic_no: form.nic_no,
        account_details: form.account_details,
        status: form.status,
        admin_notes: form.admin_notes || null,
        assigned_regional_head_id: form.assigned_regional_head_id || null,
        commission_rate: Number(form.commission_rate) || 10,
        sub_agent_split_percent: Number(form.sub_agent_split_percent) || 50,
      });

      if (result.success === false) {
        toast.error(result.error);
        return;
      }

      toast.success("Application updated.");
      closeEdit();
      await loadData();
    } finally {
      setSaving(false);
    }
  }

  async function handleProvision() {
    if (!selected || !form) return;
    if (!form.assigned_regional_head_id) {
      toast.error("Assign a regional head before provisioning.");
      return;
    }
    if (!form.temp_password || form.temp_password.length < 6) {
      toast.error("Enter a temporary password (min 6 characters).");
      return;
    }

    setProvisioning(true);
    try {
      const result = await provisionAgentFromRequest({
        id: selected.id,
        password: form.temp_password,
        assigned_regional_head_id: form.assigned_regional_head_id,
        commission_rate: Number(form.commission_rate) || 10,
        sub_agent_split_percent: Number(form.sub_agent_split_percent) || 50,
      });

      if (result.success === false) {
        toast.error(result.error);
        return;
      }

      toast.success(result.message);
      closeEdit();
      await loadData();
    } finally {
      setProvisioning(false);
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-zinc-900">Agent Requests</h1>
          <p className="text-sm text-zinc-500 font-medium mt-1">
            Review career applications from the public careers page and provision field agents.
          </p>
        </div>
        <Button variant="outline" onClick={() => void loadData()} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {["all", "pending", "reviewing", "approved", "rejected", "provisioned"].map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize transition-colors ${
              statusFilter === status
                ? "bg-[#ffde5a] text-black"
                : "bg-white border border-zinc-200 text-zinc-600 hover:border-zinc-300"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24 text-zinc-500">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Loading applications...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center text-zinc-500">
          No agent requests found.
        </div>
      ) : (
        <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 border-b border-zinc-200">
                <tr>
                  <th className="text-left px-4 py-3 font-bold text-zinc-600">Applicant</th>
                  <th className="text-left px-4 py-3 font-bold text-zinc-600">Territory</th>
                  <th className="text-left px-4 py-3 font-bold text-zinc-600">Regional Head</th>
                  <th className="text-left px-4 py-3 font-bold text-zinc-600">Status</th>
                  <th className="text-left px-4 py-3 font-bold text-zinc-600">Submitted</th>
                  <th className="text-right px-4 py-3 font-bold text-zinc-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id} className="border-b border-zinc-100 hover:bg-zinc-50/80">
                    <td className="px-4 py-4">
                      <div className="font-bold text-zinc-900">
                        {row.first_name} {row.last_name}
                      </div>
                      <div className="text-xs text-zinc-500">{row.email}</div>
                    </td>
                    <td className="px-4 py-4 text-zinc-700">
                      {row.district}
                      {row.city ? `, ${row.city}` : ""}
                    </td>
                    <td className="px-4 py-4 text-zinc-600 text-xs">
                      {row.assigned_regional_head_id
                        ? headEmailById.get(row.assigned_regional_head_id) || "Assigned"
                        : "—"}
                    </td>
                    <td className="px-4 py-4">
                      <Badge className={`${STATUS_STYLES[row.status]} border-0 capitalize`}>
                        {row.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-xs text-zinc-500">
                      {new Date(row.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Button size="sm" variant="outline" onClick={() => openEdit(row)}>
                        <Pencil className="w-3.5 h-3.5 mr-1.5" />
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={!!selected && !!form} onOpenChange={(open) => !open && closeEdit()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Agent Request</DialogTitle>
          </DialogHeader>

          {form && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-500">First Name</label>
                  <Input
                    value={form.first_name}
                    onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-500">Last Name</label>
                  <Input
                    value={form.last_name}
                    onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-500">Email</label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-500">Phone</label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
              </div>

              <LocationHierarchySelect
                province={form.province || SRI_LANKA_PROVINCES[0]?.name || ""}
                district={form.district}
                city={form.city}
                onProvinceChange={(value) => setForm({ ...form, province: value })}
                onDistrictChange={(value) => setForm({ ...form, district: value })}
                onCityChange={(value) => setForm({ ...form, city: value })}
                showCity
              />

              <div>
                <label className="text-xs font-semibold text-zinc-500">Address</label>
                <textarea
                  rows={2}
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-500">NIC No</label>
                <Input value={form.nic_no} onChange={(e) => setForm({ ...form, nic_no: e.target.value })} />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-500">Account Details</label>
                <textarea
                  rows={3}
                  value={form.account_details}
                  onChange={(e) => setForm({ ...form, account_details: e.target.value })}
                  className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-500">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value as AgentRequestRow["status"] })
                    }
                    className="w-full h-10 rounded-md border border-zinc-200 px-3 text-sm"
                  >
                    <option value="pending">Pending</option>
                    <option value="reviewing">Reviewing</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="provisioned">Provisioned</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-500">Assign Regional Head *</label>
                  <select
                    value={form.assigned_regional_head_id}
                    onChange={(e) =>
                      setForm({ ...form, assigned_regional_head_id: e.target.value })
                    }
                    className="w-full h-10 rounded-md border border-zinc-200 px-3 text-sm"
                  >
                    <option value="">Select regional head</option>
                    {regionalHeads.map((head) => (
                      <option key={head.id} value={head.id}>
                        {head.user_email}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-500">Commission Rate (%)</label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={form.commission_rate}
                    onChange={(e) => setForm({ ...form, commission_rate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-500">Sub-agent Split (%)</label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={form.sub_agent_split_percent}
                    onChange={(e) => setForm({ ...form, sub_agent_split_percent: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-500">Admin Notes</label>
                <textarea
                  rows={2}
                  value={form.admin_notes}
                  onChange={(e) => setForm({ ...form, admin_notes: e.target.value })}
                  className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm"
                />
              </div>

              {form.status !== "provisioned" && (
                <div>
                  <label className="text-xs font-semibold text-zinc-500">
                    Temporary Password (for Approve &amp; Provision)
                  </label>
                  <Input
                    type="password"
                    value={form.temp_password}
                    onChange={(e) => setForm({ ...form, temp_password: e.target.value })}
                    placeholder="Min 6 characters"
                  />
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-2">
                <Button onClick={() => void handleSave()} disabled={saving || provisioning}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Save Changes
                </Button>
                {form.status !== "provisioned" && (
                  <Button
                    className="bg-[#ffde5a] hover:bg-[#ffe680] text-black"
                    onClick={() => void handleProvision()}
                    disabled={saving || provisioning}
                  >
                    {provisioning ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <UserCheck className="w-4 h-4 mr-2" />
                    )}
                    Approve &amp; Provision Agent
                  </Button>
                )}
                <Button variant="ghost" onClick={closeEdit}>
                  <X className="w-4 h-4 mr-2" />
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
