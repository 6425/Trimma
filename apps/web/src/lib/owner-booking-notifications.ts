import type { SupabaseClient } from "@supabase/supabase-js";
import { sendBookingCreatedOwnerEmail } from "@/app/actions/email-settings";
import { sendOwnerBookingRequestWhatsApp } from "@/app/actions/whatsapp";
import { resolveSalonOwnerEmail } from "@/lib/salon-owner-notifications";

export async function notifyOwnerPaidBookingRequest(
  supabase: SupabaseClient,
  bookingNo: string,
  paymentStatus = "reservation_paid"
): Promise<void> {
  const { data: booking } = await supabase
    .from("bookings")
    .select("salon_id")
    .eq("booking_no", bookingNo)
    .maybeSingle();

  if (!booking?.salon_id) return;

  const ownerEmail = await resolveSalonOwnerEmail(supabase, booking.salon_id);
  if (ownerEmail) {
    void sendBookingCreatedOwnerEmail(bookingNo, ownerEmail, paymentStatus).catch((err) => {
      console.error("Owner booking email failed:", err);
    });
  }

  void sendOwnerBookingRequestWhatsApp(bookingNo, paymentStatus).catch((err) => {
    console.error("Owner booking WhatsApp failed:", err);
  });
}
