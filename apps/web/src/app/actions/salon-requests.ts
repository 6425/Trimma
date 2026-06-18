"use server";

import { adminDbFailure, isAdminDbSuccess, withAdminDb } from "@/lib/with-admin-db";
import { getAdminActorEmail, requirePlatformAdminFromCookies } from "@/lib/server-admin-auth";
import { notifyAgentLeadAssigned } from "@/lib/agent-lead-notifications";
import { normalizeEmail } from "@/lib/normalize-email";
import { APP_BASE_URL } from "@/lib/email/config";

export type SalonRequestOrigin = "salon_requests" | "salon_leads";

export type SalonRequestRow = {
  id: string;
  created_at: string;
  updated_at: string;
  full_name: string;
  email: string;
  phone: string | null;
  business_name: string | null;
  business_type: string | null;
  inquiry_type: string;
  message: string;
  source: string;
  status: "new" | "reviewing" | "contacted" | "converted" | "closed" | "spam";
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  assign_to: string | null;
  origin: SalonRequestOrigin;
};

const SALON_REQUESTS_PATCH = "packages/db/SALON_REQUESTS_PATCH.sql";

function mapLeadStatusToRequestStatus(
  status: string | null | undefined
): SalonRequestRow["status"] {
  switch ((status || "new").toLowerCase()) {
    case "assigned":
      return "reviewing";
    case "contacted":
      return "contacted";
    case "converted":
    case "claimed":
      return "converted";
    case "rejected":
      return "closed";
    default:
      return "new";
  }
}

function mapRequestStatusToLeadStatus(status: SalonRequestRow["status"]): string {
  switch (status) {
    case "reviewing":
      return "assigned";
    case "contacted":
      return "contacted";
    case "converted":
      return "converted";
    case "closed":
    case "spam":
      return "rejected";
    default:
      return "new";
  }
}

function extractLinkedLeadId(adminNotes: string | null | undefined): string | null {
  if (!adminNotes) return null;
  return adminNotes.match(/salon_leads:([0-9a-f-]{36})/i)?.[1] || null;
}

function mapSalonLeadToRequestRow(lead: Record<string, unknown>): SalonRequestRow {
  const createdAt = String(lead.created_at || new Date().toISOString());
  const address = [lead.address, lead.city, lead.district, lead.province].filter(Boolean).join(", ");
  const notes = String(lead.notes || lead.summary || "").trim();
  const messageParts = [
    "Salon onboarding lead (agent pipeline).",
    address ? `Location: ${address}` : null,
    notes ? `Notes: ${notes}` : null,
    lead.assign_to ? `Assigned agent: ${lead.assign_to}` : null,
  ].filter(Boolean);

  return {
    id: String(lead.id),
    created_at: createdAt,
    updated_at: String(lead.updated_at || createdAt),
    full_name: String(lead.owner_name || lead.name || "Unknown"),
    email: String(lead.owner_email || lead.phone || "unknown@trimma.io"),
    phone: (lead.whatsapp_number as string | null) || (lead.phone as string | null) || null,
    business_name: (lead.name as string | null) || null,
    business_type: "Salon / Beauty Business",
    inquiry_type: "Salon Onboarding Request",
    message: messageParts.join("\n"),
    source: String(lead.lead_source || "onboarding_web"),
    status: mapLeadStatusToRequestStatus(lead.status as string | null),
    admin_notes: notes || null,
    reviewed_by: null,
    reviewed_at: null,
    assign_to: (lead.assign_to as string | null) || null,
    origin: "salon_leads",
  };
}

function isOnboardingLead(lead: Record<string, unknown>): boolean {
  const source = String(lead.lead_source || "").toLowerCase();
  if (source.includes("onboarding")) return true;
  if (lead.owner_name || lead.owner_email || lead.whatsapp_number) return true;
  return false;
}

export async function fetchAdminSalonRequests() {
  const result = await withAdminDb(async (supabase) => {
    const { data: requestRows, error: requestError } = await supabase
      .from("salon_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (requestError) {
      const lower = requestError.message.toLowerCase();
      if (lower.includes("salon_requests") && (lower.includes("does not exist") || lower.includes("relation"))) {
        throw new Error(`Run ${SALON_REQUESTS_PATCH} in Supabase SQL Editor to enable Salon Requests.`);
      }
      throw new Error(requestError.message);
    }

    const linkedLeadIds = new Set(
      (requestRows || [])
        .map((row) => extractLinkedLeadId(row.admin_notes))
        .filter((id): id is string => Boolean(id))
    );

    const requests: SalonRequestRow[] = (requestRows || []).map((row) => ({
      ...(row as Omit<SalonRequestRow, "origin">),
      assign_to: (row as { assign_to?: string | null }).assign_to || null,
      origin: "salon_requests" as const,
    }));

    const { data: leadRows, error: leadError } = await supabase
      .from("salon_leads")
      .select(
        "id, created_at, updated_at, name, owner_name, owner_email, phone, whatsapp_number, province, district, city, address, notes, summary, status, assign_to, lead_source"
      )
      .order("created_at", { ascending: false })
      .limit(200);

    if (!leadError && leadRows?.length) {
      for (const lead of leadRows) {
        const leadRecord = lead as Record<string, unknown>;
        const leadId = String(leadRecord.id);
        if (linkedLeadIds.has(leadId)) continue;
        if (!isOnboardingLead(leadRecord)) continue;
        requests.push(mapSalonLeadToRequestRow(leadRecord));
      }
    }

    requests.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return { requests };
  });

  if (!isAdminDbSuccess(result)) return adminDbFailure(result, `Run ${SALON_REQUESTS_PATCH} if Salon Requests is empty.`);
  return { success: true as const, requests: result.data.requests };
}

export async function updateAdminSalonRequest(input: {
  id: string;
  origin: SalonRequestOrigin;
  status: SalonRequestRow["status"];
  admin_notes?: string | null;
}) {
  const result = await withAdminDb(async (supabase) => {
    const auth = await requirePlatformAdminFromCookies();
    if ("error" in auth) throw new Error(auth.error);

    const reviewedBy = await getAdminActorEmail();
    const reviewedAt = new Date().toISOString();

    if (input.origin === "salon_leads") {
      const { error } = await supabase
        .from("salon_leads")
        .update({
          status: mapRequestStatusToLeadStatus(input.status),
          notes: input.admin_notes?.trim() || null,
        })
        .eq("id", input.id);

      if (error) throw new Error(error.message);
      return;
    }

    const { error } = await supabase
      .from("salon_requests")
      .update({
        status: input.status,
        admin_notes: input.admin_notes?.trim() || null,
        reviewed_by: reviewedBy,
        reviewed_at: reviewedAt,
      })
      .eq("id", input.id);

    if (error) throw new Error(error.message);
  });

  if (!isAdminDbSuccess(result)) return adminDbFailure(result);
  return { success: true as const };
}

export async function assignAdminSalonRequest(input: {
  id: string;
  origin: SalonRequestOrigin;
  assignToEmail: string;
  adminNotes?: string | null;
}) {
  const result = await withAdminDb(async (supabase) => {
    const auth = await requirePlatformAdminFromCookies();
    if ("error" in auth) throw new Error(auth.error);

    const assignTo = normalizeEmail(input.assignToEmail);
    if (!assignTo) throw new Error("Select an agent or regional head.");

    const { data: assignee } = await supabase
      .from("users")
      .select("email, global_role, full_name")
      .eq("email", assignTo)
      .maybeSingle();

    if (
      !assignee ||
      !["agent", "regional_head", "regional_admin"].includes(String(assignee.global_role || "").toLowerCase())
    ) {
      throw new Error("Assignee must be a field agent or regional head.");
    }

    const reviewedBy = await getAdminActorEmail();
    const reviewedAt = new Date().toISOString();
    const adminNotes = input.adminNotes?.trim() || null;

    if (input.origin === "salon_leads") {
      const { data: lead, error: leadError } = await supabase
        .from("salon_leads")
        .select("id, name, address, city, district, province")
        .eq("id", input.id)
        .maybeSingle();

      if (leadError) throw new Error(leadError.message);

      const { error } = await supabase
        .from("salon_leads")
        .update({
          assign_to: assignTo,
          status: "assigned",
          lead_status: "ASSIGNED_TO_AGENT",
          notes: adminNotes,
        })
        .eq("id", input.id);

      if (error) throw new Error(error.message);

      const salonAddress = [lead?.address, lead?.city, lead?.district, lead?.province]
        .filter(Boolean)
        .join(", ");

      void notifyAgentLeadAssigned(supabase, {
        salonId: input.id,
        salonName: lead?.name || "Salon onboarding request",
        salonAddress,
        assignToEmail: assignTo,
        onboardingStatus: "ASSIGNED_TO_AGENT",
        dashboardLink: `${APP_BASE_URL}/agent/leads`,
      }).catch((err) => console.error("Salon request assignment notification failed:", err));

      return;
    }

    const { data: requestRow, error: requestFetchError } = await supabase
      .from("salon_requests")
      .select("id, business_name, full_name, message, admin_notes")
      .eq("id", input.id)
      .maybeSingle();

    if (requestFetchError) throw new Error(requestFetchError.message);

    const linkedLeadId = extractLinkedLeadId(requestRow?.admin_notes);
    const mergedNotes = adminNotes || requestRow?.admin_notes || null;

    const updatePayload: Record<string, unknown> = {
      status: "reviewing",
      reviewed_by: reviewedBy,
      reviewed_at: reviewedAt,
      admin_notes: mergedNotes,
    };

    const { error: requestUpdateError } = await supabase
      .from("salon_requests")
      .update({ ...updatePayload, assign_to: assignTo })
      .eq("id", input.id);

    if (requestUpdateError) {
      const lower = requestUpdateError.message.toLowerCase();
      if (lower.includes("assign_to") && lower.includes("does not exist")) {
        const { error: fallbackError } = await supabase
          .from("salon_requests")
          .update(updatePayload)
          .eq("id", input.id);
        if (fallbackError) throw new Error(fallbackError.message);
      } else {
        throw new Error(requestUpdateError.message);
      }
    }

    if (linkedLeadId) {
      await supabase
        .from("salon_leads")
        .update({
          assign_to: assignTo,
          status: "assigned",
          lead_status: "ASSIGNED_TO_AGENT",
        })
        .eq("id", linkedLeadId);
    }

    void notifyAgentLeadAssigned(supabase, {
      salonId: linkedLeadId || input.id,
      salonName: requestRow?.business_name || requestRow?.full_name || "Salon request",
      salonAddress: requestRow?.message || "",
      assignToEmail: assignTo,
      onboardingStatus: "ASSIGNED_TO_AGENT",
      dashboardLink: `${APP_BASE_URL}/agent/leads`,
    }).catch((err) => console.error("Salon request assignment notification failed:", err));
  });

  if (!isAdminDbSuccess(result)) return adminDbFailure(result);
  return { success: true as const };
}
