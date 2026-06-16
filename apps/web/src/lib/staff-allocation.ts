import {
  normalizeDbTime,
  resolveAvailableStaffId,
  type BookingConflictRow,
} from "@/lib/booking-availability";
import { parseStaffWorkingHours } from "@/lib/salon-staff-insert";

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
  amount?: number | string | null;
  status?: string | null;
  salon_staff?: SalonStaffForAllocation | null;
  booking_services?: Array<{
    service_id?: string | null;
    price?: number | string | null;
    duration_min?: number | string | null;
    services?:
      | { id?: string; global_service_id?: string | null }
      | Array<{ id?: string; global_service_id?: string | null }>
      | null;
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
    const nested = Array.isArray(svc) ? svc[0] : svc;
    if (nested?.id) ids.add(nested.id);
    if (nested?.global_service_id) ids.add(nested.global_service_id);
  }

  return [...ids];
}

/** Merge nested booking staff with the salon directory and parse working_hours JSON. */
export function normalizeStaffForCommission(
  staffMember: SalonStaffForAllocation | null | undefined,
  allStaff: SalonStaffForAllocation[] = []
): SalonStaffForAllocation | null {
  if (!staffMember?.id) return null;

  const directory = allStaff.find((member) => member.id === staffMember.id);
  const parsedHours =
    parseStaffWorkingHours(staffMember.working_hours) ||
    parseStaffWorkingHours(directory?.working_hours) ||
    staffMember.working_hours ||
    directory?.working_hours;

  return {
    ...(directory || {}),
    ...staffMember,
    commission_rate: staffMember.commission_rate ?? directory?.commission_rate ?? 0,
    working_hours: parsedHours as SalonStaffForAllocation["working_hours"],
  };
}

function findAssignedCommissionRate(
  assigned: StaffAssignedService[] | null | undefined,
  serviceIds: string[]
): number | null {
  if (!assigned?.length || !serviceIds.length) return null;

  for (const serviceId of serviceIds) {
    for (const row of assigned) {
      if (row.enabled === false || !row.service_id) continue;
      if (row.service_id === serviceId && row.commission_rate != null) {
        return Number(row.commission_rate);
      }
    }
  }

  return null;
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
  let resolved: SalonStaffForAllocation | null = null;

  if (booking.salon_staff && typeof booking.salon_staff === "object" && !Array.isArray(booking.salon_staff)) {
    resolved = booking.salon_staff;
  }

  if (!resolved?.id && booking.booking_staff?.length) {
    const raw = booking.booking_staff[0].salon_staff;
    const fromJunction = Array.isArray(raw) ? raw[0] : raw;
    if (fromJunction && typeof fromJunction === "object") {
      resolved = fromJunction as SalonStaffForAllocation;
    }
    const staffId = booking.booking_staff[0].staff_id;
    if (!resolved?.id && staffId) {
      resolved = allStaff.find((member) => member.id === staffId) || null;
    }
  }

  if (!resolved?.id && booking.staff_id) {
    resolved = allStaff.find((member) => member.id === booking.staff_id) || null;
  }

  return normalizeStaffForCommission(resolved, allStaff);
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
  serviceIds: string | string[] | null,
  servicePrice: number,
  allStaff: SalonStaffForAllocation[] = []
): { amount: number; rate: number } {
  const normalized = normalizeStaffForCommission(staffMember, allStaff) || staffMember;
  const ids = Array.isArray(serviceIds) ? serviceIds : serviceIds ? [serviceIds] : [];
  let rate = Number(normalized.commission_rate || 0);
  const perServiceRate = findAssignedCommissionRate(
    normalized.working_hours?.assigned_services,
    ids
  );
  if (perServiceRate != null) rate = perServiceRate;

  return {
    rate,
    amount: Math.round((servicePrice * rate) / 100),
  };
}

export function computeBookingStaffCommission(
  staffMember: SalonStaffForAllocation | null | undefined,
  booking: BookingForAllocation,
  allStaff: SalonStaffForAllocation[] = []
): { amount: number; rate: number } | null {
  const normalized = normalizeStaffForCommission(staffMember, allStaff);
  if (!normalized) return null;

  const lines: Array<{ serviceIds: string[]; price: number }> = [];
  for (const row of booking.booking_services || []) {
    const serviceIds = new Set<string>();
    if (row.service_id) serviceIds.add(row.service_id);
    const svc = row.services;
    const nested = Array.isArray(svc) ? svc[0] : svc;
    if (nested?.id) serviceIds.add(nested.id);
    if (nested?.global_service_id) serviceIds.add(nested.global_service_id);

    const price = Number(row.price ?? 0);
    if (serviceIds.size && price > 0) {
      lines.push({ serviceIds: [...serviceIds], price });
    }
  }

  if (!lines.length) {
    const price = Number(booking.amount || 0);
    if (!price) return null;
    return computeStaffCommissionAmount(
      normalized,
      getBookingServiceIds(booking),
      price,
      allStaff
    );
  }

  let totalAmount = 0;
  let totalPrice = 0;
  let lastRate = Number(normalized.commission_rate || 0);

  for (const line of lines) {
    const result = computeStaffCommissionAmount(normalized, line.serviceIds, line.price, allStaff);
    totalAmount += result.amount;
    totalPrice += line.price;
    lastRate = result.rate;
  }

  const blendedRate =
    totalPrice > 0 ? Math.round((totalAmount / totalPrice) * 10000) / 100 : lastRate;

  return { amount: totalAmount, rate: blendedRate };
}
