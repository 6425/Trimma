import {
  computeStaffCommissionAmount,
  getBookingServiceIds,
  inferStaffAllocations,
  resolveStaffMemberFromBooking,
  type SalonStaffForAllocation,
} from "@/lib/staff-allocation";

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
  if (total > 0) return Math.round(total * 0.8);
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
    const dateStr = d.toISOString().split("T")[0];
    const label = d.toLocaleDateString(undefined, { weekday: "short" });
    buckets.set(dateStr, { label, dateStr, bookings: 0, revenue: 0 });
  }

  for (const booking of bookings) {
    if (!booking.booking_date) continue;
    // ensure we only count if it is within the initialized days
    if (buckets.has(booking.booking_date)) {
      const current = buckets.get(booking.booking_date)!;
      current.bookings += 1;
      current.revenue += Number(booking.amount || 0);
    }
  }

  const sorted = [...buckets.entries()].sort(([a], [b]) => a.localeCompare(b));
  return sorted.map(([, point]) => point);
}

export function groupBookingsByStaffAndDay(bookings: any[], offsetWeeks = 0, allStaff: any[] = []) {
  // Generate the 7 days for the given week offset
  const last7Days: string[] = [];
  const endDate = new Date();
  endDate.setHours(0, 0, 0, 0); // Normalize to midnight
  endDate.setDate(endDate.getDate() - (offsetWeeks * 7)); // Shift back by N weeks

  for (let i = 6; i >= 0; i--) {
    const d = new Date(endDate);
    d.setDate(d.getDate() - i);
    // Format as YYYY-MM-DD for easy mapping
    last7Days.push(d.toISOString().split("T")[0]);
  }

  // Create a bucket for each day: { date: 'Mon', fullDate: 'YYYY-MM-DD', ...staffCounts }
  const dataMap = new Map<string, any>();
  const staffSet = new Set<string>();

  // Prepopulate staffSet with all assigned staff first names
  allStaff.forEach(staffMem => {
    if (staffMem?.name) {
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
    if (!b.booking_date) continue;
    // We only care if it falls in our last 7 days bucket
    if (dataMap.has(b.booking_date)) {
      const bucket = dataMap.get(b.booking_date)!;
      let staffName = "Any Staff";

      // Try direct relation first, then fallback to junction table
      let fullName = b.salon_staff?.name;
      if (!fullName && b.booking_staff && b.booking_staff.length > 0) {
        const st = b.booking_staff[0].salon_staff;
        fullName = Array.isArray(st) ? st[0]?.name : st?.name;
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
  
  if (offsetWeeks > 0) {
    endDate.setDate(endDate.getDate() - (offsetWeeks * 7));
  }
  
  endDate.setHours(23, 59, 59, 999);

  for (let i = 6; i >= 0; i--) {
    const d = new Date(endDate);
    d.setDate(d.getDate() - i);
    last7Days.push(d.toISOString().split("T")[0]);
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
    if (!b.booking_date) continue;
    if (dataMap.has(b.booking_date)) {
      const bucket = dataMap.get(b.booking_date)!;
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
    salon_staff?: SalonStaffForAllocation | null;
    booking_services?: Array<{
      service_id?: string | null;
      services?: { id?: string } | { id?: string }[] | null;
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
  const servicePrice = Number(booking.amount || 0);
  if (!servicePrice) return null;

  const allStaff = context?.allStaff || [];
  let staffMember =
    resolveStaffMemberFromBooking(booking, allStaff) || context?.inferredStaff || null;

  if (!staffMember) return null;

  const serviceIds = getBookingServiceIds(booking);
  const serviceId = serviceIds[0] || null;

  return computeStaffCommissionAmount(staffMember, serviceId, servicePrice);
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
