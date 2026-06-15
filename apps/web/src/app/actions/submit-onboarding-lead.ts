"use server";

import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { sendTriggeredEmail } from "@/app/actions/email-settings";
import { notifyAgentLeadAssigned } from "@/lib/agent-lead-notifications";
import { normalizeEmail } from "@/lib/normalize-email";
import { APP_BASE_URL } from "@/lib/email/config";

export async function submitOnboardingLead(formData: {
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
}) {
  const supabase = createSupabaseAdminClient();

  try {
    let assignedAgent = null;
    const districtLower = formData.district.toLowerCase();

    const agentMap: Record<string, string> = {
      colombo: "agent-colombo@trimma.io",
      gampaha: "agent-gampaha@trimma.io",
      kandy: "agent-kandy@trimma.io",
      anuradhapura: "agent-anura@trimma.io",
    };

    if (agentMap[districtLower]) {
      assignedAgent = agentMap[districtLower];
    }

    const isWaitingList = !assignedAgent;
    const applicantEmail = normalizeEmail(formData.email);

    const { data: newLead, error: insertError } = await supabase
      .from("salon_leads")
      .insert({
        name: formData.businessName,
        owner_name: formData.ownerName,
        owner_email: applicantEmail,
        phone: formData.whatsapp,
        whatsapp_number: formData.whatsapp,
        province: formData.province,
        district: formData.district,
        city: formData.city,
        address: formData.address,
        latitude: formData.latitude,
        longitude: formData.longitude,
        summary: formData.notes,
        assign_to: assignedAgent,
        status: isWaitingList ? "new" : "assigned",
        lead_status: isWaitingList ? "NEW" : "ASSIGNED_TO_AGENT",
        onboarding_stage: "NOT_STARTED",
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Lead insert error:", insertError);
      throw insertError;
    }

    const salonAddress = [formData.address, formData.city, formData.district, formData.province]
      .filter(Boolean)
      .join(", ");

    if (applicantEmail) {
      void sendTriggeredEmail({
        triggerId: "partner-lead-received",
        to: applicantEmail,
        variables: {
          owner_name: formData.ownerName || formData.businessName,
          salon_name: formData.businessName,
          salon_address: salonAddress || "Sri Lanka",
        },
        rateLimitKey: `partner-lead:${newLead.id}`,
        idempotencyKey: `partner-lead/${newLead.id}`,
      }).catch((err) => console.error("Partner lead confirmation email failed:", err));
    }

    if (assignedAgent) {
      void notifyAgentLeadAssigned(supabase, {
        salonId: newLead.id,
        salonName: formData.businessName,
        salonAddress,
        assignToEmail: assignedAgent,
        onboardingStatus: "ASSIGNED_TO_AGENT",
        dashboardLink: `${APP_BASE_URL}/agent/leads`,
      }).catch((err) => console.error("Agent lead assignment notification failed:", err));
    }

    return { success: true as const, leadId: newLead.id, isWaitingList };
  } catch (err: unknown) {
    console.error("Failed to submit onboarding lead:", err);
    const message = err instanceof Error ? err.message : "Failed to submit lead.";
    return { success: false as const, error: message };
  }
}
