import type { SupabaseClient } from "@supabase/supabase-js";
import { sendTriggeredEmail } from "@/app/actions/email-settings";
import { sendAgentLeadAssignedWhatsApp } from "@/app/actions/whatsapp";
import { APP_BASE_URL } from "@/lib/email/config";
import {
  findAgentHierarchyRecord,
  getRegionalHeadForAgent,
  isRegionalHeadAgent,
} from "@/lib/agent-hierarchy";
import { normalizeEmail } from "@/lib/normalize-email";

export type AgentLeadNotificationInput = {
  salonId: string;
  salonName: string;
  salonAddress?: string | null;
  assignToEmail: string;
  onboardingStatus?: string;
  dashboardLink?: string;
};

async function loadAgentContact(
  supabase: SupabaseClient,
  email: string
): Promise<{ name: string; phone: string | null }> {
  const normalized = normalizeEmail(email);
  if (!normalized) return { name: email, phone: null };

  const { data: user } = await supabase
    .from("users")
    .select("full_name, phone")
    .eq("email", normalized)
    .maybeSingle();

  return {
    name: user?.full_name || normalized,
    phone: user?.phone || null,
  };
}

async function sendAgentLeadAssignedEmail(
  to: string,
  variables: Record<string, string>,
  idempotencyKey: string
) {
  return sendTriggeredEmail({
    triggerId: "agent-lead-assigned",
    to,
    variables,
    rateLimitKey: `agent-lead:${idempotencyKey}:${to}`,
    idempotencyKey: `agent-lead/${idempotencyKey}/${to}`,
  });
}

export async function notifyRegionalHeadOfTeamEvent(
  supabase: SupabaseClient,
  fieldAgentEmail: string,
  salonName: string,
  eventLabel: string,
  dashboardLink: string,
  idempotencyKey: string
): Promise<void> {
  const agent = await findAgentHierarchyRecord(supabase, fieldAgentEmail);
  if (!agent || isRegionalHeadAgent(agent, null)) return;

  const regionalHead = await getRegionalHeadForAgent(supabase, agent);
  const headEmail = normalizeEmail(regionalHead?.user_email || "");
  if (!headEmail) return;

  const headContact = await loadAgentContact(supabase, headEmail);
  const fieldContact = await loadAgentContact(supabase, fieldAgentEmail);

  await sendAgentLeadAssignedEmail(headEmail, {
    agent_name: headContact.name,
    salon_name: `${salonName} — ${eventLabel} (${fieldContact.name})`,
    salon_address: "",
    onboarding_status: eventLabel,
    dashboard_link: dashboardLink,
  }, `rh-${idempotencyKey}`);

  if (headContact.phone) {
    void sendAgentLeadAssignedWhatsApp(headContact.name, headContact.phone, `${salonName} (${fieldContact.name})`, {
      salonAddress: eventLabel,
      onboardingStatus: eventLabel,
      dashboardLink,
    }).catch((err) => console.error("Regional head lead WhatsApp failed:", err));
  }
}

export async function notifyAgentLeadAssigned(
  supabase: SupabaseClient,
  input: AgentLeadNotificationInput
): Promise<void> {
  const assignTo = normalizeEmail(input.assignToEmail);
  if (!assignTo) return;

  const agentContact = await loadAgentContact(supabase, assignTo);
  const dashboardLink =
    input.dashboardLink || `${APP_BASE_URL}/agent/leads?open=${input.salonId}`;
  const variables = {
    agent_name: agentContact.name,
    salon_name: input.salonName,
    salon_address: input.salonAddress || "TBD",
    onboarding_status: input.onboardingStatus || "ASSIGNED_TO_AGENT",
    dashboard_link: dashboardLink,
  };

  void sendAgentLeadAssignedEmail(assignTo, variables, input.salonId).catch((err) => {
    console.error("Agent lead assignment email failed:", err);
  });

  if (agentContact.phone) {
    void sendAgentLeadAssignedWhatsApp(
      agentContact.name,
      agentContact.phone,
      input.salonName,
      {
        salonAddress: variables.salon_address,
        onboardingStatus: variables.onboarding_status,
        dashboardLink,
      }
    ).catch((err) => console.error("Agent lead assignment WhatsApp failed:", err));
  }

  void notifyRegionalHeadOfTeamEvent(
    supabase,
    assignTo,
    input.salonName,
    "New lead assigned",
    `${APP_BASE_URL}/regional-head`,
    input.salonId
  ).catch((err) => console.error("Regional head lead notification failed:", err));
}

export type OwnerSubmissionNotificationInput = {
  salonId: string;
  salonName: string;
  salonAddress?: string | null;
  assignToEmail: string | null;
  sourceType?: string | null;
};

/** Fired when an owner submits their profile for booking approval (OWNER_ACTIVATED). */
export async function notifyOwnerSubmittedForBookingApproval(
  supabase: SupabaseClient,
  input: OwnerSubmissionNotificationInput
): Promise<void> {
  const assignTo = normalizeEmail(input.assignToEmail || "");
  const dashboardLink = `${APP_BASE_URL}/agent/leads?open=${input.salonId}`;
  const eventLabel = "Owner submitted for booking approval";

  if (!assignTo) {
    console.warn(
      `Owner submission for salon ${input.salonId} has no assign_to — admin must review in pipeline.`
    );
    return;
  }

  await notifyAgentLeadAssigned(supabase, {
    salonId: input.salonId,
    salonName: input.salonName,
    salonAddress: input.salonAddress || "Owner completed self onboarding profile",
    assignToEmail: assignTo,
    onboardingStatus: "OWNER_ACTIVATED",
    dashboardLink,
  });

  void notifyRegionalHeadOfTeamEvent(
    supabase,
    assignTo,
    input.salonName,
    eventLabel,
    dashboardLink,
    `owner-submit-${input.salonId}`
  ).catch((err) => console.error("Regional head owner submission notification failed:", err));
}
