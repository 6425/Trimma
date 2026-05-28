import { NextResponse } from "next/server";
import { completeSubscriptionCheckout } from "@/lib/complete-subscription-checkout";
import { validateCardPayment, type CardType } from "@/lib/card-payment";

export async function POST(request: Request) {
  try {
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

    const result = await completeSubscriptionCheckout({
      planName: String(body.planName || ""),
      billingCycle: body.billingCycle === "annual" ? "annual" : "monthly",
      chargeAmount: Number(body.chargeAmount || 0),
      customer: body.customer,
      card: {
        cardType,
        ...cardDetails,
      },
      payhereEnvironment: body.payhereEnvironment || "sandbox",
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Subscription checkout failed.";
    console.error("Subscription checkout API failed:", message, error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
