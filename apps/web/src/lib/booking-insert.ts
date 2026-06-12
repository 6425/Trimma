import type { SupabaseClient } from "@supabase/supabase-js";
import { SLOT_UNAVAILABLE_MESSAGE } from "@/lib/booking-availability";

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
  promotion_package_id?: string | null;
};

function getMinimalBookingPayload(payload: BookingRecordInput) {
  return {
    booking_no: payload.booking_no,
    salon_id: payload.salon_id,
    customer_email: payload.customer_email,
    service_id: payload.service_id,
    staff_id: payload.staff_id,
    booking_date: payload.booking_date,
    booking_time: payload.booking_time,
    amount: payload.amount,
    status: payload.status,
    payment_status: payload.payment_status,
  };
}

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
  const fullAttempt = await supabase.from("bookings").insert(payload).select().single();
  if (!fullAttempt.error && fullAttempt.data) {
    return { data: fullAttempt.data, error: null as null };
  }

  if (isSlotConflictError(fullAttempt.error)) {
    throw new Error(SLOT_UNAVAILABLE_MESSAGE);
  }

  const minimalAttempt = await supabase
    .from("bookings")
    .insert(getMinimalBookingPayload(payload))
    .select()
    .single();

  if (minimalAttempt.error || !minimalAttempt.data) {
    const rawError = minimalAttempt.error || fullAttempt.error;
    if (isSlotConflictError(rawError)) {
      throw new Error(SLOT_UNAVAILABLE_MESSAGE);
    }
    const message = getErrorMessage(rawError);
    throw new Error(message || "Failed to create booking.");
  }

  return { data: minimalAttempt.data, error: null as null };
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
  const fullAttempt = await supabase.from("bookings").update(updates).eq("id", bookingId);
  if (!fullAttempt.error) return;

  const safeUpdates: Record<string, string | boolean> = {};
  if (updates.status) safeUpdates.status = updates.status;
  if (updates.payment_status) safeUpdates.payment_status = updates.payment_status;

  if (Object.keys(safeUpdates).length === 0) return;

  const fallbackAttempt = await supabase.from("bookings").update(safeUpdates).eq("id", bookingId);
  if (fallbackAttempt.error) {
    throw new Error(getErrorMessage(fallbackAttempt.error));
  }
}
