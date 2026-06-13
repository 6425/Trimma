import { NextResponse } from "next/server";
import { completeBookingCheckout } from "@/lib/complete-booking-checkout";
import { completeSubscriptionCheckout } from "@/lib/complete-subscription-checkout";
import {
  loadStripePendingCheckout,
  markStripePendingCompleted,
} from "@/lib/stripe-checkout";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const sessionId = body.sessionId as string | undefined;

    if (!sessionId) {
      return NextResponse.json({ error: "Missing Stripe session id." }, { status: 400 });
    }

    const { session, pending, alreadyCompleted } = await loadStripePendingCheckout(sessionId);
    const payload = pending.payload as Record<string, unknown>;
    const environment = session.metadata?.environment || "sandbox";

    if (pending.checkout_type === "booking") {
      if (alreadyCompleted) {
        const bookingNo =
          (payload.completedBookingNo as string | undefined) ||
          (session.metadata?.booking_no as string | undefined);
        return NextResponse.json({
          checkoutType: "booking",
          bookingNo: bookingNo || null,
          alreadyCompleted: true,
        });
      }

      const result = await completeBookingCheckout({
        ...(payload as Parameters<typeof completeBookingCheckout>[0]),
        stripePayment: {
          paymentId: session.id,
          environment,
        },
        payhereEnvironment: environment,
      });

      await markStripePendingCompleted(pending.id, {
        completedBookingNo: result.bookingNo,
      });

      return NextResponse.json({
        checkoutType: "booking",
        bookingNo: result.bookingNo,
        whatsappSent: result.whatsappSent,
        whatsappError: result.whatsappError,
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

      const result = await completeSubscriptionCheckout({
        ...(payload as Parameters<typeof completeSubscriptionCheckout>[0]),
        stripePayment: {
          paymentId: session.id,
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
