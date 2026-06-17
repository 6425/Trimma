import { createHash, randomBytes } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeEmail } from "@/lib/normalize-email";

export type OnboardingLeadFormInput = {
  businessName: string;
  ownerName: string;
  email: string;
  whatsapp: string;
  province: string;
  district: string;
  city: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  notes: string;
};

const DISTRICT_AGENT_FALLBACK: Record<string, string> = {
  colombo: "agent-colombo@trimma.io",
  gampaha: "agent-gampaha@trimma.io",
  kandy: "agent-kandy@trimma.io",
  anuradhapura: "agent-anura@trimma.io",
};

export function createOnboardingPlaceId(seed: string) {
  const digest = createHash("sha256").update(seed).digest("hex").slice(0, 20);
  return `onboarding_${digest}_${randomBytes(4).toString("hex")}`;
}

export function validateOnboardingLeadInput(formData: OnboardingLeadFormInput): string | null {
  if (!formData.businessName?.trim()) return "Business name is required.";
  if (!formData.ownerName?.trim()) return "Owner name is required.";
  const email = normalizeEmail(formData.email);
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "A valid business email is required.";
  if (!formData.whatsapp?.trim()) return "WhatsApp number is required.";
  if (!formData.address?.trim()) return "Address is required.";
  if (!formData.province?.trim() || !formData.district?.trim()) return "Province and district are required.";
  return null;
}

async function userEmailExists(
  supabase: SupabaseClient,
  email: string | null | undefined
): Promise<string | null> {
  const normalized = normalizeEmail(email || "");
  if (!normalized) return null;

  const { data } = await supabase.from("users").select("email").eq("email", normalized).maybeSingle();
  return data?.email ? normalized : null;
}

export async function resolveOnboardingAgentEmail(
  supabase: SupabaseClient,
  district: string
): Promise<string | null> {
  const districtName = district.trim();
  const districtKey = districtName.toLowerCase();

  try {
    const { data: agentRows, error } = await supabase
      .from("agents")
      .select("user_email, territory, status")
      .eq("status", "active");

    if (!error) {
      for (const row of agentRows || []) {
        const territory = String(row.territory || "").trim().toLowerCase();
        if (!territory) continue;
        if (!territory.includes(districtKey) && territory !== districtKey) continue;

        const verified = await userEmailExists(supabase, row.user_email);
        if (verified) return verified;
      }
    }
  } catch {
    // Fall through to hardcoded district agents.
  }

  const fallback = DISTRICT_AGENT_FALLBACK[districtKey];
  if (fallback) {
    const verified = await userEmailExists(supabase, fallback);
    if (verified) return verified;
  }

  return null;
}

function isMissingColumnError(message: string, column: string) {
  const lower = message.toLowerCase();
  return lower.includes(column.toLowerCase()) && lower.includes("does not exist");
}

function stripOptionalLeadColumns(payload: Record<string, unknown>) {
  const next = { ...payload };
  for (const key of [
    "owner_name",
    "owner_email",
    "whatsapp_number",
    "province",
    "district",
    "city",
    "notes",
    "lead_source",
    "lead_status",
    "onboarding_stage",
    "latitude",
    "longitude",
  ]) {
    delete next[key];
  }
  return next;
}

export async function insertOnboardingSalonLead(
  supabase: SupabaseClient,
  formData: OnboardingLeadFormInput
): Promise<{ id: string; assignedAgent: string | null; isWaitingList: boolean }> {
  const validationError = validateOnboardingLeadInput(formData);
  if (validationError) throw new Error(validationError);

  const applicantEmail = normalizeEmail(formData.email);
  const assignedAgent = await resolveOnboardingAgentEmail(supabase, formData.district);
  const isWaitingList = !assignedAgent;

  const placeId = createOnboardingPlaceId(
    `${applicantEmail}|${formData.businessName.trim().toLowerCase()}|${Date.now()}`
  );

  let payload: Record<string, unknown> = {
    place_id: placeId,
    name: formData.businessName.trim(),
    owner_name: formData.ownerName.trim(),
    owner_email: applicantEmail,
    phone: formData.whatsapp.trim(),
    whatsapp_number: formData.whatsapp.trim(),
    province: formData.province.trim(),
    district: formData.district.trim(),
    city: (formData.city || formData.address).trim(),
    address: formData.address.trim(),
    latitude: formData.latitude,
    longitude: formData.longitude,
    summary: formData.notes?.trim() || null,
    notes: formData.notes?.trim() || null,
    assign_to: assignedAgent,
    status: isWaitingList ? "new" : "assigned",
    lead_status: isWaitingList ? "NEW" : "ASSIGNED_TO_AGENT",
    onboarding_stage: "NOT_STARTED",
    lead_source: "onboarding_web",
    role: "salon_owner",
  };

  let lastError: string | null = null;

  for (let attempt = 0; attempt < 6; attempt++) {
    const { data, error } = await supabase
      .from("salon_leads")
      .insert(payload)
      .select("id")
      .single();

    if (!error && data?.id) {
      return { id: data.id, assignedAgent, isWaitingList };
    }

    const message = error?.message || "Insert failed";
    lastError = message;
    const lower = message.toLowerCase();

    if (lower.includes("assign_to") || lower.includes("foreign key constraint")) {
      payload = {
        ...payload,
        assign_to: null,
        status: "new",
        lead_status: "NEW",
      };
      continue;
    }

    if (lower.includes("check_lead_status") || lower.includes("lead_status")) {
      delete payload.lead_status;
      continue;
    }

    if (lower.includes("check_onboarding_stage") || lower.includes("onboarding_stage")) {
      delete payload.onboarding_stage;
      continue;
    }

    if (lower.includes("place_id") && (lower.includes("not-null") || lower.includes("null value"))) {
      payload.place_id = createOnboardingPlaceId(`${placeId}-${attempt}`);
      continue;
    }

    if (lower.includes("does not exist")) {
      if (isMissingColumnError(message, "owner_name")) payload = stripOptionalLeadColumns(payload);
      else if (isMissingColumnError(message, "lead_source")) delete payload.lead_source;
      else if (isMissingColumnError(message, "notes")) delete payload.notes;
      else payload = stripOptionalLeadColumns(payload);
      continue;
    }

    break;
  }

  throw new Error(lastError || "Could not save your onboarding request.");
}
