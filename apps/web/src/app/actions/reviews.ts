"use server";

import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { createServerSupabaseClient } from "@/config/supabase-server";
import {
  buildReviewSummary,
  isBookingAppointmentPast,
  isBookingReviewEligible,
  isReviewEligibleBookingStatus,
  isVerifiedBookingReview,
  maskReviewerName,
  normalizeBookingStatus,
  validateReviewRating,
  validateReviewText,
  type SalonReviewSummary,
} from "@/lib/reviews";
import { refreshStaffReviewStats } from "@/lib/staff-review-stats";

export type PublicSalonReview = {
  id: string;
  bookingId: string | null;
  authorName: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  verified: boolean;
  reply: {
    text: string;
    createdAt: string;
  } | null;
};

export type ReviewableBooking = {
  id: string;
  bookingNo: string;
  salonId: string;
  salonName: string;
  salonSlug: string | null;
  staffId: string | null;
  staffName: string | null;
  bookingDate: string;
  bookingTime: string;
  status: string;
  hasReview: boolean;
  existingReview: {
    id: string;
    rating: number;
    comment: string | null;
    staffRating: number | null;
  } | null;
  canReview: boolean;
  reviewPending: boolean;
  rescheduleRequested?: boolean;
  rescheduleStatus?: string | null;
  requestedBookingDate?: string | null;
  requestedBookingTime?: string | null;
};

async function getAuthedEmail(accessToken: string) {
  if (!accessToken) return null;
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data.user?.email) return null;
  return data.user.email.toLowerCase();
}

function mapPublicReview(
  row: any,
  nameByEmail: Record<string, string | null>,
  replyByReviewId: Record<string, { reply_text: string; created_at: string }>
): PublicSalonReview {
  const email = (row.customer_email || "").toLowerCase();
  return {
    id: row.id,
    bookingId: row.booking_id,
    authorName: maskReviewerName(nameByEmail[email], email),
    rating: row.rating,
    comment: row.comment,
    createdAt: row.created_at,
    verified: Boolean(row.booking_id),
    reply: replyByReviewId[row.id]
      ? {
          text: replyByReviewId[row.id].reply_text,
          createdAt: replyByReviewId[row.id].created_at,
        }
      : null,
  };
}

/** Bundled reviews for public salon page (admin client — used during SSR). */
export async function fetchPublishedSalonReviewsForPage(salonId: string): Promise<{
  summary: SalonReviewSummary;
  reviews: PublicSalonReview[];
}> {
  try {
    const admin = createSupabaseAdminClient();
    const { data: reviews, error } = await admin
      .from("reviews")
      .select("id, booking_id, customer_email, rating, comment, created_at, status")
      .eq("salon_id", salonId)
      .eq("status", "published")
      .not("booking_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;

    const verifiedReviews = (reviews || []).filter((row) => isVerifiedBookingReview(row));
    const summary = buildReviewSummary(verifiedReviews);
    if (!verifiedReviews.length) {
      return { summary, reviews: [] };
    }

    const emails = [
      ...new Set(verifiedReviews.map((row) => (row.customer_email || "").toLowerCase()).filter(Boolean)),
    ];
    const reviewIds = verifiedReviews.map((row) => row.id);

    const [{ data: users }, { data: replies }] = await Promise.all([
      emails.length
        ? admin.from("users").select("email, full_name").in("email", emails)
        : Promise.resolve({ data: [] as Array<{ email: string; full_name: string | null }> }),
      reviewIds.length
        ? admin
            .from("review_replies")
            .select("review_id, reply_text, created_at")
            .in("review_id", reviewIds)
        : Promise.resolve({ data: [] as Array<{ review_id: string; reply_text: string; created_at: string }> }),
    ]);

    const nameByEmail = Object.fromEntries(
      (users || []).map((user) => [user.email.toLowerCase(), user.full_name])
    );
    const replyByReviewId = Object.fromEntries(
      (replies || []).map((reply) => [reply.review_id, reply])
    );

    return {
      summary,
      reviews: verifiedReviews.map((row) => mapPublicReview(row, nameByEmail, replyByReviewId)),
    };
  } catch {
    return { summary: buildReviewSummary([]), reviews: [] };
  }
}

export async function getSalonReviewSummary(salonId: string): Promise<SalonReviewSummary> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("reviews")
      .select("rating, booking_id, status")
      .eq("salon_id", salonId)
      .eq("status", "published")
      .not("booking_id", "is", null);

    if (error) throw error;
    const verifiedRows = (data || []).filter((row) => isVerifiedBookingReview(row));
    return buildReviewSummary(verifiedRows);
  } catch {
    return buildReviewSummary([]);
  }
}

export async function getSalonReviews(salonId: string): Promise<PublicSalonReview[]> {
  try {
    const supabase = createServerSupabaseClient();
    const { data: reviews, error } = await supabase
      .from("reviews")
      .select("id, booking_id, customer_email, rating, comment, created_at, status")
      .eq("salon_id", salonId)
      .eq("status", "published")
      .not("booking_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;
    const verifiedReviews = (reviews || []).filter((row) => isVerifiedBookingReview(row));
    if (!verifiedReviews.length) return [];

    const emails = [
      ...new Set(verifiedReviews.map((row) => (row.customer_email || "").toLowerCase()).filter(Boolean)),
    ];
    const reviewIds = verifiedReviews.map((row) => row.id);

    const admin = createSupabaseAdminClient();
    const [{ data: users }, { data: replies }] = await Promise.all([
      emails.length
        ? admin.from("users").select("email, full_name").in("email", emails)
        : Promise.resolve({ data: [] as any[] }),
      reviewIds.length
        ? admin.from("review_replies").select("review_id, reply_text, created_at").in("review_id", reviewIds)
        : Promise.resolve({ data: [] as any[] }),
    ]);

    const nameByEmail = Object.fromEntries(
      (users || []).map((user) => [user.email.toLowerCase(), user.full_name])
    );
    const replyByReviewId = Object.fromEntries(
      (replies || []).map((reply) => [reply.review_id, reply])
    );

    return verifiedReviews.map((row) => mapPublicReview(row, nameByEmail, replyByReviewId));
  } catch {
    return [];
  }
}

export async function getCustomerReviewableBookings(accessToken: string): Promise<ReviewableBooking[]> {
  try {
    const email = await getAuthedEmail(accessToken);
    if (!email) return [];

    const admin = createSupabaseAdminClient();
    const { data: bookings, error } = await admin
      .from("bookings")
      .select(
        "id, booking_no, salon_id, staff_id, status, booking_date, booking_time, created_at, salons(name, slug), salon_staff(name)"
      )
      .ilike("customer_email", email)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error || !bookings?.length) return [];

    const bookingIds = bookings.map((booking) => booking.id);
    const { data: reviews } = await admin
      .from("reviews")
      .select("id, booking_id, rating, comment")
      .in("booking_id", bookingIds);

    const staffReviewsRes = await admin
      .from("staff_reviews")
      .select("booking_id, rating")
      .in("booking_id", bookingIds);
    const staffReviews = staffReviewsRes.error ? [] : staffReviewsRes.data || [];

    const reviewByBookingId = Object.fromEntries(
      (reviews || []).map((review) => [review.booking_id, review])
    );
    const staffReviewByBookingId = Object.fromEntries(
      (staffReviews || []).map((review) => [review.booking_id, review])
    );

    return bookings.map((booking) => {
      const existingReview = reviewByBookingId[booking.id] || null;
      const existingStaffReview = staffReviewByBookingId[booking.id] || null;
      const canReview = isBookingReviewEligible(booking);
      const salon = Array.isArray(booking.salons) ? booking.salons[0] : booking.salons;
      const staff = Array.isArray(booking.salon_staff) ? booking.salon_staff[0] : booking.salon_staff;

      return {
        id: booking.id,
        bookingNo: booking.booking_no,
        salonId: booking.salon_id,
        salonName: salon?.name || "Trimma Partner Salon",
        salonSlug: salon?.slug || null,
        staffId: booking.staff_id || null,
        staffName: staff?.name || null,
        bookingDate: booking.booking_date,
        bookingTime: booking.booking_time,
        status: booking.status,
        hasReview: Boolean(existingReview),
        existingReview: existingReview
          ? {
              id: existingReview.id,
              rating: existingReview.rating,
              comment: existingReview.comment,
              staffRating: existingStaffReview?.rating ?? null,
            }
          : null,
        canReview,
        reviewPending:
          !existingReview &&
          !canReview &&
          isReviewEligibleBookingStatus(booking.status) &&
          !isBookingAppointmentPast(booking.booking_date, booking.booking_time),
        rescheduleRequested: false,
        rescheduleStatus: null,
        requestedBookingDate: null,
        requestedBookingTime: null,
      };
    });
  } catch {
    return [];
  }
}

async function upsertStaffReviewForBooking(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  input: {
    bookingId: string;
    salonId: string;
    staffId: string;
    customerEmail: string;
    staffRating: number;
    comment: string | null;
  }
) {
  const payload = {
    booking_id: input.bookingId,
    salon_id: input.salonId,
    staff_id: input.staffId,
    customer_email: input.customerEmail,
    rating: input.staffRating,
    comment: input.comment,
    updated_at: new Date().toISOString(),
  };

  const { data: existing } = await admin
    .from("staff_reviews")
    .select("id")
    .eq("booking_id", input.bookingId)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await admin.from("staff_reviews").update(payload).eq("id", existing.id);
    if (error) throw error;
    return;
  }

  const { error } = await admin.from("staff_reviews").insert(payload);
  if (error) throw error;
}

async function saveStaffReviewForBooking(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  input: {
    bookingId: string;
    salonId: string;
    staffId: string;
    customerEmail: string;
    staffRating: number;
    comment: string | null;
  }
) {
  await upsertStaffReviewForBooking(admin, input);
  await refreshStaffReviewStats(admin, input.staffId);
}

export async function submitBookingReview(input: {
  accessToken: string;
  bookingId: string;
  rating: number;
  reviewText: string;
  staffRating?: number;
}) {
  try {
    const email = await getAuthedEmail(input.accessToken);
    if (!email) {
      return { success: false as const, error: "You must be logged in to leave a review." };
    }

    const ratingResult = validateReviewRating(input.rating);
    if (!ratingResult.ok) {
      return { success: false as const, error: ratingResult.error };
    }

    const textResult = validateReviewText(input.reviewText || "");
    if (!textResult.ok) {
      return { success: false as const, error: textResult.error };
    }

    const admin = createSupabaseAdminClient();
    const { data: booking, error: bookingError } = await admin
      .from("bookings")
      .select("id, salon_id, staff_id, customer_email, status, booking_date, booking_time")
      .eq("id", input.bookingId)
      .maybeSingle();

    if (bookingError || !booking) {
      return { success: false as const, error: "Booking not found." };
    }

    if ((booking.customer_email || "").toLowerCase() !== email) {
      return { success: false as const, error: "You can only review your own bookings." };
    }

    if (!isBookingReviewEligible(booking)) {
      return {
        success: false as const,
        error: "Reviews unlock after your confirmed visit time has passed.",
      };
    }

    if (booking.staff_id) {
      if (typeof input.staffRating !== "number") {
        return {
          success: false as const,
          error: "Please rate your stylist as well as the salon.",
        };
      }
      const staffRatingResult = validateReviewRating(input.staffRating);
      if (!staffRatingResult.ok) {
        return { success: false as const, error: staffRatingResult.error };
      }
    }

    const payload = {
      booking_id: booking.id,
      salon_id: booking.salon_id,
      customer_email: email,
      rating: ratingResult.value,
      comment: textResult.value || null,
      status: "published",
      updated_at: new Date().toISOString(),
    };

    const { data: existing } = await admin
      .from("reviews")
      .select("id")
      .eq("booking_id", booking.id)
      .maybeSingle();

    if (existing?.id) {
      const { error } = await admin.from("reviews").update(payload).eq("id", existing.id);
      if (error) throw error;

      if (booking.staff_id && typeof input.staffRating === "number") {
        const staffRatingResult = validateReviewRating(input.staffRating);
        if (staffRatingResult.ok) {
          try {
            await saveStaffReviewForBooking(admin, {
              bookingId: booking.id,
              salonId: booking.salon_id,
              staffId: booking.staff_id,
              customerEmail: email,
              staffRating: staffRatingResult.value,
              comment: textResult.value || null,
            });
          } catch (staffErr) {
            console.warn("Staff review save skipped:", staffErr);
            return {
              success: true as const,
              reviewId: existing.id,
              updated: true,
              staffReviewWarning: "Salon review saved, but stylist rating could not be saved. Run packages/db/STAFF_REVIEWS_PATCH.sql and packages/db/SALON_STAFF_RATING_PATCH.sql.",
            };
          }
        }
      }

      return { success: true as const, reviewId: existing.id, updated: true };
    }

    const { data: inserted, error: insertError } = await admin
      .from("reviews")
      .insert(payload)
      .select("id")
      .single();

    if (insertError) throw insertError;

    if (booking.staff_id && typeof input.staffRating === "number") {
      const staffRatingResult = validateReviewRating(input.staffRating);
      if (staffRatingResult.ok) {
        try {
          await saveStaffReviewForBooking(admin, {
            bookingId: booking.id,
            salonId: booking.salon_id,
            staffId: booking.staff_id,
            customerEmail: email,
            staffRating: staffRatingResult.value,
            comment: textResult.value || null,
          });
        } catch (staffErr) {
          console.warn("Staff review save skipped:", staffErr);
          return {
            success: true as const,
            reviewId: inserted.id,
            updated: false,
            staffReviewWarning: "Salon review saved, but stylist rating could not be saved. Run packages/db/STAFF_REVIEWS_PATCH.sql and packages/db/SALON_STAFF_RATING_PATCH.sql.",
          };
        }
      }
    }

    return { success: true as const, reviewId: inserted.id, updated: false };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not submit review.";
    return { success: false as const, error: message };
  }
}

export async function submitSalonReviewReply(input: {
  accessToken: string;
  reviewId: string;
  replyText: string;
}) {
  try {
    const email = await getAuthedEmail(input.accessToken);
    if (!email) {
      return { success: false as const, error: "You must be logged in to reply." };
    }

    const replyText = input.replyText.trim();
    if (replyText.length < 5) {
      return { success: false as const, error: "Reply must be at least 5 characters." };
    }
    if (replyText.length > 500) {
      return { success: false as const, error: "Reply must be 500 characters or fewer." };
    }

    const admin = createSupabaseAdminClient();
    const { data: review, error: reviewError } = await admin
      .from("reviews")
      .select("id, salon_id")
      .eq("id", input.reviewId)
      .maybeSingle();

    if (reviewError || !review) {
      return { success: false as const, error: "Review not found." };
    }

    const { data: salon, error: salonError } = await admin
      .from("salons")
      .select("owner_email, owner_gmail")
      .eq("id", review.salon_id)
      .maybeSingle();

    if (salonError || !salon) {
      return { success: false as const, error: "Salon not found." };
    }

    const ownerEmails = [salon.owner_email, salon.owner_gmail]
      .filter(Boolean)
      .map((value) => String(value).toLowerCase());

    if (!ownerEmails.includes(email)) {
      return { success: false as const, error: "Only the salon owner can reply to reviews." };
    }

    const payload = {
      review_id: review.id,
      salon_owner_email: email,
      reply_text: replyText,
      updated_at: new Date().toISOString(),
    };

    const { data: existing } = await admin
      .from("review_replies")
      .select("id")
      .eq("review_id", review.id)
      .maybeSingle();

    if (existing?.id) {
      const { error } = await admin.from("review_replies").update(payload).eq("id", existing.id);
      if (error) throw error;
      return { success: true as const, updated: true };
    }

    const { error: insertError } = await admin.from("review_replies").insert(payload);
    if (insertError) throw insertError;
    return { success: true as const, updated: false };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not save reply.";
    return { success: false as const, error: message };
  }
}

export async function getSalonOwnerReviews(accessToken: string, salonId: string) {
  try {
    const email = await getAuthedEmail(accessToken);
    if (!email) return { success: false as const, error: "Not authenticated.", reviews: [] as PublicSalonReview[] };

    const admin = createSupabaseAdminClient();
    const { data: salon } = await admin
      .from("salons")
      .select("owner_email, owner_gmail")
      .eq("id", salonId)
      .maybeSingle();

    const ownerEmails = [salon?.owner_email, salon?.owner_gmail]
      .filter(Boolean)
      .map((value) => String(value).toLowerCase());

    if (!ownerEmails.includes(email)) {
      return { success: false as const, error: "You do not manage this salon.", reviews: [] as PublicSalonReview[] };
    }

    const reviews = await getSalonReviews(salonId);
    const summary = await getSalonReviewSummary(salonId);
    return { success: true as const, reviews, summary };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not load reviews.";
    return { success: false as const, error: message, reviews: [] as PublicSalonReview[] };
  }
}
