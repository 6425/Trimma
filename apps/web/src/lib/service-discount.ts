export type ServiceDiscountFields = {
  price: number | string;
  discount_percentage?: number | string | null;
  discount_end_date?: string | null;
};

export function isServiceDiscountActive(
  service: ServiceDiscountFields,
  now: Date = new Date()
): boolean {
  const pct = Number(service.discount_percentage || 0);
  if (pct <= 0 || pct > 100) return false;

  if (!service.discount_end_date) return true;

  const end = new Date(service.discount_end_date);
  if (Number.isNaN(end.getTime())) return false;

  end.setHours(23, 59, 59, 999);
  return now <= end;
}

export function getDiscountedServicePrice(service: ServiceDiscountFields): number {
  const base = Number(service.price) || 0;
  if (!isServiceDiscountActive(service)) return base;

  const pct = Number(service.discount_percentage) || 0;
  return Math.max(0, Math.round(base * (1 - pct / 100)));
}

export function getServiceDiscountLabel(service: ServiceDiscountFields): string | null {
  if (!isServiceDiscountActive(service)) return null;
  const pct = Number(service.discount_percentage) || 0;
  return `${pct}% off`;
}
