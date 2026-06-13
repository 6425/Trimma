import {
  normalizeDbTime,
  resolveAvailableStaffId,
  type BookingConflictRow,
} from "@/lib/booking-availability";

export type StaffAssignedService = {
  service_id: string;
  commission_rate?: number | null;
  enabled?: boolean;
};

export type SalonStaffForAllocation = {
  id: string;
  name?: string | null;
  status?: string | null;
  commission_rate?: number | null;
  working_hours?: { assigned_services?: StaffAssignedService[] | null } | null;
};

export const STAFF_REQUIRED_BEFORE_SERVICES_MSG =
  "Add at least one staff member in the Staff menu before adding or publishing services.";

export const SERVICE_NEEDS_STAFF_MSG =
  "Assign this service to at least one staff member in the Staff menu before setting it to Active.";

export function isActiveSalonStaff(member: SalonStaffForAllocation): boolean {
  return (member.status || "active").toLowerCase() !== "inactive";
}

/** Service IDs explicitly mapped to at least one active staff member. */
export function getServiceIdsCoveredByStaff(staff: SalonStaffForAllocation[]): Set<string> {
  const covered = new Set<string>();
  for (const member of staff) {
    if (!isActiveSalonStaff(member)) continue;
    for (const row of member.working_hours?.assigned_services || []) {
      if (row.service_id && row.enabled !== false) {
        covered.add(row.service_id);
      }
    }
  }
  return covered;
}

export function isServiceCoveredByStaff(
  serviceId: string,
  staff: SalonStaffForAllocation[]
): boolean {
  return getServiceIdsCoveredByStaff(staff).has(serviceId);
}

export function salonHasActiveStaff(staff: SalonStaffForAllocation[]): boolean {
  return staff.some(isActiveSalonStaff);
}

/** Only active services with at least one mapped active staff member are bookable. */
export function filterServicesWithStaffCoverage<
  T extends { id: string; global_service_id?: string | null; status?: string | null }
>(services: T[], staff: SalonStaffForAllocation[]): T[] {
  const coveredStaffIds = getServiceIdsCoveredByStaff(staff);
  return services.filter((service) => {
    if ((service.status || "active").toLowerCase() !== "active") return false;
    if (coveredStaffIds.has(service.id)) return true;
    if (service.global_service_id && coveredStaffIds.has(service.global_service_id)) {
      return true;
    }
    return false;
  });
}

export type BookingForAllocation = {
  id?: string;
  booking_date?: string | null;
  booking_time?: string | null;
  staff_id?: string | null;
  service_id?: string | null;
  status?: string | null;
  salon_staff?: SalonStaffForAllocation | null;
  booking_services?: Array<{
    service_id?: string | null;
    duration_min?: number | string | null;
    services?: { id?: string } | { id?: string }[] | null;
  }> | null;
  booking_staff?: Array<{
    staff_id?: string | null;
    salon_staff?: SalonStaffForAllocation | { id?: string }[] | null;
  }> | null;
};

/** Staff must be explicitly mapped to the booked service(s). */
export function filterStaffQualifiedForServices(
  staff: SalonStaffForAllocation[],
  serviceIds: string[]
): SalonStaffForAllocation[] {
  if (!serviceIds.length) return staff.filter(isActiveSalonStaff);

  return staff.filter((member) => {
    if (!isActiveSalonStaff(member)) return false;
    const assigned = member.working_hours?.assigned_services;
    if (!assigned?.length) return false;
    return assigned.some(
      (row) => serviceIds.includes(row.service_id) && row.enabled !== false
    );
  });
}

export function getBookingServiceIds(booking: BookingForAllocation): string[] {
  const ids = new Set<string>();
  if (booking.service_id) ids.add(booking.service_id);

  for (const row of booking.booking_services || []) {
    if (row.service_id) ids.add(row.service_id);
    const svc = row.services;
    const svcId = Array.isArray(svc) ? svc[0]?.id : svc?.id;
    if (svcId) ids.add(svcId);
  }

  return [...ids];
}

export function getBookingDurationMinutes(booking: BookingForAllocation): number {
  let total = 0;
  for (const row of booking.booking_services || []) {
    const dur = parseInt(String(row.duration_min || 0), 10);
    if (dur > 0) total += dur;
  }
  return total > 0 ? total : 30;
}

export function bookingHasAssignedStaff(booking: BookingForAllocation): boolean {
  if (booking.staff_id) return true;
  if (booking.salon_staff?.id) return true;
  if (booking.booking_staff?.some((row) => row.staff_id || row.salon_staff)) return true;
  return false;
}

export function resolveStaffMemberFromBooking(
  booking: BookingForAllocation,
  allStaff: SalonStaffForAllocation[] = []
): SalonStaffForAllocation | null {
  if (booking.salon_staff && typeof booking.salon_staff === "object") {
    return booking.salon_staff;
  }

  if (booking.booking_staff?.length) {
    const raw = booking.booking_staff[0].salon_staff;
    const fromJunction = Array.isArray(raw) ? raw[0] : raw;
    if (fromJunction && typeof fromJunction === "object" && "commission_rate" in fromJunction) {
      return fromJunction as SalonStaffForAllocation;
    }
    const staffId = booking.booking_staff[0].staff_id;
    if (staffId) {
      return allStaff.find((member) => member.id === staffId) || null;
    }
  }

  if (booking.staff_id) {
    return allStaff.find((member) => member.id === booking.staff_id) || null;
  }

  return null;
}

function toConflictRow(
  booking: BookingForAllocation,
  staffId: string | null
): BookingConflictRow {
  return {
    id: booking.id,
    booking_time: normalizeDbTime(booking.booking_time || "00:00:00"),
    staff_id: staffId,
    status: booking.status || null,
    duration_minutes: getBookingDurationMinutes(booking),
  };
}

/**
 * When the customer chose "Anyone Available", mirror checkout allocation:
 * pick the first qualified, available staff member for that slot.
 */
export function inferStaffAllocations(
  bookings: BookingForAllocation[],
  allStaff: SalonStaffForAllocation[]
): Map<string, SalonStaffForAllocation> {
  const inferred = new Map<string, SalonStaffForAllocation>();
  const byDate = new Map<string, BookingForAllocation[]>();

  for (const booking of bookings) {
    if (!booking.booking_date || !booking.booking_time) continue;
    const day = booking.booking_date;
    if (!byDate.has(day)) byDate.set(day, []);
    byDate.get(day)!.push(booking);
  }

  for (const dayBookings of byDate.values()) {
    const sorted = [...dayBookings].sort((a, b) =>
      normalizeDbTime(a.booking_time || "").localeCompare(normalizeDbTime(b.booking_time || ""))
    );

    for (const booking of sorted) {
      if (!booking.id || bookingHasAssignedStaff(booking)) continue;

      const serviceIds = getBookingServiceIds(booking);
      const qualified = filterStaffQualifiedForServices(allStaff, serviceIds);
      const staffIds = qualified.map((member) => member.id).filter(Boolean);
      if (!staffIds.length) continue;

      const conflictBookings: BookingConflictRow[] = sorted
        .filter((other) => other.id && other.id !== booking.id)
        .map((other) => {
          const assigned = resolveStaffMemberFromBooking(other, allStaff);
          const inferredStaff = other.id ? inferred.get(other.id) : undefined;
          const staffId =
            assigned?.id || other.staff_id || inferredStaff?.id || null;
          return toConflictRow(other, staffId);
        });

      const resolvedId = resolveAvailableStaffId(
        staffIds,
        conflictBookings,
        normalizeDbTime(booking.booking_time || ""),
        getBookingDurationMinutes(booking)
      );

      if (!resolvedId) continue;
      const member = qualified.find((row) => row.id === resolvedId);
      if (member) inferred.set(booking.id, member);
    }
  }

  return inferred;
}

export function computeStaffCommissionAmount(
  staffMember: SalonStaffForAllocation,
  serviceId: string | null,
  servicePrice: number
): { amount: number; rate: number } {
  let rate = Number(staffMember.commission_rate || 0);
  const assigned = staffMember.working_hours?.assigned_services;
  if (serviceId && Array.isArray(assigned)) {
    const match = assigned.find((row) => row.service_id === serviceId);
    if (match?.commission_rate != null) {
      rate = Number(match.commission_rate);
    }
  }

  return {
    rate,
    amount: Math.round((servicePrice * rate) / 100),
  };
}
