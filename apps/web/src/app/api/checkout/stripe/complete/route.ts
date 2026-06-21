import { NextResponse } from "next/server";
import { completeBookingCheckout } from "@/lib/complete-booking-checkout";
import type { CompleteBookingCheckoutInput } from "@/lib/complete-booking-checkout";
import { completeSubscriptionCheckout } from "@/lib/complete-subscription-checkout";
import { getClientIp } from "@/lib/email/rate-limit";
import {
  loadStripePendingCheckout,
  markStripePendingCompleted,
} from "@/lib/stripe-checkout";
import {
  assertValidStripePaymentIntentId,
  verifyStripePaymentIntent,
} from "@/lib/stripe-payment-verify";

function enrichBookingPayloadFromPayment(
  payload: CompleteBookingCheckoutInput,
  paymentIntent: { receipt_email?: string | null }
): CompleteBookingCheckoutInput {
  const receiptEmail = paymentIntent.receipt_email?.trim();
  if (!receiptEmail) return payload;

  const currentEmail = payload.customer?.email?.trim();
  if (currentEmail) return payload;

  return {
    ...payload,
    customer: {
      ...payload.customer,
      email: receiptEmail,
    },
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const paymentIntentId = assertValidStripePaymentIntentId(
      String(body.paymentIntentId || body.sessionId || "")
    );

    const { paymentIntent, pending, alreadyCompleted } =
      await loadStripePendingCheckout(paymentIntentId);
    const payload = pending.payload as Record<string, unknown>;
    const environment = paymentIntent.metadata?.environment || "sandbox";

    if (pending.checkout_type === "booking") {
      if (alreadyCompleted) {
        const bookingNo =
          (payload.completedBookingNo as string | undefined) ||
          (paymentIntent.metadata?.booking_no as string | undefined);
        return NextResponse.json({
          checkoutType: "booking",
          bookingNo: bookingNo || null,
          alreadyCompleted: true,
        });
      }

      const checkoutPayload = enrichBookingPayloadFromPayment(
        payload as CompleteBookingCheckoutInput,
        paymentIntent
      );

      verifyStripePaymentIntent(paymentIntent, {
        expectedAmountLkr: Number(checkoutPayload.reservationFee || 0),
      });

      const result = await completeBookingCheckout({
        ...checkoutPayload,
        stripePayment: {
          paymentId: paymentIntent.id,
          environment,
        },
        payhereEnvironment: environment,
        clientIp: getClientIp(request),
      });

      await markStripePendingCompleted(pending.id, {
        completedBookingNo: result.bookingNo,
      });

      return NextResponse.json({
        checkoutType: "booking",
        bookingNo: result.bookingNo,
        notificationsPending: result.notificationsPending,
        whatsappSent: result.whatsappSent,
        whatsappError: result.whatsappError,
        emailSent: result.emailSent,
        emailError: result.emailError,
      });
    }

    if (pending.checkout_type === "subscription") {
      if (alreadyCompleted) {
        return NextResponse.json({
          checkoutType: "subscription",
          orderId: payload.completedOrderId || null,
          planName: payload.planName || null,
          alreadyCompleted: true,
        });
      }

      verifyStripePaymentIntent(paymentIntent, {
        expectedAmountLkr: Number(payload.chargeAmount || 0),
      });

      const result = await completeSubscriptionCheckout({
        ...(payload as Parameters<typeof completeSubscriptionCheckout>[0]),
        stripePayment: {
          paymentId: paymentIntent.id,
          environment,
        },
        payhereEnvironment: environment,
      });

      await markStripePendingCompleted(pending.id, {
        completedOrderId: result.orderId,
        planName: result.planName,
      });

      return NextResponse.json({
        checkoutType: "subscription",
        orderId: result.orderId,
        planName: result.planName,
      });
    }

    return NextResponse.json({ error: "Unknown checkout type." }, { status: 400 });
  } catch (error) {
    console.error("[stripe/complete]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to complete Stripe checkout." },
      { status: 500 }
    );
  }
}
