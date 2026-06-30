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
  const { error: scheduleErr } = await supabase
    .from("bookings")
    .update({
      booking_date: input.bookingDate,
      booking_time: input.bookingTime,
    })
    .eq("id", bookingId);

  if (scheduleErr) {
    throw new Error(scheduleErr.message);
  }

  const shouldTouchRescheduleFlags =
    input.rejectPendingRequest || input.clearRescheduleRequest || input.approvePendingRequest;

  if (!shouldTouchRescheduleFlags) {
    return { rescheduleColumnsAvailable: true };
  }

  const flagPayload: Record<string, unknown> = input.rejectPendingRequest
    ? {
        reschedule_requested: false,
        reschedule_status: "rejected",
        requested_booking_date: null,
        requested_booking_time: null,
      }
    : {
        reschedule_requested: false,
        reschedule_status: "none",
        requested_booking_date: null,
        requested_booking_time: null,
      };

  const { error: flagErr } = await supabase
    .from("bookings")
    .update(flagPayload)
    .eq("id", bookingId);

  if (!flagErr) {
    return { rescheduleColumnsAvailable: true };
  }

  if (!isMissingRescheduleColumnError(flagErr.message)) {
    throw new Error(flagErr.message);
  }

  if (input.rejectPendingRequest) {
    throw new Error(rescheduleColumnsMissingMessage());
  }

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
