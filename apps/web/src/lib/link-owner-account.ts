import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { ensureSalonOwnerAccess } from "@/lib/ensure-salon-owner-access";
import { normalizeEmail } from "@/lib/normalize-email";
import { provisionSelfServeSalonOwner } from "@/lib/provision-self-serve-salon";
import { syncUserRolesForGlobalRole } from "@/lib/sync-user-role";
import type { TrimmaUserRole } from "@/lib/auth-routes";
import { pickHighestRole } from "@/lib/trimma-role";

export type LinkOwnerResult = {
  linked: boolean;
  role: TrimmaUserRole;
  onboardingStatus: string | null;
  salonId: string | null;
  salonName: string | null;
  isNewUser: boolean;
};

function getAdminClient() {
  try {
    return createSupabaseAdminClient();
  } catch {
    return null;
  }
}

async function resolveDbRole(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  authUserId: string,
  normalizedEmail: string
): Promise<TrimmaUserRole | null> {
  const [{ data: roleRows }, { data: userRows }] = await Promise.all([
    admin.from("user_roles").select("role").eq("user_id", authUserId),
    admin.from("users").select("global_role").ilike("email", normalizedEmail),
  ]);

  return pickHighestRole(
    ...(roleRows || []).map((row) => row.role),
    ...(userRows || []).map((row) => row.global_role)
  );
}

/** Link salon owner account, sync roles, and ensure subscription plan on sign-in. */
export async function linkInvitedOwnerAccount(
  authUserId: string,
  email: string | null | undefined,
  fullName?: string | null,
  avatarUrl?: string | null,
  options?: { salonOwnerIntent?: boolean }
): Promise<LinkOwnerResult> {
  const normalizedEmail = normalizeEmail(email);
  const fallbackRole: TrimmaUserRole = "customer";

  if (!normalizedEmail) {
    return { linked: false, role: fallbackRole, onboardingStatus: null, salonId: null, salonName: null, isNewUser: false };
  }

  const admin = getAdminClient();
  if (!admin) {
    if (options?.salonOwnerIntent) {
      throw new Error("Salon owner sign-in is temporarily unavailable. Please try again shortly.");
    }
    return { linked: false, role: fallbackRole, onboardingStatus: null, salonId: null, salonName: null, isNewUser: false };
  }

  const { data: userRows } = await admin
    .from("users")
    .select("global_role, full_name")
    .ilike("email", normalizedEmail)
    .limit(1);

  const userRow = userRows?.[0] ?? null;

  const isNewUser = !userRow;

  let role = (await resolveDbRole(admin, authUserId, normalizedEmail)) || fallbackRole;

  let { linked, salonId } = await ensureSalonOwnerAccess(admin, normalizedEmail);

  if (options?.salonOwnerIntent && !salonId) {
    const provisioned = await provisionSelfServeSalonOwner(
      admin,
      authUserId,
      normalizedEmail,
      fullName
    );
    salonId = provisioned.salonId;
    linked = true;
  }

  if (linked && salonId && role !== "admin" && role !== "agent" && role !== "regional_head" && role === "customer") {
    role = "salon_owner";
  }

  if (
    options?.salonOwnerIntent &&
    role !== "admin" &&
    role !== "agent" &&
    role !== "regional_head"
  ) {
    role = "salon_owner";
  }

  await admin.from("users").upsert(
    {
      email: normalizedEmail,
      full_name: fullName || userRow?.full_name || normalizedEmail.split("@")[0],
      avatar_url: avatarUrl || null,
      global_role: role,
    },
    { onConflict: "email" }
  );

  if (role === "salon_owner") {
    await syncUserRolesForGlobalRole(admin, normalizedEmail, "salon_owner", authUserId);
  }

  let linkedSalon: { id: string; name: string | null; onboarding_status: string | null } | null = null;
  if (salonId) {
    const { data } = await admin
      .from("salons")
      .select("id, name, onboarding_status")
      .eq("id", salonId)
      .maybeSingle();
    linkedSalon = data;
  }

  return {
    linked: Boolean(linkedSalon || salonId),
    role,
    onboardingStatus: linkedSalon?.onboarding_status ?? null,
    salonId: linkedSalon?.id ?? salonId ?? null,
    salonName: linkedSalon?.name ?? null,
    isNewUser,
  };
}
