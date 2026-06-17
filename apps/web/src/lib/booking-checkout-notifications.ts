import type { SupabaseClient } from "@supabase/supabase-js";
import { sendWhatsAppReservationPaidNotification } from "@/app/actions/whatsapp";
import { sendTriggeredEmail } from "@/app/actions/email-settings";
import { isEmailSendFailure } from "@/lib/email/result";
import { APP_BASE_URL } from "@/lib/email/config";
import { buildEmailRateLimitKey } from "@/lib/email/rate-limit";
import { createBookingPendingConfirmNotification } from "@/lib/salon-owner-notifications";
import { notifyOwnerPaidBookingRequest } from "@/lib/owner-booking-notifications";

export type BookingCheckoutNotificationInput = {
  supabase: SupabaseClient;
  bookingNo: string;
  bookingId: string;
  salonId: string;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  bookingDate: string;
  bookingTime: string;
  serviceTotal: number;
  reservationFee: number;
  promotionPackageName?: string;
  services: Array<{ name?: string | null }>;
  resolvedStaffId: string | null;
  clientIp?: string;
};

/** Fire-and-forget: never blocks checkout response. */
export function dispatchBookingCheckoutNotifications(input: BookingCheckoutNotificationInput) {
  void runBookingCheckoutNotifications(input).catch((err) => {
    console.error("[checkout/notifications]", err);
  });
}

async function runBookingCheckoutNotifications(input: BookingCheckoutNotificationInput) {
  const {
    supabase,
    bookingNo,
    bookingId,
    salonId,
    customerEmail,
    customerName,
    customerPhone,
    bookingDate,
    bookingTime,
    serviceTotal,
    reservationFee,
    promotionPackageName,
    services,
    resolvedStaffId,
    clientIp,
  } = input;

  const [{ data: salonRow }, { data: staffRow }] = await Promise.all([
    supabase.from("salons").select("name, address, location, slug").eq("id", salonId).maybeSingle(),
    resolvedStaffId
      ? supabase.from("salon_staff").select("name").eq("id", resolvedStaffId).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const serviceName =
    promotionPackageName ||
    services
      .map((service) => service.name)
      .filter(Boolean)
      .join(", ") ||
    "Salon service";

  const salonName = salonRow?.name || "your salon";
  const balanceToPay = Math.max(0, serviceTotal - reservationFee);

  const notificationTasks: Promise<unknown>[] = [
    sendWhatsAppReservationPaidNotification(bookingNo, {
      customerPhone,
      customerName,
      serviceName,
    }).then((result) => {
      if (!result.success) {
        console.error("WhatsApp confirmation failed after checkout:", result.error);
      }
    }),
    createBookingPendingConfirmNotification(supabase, {
      salonId,
      bookingId,
      bookingNo,
      customerEmail,
      customerName,
      bookingDate,
      bookingTime,
      amount: serviceTotal,
      serviceName,
      staffName: staffRow?.name || null,
      paymentStatus: "reservation_paid",
    }),
    notifyOwnerPaidBookingRequest(supabase, bookingNo, "reservation_paid"),
    sendTriggeredEmail({
      triggerId: "reservation-paid",
      to: customerEmail,
      variables: {
        customer_name: customerName,
        booking_no: bookingNo,
        salon_name: salonName,
        booking_date: bookingDate,
        booking_time: bookingTime,
        service_name: serviceName,
        deposit_paid: Number(reservationFee).toLocaleString("en-LK"),
        balance_to_pay: balanceToPay.toLocaleString("en-LK"),
        dashboard_link: `${APP_BASE_URL}/customer`,
      },
      rateLimitKey: buildEmailRateLimitKey(clientIp || "checkout", customerEmail),
      idempotencyKey: `booking-reservation-paid/${bookingNo}`,
    }).then((emailResult) => {
      if (isEmailSendFailure(emailResult) && !emailResult.skipped) {
        console.error("Reservation payment email failed:", emailResult.error);
      }
    }),
  ];

  await Promise.allSettled(notificationTasks);
}
