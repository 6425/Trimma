export const ACTIVE_BOOKING_STATUSES = [
  "pending",
  "confirmed",
  "in_progress",
  "checked_in",
] as const;

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

/**
 * Whether an existing booking should block slot selection in the UI and at checkout.
 * Matches the DB unique index: all pending/confirmed bookings block their exact slot.
 */
export function shouldBlockBooking(booking: BookingConflictRow): boolean {
  return isActiveBookingStatus(booking.status);
}

/** Unassigned bookings (staff_id null) occupy salon capacity for every stylist. */
export function bookingAppliesToStaff(
  booking: BookingConflictRow,
  staffId: string
): boolean {
  if (!booking.staff_id) return true;
  return booking.staff_id === staffId;
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
  return slotStartMin < bookingEnd && bookingStartMin < slotEnd;
}

type BusyRange = { startMin: number; durationMin: number };

function getBookingBusyRange(booking: BookingConflictRow): BusyRange {
  return {
    startMin: timeToMinutes(normalizeDbTime(booking.booking_time)),
    durationMin: booking.duration_minutes ?? 30,
  };
}

function addBusyRange(
  staffBusyMap: Map<string, BusyRange[]>,
  staffKey: string,
  range: BusyRange
): void {
  if (!staffBusyMap.has(staffKey)) staffBusyMap.set(staffKey, []);
  staffBusyMap.get(staffKey)!.push(range);
}

function buildStaffBusyMap(
  bookings: BookingConflictRow[],
  staffPool: string[]
): Map<string, BusyRange[]> {
  const staffBusyMap = new Map<string, BusyRange[]>();

  for (const booking of bookings) {
    const range = getBookingBusyRange(booking);

    if (!booking.staff_id) {
      if (staffPool.length > 0) {
        for (const staffMemberId of staffPool) {
          addBusyRange(staffBusyMap, staffMemberId, range);
        }
      } else {
        addBusyRange(staffBusyMap, "__unassigned__", range);
      }
      continue;
    }

    addBusyRange(staffBusyMap, booking.staff_id, range);
  }

  return staffBusyMap;
}

/**
 * Returns the set of display-format time slots that should be shown as blocked
 * (unavailable) for the given staff member (or "any").
 */
export function getBlockedDisplaySlots(
  bookings: BookingConflictRow[],
  staffId: string | "any",
  allStaffIds: string[],
  proposedDurationMinutes: number
): Set<string> {
  const active = bookings.filter((b) => shouldBlockBooking(b));
  const blocked = new Set<string>();
  const staffPool = allStaffIds.filter(Boolean);
  const staffBusyMap = buildStaffBusyMap(active, staffPool);

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
    const busyRanges = staffBusyMap.get(staffId) || [];
    for (const slot of candidateSlots) {
      for (const busy of busyRanges) {
        if (rangesOverlap(slot.startMin, proposedDurationMinutes, busy.startMin, busy.durationMin)) {
          blocked.add(slot.display);
          break;
        }
      }
    }
  } else if (staffPool.length === 0) {
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
  proposedDurationMinutes: number
): string | null {
  const active = bookings.filter((b) => shouldBlockBooking(b));
  const slotStartMin = timeToMinutes(formattedTime);

  return (
    staffIds.find((id) => {
      return !active.some(
        (b) =>
          bookingAppliesToStaff(b, id) &&
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

const STAFF_NOT_ASSIGNED_TO_SERVICE_MSG =
  "The selected stylist is not assigned to this service.";

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
}): string {
  const { bookings, staffIds, preferredStaffId, formattedTime, proposedDurationMinutes } = params;

  let resolvedStaffId: string | null = null;

  if (preferredStaffId && preferredStaffId !== "any") {
    if (!staffIds.includes(preferredStaffId)) {
      throw new Error(STAFF_NOT_ASSIGNED_TO_SERVICE_MSG);
    }
    resolvedStaffId = preferredStaffId;
  } else {
    resolvedStaffId = resolveAvailableStaffId(
      staffIds,
      bookings,
      formattedTime,
      proposedDurationMinutes
    );
  }

  assertStaffSlotAvailable(bookings, resolvedStaffId, formattedTime, proposedDurationMinutes);

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
  proposedDurationMinutes: number
): void {
  if (!staffId) {
    throw new Error("No staff member is available for the selected time slot.");
  }

  const slotStartMin = timeToMinutes(formattedTime);

  const conflict = bookings.find(
    (b) =>
      shouldBlockBooking(b) &&
      bookingAppliesToStaff(b, staffId) &&
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
