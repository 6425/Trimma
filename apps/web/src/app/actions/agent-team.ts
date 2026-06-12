"use server";

import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { requireAgentFromCookies } from "@/lib/server-agent-auth";
import {
  calculateSubAgentShare,
  clampSplitPercent,
  findAgentHierarchyRecord,
  listSubAgentsForRegionalHead,
  isRegionalHeadAgent,
  normalizeAgentTier,
  type AgentHierarchyRow,
} from "@/lib/agent-hierarchy";
import { normalizeEmail } from "@/lib/normalize-email";

export type SubAgentTeamRow = {
  id: string;
  email: string;
  status: string;
  splitPercent: number;
  salonCount: number;
  bookingGross: number;
  bookingEarnings: number;
  subscriptionGross: number;
  subscriptionEarnings: number;
  totalEarnings: number;
};

export async function getAgentTeamData() {
  const auth = await requireAgentFromCookies();
  if ("error" in auth) return { success: false as const, error: auth.error };

  const supabase = createSupabaseAdminClient();
  const email = normalizeEmail(auth.email);
  const head = await findAgentHierarchyRecord(supabase, email, auth.userId);

  const { data: userRow } = await supabase
    .from("users")
    .select("global_role")
    .eq("email", email)
    .maybeSingle();

  const isHead =
    auth.role === "regional_head" || isRegionalHeadAgent(head, userRow?.global_role);
  if (!isHead || !head?.id) {
    return {
      success: false as const,
      error: head?.id
        ? "Only regional heads can manage a team."
        : "Regional head agent profile is missing. Ask an admin to link your account in Agents.",
    };
  }

  const subAgents = await listSubAgentsForRegionalHead(supabase, head.id);
  const rows = await Promise.all(
    subAgents.map((sub) => buildSubAgentTeamRow(supabase, sub))
  );

  return {
    success: true as const,
    regionalHeadEmail: email,
    subAgents: rows,
  };
}

async function buildSubAgentTeamRow(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  sub: AgentHierarchyRow
): Promise<SubAgentTeamRow> {
  const subEmail = normalizeEmail(sub.user_email || "");
  const splitPercent = clampSplitPercent(sub.sub_agent_split_percent);

  const [salonsRes, bookingsRes, ledgerRes] = await Promise.all([
    supabase.from("salons").select("id").eq("assign_to", subEmail),
    supabase
      .from("bookings")
      .select("agent_commission_amount, platform_commission_amount, agent_commission_percent")
      .ilike("field_agent_email", subEmail),
    supabase
      .from("commission_ledger")
      .select("amount, commission_category")
      .ilike("field_agent_email", subEmail),
  ]);

  const salonCount = (salonsRes.data || []).length;

  let bookingGross = 0;
  for (const row of bookingsRes.data || []) {
    const stored = Number(row.agent_commission_amount) || 0;
    if (stored > 0) {
      bookingGross += stored;
      continue;
    }
    const platform = Number(row.platform_commission_amount) || 0;
    const pct = Number(row.agent_commission_percent) || 0;
    if (platform > 0 && pct > 0) bookingGross += platform * (pct / 100);
  }

  let subscriptionGross = 0;
  for (const row of ledgerRes.data || []) {
    if (String(row.commission_category || "").toLowerCase() !== "subscription") continue;
    subscriptionGross += Number(row.amount) || 0;
  }

  const bookingEarnings = calculateSubAgentShare(bookingGross, splitPercent);
  const subscriptionEarnings = calculateSubAgentShare(subscriptionGross, splitPercent);

  return {
    id: sub.id,
    email: subEmail,
    status: sub.status || "active",
    splitPercent,
    salonCount,
    bookingGross,
    bookingEarnings,
    subscriptionGross,
    subscriptionEarnings,
    totalEarnings: bookingEarnings + subscriptionEarnings,
  };
}

export async function updateSubAgentSplitPercent(subAgentId: string, splitPercent: number) {
  const auth = await requireAgentFromCookies();
  if ("error" in auth) return { success: false as const, error: auth.error };

  const supabase = createSupabaseAdminClient();
  const head = await findAgentHierarchyRecord(supabase, auth.email, auth.userId);

  const { data: userRow } = await supabase
    .from("users")
    .select("global_role")
    .eq("email", normalizeEmail(auth.email))
    .maybeSingle();

  const isHead =
    auth.role === "regional_head" || isRegionalHeadAgent(head, userRow?.global_role);
  if (!isHead || !head?.id) {
    return {
      success: false as const,
      error: head?.id
        ? "Only regional heads can update sub-agent splits."
        : "Regional head agent profile is missing. Ask an admin to link your account in Agents.",
    };
  }

  const { data: subAgent, error: subError } = await supabase
    .from("agents")
    .select("id, user_email, reports_to_agent_id, agent_tier")
    .eq("id", subAgentId)
    .maybeSingle();

  if (subError || !subAgent?.id) {
    return { success: false as const, error: "Sub-agent not found." };
  }

  if (
    subAgent.reports_to_agent_id !== head.id ||
    normalizeAgentTier(subAgent.agent_tier) !== "field_agent"
  ) {
    return { success: false as const, error: "You can only update sub-agents on your team." };
  }

  const nextSplit = clampSplitPercent(splitPercent);
  const { error } = await supabase
    .from("agents")
    .update({ sub_agent_split_percent: nextSplit })
    .eq("id", subAgentId);

  if (error) return { success: false as const, error: error.message };

  await supabase.from("agent_activity_logs").insert({
    actor_email: auth.email,
    agent_email: normalizeEmail(subAgent.user_email || ""),
    action: "SUB_AGENT_SPLIT_UPDATED",
    notes: `Regional head set sub-agent split to ${nextSplit}%.`,
  });

  return { success: true as const, splitPercent: nextSplit };
}
