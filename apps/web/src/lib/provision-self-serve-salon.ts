import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeEmail } from "@/lib/normalize-email";
import { ensureSalonSubscriptionPlan } from "@/lib/salon-subscription-plan";
import { syncUserRolesForGlobalRole } from "@/lib/sync-user-role";

function slugifySalonName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

async function uniqueSalonSlug(
  supabase: SupabaseClient,
  base: string
): Promise<string> {
  const root = base || "my-salon";
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate = attempt === 0 ? root : `${root}-${attempt + 1}`;
    const { data } = await supabase.from("salons").select("id").eq("slug", candidate).maybeSingle();
    if (!data) return candidate;
  }
  return `${root}-${Date.now()}`;
}

/** Create a draft salon when an owner signs in from /onboarding without an existing record. */
export async function provisionSelfServeSalonOwner(
  supabase: SupabaseClient,
  authUserId: string,
  email: string,
  fullName?: string | null
): Promise<{ salonId: string; created: boolean }> {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    throw new Error("A valid Google email is required to start salon onboarding.");
  }

  const { data: byOwnerEmail } = await supabase
    .from("salons")
    .select("id")
    .ilike("owner_email", normalizedEmail)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  let existing = byOwnerEmail;

  if (!existing) {
    const { data: byOwnerGmail } = await supabase
      .from("salons")
      .select("id")
      .ilike("owner_gmail", normalizedEmail)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    existing = byOwnerGmail;
  }

  if (existing?.id) {
    return { salonId: String(existing.id), created: false };
  }

  const { data: freePlan } = await supabase
    .from("subscription_plans")
    .select("id")
    .eq("name", "Free")
    .limit(1)
    .maybeSingle();

  const displayName = (fullName || normalizedEmail.split("@")[0] || "My Salon").trim();
  const slug = await uniqueSalonSlug(supabase, slugifySalonName(displayName));

  const { error: userUpsertError } = await supabase.from("users").upsert(
    {
      email: normalizedEmail,
      full_name: displayName,
      global_role: "salon_owner",
    },
    { onConflict: "email" }
  );

  if (userUpsertError) {
    throw new Error(userUpsertError.message);
  }

  await syncUserRolesForGlobalRole(supabase, normalizedEmail, "salon_owner", authUserId);

  const { data: salon, error } = await supabase
    .from("salons")
    .insert({
      name: `${displayName}'s Salon`,
      slug,
      owner_email: normalizedEmail,
      owner_gmail: normalizedEmail,
      email: normalizedEmail,
      status: "draft",
      onboarding_status: "OWNER_INVITED",
      activation_status: "DRAFT",
      booking_enabled: false,
      public_visibility: "hidden",
      is_verified: false,
      subscription_plan_id: freePlan?.id || null,
      source_type: "self_serve_onboarding",
      draft_created_at: new Date().toISOString(),
      owner_invited_at: new Date().toISOString(),
      onboarding_completion_score: 0,
      business_info_extended: {
        owner_full_name: displayName,
      },
    })
    .select("id")
    .single();

  if (error || !salon?.id) {
    throw new Error(error?.message || "Could not create your salon draft.");
  }

  await ensureSalonSubscriptionPlan(
    supabase,
    String(salon.id),
    (freePlan?.id as string | null | undefined) ?? null
  );

  await supabase.from("onboarding_logs").insert({
    salon_id: salon.id,
    actor_email: normalizedEmail,
    action: "SELF_SERVE_OWNER_SIGNUP",
    notes: "Salon owner started onboarding via Google sign-in on /onboarding.",
  });

  return { salonId: String(salon.id), created: true };
}
