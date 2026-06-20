import { supabase } from "@/config/supabase";
import { getBookingAmount } from "@/lib/dashboard-stats";

/** Client fallback when admin server actions are unavailable on preview. */
export async function fetchAdminDashboardClient() {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoIso = weekAgo.toISOString();

  const [
    salonsRes,
    salonsWeekRes,
    bookingsRes,
    usersRes,
    recentBookingsRes,
    recentSalonsRes,
  ] = await Promise.all([
    supabase.from("salons").select("id", { count: "exact", head: true }),
    supabase
      .from("salons")
      .select("id", { count: "exact", head: true })
      .gte("created_at", weekAgoIso),
    supabase.from("bookings").select("id, amount, total_reservation_fee, status, booking_no, created_at, salons(name)"),
    supabase.from("users").select("email", { count: "exact", head: true }),
    supabase
      .from("bookings")
      .select("id, booking_no, amount, total_reservation_fee, created_at, salons(name)")
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("salons")
      .select("id, name, onboarding_status, created_at, verified_at, status, is_verified")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const bookingRows = bookingsRes.data || [];
  const pendingSalons = (recentSalonsRes.data || []).filter((salon) => {
    const status = String(salon.status || "").toLowerCase();
    if (["pending", "pending_approval"].includes(status)) return true;
    const onboarding = salon.onboarding_status || "";
    return ["PENDING_ADMIN_VERIFICATION", "AGENT_APPROVED"].includes(onboarding) && !salon.is_verified;
  });

  return {
    success: true as const,
    salonsCount: salonsRes.count ?? 0,
    salonsThisWeek: salonsWeekRes.count ?? 0,
    bookingsCount: bookingRows.length,
    bookingRows,
    pendingSalons,
    usersCount: usersRes.count ?? 0,
    activeSalons: [],
    onboardingLogs: [],
    recentBookings: recentBookingsRes.data || [],
    recentSalons: (recentSalonsRes.data || []).slice(0, 3),
    recentServices: [],
    clientFallback: true as const,
  };
}
