import { NextResponse } from "next/server";
import { sendWhatsAppNotification } from "@/app/actions/whatsapp";
import { checkCheckoutRateLimit } from "@/lib/checkout-rate-limit";
import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { getClientIp } from "@/lib/email/rate-limit";

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);
    const rateLimit = await checkCheckoutRateLimit(clientIp);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please wait and try again." },
        {
          status: 429,
          headers: rateLimit.retryAfterSec
            ? { "Retry-After": String(rateLimit.retryAfterSec) }
            : undefined,
        }
      );
    }

    const body = await request.json();
    const bookingNo = String(body.bookingNo || "").trim();

    if (!/^TRM-\d{6}$/.test(bookingNo)) {
      return NextResponse.json({ error: "Invalid booking reference." }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    const { data: booking, error } = await supabase
      .from("bookings")
      .select("id, status, payment_status")
      .eq("booking_no", bookingNo)
      .maybeSingle();

    if (error || !booking) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }

    const status = String(booking.status || "").toLowerCase();
    if (status === "canceled" || status === "cancelled") {
      return NextResponse.json({ error: "This booking is no longer active." }, { status: 400 });
    }

    const result = await sendWhatsAppNotification(bookingNo);

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
