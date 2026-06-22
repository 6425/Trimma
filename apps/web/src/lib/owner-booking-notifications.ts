import type { SupabaseClient } from "@supabase/supabase-js";
import { sendBookingCreatedOwnerEmail } from "@/app/actions/email-settings";
import { sendOwnerBookingRequestWhatsApp } from "@/app/actions/whatsapp";
import { resolveSalonOwnerEmail } from "@/lib/salon-owner-notifications";

export async function notifyOwnerPaidBookingRequest(
  supabase: SupabaseClient,
  bookingNo: string,
  paymentStatus = "reservation_paid"
): Promise<{ ownerWhatsAppSent: boolean; ownerWhatsAppError: string | null }> {
  const { data: booking } = await supabase
    .from("bookings")
    .select("salon_id")
    .eq("booking_no", bookingNo)
    .maybeSingle();

  if (!booking?.salon_id) {
    return { ownerWhatsAppSent: false, ownerWhatsAppError: "Booking salon not found." };
  }

  const ownerEmail = await resolveSalonOwnerEmail(supabase, booking.salon_id);
  if (ownerEmail) {
    void sendBookingCreatedOwnerEmail(bookingNo, ownerEmail, paymentStatus).catch((err) => {
      console.error("Owner booking email failed:", err);
    });
  }

  const whatsappResult = await sendOwnerBookingRequestWhatsApp(bookingNo, paymentStatus);
  if (!whatsappResult.success && !whatsappResult.skipped) {
    console.error("Owner booking WhatsApp failed:", whatsappResult.error);
  }

  return {
    ownerWhatsAppSent: Boolean(whatsappResult.success && whatsappResult.messageId),
    ownerWhatsAppError: whatsappResult.success
      ? null
      : whatsappResult.error || "Salon owner WhatsApp could not be sent.",
  };
}
