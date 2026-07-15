import { APP_BASE_URL } from "@/lib/email/config";
import { sanitizeText } from "@/lib/sanitize-input";

export function buildCustomerReviewLink(bookingId: string, baseUrl = APP_BASE_URL) {
  return `${baseUrl}/customer/bookings?review=${encodeURIComponent(bookingId)}`;
}

export type BookingReviewRow = {
  id: string;
  booking_id: string | null;
  salon_id: string;
  customer_email: string | null;
  rating: number;
  comment: string | null;
  status: string | null;
  created_at: string;
  updated_at?: string | null;
};

export type ReviewReplyRow = {
  id: string;
  review_id: string;
  salon_owner_email: string;
  reply_text: string;
  created_at: string;
};

export type SalonReviewSummary = {
  averageRating: number;
  totalReviews: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
};

const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const PHONE_PATTERN = /(\+?\d[\d\s().-]{7,}\d)/;
const URL_PATTERN = /(https?:\/\/|www\.)/i;

export function normalizeBookingStatus(status: string | null | undefined) {
  return (status || "").trim().toLowerCase();
}

/** Public marketplace may only show reviews tied to a real customer booking. */
export function isVerifiedBookingReview(row: { booking_id?: string | null; status?: string | null }) {
  return Boolean(row.booking_id) && (row.status || "published") === "published";
}

export function isCompletedBookingStatus(status: string | null | undefined) {
  return normalizeBookingStatus(status) === "completed";
}

const REVIEW_ELIGIBLE_BOOKING_STATUSES = new Set([
  "confirmed",
  "in_progress",
  "checked_in",
  "completed",
]);

export function isReviewEligibleBookingStatus(status: string | null | undefined) {
  return REVIEW_ELIGIBLE_BOOKING_STATUSES.has(normalizeBookingStatus(status));
}

export function getBookingDateTime(bookingDate: string, bookingTime: string) {
  const time = bookingTime.length === 5 ? `${bookingTime}:00` : bookingTime;
  const normalizedTime = time.slice(0, 8);
  // Booking times are stored as Sri Lanka local wall-clock values.
  return new Date(`${bookingDate}T${normalizedTime}+05:30`);
}

export function isBookingAppointmentPast(
  bookingDate: string,
  bookingTime: string,
  now = new Date()
) {
  const appointmentAt = getBookingDateTime(bookingDate, bookingTime);
  return !Number.isNaN(appointmentAt.getTime()) && appointmentAt <= now;
}

export function isBookingReviewEligible(
  booking: {
    status: string | null | undefined;
    booking_date: string;
    booking_time: string;
  },
  now = new Date()
) {
  return (
    isReviewEligibleBookingStatus(booking.status) &&
    isBookingAppointmentPast(booking.booking_date, booking.booking_time, now)
  );
}

export function validateReviewText(reviewText: string) {
  const trimmed = reviewText.trim();
  if (!trimmed) {
    return { ok: true as const, value: "" };
  }
  if (trimmed.length < 20) {
    return { ok: false as const, error: "Review text must be at least 20 characters." };
  }
  if (trimmed.length > 500) {
    return { ok: false as const, error: "Review text must be 500 characters or fewer." };
  }
  if (containsBlockedReviewContent(trimmed)) {
    return {
      ok: false as const,
      error: "Please remove phone numbers, email addresses, or external links.",
    };
  }
  return { ok: true as const, value: sanitizeText(trimmed) };
}

export function containsBlockedReviewContent(text: string) {
  return EMAIL_PATTERN.test(text) || PHONE_PATTERN.test(text) || URL_PATTERN.test(text);
}

export function validateReviewRating(rating: number) {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { ok: false as const, error: "Please select a rating between 1 and 5 stars." };
  }
  return { ok: true as const, value: rating };
}

export function buildReviewSummary(
  reviews: Array<{ rating: number }>
): SalonReviewSummary {
  const distribution: SalonReviewSummary["distribution"] = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };

  for (const review of reviews) {
    const stars = Math.min(5, Math.max(1, Math.round(review.rating))) as 1 | 2 | 3 | 4 | 5;
    distribution[stars] += 1;
  }

  const totalReviews = reviews.length;
  const averageRating =
    totalReviews === 0
      ? 0
      : Math.round(
          (reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews) * 10
        ) / 10;

  return { averageRating, totalReviews, distribution };
}

export type CustomerReviewUiState =
  | { kind: "action"; actionLabel: "Leave review" | "Edit review" }
  | { kind: "submitted"; rating: number }
  | { kind: "waiting"; message: string }
  | { kind: "info"; message: string };

export function getCustomerReviewUiState(booking: {
  status: string;
  hasReview: boolean;
  canReview: boolean;
  reviewPending?: boolean;
  existingReview?: { rating: number } | null;
}): CustomerReviewUiState | null {
  if (booking.canReview) {
    return {
      kind: "action",
      actionLabel: booking.hasReview ? "Edit review" : "Leave review",
    };
  }

  if (booking.hasReview && booking.existingReview) {
    return { kind: "submitted", rating: booking.existingReview.rating };
  }

  if (booking.reviewPending) {
    return {
      kind: "waiting",
      message: "Leave review unlocks after your appointment time has passed.",
    };
  }

  const status = normalizeBookingStatus(booking.status);
  if (status === "pending") {
    return {
      kind: "info",
      message: "Review opens once your booking is confirmed and your visit time has passed.",
    };
  }

  if (isReviewEligibleBookingStatus(status)) {
    return {
      kind: "waiting",
      message: "Leave review unlocks after your appointment time has passed.",
    };
  }

  return null;
}

export function maskReviewerName(fullName: string | null | undefined, email: string | null | undefined) {
  const cleanedName = (fullName || "").trim();
  if (cleanedName) {
    const parts = cleanedName.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0];
    return `${parts[0]} ${parts[parts.length - 1].charAt(0).toUpperCase()}.`;
  }

  const localPart = (email || "Customer").split("@")[0] || "Customer";
  return localPart.charAt(0).toUpperCase() + localPart.slice(1);
}
