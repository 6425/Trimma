export function toDateInputValue(value: string | null | undefined): string {
  if (!value) return "";
  return value.includes("T") ? value.split("T")[0] : value;
}

export function formatDisplayDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(`${toDateInputValue(value)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-LK", { day: "numeric", month: "short", year: "numeric" });
}

export function getRemainingDays(endDate: string | null | undefined, now = new Date()): number | null {
  if (!endDate) return null;
  const end = new Date(`${toDateInputValue(endDate)}T00:00:00`);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  if (Number.isNaN(end.getTime())) return null;
  return Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function getRemainingDaysLabel(endDate: string | null | undefined): string {
  const days = getRemainingDays(endDate);
  if (days === null) return "Open-ended";
  if (days < 0) return "Expired";
  if (days === 0) return "Ends today";
  if (days === 1) return "1 day remaining";
  return `${days} days remaining`;
}

export function getPromotionPeriodLabel(
  startDate: string | null | undefined,
  endDate: string | null | undefined
): string {
  if (!startDate && !endDate) return "No schedule set";
  if (startDate && endDate) {
    return `${formatDisplayDate(startDate)} – ${formatDisplayDate(endDate)}`;
  }
  if (startDate) return `From ${formatDisplayDate(startDate)}`;
  return `Until ${formatDisplayDate(endDate)}`;
}

export function getRemainingDaysBadgeClass(endDate: string | null | undefined): string {
  const days = getRemainingDays(endDate);
  if (days === null) return "bg-zinc-100 text-zinc-600 border-zinc-200";
  if (days < 0) return "bg-rose-50 text-rose-600 border-rose-100";
  if (days <= 3) return "bg-amber-50 text-amber-700 border-amber-100";
  return "bg-sky-50 text-sky-700 border-sky-100";
}

export function validatePromotionDates(startDate: string, endDate: string): string | null {
  if (startDate && endDate && startDate > endDate) {
    return "End date must be on or after the start date.";
  }
  return null;
}

export function normalizeDatePayload(startDate: string, endDate: string) {
  return {
    start_date: startDate || null,
    end_date: endDate || null,
  };
}
