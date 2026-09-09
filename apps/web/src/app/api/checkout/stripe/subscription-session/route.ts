import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Subscription packages are free for 365 days. Select your package from Subscription & Billing; no payment is required.",
    },
    {
      status: 410,
      headers: { "Cache-Control": "no-store" },
    }
  );
}
