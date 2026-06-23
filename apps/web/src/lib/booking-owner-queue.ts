/** Shared rules for salon-owner pending confirmation queue (matches notification backfill SQL). */

export type BookingOwnerQueueRow = {
  status?: string | null;
  payment_status?: string | null;
  reservation_fee_paid?: boolean | null;
  reschedule_requested?: boolean | null;
  reschedule_status?: string | null;
};

export function normalizeBookingStatus(status: unknown): string {
  return String(status ?? "pending")
    .trim()
    .toLowerCase();
}

export function normalizePaymentStatus(status: unknown): string {
  return String(status ?? "unpaid")
    .trim()
    .toLowerCase();
}

/** Paid reservation waiting for salon owner to confirm (bell + pending queue). */
export function isBookingAwaitingOwnerConfirmation(booking: BookingOwnerQueueRow): boolean {
  if (normalizeBookingStatus(booking.status) !== "pending") return false;
  if (booking.reservation_fee_paid === true) return true;
  return normalizePaymentStatus(booking.payment_status) === "reservation_paid";
}

export function isUnpaidPendingBooking(booking: BookingOwnerQueueRow): boolean {
  return (
    normalizeBookingStatus(booking.status) === "pending" &&
    !isBookingAwaitingOwnerConfirmation(booking)
  );
}

export type BookingStatusTab = "confirmed" | "rescheduled" | "canceled";

export function matchesBookingStatusTab(
  booking: BookingOwnerQueueRow,
  tab: BookingStatusTab
): boolean {
  const status = normalizeBookingStatus(booking.status);

  if (tab === "confirmed") {
    return (
      status === "confirmed" ||
      status === "in_progress" ||
      status === "completed" ||
      status === "pending"
    );
  }
  if (tab === "rescheduled") {
    return (
      status === "rescheduled" ||
      booking.reschedule_requested === true ||
      booking.reschedule_status === "approved" ||
      booking.reschedule_status === "pending_salon"
    );
  }
  if (tab === "canceled") {
    return status === "canceled" || status === "no_show";
  }
  return true;
}
