import type Stripe from "stripe";
import { toStripeAmountLkr } from "@/lib/stripe-settings";

export function assertValidStripePaymentIntentId(paymentIntentId: string) {
  const trimmed = paymentIntentId.trim();
  if (!/^pi_[A-Za-z0-9]{8,}$/.test(trimmed)) {
    throw new Error("Invalid Stripe payment reference.");
  }
  return trimmed;
}

export function verifyStripePaymentIntent(
  paymentIntent: Stripe.PaymentIntent,
  input: { expectedAmountLkr: number; expectedCurrency?: string }
) {
  if (paymentIntent.status !== "succeeded") {
    throw new Error("Payment has not been completed yet.");
  }

  const expectedCurrency = (input.expectedCurrency || "lkr").toLowerCase();
  const actualCurrency = String(paymentIntent.currency || "").toLowerCase();
  if (actualCurrency !== expectedCurrency) {
    throw new Error("Payment currency does not match checkout.");
  }

  const expectedAmount = toStripeAmountLkr(input.expectedAmountLkr);
  const actualAmount = Number(paymentIntent.amount || 0);
  if (!Number.isFinite(actualAmount) || actualAmount !== expectedAmount) {
    throw new Error("Payment amount does not match reservation fee.");
  }
}
