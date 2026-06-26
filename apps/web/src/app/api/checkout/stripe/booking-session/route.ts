import { NextResponse } from "next/server";
import { checkCheckoutRateLimit } from "@/lib/checkout-rate-limit";
import { getClientIp } from "@/lib/email/rate-limit";
import { createStripePaymentIntent } from "@/lib/stripe-checkout";

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);
    const rateLimit = checkCheckoutRateLimit(clientIp);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please wait and try again." },
        {
          status: 429,
          headers: rateLimit.retryAfterSec
            ? { "Retry-After": String(rateLimit.retryAfterSec) }
            : undefined,
        }
      );
    }

    const body = await request.json();
    const {
      customer,
      reservationFee,
      salon,
      services,
      draft,
      rates,
      serviceTotal,
      staffMemberId,
      totalDuration,
    } = body;

    if (!customer?.email || !draft?.salonId || !reservationFee) {
      return NextResponse.json({ error: "Incomplete checkout details." }, { status: 400 });
    }

    const serviceLabel =
      draft.promotionPackageName ||
      (services || []).map((service: { name?: string }) => service.name).filter(Boolean).join(" + ") ||
      "Salon booking deposit";

    const result = await createStripePaymentIntent({
      checkoutType: "booking",
      amount: Number(reservationFee),
      description: `Trimma booking deposit — ${serviceLabel}`,
      customerEmail: customer.email,
      payload: {
        draft,
        customer,
        reservationFee,
        serviceTotal,
        rates,
        salon,
        services,
        staffMemberId,
        totalDuration,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[stripe/booking-session]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create Stripe payment." },
      { status: 500 }
    );
  }
}
