import { NextResponse } from "next/server";

/**
 * The legacy endpoint accepted raw card data without using a payment processor.
 * Keep it fail-closed so old clients cannot create a paid booking. New checkouts
 * must use Stripe's server-verified PaymentIntent flow.
 */
export async function POST() {
  return NextResponse.json(
    {
      error: "This payment endpoint has been retired. Please restart checkout and pay securely with Stripe.",
    },
    {
      status: 410,
      headers: { "Cache-Control": "no-store" },
    }
  );
}
