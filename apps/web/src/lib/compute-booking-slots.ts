import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { getBlockedDisplaySlots } from "@/lib/booking-availability";
import { enrichBookingsWithDurations } from "@/lib/booking-conflict-data";
import {
  resolveSalonHoursForBooking,
  SALON_DAY_NAMES,
} from "@/lib/salon-operating-hours";
import { parseStaffWorkingHours } from "@/lib/salon-staff-insert";

export type ComputeBookingSlotsInput = {
  salonId: string;
  staffId: string;
  dateISO: string;
  dayOfWeek: number;
  totalDurationMinutes: number;
  staffIds: string[];
};

export type ComputeBookingSlotsResult =
  | { success: true; slots: string[]; closed: boolean; reason?: string }
  | { success: false; error: string };

/**
 * Server-side slot availability (ported from api-gateway BookingsService).
 */
export async function computeBookingSlots(
  input: ComputeBookingSlotsInput
): Promise<ComputeBookingSlotsResult> {
  const { salonId, staffId, dateISO, dayOfWeek, totalDurationMinutes, staffIds } = input;

  if (!salonId || !dateISO) {
    return { success: false, error: "Missing salon or date." };
  }

  try {
    const supabase = createSupabaseAdminClient();

    const [{ data: operatingRows }, { data: salon }] = await Promise.all([
      supabase.from("salon_operating_hours").select("*").eq("salon_id", salonId),
      supabase.from("salons").select("working_hours").eq("id", salonId).maybeSingle(),
    ]);

    const salonHours = resolveSalonHoursForBooking(
      dayOfWeek,
      operatingRows || [],
      salon?.working_hours
    );

    if (salonHours.isClosed) {
      return { success: true, slots: [], closed: true, reason: "Salon is closed on this day." };
    }

    const { startHour, endHour, closingMinutes } = salonHours;

    const baseSlots: string[] = [];
    for (let h = startHour; h < endHour; h++) {
      const displayH = h % 12 === 0 ? 12 : h % 12;
      const period = h >= 12 ? "PM" : "AM";
      baseSlots.push(`${displayH.toString().padStart(2, "0")}:00 ${period}`);
      baseSlots.push(`${displayH.toString().padStart(2, "0")}:30 ${period}`);
    }

    let staffWorking = true;
    let breaks: Array<{ break_start: string; break_end: string }> = [];
    let schedule: { is_working?: boolean; end_time?: string } | null = null;

    if (staffId && staffId !== "any") {
      const [{ data: sData }, { data: staffRow }] = await Promise.all([
        supabase
          .from("staff_schedules")
          .select("*")
          .eq("staff_id", staffId)
          .eq("day_of_week", dayOfWeek)
          .maybeSingle(),
        supabase.from("salon_staff").select("working_hours").eq("id", staffId).maybeSingle(),
      ]);
      schedule = sData;
      if (!schedule) {
        const parsed = parseStaffWorkingHours(staffRow?.working_hours);
        const dayName = SALON_DAY_NAMES[dayOfWeek];
        const day = dayName
          ? (parsed?.schedule?.[dayName] as { isWorking?: boolean; start?: string; end?: string } | undefined)
          : undefined;
        if (day) {
          schedule = {
            is_working: !!day.isWorking,
            end_time: day.end ? `${day.end}:00`.replace(/:00:00$/, ":00") : undefined,
          };
        }
      }
      if (schedule && schedule.is_working === false) staffWorking = false;

      const { data: staffBreaks } = await supabase
        .from("staff_breaks")
        .select("*")
        .eq("staff_id", staffId)
        .eq("day_of_week", dayOfWeek);
      if (staffBreaks) breaks = staffBreaks;
    }

    if (!staffWorking) {
      return { success: true, slots: [], closed: false, reason: "Stylist is not working on this day." };
    }

    const { data: bookedEvents } = await supabase
      .from("bookings")
      .select("id, booking_time, staff_id, status, created_at, service_id")
      .eq("salon_id", salonId)
      .eq("booking_date", dateISO);

    const enrichedBookings = await enrichBookingsWithDurations(supabase, bookedEvents || []);

    const blockedSlots = getBlockedDisplaySlots(
      enrichedBookings,
      staffId || "any",
      staffIds || [],
      totalDurationMinutes
    );

    const { data: salonResources } = await supabase
      .from("resources")
      .select("*")
      .eq("salon_id", salonId);

    const { data: activeResourceBookings } = await supabase
      .from("resource_bookings")
      .select("*")
      .eq("booking_date", dateISO);

    const closingMinutesResolved = closingMinutes;

    const bufferTime = 15;

    const finalSlots = baseSlots.filter((slot) => {
      if (blockedSlots.has(slot)) return false;

      const [timeStr, period] = slot.split(" ");
      let [hh, mm] = timeStr.split(":").map(Number);
      if (period === "PM" && hh < 12) hh += 12;
      if (period === "AM" && hh === 12) hh = 0;
      const slotMinutes = hh * 60 + mm;
      const totalRequiredMinutes = slotMinutes + totalDurationMinutes + bufferTime;

      if (totalRequiredMinutes > closingMinutesResolved) return false;

      if (staffId && staffId !== "any" && schedule?.end_time) {
        const [sEndH, sEndM] = schedule.end_time.split(":").map(Number);
        if (totalRequiredMinutes > sEndH * 60 + sEndM) return false;
      }

      if (breaks.length > 0) {
        for (const brk of breaks) {
          const [bStartH, bStartM] = brk.break_start.split(":").map(Number);
          const [bEndH, bEndM] = brk.break_end.split(":").map(Number);
          const brkStartMin = bStartH * 60 + bStartM;
          const brkEndMin = bEndH * 60 + bEndM;
          if (slotMinutes >= brkStartMin && slotMinutes < brkEndMin) return false;
        }
      }

      if (salonResources && salonResources.length > 0 && activeResourceBookings) {
        const slotTimeStr = `${hh.toString().padStart(2, "0")}:${mm.toString().padStart(2, "0")}:00`;
        for (const res of salonResources) {
          const currentBookings = activeResourceBookings.filter(
            (rb) =>
              rb.resource_id === res.id &&
              rb.start_time <= slotTimeStr &&
              rb.end_time > slotTimeStr
          );
          if (currentBookings.length >= res.quantity) return false;
        }
      }

      return true;
    });

    return { success: true, slots: finalSlots, closed: false };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not load time slots.";
    return { success: false, error: message };
  }
}
