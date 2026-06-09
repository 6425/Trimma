export const ACTIVE_BOOKING_STATUSES = ["pending", "confirmed"] as const;

export type BookingConflictRow = {
  id?: string;
  booking_time: string;
  staff_id: string | null;
  status: string | null;
  created_at?: string | null;
  customer_email?: string | null;
  /** Total duration of the booking in minutes (sum of all services). Defaults to 30 if unknown. */
  duration_minutes?: number;
};

export function isActiveBookingStatus(status: string | null | undefined): boolean {
  return ACTIVE_BOOKING_STATUSES.includes(
    (status || "").toLowerCase() as (typeof ACTIVE_BOOKING_STATUSES)[number]
  );
}

export function parseDisplayTimeSlot(timeSlot: string): string {
  const [timeStr, period] = timeSlot.split(" ");
  let [hh, mm] = timeStr.split(":").map(Number);
  if (period === "PM" && hh < 12) hh += 12;
  if (period === "AM" && hh === 12) hh = 0;
  return `${hh.toString().padStart(2, "0")}:${mm.toString().padStart(2, "0")}:00`;
}

export function normalizeDbTime(bookingTime: string): string {
  const parts = bookingTime.split(":");
  const hh = parts[0]?.padStart(2, "0") ?? "00";
  const mm = parts[1]?.padStart(2, "0") ?? "00";
  return `${hh}:${mm}:00`;
}

export function formatDbTimeToDisplaySlot(bookingTime: string): string {
  const normalized = normalizeDbTime(bookingTime);
  const hh = parseInt(normalized.split(":")[0], 10);
  const mm = normalized.split(":")[1];
  const period = hh >= 12 ? "PM" : "AM";
  const displayHh = hh % 12 === 0 ? 12 : hh % 12;
  return `${displayHh.toString().padStart(2, "0")}:${mm} ${period}`;
}

/** Convert a normalized time string "HH:MM:SS" to total minutes from midnight. */
function timeToMinutes(normalized: string): number {
  const [hh, mm] = normalized.split(":").map(Number);
  return hh * 60 + mm;
}

export function shouldBlockBooking(
  booking: BookingConflictRow,
  stalePendingMinutes = 10
): boolean {
  if (!isActiveBookingStatus(booking.status)) return false;

  if ((booking.status || "").toLowerCase() === "pending" && booking.created_at) {
    const createdAt = new Date(booking.created_at).getTime();
    const cutoff = Date.now() - stalePendingMinutes * 60 * 1000;
    if (createdAt < cutoff) return false;
  }

  return true;
}

/**
 * Check whether a proposed slot [slotStart, slotStart + slotDuration)
 * overlaps with an existing booking [bookingStart, bookingStart + bookingDuration).
 */
function rangesOverlap(
  slotStartMin: number,
  slotDurationMin: number,
  bookingStartMin: number,
  bookingDurationMin: number
): boolean {
  const slotEnd = slotStartMin + Math.max(slotDurationMin, 1);
  const bookingEnd = bookingStartMin + Math.max(bookingDurationMin, 1);
  // Two ranges [A, B) and [C, D) overlap when A < D && C < B
  return slotStartMin < bookingEnd && bookingStartMin < slotEnd;
}

/**
 * Returns the set of display-format time slots that should be shown as blocked
 * (unavailable) for the given staff member (or "any").
 *
 * This version is duration-aware: a 60-minute booking at 10:00 will block both
 * the 10:00 and 10:30 display slots (assuming 30-min slot intervals and a
 * proposed service of any positive duration).
 */
export function getBlockedDisplaySlots(
  bookings: BookingConflictRow[],
  staffId: string | "any",
  allStaffIds: string[],
  proposedDurationMinutes: number,
  stalePendingMinutes = 10
): Set<string> {
  const active = bookings.filter((b) => shouldBlockBooking(b, stalePendingMinutes));
  const blocked = new Set<string>();
  const staffPool = allStaffIds.filter(Boolean);

  // Build a helper to check if a candidate display slot is blocked.
  // We generate all half-hour display slots from 00:00 to 23:30
  // but the caller only cares about slots that exist in their base list,
  // so returning a superset is fine — the caller will intersect.

  // Collect per-staff busy ranges
  type BusyRange = { startMin: number; durationMin: number };
  const staffBusyMap = new Map<string, BusyRange[]>();

  for (const b of active) {
    const sid = b.staff_id || "__unassigned__";
    const startMin = timeToMinutes(normalizeDbTime(b.booking_time));
    const dur = b.duration_minutes ?? 30;
    if (!staffBusyMap.has(sid)) staffBusyMap.set(sid, []);
    staffBusyMap.get(sid)!.push({ startMin, durationMin: dur });
  }

  // Generate candidate display slots (every 30 min, 0:00-23:30)
  const candidateSlots: { display: string; startMin: number }[] = [];
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 30]) {
      const normalized = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:00`;
      candidateSlots.push({
        display: formatDbTimeToDisplaySlot(normalized),
        startMin: h * 60 + m,
      });
    }
  }

  if (staffId && staffId !== "any") {
    // Specific staff: block any slot that overlaps with this staff member's bookings
    const busyRanges = staffBusyMap.get(staffId) || [];
    for (const slot of candidateSlots) {
      for (const busy of busyRanges) {
        if (rangesOverlap(slot.startMin, proposedDurationMinutes, busy.startMin, busy.durationMin)) {
          blocked.add(slot.display);
          break;
        }
      }
    }
  } else {
    // "Any" staff: a slot is blocked only if ALL staff members are busy during that range
    if (staffPool.length === 0) {
      // No staff pool info — treat all active bookings as blocking
      const allBusy: BusyRange[] = [];
      for (const ranges of staffBusyMap.values()) allBusy.push(...ranges);
      for (const slot of candidateSlots) {
        for (const busy of allBusy) {
          if (rangesOverlap(slot.startMin, proposedDurationMinutes, busy.startMin, busy.durationMin)) {
            blocked.add(slot.display);
            break;
          }
        }
      }
    } else {
      for (const slot of candidateSlots) {
        const allBusy = staffPool.every((sid) => {
          const ranges = staffBusyMap.get(sid) || [];
          return ranges.some((busy) =>
            rangesOverlap(slot.startMin, proposedDurationMinutes, busy.startMin, busy.durationMin)
          );
        });
        if (allBusy) blocked.add(slot.display);
      }
    }
  }

  return blocked;
}

/**
 * Find the first available staff member for the given time slot,
 * considering the full duration of the proposed booking.
 */
export function resolveAvailableStaffId(
  staffIds: string[],
  bookings: BookingConflictRow[],
  formattedTime: string,
  proposedDurationMinutes: number,
  stalePendingMinutes = 10
): string | null {
  const active = bookings.filter((b) => shouldBlockBooking(b, stalePendingMinutes));
  const slotStartMin = timeToMinutes(formattedTime);

  return (
    staffIds.find((id) => {
      // Check this staff member has no overlapping bookings
      return !active.some(
        (b) =>
          b.staff_id === id &&
          rangesOverlap(
            slotStartMin,
            proposedDurationMinutes,
            timeToMinutes(normalizeDbTime(b.booking_time)),
            b.duration_minutes ?? 30
          )
      );
    }) ?? null
  );
}

export const SLOT_UNAVAILABLE_MESSAGE =
  "This time slot is no longer available. Please choose another time.";

/**
 * Resolve which staff member will take the booking and verify the slot is free.
 * Never falls back to a busy stylist — throws if no one is available.
 */
export function resolveStaffForBookingSlot(params: {
  bookings: BookingConflictRow[];
  staffIds: string[];
  preferredStaffId?: string | null;
  formattedTime: string;
  proposedDurationMinutes: number;
  stalePendingMinutes?: number;
}): string {
  const {
    bookings,
    staffIds,
    preferredStaffId,
    formattedTime,
    proposedDurationMinutes,
    stalePendingMinutes = 10,
  } = params;

  let resolvedStaffId: string | null = null;

  if (preferredStaffId && preferredStaffId !== "any") {
    resolvedStaffId = preferredStaffId;
  } else {
    resolvedStaffId = resolveAvailableStaffId(
      staffIds,
      bookings,
      formattedTime,
      proposedDurationMinutes,
      stalePendingMinutes
    );
  }

  assertStaffSlotAvailable(
    bookings,
    resolvedStaffId,
    formattedTime,
    proposedDurationMinutes,
    stalePendingMinutes
  );

  return resolvedStaffId!;
}

/**
 * Assert that the given staff member's slot is still available,
 * considering the full duration of the proposed booking.
 * Throws if a conflict is found.
 */
export function assertStaffSlotAvailable(
  bookings: BookingConflictRow[],
  staffId: string | null,
  formattedTime: string,
  proposedDurationMinutes: number,
  stalePendingMinutes = 10
): void {
  if (!staffId) {
    throw new Error("No staff member is available for the selected time slot.");
  }

  const slotStartMin = timeToMinutes(formattedTime);

  const conflict = bookings.find(
    (b) =>
      shouldBlockBooking(b, stalePendingMinutes) &&
      b.staff_id === staffId &&
      rangesOverlap(
        slotStartMin,
        proposedDurationMinutes,
        timeToMinutes(normalizeDbTime(b.booking_time)),
        b.duration_minutes ?? 30
      )
  );

  if (conflict) {
    throw new Error(SLOT_UNAVAILABLE_MESSAGE);
  }
}
