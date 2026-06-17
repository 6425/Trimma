import type Stripe from "stripe";
import { toStripeAmountLkr } from "@/lib/stripe-settings";

export function assertValidStripePaymentIntentId(paymentIntentId: string) {
  const trimmed = paymentIntentId.trim();
  if (!/^pi_[A-Za-z0-9]{8,}$/.test(trimmed)) {
    throw new Error("Invalid Stripe payment reference.");
  }
  return trimmed;
}

export function resolveStripePaidAmountCents(paymentIntent: Stripe.PaymentIntent): number {
  const metadataCents = Number(paymentIntent.metadata?.reservation_fee_cents);
  if (Number.isFinite(metadataCents) && metadataCents > 0) {
    return metadataCents;
  }
  return Number(paymentIntent.amount || 0);
}

export function verifyStripePaymentIntent(
  paymentIntent: Stripe.PaymentIntent,
  input: { expectedAmountLkr?: number; expectedCurrency?: string }
) {
  if (paymentIntent.status !== "succeeded") {
    throw new Error("Payment has not been completed yet.");
  }

  const expectedCurrency = (input.expectedCurrency || "lkr").toLowerCase();
  const actualCurrency = String(paymentIntent.currency || "").toLowerCase();
  if (actualCurrency !== expectedCurrency) {
    throw new Error("Payment currency does not match checkout.");
  }

  const actualAmount = resolveStripePaidAmountCents(paymentIntent);
  if (!Number.isFinite(actualAmount) || actualAmount <= 0) {
    throw new Error("Payment amount is invalid.");
  }

  if (input.expectedAmountLkr != null && Number.isFinite(input.expectedAmountLkr)) {
    const expectedAmount = toStripeAmountLkr(input.expectedAmountLkr);
    if (Math.abs(actualAmount - expectedAmount) > 1) {
      throw new Error("Payment amount does not match reservation fee.");
    }
  }
}

export function stripePaidAmountLkr(paymentIntent: Stripe.PaymentIntent): number {
  return resolveStripePaidAmountCents(paymentIntent) / 100;
}
