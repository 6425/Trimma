import type { SupabaseClient } from "@supabase/supabase-js";
import type { BookingConflictRow } from "@/lib/booking-availability";

type RawDayBooking = {
  id: string;
  booking_time: string;
  staff_id: string | null;
  status: string | null;
  created_at?: string | null;
  service_id?: string | null;
};

export async function enrichBookingsWithDurations(
  supabase: SupabaseClient,
  rawBookings: RawDayBooking[]
): Promise<BookingConflictRow[]> {
  const bookingIds = rawBookings.map((b) => b.id).filter(Boolean);
  const bookingDurations = new Map<string, number>();

  if (bookingIds.length > 0) {
    const { data: bsRows } = await supabase
      .from("booking_services")
      .select("booking_id, duration_min")
      .in("booking_id", bookingIds);

    if (bsRows) {
      for (const row of bsRows) {
        const dur = parseInt(String(row.duration_min || 0), 10);
        bookingDurations.set(
          row.booking_id,
          (bookingDurations.get(row.booking_id) || 0) + dur
        );
      }
    }

    const missingServiceIds = rawBookings
      .filter((b) => !bookingDurations.has(b.id) && b.service_id)
      .map((b) => b.service_id as string);

    if (missingServiceIds.length > 0) {
      const { data: serviceRows } = await supabase
        .from("services")
        .select("id, duration, duration_min")
        .in("id", [...new Set(missingServiceIds)]);

      const serviceDurationById = new Map<string, number>();
      for (const service of serviceRows || []) {
        const dur = parseInt(String(service.duration_min || service.duration || 30), 10);
        serviceDurationById.set(service.id, dur > 0 ? dur : 30);
      }

      for (const booking of rawBookings) {
        if (!bookingDurations.has(booking.id) && booking.service_id) {
          bookingDurations.set(
            booking.id,
            serviceDurationById.get(booking.service_id) || 30
          );
        }
      }
    }
  }

  return rawBookings.map((b) => ({
    id: b.id,
    booking_time: b.booking_time,
    staff_id: b.staff_id,
    status: b.status,
    created_at: b.created_at,
    duration_minutes: bookingDurations.get(b.id) || 30,
  }));
}
