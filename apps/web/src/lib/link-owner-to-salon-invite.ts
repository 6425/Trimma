import type { SupabaseClient } from "@supabase/supabase-js";
import { ensureSalonSubscriptionPlan } from "@/lib/salon-subscription-plan";
import { normalizeEmail } from "@/lib/normalize-email";
import { syncUserRolesForGlobalRole } from "@/lib/sync-user-role";

const PRE_INVITE_STATUSES = new Set(["DISCOVERED", "ASSIGNED_TO_AGENT", "AGENT_VERIFIED"]);

/** Bind a Google sign-in email to a specific salon from an offline invitation link. */
export async function linkOwnerEmailToSalonInvite(
  supabase: SupabaseClient,
  salonId: string,
  email: string,
  authUserId?: string,
  fullName?: string | null,
  avatarUrl?: string | null
): Promise<{ salonId: string; linked: boolean }> {
  const normalized = normalizeEmail(email);
  if (!normalized) {
    throw new Error("A valid Google email is required to accept this salon invitation.");
  }

  const trimmedSalonId = String(salonId || "").trim();
  if (!trimmedSalonId) {
    throw new Error("Salon invitation link is invalid.");
  }

  const { data: salon, error } = await supabase
    .from("salons")
    .select("id, owner_gmail, owner_email, onboarding_status, subscription_plan_id, name")
    .eq("id", trimmedSalonId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!salon?.id) {
    throw new Error("Salon invitation link is invalid or expired.");
  }

  const boundOwner =
    normalizeEmail(salon.owner_gmail) || normalizeEmail(salon.owner_email);

  if (boundOwner && boundOwner !== normalized) {
    throw new Error(
      "This salon invitation is linked to a different owner email. Sign in with the invited Gmail or contact your Trimma agent."
    );
  }

  const updates: Record<string, unknown> = {
    owner_gmail: normalized,
    owner_email: normalized,
  };

  if (PRE_INVITE_STATUSES.has(String(salon.onboarding_status || ""))) {
    updates.onboarding_status = "OWNER_INVITED";
    updates.owner_invited_at = new Date().toISOString();
  }

  const { error: updateError } = await supabase.from("salons").update(updates).eq("id", salon.id);
  if (updateError) throw new Error(updateError.message);

  await ensureSalonSubscriptionPlan(
    supabase,
    String(salon.id),
    (salon.subscription_plan_id as string | null | undefined) ?? null
  );

  const displayName = (fullName || normalized.split("@")[0] || "Salon Owner").trim();

  const { error: userError } = await supabase.from("users").upsert(
    {
      email: normalized,
      global_role: "salon_owner",
      full_name: displayName,
      avatar_url: avatarUrl ?? null,
    },
    { onConflict: "email" }
  );
  if (userError) throw new Error(userError.message);

  await syncUserRolesForGlobalRole(supabase, normalized, "salon_owner", authUserId);

  return { salonId: String(salon.id), linked: true };
}
