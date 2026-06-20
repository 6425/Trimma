import { cookies } from "next/headers";
import { createSupabaseAdminClient } from "@/config/supabase-admin";
import type { TrimmaUserRole } from "@/lib/auth-routes";
import { ensureSalonOwnerAccess } from "@/lib/ensure-salon-owner-access";
import { forceSalonOwnerUpgrade } from "@/lib/force-salon-owner-upgrade";
import { normalizeEmail } from "@/lib/normalize-email";
import { pickHighestRole } from "@/lib/trimma-role-core";
import { resolveTrimmaUserRoleServer } from "@/lib/trimma-role-server";
import type { SupabaseClient } from "@supabase/supabase-js";

export type SalonOwnerContext = {
  accessToken: string;
  email: string;
  userId: string;
  role: TrimmaUserRole;
  salon: Record<string, unknown>;
  salonId: string;
};

function readRoleFromCookieValue(value: string | undefined): TrimmaUserRole | null {
  if (!value) return null;
  try {
    const decoded = decodeURIComponent(value).toLowerCase();
    if (decoded === "superadmin") return "admin";
    if (decoded === "regional_admin") return "regional_head";
    if (
      decoded === "admin" ||
      decoded === "regional_head" ||
      decoded === "salon_owner" ||
      decoded === "agent" ||
      decoded === "customer"
    ) {
      return decoded;
    }
    return null;
  } catch {
    return null;
  }
}

export async function getSalonAccessTokenFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  let chunkedToken = "";
  for (let i = 0; i < 5; i++) {
    const chunk = cookieStore.get(`sb-access-token.${i}`)?.value;
    if (chunk) chunkedToken += chunk;
  }

  const raw = chunkedToken || cookieStore.get("sb-access-token")?.value;
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export async function getSalonOwnerEmailFromCookies(): Promise<string | null> {
  const accessToken = await getSalonAccessTokenFromCookies();
  if (!accessToken) return null;

  try {
    const supabase = createSupabaseAdminClient();
    const {
      data: { user },
    } = await supabase.auth.getUser(accessToken);
    return normalizeEmail(user?.email) || null;
  } catch {
    return null;
  }
}

export async function findOwnerSalon(
  supabase: SupabaseClient,
  email: string
): Promise<Record<string, unknown> | null> {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;

  const { data: byOwnerEmail, error: ownerEmailError } = await supabase
    .from("salons")
    .select("*")
    .ilike("owner_email", normalized)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (ownerEmailError) throw new Error(ownerEmailError.message);
  if (byOwnerEmail) return byOwnerEmail as Record<string, unknown>;

  const { data: byOwnerGmail, error: ownerGmailError } = await supabase
    .from("salons")
    .select("*")
    .ilike("owner_gmail", normalized)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (ownerGmailError) throw new Error(ownerGmailError.message);
  return (byOwnerGmail as Record<string, unknown> | null) ?? null;
}

async function loadSalonById(
  supabase: SupabaseClient,
  salonId: string
): Promise<Record<string, unknown> | null> {
  const { data, error } = await supabase.from("salons").select("*").eq("id", salonId).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as Record<string, unknown> | null) ?? null;
}

/** Resolve salon owner session, role, and linked salon (auto-provision when allowed). */
export async function requireSalonOwnerFromCookies(): Promise<
  SalonOwnerContext | { error: string }
> {
  const accessToken = await getSalonAccessTokenFromCookies();
  if (!accessToken) {
    return { error: "Please sign in to access your salon dashboard." };
  }

  const cookieStore = await cookies();
  const cookieRole = readRoleFromCookieValue(cookieStore.get("user-role")?.value);

  const supabase = createSupabaseAdminClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(accessToken);

  if (userError || !user?.email) {
    return { error: "Your session expired. Please sign in again." };
  }

  const email = normalizeEmail(user.email)!;
  const dbRole = (await resolveTrimmaUserRoleServer(user.id, email)) ?? "customer";
  const effectiveRole = pickHighestRole(dbRole, cookieRole) ?? dbRole;

  const canUseSalonDashboard =
    effectiveRole === "salon_owner" || effectiveRole === "admin" || cookieRole === "salon_owner";

  if (!canUseSalonDashboard) {
    return {
      error:
        "Your account does not have salon owner access. Start at /onboarding to register your salon.",
    };
  }

  let salon: Record<string, unknown> | null;
  try {
    await ensureSalonOwnerAccess(supabase, email);
    salon = await findOwnerSalon(supabase, email);

    const shouldAutoProvision =
      !salon?.id && (effectiveRole === "salon_owner" || cookieRole === "salon_owner");

    if (shouldAutoProvision) {
      const upgraded = await forceSalonOwnerUpgrade(
        supabase,
        user.id,
        email,
        (user.user_metadata?.full_name as string | undefined) ||
          (user.user_metadata?.first_name as string | undefined),
        (user.user_metadata?.avatar_url as string | undefined) ?? null
      );

      salon = (await findOwnerSalon(supabase, email)) || (await loadSalonById(supabase, upgraded.salonId));
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not load your salon.";
    return { error: message };
  }

  if (!salon?.id) {
    return {
      error:
        "No salon is linked to your account yet. Open /onboarding and sign in with Google to create your salon workspace.",
    };
  }

  return {
    accessToken,
    email,
    userId: user.id,
    role: effectiveRole === "admin" ? "admin" : "salon_owner",
    salon,
    salonId: String(salon.id),
  };
}
