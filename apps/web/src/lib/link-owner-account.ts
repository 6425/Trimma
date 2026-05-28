import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { normalizeEmail } from "@/lib/normalize-email";
import type { TrimmaUserRole } from "@/lib/auth-routes";
import { pickHighestRole } from "@/lib/trimma-role";

export type LinkOwnerResult = {
  linked: boolean;
  role: TrimmaUserRole;
  onboardingStatus: string | null;
  salonId: string | null;
  salonName: string | null;
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
  const [{ data: roleRows }, { data: userRow }] = await Promise.all([
    admin.from("user_roles").select("role").eq("user_id", authUserId),
    admin.from("users").select("global_role").eq("email", normalizedEmail).maybeSingle(),
  ]);

  return pickHighestRole(...(roleRows || []).map((row) => row.role), userRow?.global_role);
}

/** Link an invited salon owner by Gmail. Never overrides admin/agent roles set in the DB. */
export async function linkInvitedOwnerAccount(
  authUserId: string,
  email: string | null | undefined,
  fullName?: string | null,
  avatarUrl?: string | null
): Promise<LinkOwnerResult> {
  const normalizedEmail = normalizeEmail(email);
  const fallbackRole: TrimmaUserRole = "customer";

  if (!normalizedEmail) {
    return { linked: false, role: fallbackRole, onboardingStatus: null, salonId: null, salonName: null };
  }

  const admin = getAdminClient();
  if (!admin) {
    return { linked: false, role: fallbackRole, onboardingStatus: null, salonId: null, salonName: null };
  }

  const [{ data: userRow }, { data: linkedSalon }] = await Promise.all([
    admin.from("users").select("global_role, full_name").eq("email", normalizedEmail).maybeSingle(),
    admin
      .from("salons")
      .select("id, name, owner_email, owner_gmail, onboarding_status")
      .ilike("owner_gmail", normalizedEmail)
      .limit(1)
      .maybeSingle(),
  ]);

  let role = (await resolveDbRole(admin, authUserId, normalizedEmail)) || fallbackRole;

  await admin.from("users").upsert(
    {
      email: normalizedEmail,
      full_name: fullName || userRow?.full_name || normalizedEmail.split("@")[0],
      avatar_url: avatarUrl || null,
      global_role: role,
    },
    { onConflict: "email" }
  );

  if (!linkedSalon) {
    return { linked: false, role, onboardingStatus: null, salonId: null, salonName: null };
  }

  await admin
    .from("salons")
    .update({ owner_email: normalizedEmail })
    .eq("id", linkedSalon.id);

  if (role === "admin" || role === "agent") {
    return {
      linked: true,
      role,
      onboardingStatus: linkedSalon.onboarding_status ?? null,
      salonId: linkedSalon.id,
      salonName: linkedSalon.name ?? null,
    };
  }

  if (role === "customer" || !userRow?.global_role) {
    await admin.from("users").upsert(
      {
        email: normalizedEmail,
        full_name: fullName || userRow?.full_name || normalizedEmail.split("@")[0],
        avatar_url: avatarUrl || null,
        global_role: "salon_owner",
      },
      { onConflict: "email" }
    );

    await admin.from("user_roles").upsert(
      { user_id: authUserId, role: "salon_owner" },
      { onConflict: "user_id,role" }
    );
  }

  role = (await resolveDbRole(admin, authUserId, normalizedEmail)) || "salon_owner";

  return {
    linked: true,
    role,
    onboardingStatus: linkedSalon.onboarding_status ?? null,
    salonId: linkedSalon.id,
    salonName: linkedSalon.name ?? null,
  };
}
