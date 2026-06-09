"use server";

import { createSupabaseAdminClient } from "@/config/supabase-admin";
import {
  getBlockedDisplaySlots,
  parseDisplayTimeSlot,
  resolveStaffForBookingSlot,
  SLOT_UNAVAILABLE_MESSAGE,
} from "@/lib/booking-availability";
import { enrichBookingsWithDurations } from "@/lib/booking-conflict-data";

export type BookingSlotsResult =
  | { success: true; slots: string[]; bookedSlots: string[]; closed: boolean; reason?: string }
  | { success: false; error: string };

/**
 * Server-side slot availability. Client-side Supabase queries are unreliable on
 * production (they hang), so the booking sheet calls this instead of querying
 * salon_operating_hours / staff_schedules / bookings from the browser.
 */
export async function fetchAvailableBookingSlots(input: {
  salonId: string;
  staffId: string; // "any" or a staff id
  dateISO: string; // yyyy-MM-dd
  dayOfWeek: number; // 0-6 (Sunday=0)
  totalDurationMinutes: number;
  staffIds: string[];
}): Promise<BookingSlotsResult> {
  const { salonId, staffId, dateISO, dayOfWeek, totalDurationMinutes, staffIds } = input;

  if (!salonId || !dateISO) {
    return { success: false, error: "Missing salon or date." };
  }

  try {
    const supabase = createSupabaseAdminClient();

    // 1. Salon operating hours for this weekday
    const { data: operatingHours } = await supabase
      .from("salon_operating_hours")
      .select("*")
      .eq("salon_id", salonId)
      .eq("day_of_week", dayOfWeek)
      .maybeSingle();

    if (operatingHours?.is_closed) {
      return { success: true, slots: [], bookedSlots: [], closed: true, reason: "Salon is closed on this day." };
    }

    let startHour = 9;
    let endHour = 19;
    if (operatingHours?.opening_time && operatingHours?.closing_time) {
      startHour = parseInt(operatingHours.opening_time.split(":")[0]);
      endHour = parseInt(operatingHours.closing_time.split(":")[0]);
    }

    const baseSlots: string[] = [];
    for (let h = startHour; h < endHour; h++) {
      const displayH = h % 12 === 0 ? 12 : h % 12;
      const period = h >= 12 ? "PM" : "AM";
      baseSlots.push(`${displayH.toString().padStart(2, "0")}:00 ${period}`);
      baseSlots.push(`${displayH.toString().padStart(2, "0")}:30 ${period}`);
    }

    // 2. Staff schedule + breaks (only when a specific stylist is chosen)
    let staffWorking = true;
    let breaks: Array<{ break_start: string; break_end: string }> = [];
    let schedule: { is_working?: boolean; end_time?: string } | null = null;

    if (staffId && staffId !== "any") {
      const { data: sData } = await supabase
        .from("staff_schedules")
        .select("*")
        .eq("staff_id", staffId)
        .eq("day_of_week", dayOfWeek)
        .maybeSingle();
      schedule = sData;
      if (schedule && schedule.is_working === false) staffWorking = false;

      const { data: staffBreaks } = await supabase
        .from("staff_breaks")
        .select("*")
        .eq("staff_id", staffId)
        .eq("day_of_week", dayOfWeek);
      if (staffBreaks) breaks = staffBreaks;
    }

    if (!staffWorking) {
      return { success: true, slots: [], bookedSlots: [], closed: false, reason: "Stylist is not working on this day." };
    }

    // 3. Existing bookings for the day — with their total service duration
    const { data: bookedEvents } = await supabase
      .from("bookings")
      .select("id, booking_time, staff_id, status, created_at, service_id")
      .eq("salon_id", salonId)
      .eq("booking_date", dateISO);

    const enrichedBookings = await enrichBookingsWithDurations(supabase, bookedEvents || []);

    const blockedSlots = getBlockedDisplaySlots(
      enrichedBookings,
      staffId || "any",
      staffIds,
      totalDurationMinutes
    );

    // 4. Shared resources (chairs/basins) and their bookings
    const { data: salonResources } = await supabase
      .from("resources")
      .select("*")
      .eq("salon_id", salonId);

    const { data: activeResourceBookings } = await supabase
      .from("resource_bookings")
      .select("*")
      .eq("booking_date", dateISO);

    const closingMinutes = operatingHours?.closing_time
      ? (() => {
          const [h, m] = operatingHours.closing_time.split(":").map(Number);
          return h * 60 + m;
        })()
      : endHour * 60;

    const bufferTime = 15;

    const finalSlots = baseSlots.filter((slot) => {
      if (blockedSlots.has(slot)) return false;

      const [timeStr, period] = slot.split(" ");
      let [hh, mm] = timeStr.split(":").map(Number);
      if (period === "PM" && hh < 12) hh += 12;
      if (period === "AM" && hh === 12) hh = 0;
      const slotMinutes = hh * 60 + mm;
      const totalRequiredMinutes = slotMinutes + totalDurationMinutes + bufferTime;

      if (totalRequiredMinutes > closingMinutes) return false;

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
            (rb) => rb.resource_id === res.id && rb.start_time <= slotTimeStr && rb.end_time > slotTimeStr
          );
          if (currentBookings.length >= res.quantity) return false;
        }
      }

      return true;
    });

    // Slots that fall within the salon's operating hours but are taken by an
    // existing booking (for this staff member, or all staff when "any" is chosen).
    // These are surfaced so the UI can show them as "already booked" instead of hiding them.
    const bookedSlots = baseSlots.filter((slot) => blockedSlots.has(slot));

    return { success: true, slots: finalSlots, bookedSlots, closed: false };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not load time slots.";
    return { success: false, error: message };
  }
}

export type ValidateSlotResult =
  | { success: true; resolvedStaffId: string }
  | { success: false; error: string };

/**
 * Re-check slot availability immediately before checkout redirect or payment.
 * Uses the same staff-resolution rules as checkout completion.
 */
export async function validateBookingSlotSelection(input: {
  salonId: string;
  staffId: string;
  bookingDate: string;
  timeSlot: string;
  totalDurationMinutes: number;
}): Promise<ValidateSlotResult> {
  const { salonId, staffId, bookingDate, timeSlot, totalDurationMinutes } = input;

  if (!salonId || !bookingDate || !timeSlot || totalDurationMinutes <= 0) {
    return { success: false, error: "Missing booking details." };
  }

  try {
    const supabase = createSupabaseAdminClient();
    const formattedTime = parseDisplayTimeSlot(timeSlot);

    const [{ data: salonStaff }, { data: dayBookings }] = await Promise.all([
      supabase.from("salon_staff").select("id").eq("salon_id", salonId),
      supabase
        .from("bookings")
        .select("id, booking_time, staff_id, status, created_at, service_id")
        .eq("salon_id", salonId)
        .eq("booking_date", bookingDate),
    ]);

    const enrichedBookings = await enrichBookingsWithDurations(supabase, dayBookings || []);

    const staffIds = (salonStaff || []).map((member) => member.id).filter(Boolean);
    const resolvedStaffId = resolveStaffForBookingSlot({
      bookings: enrichedBookings,
      staffIds,
      preferredStaffId: staffId,
      formattedTime,
      proposedDurationMinutes: totalDurationMinutes,
    });

    return { success: true, resolvedStaffId };
  } catch (err) {
    const message = err instanceof Error ? err.message : SLOT_UNAVAILABLE_MESSAGE;
    return { success: false, error: message };
  }
}

/** Weekdays (0-6) the salon is closed — for greying out calendar dates. */
export async function fetchSalonClosedDays(salonId: string): Promise<number[]> {
  if (!salonId) return [];
  try {
    const supabase = createSupabaseAdminClient();
    const { data } = await supabase
      .from("salon_operating_hours")
      .select("day_of_week")
      .eq("salon_id", salonId)
      .eq("is_closed", true);
    return (data || []).map((d) => d.day_of_week as number);
  } catch {
    return [];
  }
}
