import { NextResponse } from "next/server";

/** See the booking counterpart: direct raw-card checkout is intentionally disabled. */
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
