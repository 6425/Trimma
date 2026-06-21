import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeEmail } from "@/lib/normalize-email";

/** How a salon entered Trimma onboarding (product paths, not DB status). */
export const SALON_ONBOARDING_PATH = {
  /** Owner signs up via /onboarding Google — primary public workflow. */
  SELF_SERVE: "self_serve",
  /** Admin Google discovery → assign agent → pipeline. */
  ADMIN_DISCOVERY: "admin_discovery",
  /** Regional head / partner form lead → agent (via salon_leads or RH team). */
  REGIONAL_HEAD_LEAD: "regional_head_lead",
  /** Field agent discovers or creates a salon from territory tools. */
  AGENT_INITIATED: "agent_initiated",
} as const;

export type SalonOnboardingPath =
  (typeof SALON_ONBOARDING_PATH)[keyof typeof SALON_ONBOARDING_PATH];

/** Values stored on salons.source_type */
export const SALON_SOURCE_TYPE = {
  SELF_SERVE: "self_serve_onboarding",
  GOOGLE_PLACES: "GOOGLE_PLACES",
  MANUAL: "MANUAL",
  AGENT_MANUAL: "agent_manual",
  CSV_IMPORT: "CSV_IMPORT",
} as const;

export const DEFAULT_SELF_SERVE_DISTRICT = "Colombo";

const DISTRICT_AGENT_FALLBACK: Record<string, string> = {
  colombo: "agent-colombo@trimma.io",
  gampaha: "agent-gampaha@trimma.io",
  kandy: "agent-kandy@trimma.io",
  anuradhapura: "agent-anura@trimma.io",
};

const PATH_LABELS: Record<SalonOnboardingPath, string> = {
  [SALON_ONBOARDING_PATH.SELF_SERVE]: "Self onboarding",
  [SALON_ONBOARDING_PATH.ADMIN_DISCOVERY]: "Admin discovery",
  [SALON_ONBOARDING_PATH.REGIONAL_HEAD_LEAD]: "Regional head lead",
  [SALON_ONBOARDING_PATH.AGENT_INITIATED]: "Agent initiated",
};

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
  if (!districtName) return null;
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

/** Resolve a field agent from salon location; falls back to Colombo district agent. */
export async function resolveOnboardingAgentForSalon(
  supabase: SupabaseClient,
  location: { district?: string | null; city?: string | null; address?: string | null }
): Promise<string | null> {
  const candidates = [
    location.district?.trim(),
    location.city?.trim(),
    DEFAULT_SELF_SERVE_DISTRICT,
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    const agent = await resolveOnboardingAgentEmail(supabase, candidate);
    if (agent) return agent;
  }

  return null;
}

export function onboardingPathFromSourceType(
  sourceType: string | null | undefined
): SalonOnboardingPath {
  switch (sourceType) {
    case SALON_SOURCE_TYPE.SELF_SERVE:
      return SALON_ONBOARDING_PATH.SELF_SERVE;
    case SALON_SOURCE_TYPE.GOOGLE_PLACES:
      return SALON_ONBOARDING_PATH.ADMIN_DISCOVERY;
    case SALON_SOURCE_TYPE.AGENT_MANUAL:
      return SALON_ONBOARDING_PATH.AGENT_INITIATED;
    case SALON_SOURCE_TYPE.MANUAL:
    case SALON_SOURCE_TYPE.CSV_IMPORT:
      return SALON_ONBOARDING_PATH.ADMIN_DISCOVERY;
    default:
      return SALON_ONBOARDING_PATH.AGENT_INITIATED;
  }
}

export function getOnboardingPathLabel(path: SalonOnboardingPath): string {
  return PATH_LABELS[path];
}

export function isSelfServeSalon(sourceType: string | null | undefined): boolean {
  return sourceType === SALON_SOURCE_TYPE.SELF_SERVE;
}

/** Status to return owner to after agent rejects profile (path-aware). */
export function ownerResubmitStatusAfterRejection(sourceType: string | null | undefined): string {
  return isSelfServeSalon(sourceType) ? "OWNER_INVITED" : "ASSIGNED_TO_AGENT";
}
