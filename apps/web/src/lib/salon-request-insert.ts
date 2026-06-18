import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeEmail } from "@/lib/normalize-email";
import type { OnboardingLeadFormInput } from "@/lib/onboarding-lead-insert";

export type SalonRequestInsertInput = {
  full_name: string;
  email: string;
  phone?: string | null;
  business_name?: string | null;
  business_type?: string | null;
  inquiry_type: string;
  message: string;
  source: string;
  status?: "new" | "reviewing" | "contacted" | "converted" | "closed" | "spam";
  admin_notes?: string | null;
};

export function buildOnboardingSalonRequestMessage(
  formData: OnboardingLeadFormInput,
  leadId?: string
): string {
  const lines = [
    "Salon onboarding request submitted from trimma.io/onboarding.",
    "",
    `Business: ${formData.businessName.trim()}`,
    `Owner: ${formData.ownerName.trim()}`,
    `WhatsApp: ${formData.whatsapp.trim()}`,
    `Location: ${[formData.address, formData.city, formData.district, formData.province].filter(Boolean).join(", ")}`,
  ];

  if (formData.latitude != null && formData.longitude != null) {
    lines.push(`Coordinates: ${formData.latitude}, ${formData.longitude}`);
  }
  if (formData.notes?.trim()) {
    lines.push("", "Notes:", formData.notes.trim());
  }
  if (leadId) {
    lines.push("", `Lead ID: ${leadId}`);
  }

  return lines.join("\n");
}

export function buildOnboardingSalonRequest(
  formData: OnboardingLeadFormInput,
  leadId?: string
): SalonRequestInsertInput {
  return {
    full_name: formData.ownerName.trim(),
    email: normalizeEmail(formData.email),
    phone: formData.whatsapp.trim(),
    business_name: formData.businessName.trim(),
    business_type: "Salon / Beauty Business",
    inquiry_type: "Salon Onboarding Request",
    message: buildOnboardingSalonRequestMessage(formData, leadId),
    source: "onboarding_form",
    status: "new",
    admin_notes: leadId ? `salon_leads:${leadId}` : null,
  };
}

export async function insertSalonRequest(
  supabase: SupabaseClient,
  input: SalonRequestInsertInput
): Promise<{ id: string } | null> {
  const { data, error } = await supabase
    .from("salon_requests")
    .insert({
      full_name: input.full_name,
      email: input.email,
      phone: input.phone || null,
      business_name: input.business_name || null,
      business_type: input.business_type || null,
      inquiry_type: input.inquiry_type,
      message: input.message,
      source: input.source,
      status: input.status || "new",
      admin_notes: input.admin_notes || null,
    })
    .select("id")
    .single();

  if (error) {
    const lower = error.message.toLowerCase();
    if (lower.includes("salon_requests") && (lower.includes("does not exist") || lower.includes("relation"))) {
      console.warn("[insertSalonRequest] salon_requests table missing — run SALON_REQUESTS_PATCH.sql");
      return null;
    }
    throw new Error(error.message);
  }

  return data ? { id: data.id } : null;
}

export async function mirrorOnboardingLeadToSalonRequests(
  supabase: SupabaseClient,
  formData: OnboardingLeadFormInput,
  leadId: string
): Promise<void> {
  try {
    await insertSalonRequest(supabase, buildOnboardingSalonRequest(formData, leadId));
  } catch (err) {
    console.error("[mirrorOnboardingLeadToSalonRequests]", err);
  }
}
