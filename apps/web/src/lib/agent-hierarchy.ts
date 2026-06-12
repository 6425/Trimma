import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeEmail } from "@/lib/normalize-email";
import { normalizePlatformRoleSlug } from "@/lib/role-permissions-core";

export type AgentTier = "regional_head" | "field_agent";

export type AgentHierarchyRow = {
  id: string;
  user_email?: string | null;
  user_id?: string | null;
  agent_tier?: AgentTier | string | null;
  reports_to_agent_id?: string | null;
  sub_agent_split_percent?: number | null;
  commission_rate?: number | null;
  status?: string | null;
  territory?: string | null;
  territory_id?: string | null;
};

export const DEFAULT_SUB_AGENT_SPLIT_PERCENT = 50;

export function normalizeAgentTier(value?: string | null): AgentTier {
  return value === "field_agent" ? "field_agent" : "regional_head";
}

export function isRegionalHeadAgent(
  agent: Pick<AgentHierarchyRow, "agent_tier"> | null | undefined,
  globalRole?: string | null
): boolean {
  if (normalizePlatformRoleSlug(globalRole) === "regional_head") return true;
  return normalizeAgentTier(agent?.agent_tier) === "regional_head";
}

export function clampSplitPercent(value: unknown, fallback = DEFAULT_SUB_AGENT_SPLIT_PERCENT): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(100, Math.max(0, Math.round(parsed * 100) / 100));
}

export function calculateSubAgentShare(grossAmount: number, splitPercent: number): number {
  const gross = Number(grossAmount) || 0;
  const pct = clampSplitPercent(splitPercent, 0);
  return Math.round(gross * (pct / 100) * 100) / 100;
}

export function calculateRegionalHeadNet(grossAmount: number, splitPercent: number): number {
  const gross = Number(grossAmount) || 0;
  return Math.round((gross - calculateSubAgentShare(gross, splitPercent)) * 100) / 100;
}

const AGENT_HIERARCHY_SELECT =
  "id, user_email, user_id, agent_tier, reports_to_agent_id, sub_agent_split_percent, commission_rate, status, territory, territory_id";

export async function findAgentHierarchyRecord(
  supabase: SupabaseClient,
  email: string,
  userId?: string | null
): Promise<AgentHierarchyRow | null> {
  const selectAgent = async (
    filter: { column: "user_id" | "user_email"; value: string; ilike?: boolean }
  ): Promise<AgentHierarchyRow | null> => {
    let query = supabase.from("agents").select(AGENT_HIERARCHY_SELECT);
    query = filter.ilike
      ? query.ilike(filter.column, filter.value)
      : query.eq(filter.column, filter.value);
    const { data, error } = await query.maybeSingle();
    if (error || !data?.id) return null;
    return data as AgentHierarchyRow;
  };

  if (userId) {
    const byUserId = await selectAgent({ column: "user_id", value: userId });
    if (byUserId) return byUserId;
  }

  const normalized = normalizeEmail(email);
  if (!normalized) return null;

  const byEmail = await selectAgent({ column: "user_email", value: normalized });
  if (byEmail) return byEmail;

  return selectAgent({ column: "user_email", value: normalized, ilike: true });
}

export async function getRegionalHeadForAgent(
  supabase: SupabaseClient,
  agent: AgentHierarchyRow | null
): Promise<AgentHierarchyRow | null> {
  if (!agent?.reports_to_agent_id) return null;
  const { data, error } = await supabase
    .from("agents")
    .select(AGENT_HIERARCHY_SELECT)
    .eq("id", agent.reports_to_agent_id)
    .maybeSingle();
  if (error || !data?.id) return null;
  return data as AgentHierarchyRow;
}

export type AgentCommissionAttribution = {
  fieldAgentEmail: string | null;
  payeeEmail: string | null;
  splitPercent: number;
};

export async function resolveAgentCommissionAttribution(
  supabase: SupabaseClient,
  salon: { assign_to?: string | null; onboarding_agent_email?: string | null } | null | undefined
): Promise<AgentCommissionAttribution> {
  const fieldEmail = normalizeEmail(salon?.assign_to || salon?.onboarding_agent_email || "");
  if (!fieldEmail) {
    return { fieldAgentEmail: null, payeeEmail: null, splitPercent: 0 };
  }

  const agent = await findAgentHierarchyRecord(supabase, fieldEmail);
  if (!agent) {
    return { fieldAgentEmail: null, payeeEmail: fieldEmail, splitPercent: 0 };
  }

  const tier = normalizeAgentTier(agent.agent_tier);
  if (tier === "field_agent") {
    const head = await getRegionalHeadForAgent(supabase, agent);
    const payeeEmail = normalizeEmail(head?.user_email || "") || fieldEmail;
    return {
      fieldAgentEmail: fieldEmail,
      payeeEmail,
      splitPercent: clampSplitPercent(agent.sub_agent_split_percent, DEFAULT_SUB_AGENT_SPLIT_PERCENT),
    };
  }

  return { fieldAgentEmail: null, payeeEmail: fieldEmail, splitPercent: 0 };
}

export async function listSubAgentsForRegionalHead(
  supabase: SupabaseClient,
  regionalHeadAgentId: string
): Promise<AgentHierarchyRow[]> {
  const { data, error } = await supabase
    .from("agents")
    .select(AGENT_HIERARCHY_SELECT)
    .eq("reports_to_agent_id", regionalHeadAgentId)
    .eq("agent_tier", "field_agent")
    .order("user_email", { ascending: true });

  if (error || !data) return [];
  return data as AgentHierarchyRow[];
}

export async function getSubAgentEmailsForRegionalHead(
  supabase: SupabaseClient,
  regionalHeadAgentId: string
): Promise<string[]> {
  const subAgents = await listSubAgentsForRegionalHead(supabase, regionalHeadAgentId);
  return subAgents
    .map((row) => normalizeEmail(row.user_email || ""))
    .filter(Boolean);
}

export async function canAgentAccessSalonAssignee(
  supabase: SupabaseClient,
  actorEmail: string,
  actorUserId: string | undefined,
  salonAssignTo: string | null | undefined
): Promise<boolean> {
  const assignee = normalizeEmail(salonAssignTo || "");
  const actor = normalizeEmail(actorEmail);
  if (!assignee || !actor) return false;
  if (assignee === actor) return true;

  const actorAgent = await findAgentHierarchyRecord(supabase, actor, actorUserId);
  if (!actorAgent?.id || !isRegionalHeadAgent(actorAgent)) {
    return false;
  }

  const subEmails = await getSubAgentEmailsForRegionalHead(supabase, actorAgent.id);
  return subEmails.includes(assignee);
}

export async function getAgentOperationalEmails(
  supabase: SupabaseClient,
  email: string,
  userId?: string | null
): Promise<string[]> {
  const normalized = normalizeEmail(email);
  if (!normalized) return [];

  const agent = await findAgentHierarchyRecord(supabase, normalized, userId);
  if (!agent?.id || !isRegionalHeadAgent(agent)) {
    return [normalized];
  }

  const subEmails = await getSubAgentEmailsForRegionalHead(supabase, agent.id);
  return Array.from(new Set([normalized, ...subEmails]));
}
