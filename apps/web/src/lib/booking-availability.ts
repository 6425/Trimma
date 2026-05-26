export const ACTIVE_BOOKING_STATUSES = ["pending", "confirmed"] as const;

export type BookingConflictRow = {
  id?: string;
  booking_time: string;
  staff_id: string | null;
  status: string | null;
  created_at?: string | null;
  customer_email?: string | null;
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

export function getBlockedDisplaySlots(
  bookings: BookingConflictRow[],
  staffId: string | "any",
  allStaffIds: string[],
  stalePendingMinutes = 10
): Set<string> {
  const active = bookings.filter((booking) => shouldBlockBooking(booking, stalePendingMinutes));

  if (staffId && staffId !== "any") {
    return new Set(
      active
        .filter((booking) => booking.staff_id === staffId)
        .map((booking) => formatDbTimeToDisplaySlot(booking.booking_time))
    );
  }

  const blocked = new Set<string>();
  const staffPool = allStaffIds.filter(Boolean);
  if (staffPool.length === 0) {
    return new Set(active.map((booking) => formatDbTimeToDisplaySlot(booking.booking_time)));
  }

  const times = new Set(active.map((booking) => normalizeDbTime(booking.booking_time)));
  for (const time of times) {
    const busyStaff = new Set(
      active
        .filter((booking) => normalizeDbTime(booking.booking_time) === time)
        .map((booking) => booking.staff_id)
        .filter(Boolean)
    );
    if (staffPool.every((id) => busyStaff.has(id))) {
      blocked.add(formatDbTimeToDisplaySlot(time));
    }
  }

  return blocked;
}

export function resolveAvailableStaffId(
  staffIds: string[],
  bookings: BookingConflictRow[],
  formattedTime: string,
  stalePendingMinutes = 10
): string | null {
  const active = bookings.filter((booking) => shouldBlockBooking(booking, stalePendingMinutes));
  const busyStaff = new Set(
    active
      .filter((booking) => normalizeDbTime(booking.booking_time) === formattedTime)
      .map((booking) => booking.staff_id)
      .filter(Boolean)
  );

  return staffIds.find((id) => !busyStaff.has(id)) ?? null;
}

export function assertStaffSlotAvailable(
  bookings: BookingConflictRow[],
  staffId: string | null,
  formattedTime: string,
  stalePendingMinutes = 10
): void {
  if (!staffId) {
    throw new Error("No staff member is available for the selected time slot.");
  }

  const conflict = bookings.find(
    (booking) =>
      shouldBlockBooking(booking, stalePendingMinutes) &&
      booking.staff_id === staffId &&
      normalizeDbTime(booking.booking_time) === formattedTime
  );

  if (conflict) {
    throw new Error("This time slot is no longer available. Please choose another time.");
  }
}
