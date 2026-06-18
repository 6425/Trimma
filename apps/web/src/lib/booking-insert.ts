import type { SupabaseClient } from "@supabase/supabase-js";
import { SLOT_UNAVAILABLE_MESSAGE } from "@/lib/booking-availability";
import { NO_QUALIFIED_STAFF_FOR_SERVICES_MSG } from "@/lib/staff-allocation";

export type BookingRecordInput = {
  booking_no: string;
  salon_id: string;
  customer_email: string;
  service_id: string | null;
  staff_id: string | null;
  booking_date: string;
  booking_time: string;
  amount: number;
  status: string;
  payment_status: string;
  reservation_fee_paid?: boolean;
  reservation_fee_refundable?: boolean;
  total_reservation_fee?: number;
  salon_upfront_amount?: number;
  platform_commission_amount?: number;
  agent_email?: string | null;
  field_agent_email?: string | null;
  agent_commission_percent?: number;
  agent_commission_amount?: number;
  staff_commission_percent?: number;
  staff_commission_amount?: number;
  promotion_package_id?: string | null;
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "Unknown booking error";
}

function isSlotConflictError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase();
  return (
    message.includes("unique_active_staff_booking_slot") ||
    message.includes("duplicate key") ||
    message.includes("already exists")
  );
}

export async function insertBookingRecord(
  supabase: SupabaseClient,
  payload: BookingRecordInput
) {
  if (!payload.staff_id) {
    throw new Error(NO_QUALIFIED_STAFF_FOR_SERVICES_MSG);
  }

  const attempt = await supabase.from("bookings").insert(payload).select().single();
  if (!attempt.error && attempt.data) {
    return { data: attempt.data, error: null as null };
  }

  if (isSlotConflictError(attempt.error)) {
    throw new Error(SLOT_UNAVAILABLE_MESSAGE);
  }

  const message = getErrorMessage(attempt.error);
  throw new Error(message || "Failed to create booking.");
}

export async function updateBookingAfterPayment(
  supabase: SupabaseClient,
  bookingId: string,
  updates: {
    status?: string;
    payment_status?: string;
    reservation_fee_paid?: boolean;
  }
) {
  const attempt = await supabase.from("bookings").update(updates).eq("id", bookingId);
  if (attempt.error) {
    throw new Error(getErrorMessage(attempt.error));
  }
}
