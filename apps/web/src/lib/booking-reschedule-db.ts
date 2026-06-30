import type { SupabaseClient } from "@supabase/supabase-js";

export function isMissingRescheduleColumnError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("reschedule_requested") ||
    lower.includes("reschedule_status") ||
    lower.includes("requested_booking_date") ||
    lower.includes("requested_booking_time")
  );
}

export function rescheduleColumnsMissingMessage(): string {
  return "Reschedule database columns are missing. Run packages/db/RESCHEDULE_REQUEST_PATCH.sql in the Supabase SQL Editor, then retry.";
}

type ScheduleUpdateInput = {
  bookingDate: string;
  bookingTime: string;
  clearRescheduleRequest?: boolean;
  approvePendingRequest?: boolean;
  rejectPendingRequest?: boolean;
};

/**
 * Updates booking date/time. Clears reschedule request fields when present;
 * falls back to date/time only when those columns have not been migrated yet.
 */
export async function updateBookingSchedule(
  supabase: SupabaseClient,
  bookingId: string,
  input: ScheduleUpdateInput
): Promise<{ rescheduleColumnsAvailable: boolean }> {
  const basePayload = {
    booking_date: input.bookingDate,
    booking_time: input.bookingTime,
  };

  const extendedPayload: Record<string, unknown> = { ...basePayload };

  if (input.rejectPendingRequest) {
    extendedPayload.reschedule_requested = false;
    extendedPayload.reschedule_status = "rejected";
    extendedPayload.requested_booking_date = null;
    extendedPayload.requested_booking_time = null;
  } else if (input.clearRescheduleRequest || input.approvePendingRequest) {
    extendedPayload.reschedule_requested = false;
    extendedPayload.reschedule_status = "none";
    extendedPayload.requested_booking_date = null;
    extendedPayload.requested_booking_time = null;
  }

  const { error } = await supabase.from("bookings").update(extendedPayload).eq("id", bookingId);

  if (!error) {
    return { rescheduleColumnsAvailable: true };
  }

  if (!isMissingRescheduleColumnError(error.message)) {
    throw new Error(error.message);
  }

  if (input.rejectPendingRequest) {
    throw new Error(rescheduleColumnsMissingMessage());
  }

  const { error: retryErr } = await supabase
    .from("bookings")
    .update(basePayload)
    .eq("id", bookingId);

  if (retryErr) throw new Error(retryErr.message);
  return { rescheduleColumnsAvailable: false };
}

export async function readBookingRescheduleState(
  supabase: SupabaseClient,
  bookingId: string
): Promise<{ rescheduleRequested: boolean; rescheduleStatus: string | null } | null> {
  const { data, error } = await supabase
    .from("bookings")
    .select("reschedule_requested, reschedule_status")
    .eq("id", bookingId)
    .maybeSingle();

  if (error) {
    if (isMissingRescheduleColumnError(error.message)) return null;
    throw new Error(error.message);
  }

  return {
    rescheduleRequested: data?.reschedule_requested === true,
    rescheduleStatus: (data?.reschedule_status as string | null) || null,
  };
}
