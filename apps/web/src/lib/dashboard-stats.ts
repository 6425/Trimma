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
  const upfront = Number(booking.salon_upfront_amount ?? 0);
  if (upfront > 0) return upfront;
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
    current.revenue += getBookingAmount(booking);
    buckets.set(key, current);
  }

  const sorted = [...buckets.entries()].sort(([a], [b]) => a.localeCompare(b));
  return sorted.slice(-months).map(([, point]) => point);
}

export type ActivityItem = {
  id: string;
  title: string;
  description: string;
  time: string;
  tone: "emerald" | "blue" | "amber" | "purple";
};
