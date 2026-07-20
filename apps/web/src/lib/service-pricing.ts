/** Stripe ~$0.50 floor — keep catalog/booking service lines at or above this LKR amount. */
export const MIN_SERVICE_PRICE_LKR = 800;

/** Canonical user-facing copy for min service fee rejections. */
export const MIN_SERVICE_FEE_MESSAGE = `Minimum service fee is LKR ${MIN_SERVICE_PRICE_LKR.toFixed(2)}`;

export function isServicePriceAtOrAboveMinimum(price: unknown): boolean {
  const n = Number(price);
  return Number.isFinite(n) && n >= MIN_SERVICE_PRICE_LKR;
}

/** Returns the canonical error message when price is below the minimum; otherwise null. */
export function getServicePriceBelowMinimumError(price: unknown): string | null {
  return isServicePriceAtOrAboveMinimum(price) ? null : MIN_SERVICE_FEE_MESSAGE;
}

export function assertMinServicePrice(price: unknown): void {
  const error = getServicePriceBelowMinimumError(price);
  if (error) throw new Error(error);
}
