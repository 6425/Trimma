import { NextResponse } from "next/server";
import { createStripeEmbeddedSession } from "@/lib/stripe-checkout";

export async function POST(request: Request) {
  try {
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

    const result = await createStripeEmbeddedSession({
      checkoutType: "booking",
      amount: Number(reservationFee),
      description: `Trimma booking deposit — ${serviceLabel}`,
      customerEmail: customer.email,
      returnPath: "/checkout/booking/success",
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
      { error: error instanceof Error ? error.message : "Failed to create Stripe session." },
      { status: 500 }
    );
  }
}
