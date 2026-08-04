import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeEmail } from "@/lib/normalize-email";
import { syncUserRolesForGlobalRole } from "@/lib/sync-user-role";

/** Child tables removed before the salon row (order matters for FK chains). */
const SALON_DEPENDENT_TABLES = [
  "payments",
  "bookings",
  "reviews",
  "staff_reviews",
  "onboarding_logs",
  "customer_ai_memory",
  "salon_analytics",
  "customer_favorite_salons",
  "salon_amenities",
  "salon_promotion_packages",
  "promotion_packages",
  "salon_operating_hours",
  "salon_customer_profiles",
  "resources",
  "facebook_sync_posts",
  "salon_marketing_campaigns",
  "salon_owner_notifications",
  "salon_loyalty_rules",
  "salon_customer_vip",
  "salon_photos",
  "salon_subscriptions",
  "commissions",
  "services",
  "salon_staff",
  "salon_facebook_integrations",
] as const;

function isMissingTableError(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes("does not exist") || lower.includes("schema cache") || lower.includes("relation");
}

async function deleteBySalonId(supabase: SupabaseClient, table: string, salonId: string) {
  const { error } = await supabase.from(table).delete().eq("salon_id", salonId);
  if (!error) return;
  if (isMissingTableError(error.message)) return;
  throw new Error(`${table}: ${error.message}`);
}

async function deleteRescheduleRequestsForSalon(supabase: SupabaseClient, salonId: string) {
  const { data: bookings, error: bookingsError } = await supabase
    .from("bookings")
    .select("id")
    .eq("salon_id", salonId);
  if (bookingsError) {
    if (isMissingTableError(bookingsError.message)) return;
    throw new Error(bookingsError.message);
  }
  const bookingIds = (bookings || []).map((row) => row.id).filter(Boolean);
  if (bookingIds.length === 0) return;

  const { error } = await supabase.from("reschedule_requests").delete().in("booking_id", bookingIds);
  if (!error) return;
  if (isMissingTableError(error.message)) return;
  throw new Error(`reschedule_requests: ${error.message}`);
}

function collectOwnerEmails(salon: {
  owner_email?: string | null;
  owner_gmail?: string | null;
}): string[] {
  const emails = [salon.owner_email, salon.owner_gmail]
    .map((value) => normalizeEmail(value))
    .filter(Boolean);
  return [...new Set(emails)];
}

/** If the owner has no remaining salons, revert platform role to customer. */
async function downgradeOrphanedSalonOwners(
  supabase: SupabaseClient,
  ownerEmails: string[]
) {
  for (const email of ownerEmails) {
    const { data: remainingSalons, error: salonError } = await supabase
      .from("salons")
      .select("id")
      .or(`owner_email.ilike.${email},owner_gmail.ilike.${email}`)
      .limit(1);

    if (salonError) {
      if (!isMissingTableError(salonError.message)) {
        throw new Error(salonError.message);
      }
      continue;
    }

    if ((remainingSalons || []).length > 0) continue;

    const { error: userError } = await supabase
      .from("users")
      .update({ global_role: "customer" })
      .eq("email", email)
      .eq("global_role", "salon_owner");

    if (userError && !isMissingTableError(userError.message)) {
      throw new Error(userError.message);
    }

    await syncUserRolesForGlobalRole(supabase, email, "customer");
  }
}

export async function deleteSalonRecordCascade(
  supabase: SupabaseClient,
  salonId: string
): Promise<{ name: string }> {
  const trimmedId = salonId.trim();
  if (!trimmedId) throw new Error("Salon id is required.");

  const { data: salon, error: fetchError } = await supabase
    .from("salons")
    .select("id,name,owner_email,owner_gmail")
    .eq("id", trimmedId)
    .maybeSingle();
  if (fetchError) throw new Error(fetchError.message);
  if (!salon) throw new Error("Salon not found.");

  const ownerEmails = collectOwnerEmails(salon);

  await deleteRescheduleRequestsForSalon(supabase, trimmedId);

  for (const table of SALON_DEPENDENT_TABLES) {
    await deleteBySalonId(supabase, table, trimmedId);
  }

  const { error: salonDeleteError } = await supabase.from("salons").delete().eq("id", trimmedId);
  if (salonDeleteError) throw new Error(salonDeleteError.message);

  await downgradeOrphanedSalonOwners(supabase, ownerEmails);

  return { name: salon.name || "Salon" };
}
