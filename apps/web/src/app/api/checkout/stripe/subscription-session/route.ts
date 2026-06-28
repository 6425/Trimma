import { NextResponse } from "next/server";
import { requireSalonOwnerFromCookies } from "@/lib/server-salon-auth";
import { validateSubscriptionCheckoutPrice } from "@/lib/checkout-price-validation";
import { createStripePaymentIntent } from "@/lib/stripe-checkout";

export async function POST(request: Request) {
  try {
    const auth = await requireSalonOwnerFromCookies();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const body = await request.json();
    const { customer, chargeAmount, planName, billingCycle } = body;

    if (!planName || !chargeAmount) {
      return NextResponse.json({ error: "Incomplete subscription checkout details." }, { status: 400 });
    }

    const validated = await validateSubscriptionCheckoutPrice({
      planName: String(planName),
      billingCycle: billingCycle === "annual" ? "annual" : "monthly",
      chargeAmount: Number(chargeAmount),
    });

    const result = await createStripePaymentIntent({
      checkoutType: "subscription",
      amount: validated.chargeAmount,
      description: `Trimma ${validated.plan.name} plan (${billingCycle})`,
      customerEmail: customer?.email || auth.email || "",
      payload: {
        planName: validated.plan.name,
        billingCycle,
        chargeAmount: validated.chargeAmount,
        customer,
        salonId: auth.salonId,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[stripe/subscription-session]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create Stripe payment." },
      { status: 500 }
    );
  }
}
