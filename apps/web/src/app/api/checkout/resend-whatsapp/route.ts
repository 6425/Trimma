import { NextResponse } from "next/server";
import { sendWhatsAppReservationPaidNotification } from "@/app/actions/whatsapp";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const bookingNo = String(body.bookingNo || "").trim();

    if (!/^TRM-\d{6}$/.test(bookingNo)) {
      return NextResponse.json({ error: "Invalid booking reference." }, { status: 400 });
    }

    const result = await sendWhatsAppReservationPaidNotification(bookingNo);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "WhatsApp could not be sent." },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, messageId: result.messageId || null });
  } catch (error) {
    console.error("[checkout/resend-whatsapp]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to resend WhatsApp." },
      { status: 500 }
    );
  }
}
