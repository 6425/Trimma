"use server";

import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { createServerSupabaseClient } from "@/config/supabase-server";
import {
  buildReviewSummary,
  isBookingReviewEligible,
  maskReviewerName,
  validateReviewRating,
  validateReviewText,
  type SalonReviewSummary,
} from "@/lib/reviews";

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
  bookingDate: string;
  bookingTime: string;
  status: string;
  hasReview: boolean;
  existingReview: {
    id: string;
    rating: number;
    comment: string | null;
  } | null;
  canReview: boolean;
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

export async function getSalonReviewSummary(salonId: string): Promise<SalonReviewSummary> {
  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase
      .from("reviews")
      .select("rating")
      .eq("salon_id", salonId)
      .eq("status", "published");

    if (error) throw error;
    return buildReviewSummary(data || []);
  } catch {
    return buildReviewSummary([]);
  }
}

export async function getSalonReviews(salonId: string): Promise<PublicSalonReview[]> {
  try {
    const supabase = createServerSupabaseClient();
    const { data: reviews, error } = await supabase
      .from("reviews")
      .select("id, booking_id, customer_email, rating, comment, created_at")
      .eq("salon_id", salonId)
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;
    if (!reviews?.length) return [];

    const emails = [...new Set(reviews.map((row) => (row.customer_email || "").toLowerCase()).filter(Boolean))];
    const reviewIds = reviews.map((row) => row.id);

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

    return reviews
      .filter((row) => row.booking_id)
      .map((row) => mapPublicReview(row, nameByEmail, replyByReviewId));
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
      .select("id, booking_no, salon_id, status, booking_date, booking_time, salons(name, slug)")
      .ilike("customer_email", email)
      .order("booking_date", { ascending: false })
      .order("booking_time", { ascending: false })
      .limit(100);

    if (error || !bookings?.length) return [];

    const bookingIds = bookings.map((booking) => booking.id);
    const { data: reviews } = await admin
      .from("reviews")
      .select("id, booking_id, rating, comment")
      .in("booking_id", bookingIds);

    const reviewByBookingId = Object.fromEntries(
      (reviews || []).map((review) => [review.booking_id, review])
    );

    return bookings.map((booking) => {
      const existingReview = reviewByBookingId[booking.id] || null;
      const canReview = isBookingReviewEligible(booking);
      const salon = Array.isArray(booking.salons) ? booking.salons[0] : booking.salons;

      return {
        id: booking.id,
        bookingNo: booking.booking_no,
        salonId: booking.salon_id,
        salonName: salon?.name || "Trimma Partner Salon",
        salonSlug: salon?.slug || null,
        bookingDate: booking.booking_date,
        bookingTime: booking.booking_time,
        status: booking.status,
        hasReview: Boolean(existingReview),
        existingReview: existingReview
          ? {
              id: existingReview.id,
              rating: existingReview.rating,
              comment: existingReview.comment,
            }
          : null,
        canReview,
      };
    });
  } catch {
    return [];
  }
}

export async function submitBookingReview(input: {
  accessToken: string;
  bookingId: string;
  rating: number;
  reviewText: string;
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
      .select("id, salon_id, customer_email, status, booking_date, booking_time")
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
        error: "Reviews unlock only after your appointment is marked completed and the visit time has passed.",
      };
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
      return { success: true as const, reviewId: existing.id, updated: true };
    }

    const { data: inserted, error: insertError } = await admin
      .from("reviews")
      .insert(payload)
      .select("id")
      .single();

    if (insertError) throw insertError;
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
