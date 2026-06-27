import { NextResponse } from "next/server";
import { completeBookingCheckout } from "@/lib/complete-booking-checkout";
import { checkCheckoutRateLimit } from "@/lib/checkout-rate-limit";
import { getClientIp } from "@/lib/email/rate-limit";
import { validateCardPayment, type CardType } from "@/lib/card-payment";

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);
    const rateLimit = await checkCheckoutRateLimit(clientIp);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many checkout attempts. Please wait and try again." },
        {
          status: 429,
          headers: rateLimit.retryAfterSec
            ? { "Retry-After": String(rateLimit.retryAfterSec) }
            : undefined,
        }
      );
    }

    const body = await request.json();

    const cardType = body.card?.cardType as CardType;
    const cardDetails = {
      cardholderName: String(body.card?.cardholderName || ""),
      cardNumber: String(body.card?.cardNumber || ""),
      expiry: String(body.card?.expiry || ""),
      cvv: String(body.card?.cvv || ""),
    };

    const cardError = validateCardPayment(cardType, cardDetails);
    if (cardError) {
      return NextResponse.json({ error: cardError }, { status: 400 });
    }

    const result = await completeBookingCheckout({
      draft: body.draft,
      customer: body.customer,
      card: {
        cardType,
        ...cardDetails,
      },
      payhereEnvironment: body.payhereEnvironment || "sandbox",
      reservationFee: Number(body.reservationFee || 0),
      serviceTotal: Number(body.serviceTotal || 0),
      rates: body.rates,
      salon: body.salon,
      services: body.services || [],
      staffMemberId: body.staffMemberId || null,
      totalDuration: Number(body.totalDuration || 0),
      clientIp,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Checkout failed.";
    console.error("Checkout API failed:", message, error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
