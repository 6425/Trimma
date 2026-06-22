import type { SupabaseClient } from "@supabase/supabase-js";
import { sendWhatsAppNotification } from "@/app/actions/whatsapp";
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

export type BookingCheckoutNotificationResult = {
  whatsappSent: boolean;
  whatsappError: string | null;
  emailSent: boolean;
  emailError: string | null;
};

export async function runBookingCheckoutNotifications(
  input: BookingCheckoutNotificationInput
): Promise<BookingCheckoutNotificationResult> {
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
    supabase
      .from("salons")
      .select("name, address, location, slug")
      .eq("id", salonId)
      .maybeSingle(),
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
  const salonAddress = salonRow?.address || "";
  const balanceToPay = Math.max(0, serviceTotal - reservationFee);
  let mapsLink = "";
  if (salonRow?.location && String(salonRow.location).includes(",")) {
    mapsLink = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(String(salonRow.location).trim())}`;
  } else if (salonAddress) {
    mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${salonName}, ${salonAddress}`)}`;
  } else if (salonRow?.slug) {
    mapsLink = `${APP_BASE_URL}/salons/${salonRow.slug}`;
  }

  const whatsappResult = await sendWhatsAppNotification(bookingNo, {
    customerPhone,
    customerName,
    serviceName,
  });
  if (!whatsappResult.success) {
    console.error("WhatsApp booking confirmation failed after checkout:", whatsappResult.error);
  }

  const [, ownerNotifyResult, emailResult] = await Promise.allSettled([
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
      triggerId: "confirmed",
      to: customerEmail,
      variables: {
        customer_name: customerName,
        booking_no: bookingNo,
        salon_name: salonName,
        booking_date: bookingDate,
        booking_time: bookingTime,
        service_name: serviceName,
        total_price: Number(serviceTotal).toLocaleString("en-LK"),
        deposit_paid: Number(reservationFee).toLocaleString("en-LK"),
        balance_to_pay: balanceToPay.toLocaleString("en-LK"),
        salon_address: salonAddress || "See Trimma for details",
        maps_link: mapsLink || APP_BASE_URL,
        dashboard_link: `${APP_BASE_URL}/customer`,
      },
      rateLimitKey: buildEmailRateLimitKey(clientIp || "checkout", customerEmail),
      idempotencyKey: `booking-confirmed/${bookingNo}`,
    }),
  ]);

  let ownerWhatsAppError: string | null = null;
  if (ownerNotifyResult.status === "fulfilled") {
    if (!ownerNotifyResult.value.ownerWhatsAppSent) {
      ownerWhatsAppError = ownerNotifyResult.value.ownerWhatsAppError;
      console.error("Salon owner WhatsApp failed after checkout:", ownerWhatsAppError);
    }
  } else {
    ownerWhatsAppError =
      ownerNotifyResult.reason instanceof Error
        ? ownerNotifyResult.reason.message
        : "Salon owner WhatsApp could not be sent.";
    console.error("Salon owner WhatsApp failed after checkout:", ownerWhatsAppError);
  }

  let emailSent = false;
  let emailError: string | null = null;
  if (emailResult.status === "fulfilled") {
    const emailPayload = emailResult.value;
    if (isEmailSendFailure(emailPayload) && !emailPayload.skipped) {
      emailError = emailPayload.error || "Email could not be sent.";
      console.error("Reservation payment email failed:", emailError);
    } else {
      emailSent = true;
    }
  } else {
    emailError =
      emailResult.reason instanceof Error
        ? emailResult.reason.message
        : "Email could not be sent.";
    console.error("Reservation payment email failed:", emailError);
  }

  return {
    whatsappSent: Boolean(whatsappResult.success && whatsappResult.messageId),
    whatsappError: whatsappResult.success && whatsappResult.messageId
      ? null
      : whatsappResult.error || "WhatsApp could not be sent.",
    emailSent,
    emailError,
  };
}
