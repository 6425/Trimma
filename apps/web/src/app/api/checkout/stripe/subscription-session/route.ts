import { NextResponse } from "next/server";
import { createStripeEmbeddedSession } from "@/lib/stripe-checkout";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customer, chargeAmount, planName, billingCycle } = body;

    if (!planName || !chargeAmount) {
      return NextResponse.json({ error: "Incomplete subscription checkout details." }, { status: 400 });
    }

    const result = await createStripeEmbeddedSession({
      checkoutType: "subscription",
      amount: Number(chargeAmount),
      description: `Trimma ${planName} plan (${billingCycle})`,
      customerEmail: customer?.email || "",
      returnPath: "/checkout/subscription/success",
      payload: {
        planName,
        billingCycle,
        chargeAmount,
        customer,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[stripe/subscription-session]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create Stripe session." },
      { status: 500 }
    );
  }
}
