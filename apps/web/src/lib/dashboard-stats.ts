import { calculateBalanceDue } from "@/lib/booking-pricing";
import {
  computeBookingStaffCommission,
  inferStaffAllocations,
  isActiveSalonStaff,
  resolveStaffMemberFromBooking,
  type SalonStaffForAllocation,
} from "@/lib/staff-allocation";
import { toDateInputValue } from "@/lib/promotion-package-dates";

/** Calendar date in the salon owner's local timezone — never use toISOString() for day keys. */
function toLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeBookingDateKey(bookingDate: string | null | undefined): string | null {
  const key = toDateInputValue(bookingDate ?? "");
  return key || null;
}

export function formatLkr(value: number): string {
  if (!Number.isFinite(value)) return "0";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${Math.round(value).toLocaleString()}`;
  return Math.round(value).toLocaleString();
}

export function formatRelativeTime(iso: string | null | undefined): string {
  if (!iso) return "Recently";
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffMin = Math.floor((now - then) / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin} min${diffMin === 1 ? "" : "s"} ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? "" : "s"} ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay} day${diffDay === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString();
}

export function getBookingAmount(booking: {
  amount?: number | string | null;
  total_reservation_fee?: number | string | null;
}): number {
  const reservation = Number(booking.total_reservation_fee ?? 0);
  const amount = Number(booking.amount ?? 0);
  return reservation > 0 ? reservation : amount;
}

export function getBookingBalance(booking: {
  amount?: number | string | null;
  total_reservation_fee?: number | string | null;
  salon_upfront_amount?: number | string | null;
}): number {
  const total = Number(booking.amount ?? 0);
  const paid = Number(booking.total_reservation_fee ?? 0);
  if (paid > 0 && total > paid) return total - paid;
  if (total > 0) return Math.round(calculateBalanceDue(total));
  return 0;
}

export type MonthlyPoint = { label: string; bookings: number; revenue: number };

export function groupBookingsByMonth(
  bookings: Array<{ booking_date?: string | null; amount?: number | string | null; total_reservation_fee?: number | string | null }>,
  months = 6
): MonthlyPoint[] {
  const buckets = new Map<string, MonthlyPoint>();

  for (const booking of bookings) {
    if (!booking.booking_date) continue;
    const date = new Date(booking.booking_date);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const label = date.toLocaleDateString(undefined, { month: "short" });
    const current = buckets.get(key) || { label, bookings: 0, revenue: 0 };
    current.bookings += 1;
    current.revenue += Number(booking.amount || 0);
    buckets.set(key, current);
  }

  const sorted = [...buckets.entries()].sort(([a], [b]) => a.localeCompare(b));
  return sorted.slice(-months).map(([, point]) => point);
}

export type DailyPoint = { label: string; dateStr: string; bookings: number; revenue: number };

export function groupBookingsByDay(
  bookings: Array<{ booking_date?: string | null; amount?: number | string | null }>,
  days = 7,
  offsetWeeks = 0
): DailyPoint[] {
  const buckets = new Map<string, DailyPoint>();

  // Determine the end date based on the offset
  const endDate = new Date();
  endDate.setHours(0, 0, 0, 0);
  endDate.setDate(endDate.getDate() - (offsetWeeks * 7));

  // Initialize the days window ending at endDate
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(endDate);
    d.setDate(d.getDate() - i);
    const dateStr = toLocalDateKey(d);
    const label = d.toLocaleDateString(undefined, { weekday: "short" });
    buckets.set(dateStr, { label, dateStr, bookings: 0, revenue: 0 });
  }

  for (const booking of bookings) {
    const bookingDateKey = normalizeBookingDateKey(booking.booking_date);
    if (!bookingDateKey) continue;
    if (buckets.has(bookingDateKey)) {
      const current = buckets.get(bookingDateKey)!;
      current.bookings += 1;
      current.revenue += Number(booking.amount || 0);
    }
  }

  const sorted = [...buckets.entries()].sort(([a], [b]) => a.localeCompare(b));
  return sorted.map(([, point]) => point);
}

export function groupBookingsByStaffAndDay(bookings: any[], offsetWeeks = 0, allStaff: any[] = []) {
  const inferredStaffByBookingId = buildInferredStaffMap(bookings, allStaff);

  // Generate the 7 days for the given week offset
  const last7Days: string[] = [];
  const endDate = new Date();
  endDate.setHours(0, 0, 0, 0); // Normalize to midnight
  endDate.setDate(endDate.getDate() - (offsetWeeks * 7)); // Shift back by N weeks

  for (let i = 6; i >= 0; i--) {
    const d = new Date(endDate);
    d.setDate(d.getDate() - i);
    last7Days.push(toLocalDateKey(d));
  }

  // Create a bucket for each day: { date: 'Mon', fullDate: 'YYYY-MM-DD', ...staffCounts }
  const dataMap = new Map<string, any>();
  const staffSet = new Set<string>();

  // Prepopulate active staff first names so the legend stays accurate.
  allStaff.forEach((staffMem) => {
    if (staffMem?.name && isActiveSalonStaff(staffMem)) {
      const firstName = staffMem.name.split(" ")[0];
      staffSet.add(firstName);
    }
  });

  last7Days.forEach(dateStr => {
    const dateObj = new Date(dateStr);
    const label = dateObj.toLocaleDateString(undefined, { weekday: 'short' });
    dataMap.set(dateStr, { date: label, fullDate: dateStr });
  });

  for (const b of bookings) {
    const bookingDateKey = normalizeBookingDateKey(b.booking_date);
    if (!bookingDateKey) continue;
    if (dataMap.has(bookingDateKey)) {
      const bucket = dataMap.get(bookingDateKey)!;
      let staffName = "Any Staff";

      let fullName = b.salon_staff?.name;
      if (!fullName && b.booking_staff && b.booking_staff.length > 0) {
        const st = b.booking_staff[0].salon_staff;
        fullName = Array.isArray(st) ? st[0]?.name : st?.name;
      }
      if (!fullName) {
        fullName = inferredStaffByBookingId.get(b.id)?.name;
      }

      if (fullName) {
        staffName = fullName.split(" ")[0];
      }

      staffSet.add(staffName);
      bucket[staffName] = (bucket[staffName] || 0) + 1;
    }
  }

  // Fill in 0s for missing staff in each bucket
  const finalData = Array.from(dataMap.values()).map(bucket => {
    staffSet.forEach(staff => {
      if (bucket[staff] === undefined) bucket[staff] = 0;
    });
    return bucket;
  });

  return { data: finalData, staffNames: Array.from(staffSet) };
}

export function groupRevenueByDay(bookings: any[], offsetWeeks = 0) {
  const last7Days: string[] = [];
  const endDate = new Date();
  endDate.setHours(0, 0, 0, 0);
  endDate.setDate(endDate.getDate() - offsetWeeks * 7);

  for (let i = 6; i >= 0; i--) {
    const d = new Date(endDate);
    d.setDate(d.getDate() - i);
    last7Days.push(toLocalDateKey(d));
  }

  const dataMap = new Map<string, any>();

  last7Days.forEach(dateStr => {
    const dateObj = new Date(dateStr);
    const label = dateObj.toLocaleDateString(undefined, { weekday: 'short' });
    dataMap.set(dateStr, { 
      date: label, 
      fullDate: dateStr,
      "Reservation Income": 0,
      "Balance Income": 0
    });
  });

  for (const b of bookings) {
    const bookingDateKey = normalizeBookingDateKey(b.booking_date);
    if (!bookingDateKey) continue;
    if (dataMap.has(bookingDateKey)) {
      const bucket = dataMap.get(bookingDateKey)!;
      const amount = Number(b.amount || 0);
      const totalResFee = Number(b.total_reservation_fee || 0);
      const salonUpfront = Number(b.salon_upfront_amount || 0);
      const balanceDue = amount - totalResFee;
      
      bucket["Reservation Income"] += salonUpfront;
      bucket["Balance Income"] += balanceDue;
    }
  }

  return Array.from(dataMap.values());
}


/** Resolve staff commission for a booking using per-service rate when configured. */
export function resolveBookingStaffCommission(
  booking: {
    id?: string;
    amount?: number | string | null;
    service_id?: string | null;
    staff_id?: string | null;
    staff_commission_amount?: number | string | null;
    staff_commission_percent?: number | string | null;
    salon_staff?: SalonStaffForAllocation | null;
    booking_services?: Array<{
      service_id?: string | null;
      price?: number | string | null;
      services?:
        | { id?: string; global_service_id?: string | null }
        | { id?: string; global_service_id?: string | null }[]
        | null;
    }> | null;
    booking_staff?: Array<{
      staff_id?: string | null;
      salon_staff?: SalonStaffForAllocation | SalonStaffForAllocation[] | null;
    }> | null;
  },
  context?: {
    allStaff?: SalonStaffForAllocation[];
    inferredStaff?: SalonStaffForAllocation | null;
  }
): { amount: number; rate: number } | null {
  if (
    booking.staff_commission_amount != null &&
    booking.staff_commission_percent != null
  ) {
    const amount = Number(booking.staff_commission_amount);
    const rate = Number(booking.staff_commission_percent);
    if (Number.isFinite(amount) && Number.isFinite(rate) && (amount > 0 || rate > 0)) {
      return { amount, rate };
    }
  }

  const servicePrice = Number(booking.amount || 0);
  if (!servicePrice) return null;

  const allStaff = context?.allStaff || [];
  const staffMember =
    resolveStaffMemberFromBooking(booking, allStaff) || context?.inferredStaff || null;

  if (!staffMember) return null;

  return computeBookingStaffCommission(staffMember, booking, allStaff);
}

/** Bookings in the 7-day window by appointment date (falls back to created_at). */
export function filterBookingsByCommissionWeek<
  T extends { created_at?: string | null; booking_date?: string | null },
>(bookings: T[], offsetWeeks = 0): T[] {
  const endDateObj = new Date();
  endDateObj.setHours(0, 0, 0, 0);
  endDateObj.setDate(endDateObj.getDate() - offsetWeeks * 7);

  const startDateObj = new Date(endDateObj);
  startDateObj.setDate(startDateObj.getDate() - 6);

  const startKey = toLocalDateKey(startDateObj);
  const endKey = toLocalDateKey(endDateObj);

  return bookings.filter((booking) => {
    const key =
      normalizeBookingDateKey(booking.booking_date) ||
      (booking.created_at ? toLocalDateKey(new Date(booking.created_at)) : null);
    if (!key) return false;
    return key >= startKey && key <= endKey;
  });
}

/** Build inferred staff map for unassigned bookings (Anyone Available). */
export function buildInferredStaffMap(
  bookings: Parameters<typeof inferStaffAllocations>[0],
  allStaff: SalonStaffForAllocation[]
): Map<string, SalonStaffForAllocation> {
  if (!allStaff.length) return new Map();
  return inferStaffAllocations(bookings, allStaff);
}

export type ActivityItem = {
  id: string;
  title: string;
  description: string;
  time: string;
  tone: "emerald" | "blue" | "amber" | "purple";
};
