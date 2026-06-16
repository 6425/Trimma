import { loadStripe, type Stripe } from "@stripe/stripe-js";

const stripePromises = new Map<string, Promise<Stripe | null>>();

/** Reuse one Stripe.js loader per publishable key (avoids duplicate CDN fetches). */
export function getStripePromise(publishableKey: string): Promise<Stripe | null> {
  const key = publishableKey.trim();
  if (!key) {
    return Promise.resolve(null);
  }

  let promise = stripePromises.get(key);
  if (!promise) {
    promise = loadStripe(key);
    stripePromises.set(key, promise);
  }

  return promise;
}

export function preloadStripe(publishableKey: string | null | undefined): void {
  if (!publishableKey?.trim()) return;
  void getStripePromise(publishableKey);
}
