import type { SupabaseClient } from "@supabase/supabase-js";
import { ensureSalonOwnerAccess } from "@/lib/ensure-salon-owner-access";
import { normalizeEmail } from "@/lib/normalize-email";
import { provisionSelfServeSalonOwner } from "@/lib/provision-self-serve-salon";
import { syncUserRolesForGlobalRole } from "@/lib/sync-user-role";

async function persistSalonOwnerUser(
  admin: SupabaseClient,
  authUserId: string,
  normalizedEmail: string,
  fullName?: string | null,
  avatarUrl?: string | null
): Promise<void> {
  const displayName = (fullName || normalizedEmail.split("@")[0] || "Salon Owner").trim();

  const { data: existingRows, error: readError } = await admin
    .from("users")
    .select("email, full_name")
    .ilike("email", normalizedEmail)
    .limit(1);

  if (readError) {
    throw new Error(readError.message);
  }

  const existing = existingRows?.[0] ?? null;

  if (existing) {
    const { error: updateError } = await admin
      .from("users")
      .update({
        global_role: "salon_owner",
        full_name: displayName || existing.full_name,
        avatar_url: avatarUrl ?? null,
      })
      .ilike("email", normalizedEmail);

    if (updateError) {
      throw new Error(updateError.message);
    }
  } else {
    const baseRow = {
      email: normalizedEmail,
      full_name: displayName,
      avatar_url: avatarUrl ?? null,
      global_role: "salon_owner" as const,
    };

    const { error: upsertWithIdError } = await admin.from("users").upsert(
      { ...baseRow, id: authUserId },
      { onConflict: "email" }
    );

    if (upsertWithIdError) {
      const { error: upsertError } = await admin.from("users").upsert(baseRow, { onConflict: "email" });
      if (upsertError) {
        throw new Error(upsertError.message);
      }
    }
  }

  await syncUserRolesForGlobalRole(admin, normalizedEmail, "salon_owner", authUserId);
}

/** Force an authenticated user onto the salon-owner role and ensure a linked salon exists. */
export async function forceSalonOwnerUpgrade(
  admin: SupabaseClient,
  authUserId: string,
  email: string,
  fullName?: string | null,
  avatarUrl?: string | null
): Promise<{ salonId: string }> {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    throw new Error("A valid Google email is required to start salon onboarding.");
  }

  await persistSalonOwnerUser(admin, authUserId, normalizedEmail, fullName, avatarUrl);

  let { salonId } = await ensureSalonOwnerAccess(admin, normalizedEmail);

  if (!salonId) {
    const provisioned = await provisionSelfServeSalonOwner(admin, authUserId, normalizedEmail, fullName);
    salonId = provisioned.salonId;
  }

  if (!salonId) {
    throw new Error("Could not create or link your salon owner account.");
  }

  const { data: verifyRow, error: verifyError } = await admin
    .from("users")
    .select("global_role")
    .ilike("email", normalizedEmail)
    .maybeSingle();

  if (verifyError) {
    throw new Error(verifyError.message);
  }

  if (verifyRow?.global_role !== "salon_owner") {
    const { error: repairError } = await admin
      .from("users")
      .update({ global_role: "salon_owner" })
      .ilike("email", normalizedEmail);

    if (repairError) {
      throw new Error(repairError.message);
    }

    await syncUserRolesForGlobalRole(admin, normalizedEmail, "salon_owner", authUserId);
  }

  return { salonId };
}
