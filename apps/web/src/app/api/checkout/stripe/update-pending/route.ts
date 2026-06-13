import { NextResponse } from "next/server";
import { updateStripePendingPayload } from "@/lib/stripe-checkout";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const pendingId = body.pendingId as string | undefined;

    if (!pendingId) {
      return NextResponse.json({ error: "Missing pending checkout id." }, { status: 400 });
    }

    const { pendingId: _ignored, ...payload } = body;
    await updateStripePendingPayload(pendingId, payload);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[stripe/update-pending]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update checkout details." },
      { status: 500 }
    );
  }
}
