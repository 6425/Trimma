import type { SupabaseClient } from "@supabase/supabase-js";
import { ensureSalonSubscriptionPlan } from "@/lib/salon-subscription-plan";
import { normalizeEmail } from "@/lib/normalize-email";

/** Link an owner email to their salon and ensure a baseline subscription plan exists. */
export async function ensureSalonOwnerAccess(
  supabase: SupabaseClient,
  email: string
): Promise<{ salonId: string | null; linked: boolean }> {
  const normalized = normalizeEmail(email);
  if (!normalized) return { salonId: null, linked: false };

  const { data: byOwnerEmail, error: ownerEmailError } = await supabase
    .from("salons")
    .select("id, subscription_plan_id, owner_email, owner_gmail")
    .ilike("owner_email", normalized)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (ownerEmailError) throw new Error(ownerEmailError.message);

  let salon = byOwnerEmail;

  if (!salon) {
    const { data: byOwnerGmail, error: ownerGmailError } = await supabase
      .from("salons")
      .select("id, subscription_plan_id, owner_email, owner_gmail")
      .ilike("owner_gmail", normalized)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (ownerGmailError) throw new Error(ownerGmailError.message);
    salon = byOwnerGmail;
  }

  if (!salon?.id) {
    return { salonId: null, linked: false };
  }

  if (normalizeEmail(salon.owner_email) !== normalized) {
    const { error: linkError } = await supabase
      .from("salons")
      .update({ owner_email: normalized })
      .eq("id", salon.id);
    if (linkError) throw new Error(linkError.message);
  }

  await ensureSalonSubscriptionPlan(
    supabase,
    String(salon.id),
    (salon.subscription_plan_id as string | null | undefined) ?? null
  );

  return { salonId: String(salon.id), linked: true };
}
