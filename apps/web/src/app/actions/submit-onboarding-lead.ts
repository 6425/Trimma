"use server";

import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { sendTriggeredEmail } from "@/app/actions/email-settings";
import { notifyAgentLeadAssigned } from "@/lib/agent-lead-notifications";
import {
  insertOnboardingSalonLead,
  type OnboardingLeadFormInput,
} from "@/lib/onboarding-lead-insert";
import { mirrorOnboardingLeadToSalonRequests } from "@/lib/salon-request-insert";
import { APP_BASE_URL } from "@/lib/email/config";

export async function submitOnboardingLead(formData: OnboardingLeadFormInput) {
  const supabase = createSupabaseAdminClient();

  try {
    const { id: leadId, assignedAgent, isWaitingList } = await insertOnboardingSalonLead(
      supabase,
      formData
    );

    await mirrorOnboardingLeadToSalonRequests(supabase, formData, leadId);

    const salonAddress = [formData.address, formData.city, formData.district, formData.province]
      .filter(Boolean)
      .join(", ");

    const applicantEmail = formData.email.trim().toLowerCase();
    if (applicantEmail) {
      void sendTriggeredEmail({
        triggerId: "partner-lead-received",
        to: applicantEmail,
        variables: {
          owner_name: formData.ownerName || formData.businessName,
          salon_name: formData.businessName,
          salon_address: salonAddress || "Sri Lanka",
        },
        rateLimitKey: `partner-lead:${leadId}`,
        idempotencyKey: `partner-lead/${leadId}`,
      }).catch((err) => console.error("Partner lead confirmation email failed:", err));
    }

    if (assignedAgent) {
      void notifyAgentLeadAssigned(supabase, {
        salonId: leadId,
        salonName: formData.businessName,
        salonAddress,
        assignToEmail: assignedAgent,
        onboardingStatus: "ASSIGNED_TO_AGENT",
        dashboardLink: `${APP_BASE_URL}/agent/leads`,
      }).catch((err) => console.error("Agent lead assignment notification failed:", err));
    }

    return { success: true as const, leadId, isWaitingList };
  } catch (err: unknown) {
    console.error("Failed to submit onboarding lead:", err);
    const message = err instanceof Error ? err.message : "Failed to submit lead.";
    return { success: false as const, error: message };
  }
}
