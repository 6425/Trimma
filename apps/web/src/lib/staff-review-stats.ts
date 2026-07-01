import type { SupabaseClient } from "@supabase/supabase-js";

export type StaffReviewStats = {
  averageRating: number;
  reviewCount: number;
};

export function buildStaffReviewStatsMap(
  rows: Array<{ staff_id?: string | null; rating?: number | string | null }>
): Map<string, StaffReviewStats> {
  const buckets = new Map<string, number[]>();

  for (const row of rows) {
    const staffId = row.staff_id ? String(row.staff_id) : "";
    if (!staffId) continue;
    const rating = Number(row.rating);
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) continue;
    const existing = buckets.get(staffId) || [];
    existing.push(rating);
    buckets.set(staffId, existing);
  }

  const stats = new Map<string, StaffReviewStats>();
  for (const [staffId, ratings] of buckets) {
    const reviewCount = ratings.length;
    const averageRating =
      reviewCount > 0
        ? Math.round((ratings.reduce((sum, value) => sum + value, 0) / reviewCount) * 10) / 10
        : 0;
    stats.set(staffId, { averageRating, reviewCount });
  }

  return stats;
}

export async function fetchStaffReviewStatsByStaffIds(
  supabase: SupabaseClient,
  staffIds: string[]
): Promise<Map<string, StaffReviewStats>> {
  if (!staffIds.length) return new Map();

  const { data, error } = await supabase
    .from("staff_reviews")
    .select("staff_id, rating")
    .in("staff_id", staffIds)
    .not("booking_id", "is", null);

  if (error) {
    console.warn("fetchStaffReviewStatsByStaffIds:", error.message);
    return new Map();
  }

  return buildStaffReviewStatsMap(data || []);
}

export async function refreshStaffReviewStats(
  supabase: SupabaseClient,
  staffId: string
): Promise<StaffReviewStats> {
  const statsMap = await fetchStaffReviewStatsByStaffIds(supabase, [staffId]);
  const stats = statsMap.get(staffId) || { averageRating: 0, reviewCount: 0 };

  const { error } = await supabase
    .from("salon_staff")
    .update({
      average_rating: stats.reviewCount > 0 ? stats.averageRating : null,
      review_count: stats.reviewCount,
    })
    .eq("id", staffId);

  if (error) {
    const message = error.message.toLowerCase();
    if (!message.includes("average_rating") && !message.includes("review_count")) {
      console.warn("refreshStaffReviewStats:", error.message);
    }
  }

  return stats;
}
