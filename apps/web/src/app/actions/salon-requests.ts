"use server";

import { adminDbFailure, isAdminDbSuccess, withAdminDb } from "@/lib/with-admin-db";
import { getAdminActorEmail, requirePlatformAdminFromCookies } from "@/lib/server-admin-auth";

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
    reviewed_by: (lead.assign_to as string | null) || null,
    reviewed_at: null,
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
