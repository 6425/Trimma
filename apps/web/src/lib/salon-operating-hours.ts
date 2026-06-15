import type { SupabaseClient } from "@supabase/supabase-js";
import { parseSalonScheduleFromWorkingHours, type SalonScheduleDay } from "@/lib/salon-profile-save";
import { parseStaffWorkingHours } from "@/lib/salon-staff-insert";

export const SALON_DAY_NAMES = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

export type SalonOperatingHourRow = {
  day_of_week: number;
  is_closed: boolean;
  opening_time: string | null;
  closing_time: string | null;
};

export type SalonDayHours = {
  dayOfWeek: number;
  isClosed: boolean;
  openingMinutes: number | null;
  closingMinutes: number | null;
};

export type SalonListingAvailability = {
  openNow: boolean;
  nextSlot: string;
  status: "Open Now" | "Closed";
};

const DEFAULT_OPEN_MINUTES = 9 * 60;
const DEFAULT_CLOSE_MINUTES = 19 * 60;
const COLOMBO_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function parseWorkingHoursJson(workingHours: unknown): unknown {
  if (!workingHours) return null;
  if (typeof workingHours === "string") {
    try {
      return JSON.parse(workingHours);
    } catch {
      return null;
    }
  }
  return workingHours;
}

function formatTimeForDb(time: string): string {
  const trimmed = time.trim();
  if (!trimmed) return "09:00:00";
  const parts = trimmed.split(":");
  const hours = parts[0]?.padStart(2, "0") ?? "09";
  const minutes = parts[1]?.padStart(2, "0") ?? "00";
  return `${hours}:${minutes}:00`;
}

function parseTimeToMinutes(time: string | null | undefined): number | null {
  if (!time) return null;
  const [hours, minutes] = time.split(":");
  const h = parseInt(hours, 10);
  const m = parseInt(minutes || "0", 10);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

function formatGooglePlacesTime(value: string): string {
  if (value.length === 4) {
    return `${value.substring(0, 2)}:${value.substring(2, 4)}`;
  }
  return value;
}

export function normalizeSalonWeeklySchedule(workingHours: unknown): Record<string, SalonScheduleDay> | null {
  const trimma = parseSalonScheduleFromWorkingHours(workingHours);
  if (Object.keys(trimma).length > 0) {
    return trimma;
  }

  const parsed = parseWorkingHoursJson(workingHours);
  if (!parsed) return null;

  if (Array.isArray(parsed)) {
    const mapped: Record<string, SalonScheduleDay> = {};
    for (const slot of parsed) {
      const openDay = slot?.open?.day;
      const openTime = slot?.open?.time;
      const closeTime = slot?.close?.time;
      if (openDay == null || !openTime || !closeTime) continue;
      const dayName = SALON_DAY_NAMES[openDay];
      if (!dayName) continue;
      mapped[dayName] = {
        isWorking: true,
        start: formatGooglePlacesTime(openTime),
        end: formatGooglePlacesTime(closeTime),
      };
    }
    return Object.keys(mapped).length > 0 ? mapped : null;
  }

  return null;
}

export function weeklyScheduleToOperatingRows(
  salonId: string,
  schedule: Record<string, SalonScheduleDay>
): Array<{
  salon_id: string;
  day_of_week: number;
  opening_time: string | null;
  closing_time: string | null;
  is_closed: boolean;
}> {
  return SALON_DAY_NAMES.map((dayName, dayOfWeek) => {
    const day = schedule[dayName];
    if (!day || !day.isWorking) {
      return {
        salon_id: salonId,
        day_of_week: dayOfWeek,
        opening_time: null,
        closing_time: null,
        is_closed: true,
      };
    }

    return {
      salon_id: salonId,
      day_of_week: dayOfWeek,
      opening_time: formatTimeForDb(day.start),
      closing_time: formatTimeForDb(day.end),
      is_closed: false,
    };
  });
}

export async function syncSalonOperatingHours(
  supabase: SupabaseClient,
  salonId: string,
  workingHours: unknown
): Promise<void> {
  const schedule = normalizeSalonWeeklySchedule(workingHours);
  if (!schedule) return;

  const rows = weeklyScheduleToOperatingRows(salonId, schedule);
  const { error: deleteError } = await supabase
    .from("salon_operating_hours")
    .delete()
    .eq("salon_id", salonId);
  if (deleteError) throw new Error(deleteError.message);

  const { error: insertError } = await supabase.from("salon_operating_hours").insert(rows);
  if (insertError) throw new Error(insertError.message);
}

export async function syncStaffSchedules(
  supabase: SupabaseClient,
  staffId: string,
  workingHours: unknown
): Promise<void> {
  const parsed = parseStaffWorkingHours(workingHours);
  const schedule = parsed?.schedule;
  if (!schedule || typeof schedule !== "object") return;

  const rows = SALON_DAY_NAMES.map((dayName, dayOfWeek) => {
    const day = schedule[dayName] as { isWorking?: boolean; start?: string; end?: string } | undefined;
    const isWorking = !!day?.isWorking && !!day.start && !!day.end;
    return {
      staff_id: staffId,
      day_of_week: dayOfWeek,
      start_time: isWorking ? formatTimeForDb(day!.start!) : null,
      end_time: isWorking ? formatTimeForDb(day!.end!) : null,
      is_working: isWorking,
    };
  });

  const { error: deleteError } = await supabase.from("staff_schedules").delete().eq("staff_id", staffId);
  if (deleteError) throw new Error(deleteError.message);

  const { error: insertError } = await supabase.from("staff_schedules").insert(rows);
  if (insertError) throw new Error(insertError.message);
}

export function resolveSalonDayHours(
  dayOfWeek: number,
  operatingRows: SalonOperatingHourRow[] | null | undefined,
  workingHours: unknown
): SalonDayHours {
  const row = operatingRows?.find((entry) => entry.day_of_week === dayOfWeek);
  if (row) {
    if (row.is_closed) {
      return { dayOfWeek, isClosed: true, openingMinutes: null, closingMinutes: null };
    }
    return {
      dayOfWeek,
      isClosed: false,
      openingMinutes: parseTimeToMinutes(row.opening_time),
      closingMinutes: parseTimeToMinutes(row.closing_time),
    };
  }

  const schedule = normalizeSalonWeeklySchedule(workingHours);
  const dayName = SALON_DAY_NAMES[dayOfWeek];
  const day = dayName ? schedule?.[dayName] : undefined;
  if (!day || !day.isWorking) {
    return { dayOfWeek, isClosed: true, openingMinutes: null, closingMinutes: null };
  }

  return {
    dayOfWeek,
    isClosed: false,
    openingMinutes: parseTimeToMinutes(day.start),
    closingMinutes: parseTimeToMinutes(day.end),
  };
}

export function getSalonClosedWeekdays(
  operatingRows: SalonOperatingHourRow[] | null | undefined,
  workingHours: unknown
): number[] {
  const closed: number[] = [];
  for (let day = 0; day < 7; day += 1) {
    if (resolveSalonDayHours(day, operatingRows, workingHours).isClosed) {
      closed.push(day);
    }
  }
  return closed;
}

function getColomboDateParts(now = new Date()) {
  const colombo = new Date(now.getTime() + now.getTimezoneOffset() * 60_000 + COLOMBO_OFFSET_MS);
  return {
    dayOfWeek: colombo.getDay(),
    minutesNow: colombo.getHours() * 60 + colombo.getMinutes(),
    month: colombo.getMonth(),
    date: colombo.getDate(),
    year: colombo.getFullYear(),
  };
}

function formatDisplayTime(totalMinutes: number): string {
  const hours24 = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const period = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`;
}

function dayLabel(offsetDays: number, now = new Date()): string {
  if (offsetDays === 0) return "Today";
  if (offsetDays === 1) return "Tomorrow";
  const colombo = new Date(now.getTime() + now.getTimezoneOffset() * 60_000 + COLOMBO_OFFSET_MS);
  colombo.setDate(colombo.getDate() + offsetDays);
  return colombo.toLocaleDateString("en-US", { weekday: "short" });
}

function roundUpToNextSlot(minutes: number, slotInterval = 30): number {
  return Math.ceil(minutes / slotInterval) * slotInterval;
}

function generateDaySlots(openingMinutes: number, closingMinutes: number, slotInterval = 30): number[] {
  const slots: number[] = [];
  let cursor = openingMinutes;
  while (cursor < closingMinutes) {
    slots.push(cursor);
    cursor += slotInterval;
  }
  return slots;
}

export function computeSalonListingAvailability(
  operatingRows: SalonOperatingHourRow[] | null | undefined,
  workingHours: unknown,
  now = new Date()
): SalonListingAvailability {
  const { dayOfWeek, minutesNow } = getColomboDateParts(now);

  for (let offset = 0; offset < 8; offset += 1) {
    const targetDay = (dayOfWeek + offset) % 7;
    const hours = resolveSalonDayHours(targetDay, operatingRows, workingHours);
    if (hours.isClosed) continue;

    const opening = hours.openingMinutes ?? DEFAULT_OPEN_MINUTES;
    const closing = hours.closingMinutes ?? DEFAULT_CLOSE_MINUTES;
    const slots = generateDaySlots(opening, closing);

    let candidateSlots = slots;
    if (offset === 0) {
      const nextStart = roundUpToNextSlot(Math.max(minutesNow, opening));
      candidateSlots = slots.filter((slot) => slot >= nextStart);
      const openNow = minutesNow >= opening && minutesNow < closing;

      if (candidateSlots.length > 0) {
        return {
          openNow,
          nextSlot: `${dayLabel(offset, now)} ${formatDisplayTime(candidateSlots[0])}`,
          status: openNow ? "Open Now" : "Closed",
        };
      }

      if (openNow) {
        return {
          openNow: true,
          nextSlot: `${dayLabel(offset, now)} ${formatDisplayTime(closing)}`,
          status: "Open Now",
        };
      }

      continue;
    }

    if (candidateSlots.length > 0) {
      return {
        openNow: false,
        nextSlot: `${dayLabel(offset, now)} ${formatDisplayTime(candidateSlots[0])}`,
        status: "Closed",
      };
    }
  }

  return {
    openNow: false,
    nextSlot: "Hours not listed",
    status: "Closed",
  };
}

export function resolveSalonHoursForBooking(
  dayOfWeek: number,
  operatingRows: SalonOperatingHourRow[] | null | undefined,
  workingHours: unknown
): { isClosed: boolean; startHour: number; endHour: number; closingMinutes: number } {
  const hours = resolveSalonDayHours(dayOfWeek, operatingRows, workingHours);
  if (hours.isClosed) {
    return { isClosed: true, startHour: 9, endHour: 19, closingMinutes: DEFAULT_CLOSE_MINUTES };
  }

  const openingMinutes = hours.openingMinutes ?? DEFAULT_OPEN_MINUTES;
  const closingMinutes = hours.closingMinutes ?? DEFAULT_CLOSE_MINUTES;
  return {
    isClosed: false,
    startHour: Math.floor(openingMinutes / 60),
    endHour: Math.max(Math.floor(closingMinutes / 60), Math.floor(openingMinutes / 60) + 1),
    closingMinutes,
  };
}
