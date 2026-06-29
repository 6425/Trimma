import type { SupabaseClient } from "@supabase/supabase-js";

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

export async function deleteSalonRecordCascade(
  supabase: SupabaseClient,
  salonId: string
): Promise<{ name: string }> {
  const trimmedId = salonId.trim();
  if (!trimmedId) throw new Error("Salon id is required.");

  const { data: salon, error: fetchError } = await supabase
    .from("salons")
    .select("id,name")
    .eq("id", trimmedId)
    .maybeSingle();
  if (fetchError) throw new Error(fetchError.message);
  if (!salon) throw new Error("Salon not found.");

  await deleteRescheduleRequestsForSalon(supabase, trimmedId);

  for (const table of SALON_DEPENDENT_TABLES) {
    await deleteBySalonId(supabase, table, trimmedId);
  }

  const { error: salonDeleteError } = await supabase.from("salons").delete().eq("id", trimmedId);
  if (salonDeleteError) throw new Error(salonDeleteError.message);

  return { name: salon.name || "Salon" };
}
