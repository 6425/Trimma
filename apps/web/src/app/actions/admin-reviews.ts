"use server";

import { adminDbFailure, isAdminDbSuccess, withAdminDb } from "@/lib/with-admin-db";

export type AdminReviewRow = {
  id: string;
  salonName: string;
  customerEmail: string;
  rating: number;
  staffRating: number | null;
  comment: string | null;
  status: string;
  verified: boolean;
  legacy: boolean;
  bookingNo: string | null;
  createdAt: string;
};

export async function fetchAdminReviewsPage() {
  const result = await withAdminDb(async (supabase) => {
    const { data, error } = await supabase
      .from("reviews")
      .select(
        `
        id,
        rating,
        comment,
        status,
        customer_email,
        booking_id,
        created_at,
        salons (name),
        bookings (booking_no)
      `
      )
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) throw new Error(error.message);

    const bookingIds = (data || [])
      .map((row: any) => row.booking_id)
      .filter(Boolean) as string[];

    const staffRatingByBookingId: Record<string, number> = {};
    if (bookingIds.length > 0) {
      const { data: staffReviews, error: staffError } = await supabase
        .from("staff_reviews")
        .select("booking_id, rating")
        .in("booking_id", bookingIds);
      if (staffError && !staffError.message.toLowerCase().includes("does not exist")) {
        throw new Error(staffError.message);
      }
      for (const row of staffReviews || []) {
        if (row.booking_id) staffRatingByBookingId[row.booking_id] = row.rating;
      }
    }

    const reviews: AdminReviewRow[] = (data || []).map((row: any) => {
      const salon = Array.isArray(row.salons) ? row.salons[0] : row.salons;
      const booking = Array.isArray(row.bookings) ? row.bookings[0] : row.bookings;
      const verified = Boolean(row.booking_id);
      return {
        id: row.id,
        salonName: salon?.name || "Unknown salon",
        customerEmail: row.customer_email || "—",
        rating: row.rating,
        staffRating: row.booking_id ? staffRatingByBookingId[row.booking_id] ?? null : null,
        comment: row.comment,
        status: row.status || "published",
        verified,
        legacy: !verified,
        bookingNo: booking?.booking_no || null,
        createdAt: row.created_at,
      };
    });

    return { reviews };
  });

  if (!isAdminDbSuccess(result)) return adminDbFailure(result);
  return { success: true as const, ...result.data };
}

export async function moderateAdminReview(
  reviewId: string,
  action: "publish" | "hide" | "delete"
) {
  const result = await withAdminDb(async (supabase) => {
    if (action === "delete") {
      const { error } = await supabase.from("reviews").delete().eq("id", reviewId);
      if (error) throw new Error(error.message);
      return;
    }

    if (action === "publish") {
      const { data: review, error: reviewError } = await supabase
        .from("reviews")
        .select("booking_id")
        .eq("id", reviewId)
        .maybeSingle();
      if (reviewError) throw new Error(reviewError.message);
      if (!review?.booking_id) {
        throw new Error("Legacy reviews without a booking cannot be published publicly.");
      }
    }

    const status = action === "publish" ? "published" : "hidden";
    const { error } = await supabase
      .from("reviews")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", reviewId);
    if (error) throw new Error(error.message);
  });

  if (!isAdminDbSuccess(result)) return adminDbFailure(result);
  return { success: true as const };
}
