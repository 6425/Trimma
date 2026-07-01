"use server";

import { withCustomerDb, isCustomerDbSuccess, customerDbFailure } from "@/lib/with-customer-db";
import { normalizeEmail } from "@/lib/normalize-email";
import { createRescheduleRequestNotification } from "@/lib/salon-owner-notifications";
import { sendOwnerRescheduleRequestWhatsApp } from "@/app/actions/whatsapp";

const NON_RESCHEDULABLE_STATUSES = new Set(["completed", "canceled", "cancelled", "no_show"]);

function formatBookingTime(time: string): string {
  return time.length === 5 ? `${time}:00` : time;
}

export async function requestCustomerReschedule(
  bookingId: string,
  requestedDate: string,
  requestedTime: string
) {
  if (!bookingId || !requestedDate || !requestedTime) {
    return { success: false as const, error: "Choose a new date and time." };
  }

  const formattedTime = formatBookingTime(requestedTime);

  let notifyPayload: {
    bookingNo: string;
    customerEmail: string;
    serviceName: string;
    currentDate: string;
    currentTime: string;
    requestedDate: string;
    requestedTime: string;
  } | null = null;

  const result = await withCustomerDb(async (supabase, ctx) => {
    const { data: booking, error: readErr } = await supabase
      .from("bookings")
      .select(
        "id, booking_no, salon_id, customer_email, status, booking_date, booking_time, reschedule_requested, reschedule_status, services(name)"
      )
      .eq("id", bookingId)
      .maybeSingle();
    if (readErr) throw new Error(readErr.message);
    if (!booking) throw new Error("Booking not found.");

    const customerEmail = normalizeEmail(booking.customer_email);
    if (!customerEmail || customerEmail !== ctx.email) {
      throw new Error("You can only reschedule your own bookings.");
    }

    const status = String(booking.status || "").toLowerCase();
    if (NON_RESCHEDULABLE_STATUSES.has(status)) {
      throw new Error("Completed or cancelled bookings cannot be rescheduled.");
    }

    if (
      booking.reschedule_requested === true &&
      booking.reschedule_status === "pending_salon"
    ) {
      throw new Error("A reschedule request is already pending salon approval.");
    }

    const { error: updateErr } = await supabase
      .from("bookings")
      .update({
        reschedule_requested: true,
        reschedule_status: "pending_salon",
        requested_booking_date: requestedDate,
        requested_booking_time: formattedTime,
      })
      .eq("id", bookingId);
    if (updateErr) throw new Error(updateErr.message);

    const { error: auditErr } = await supabase.from("reschedule_requests").insert({
      booking_id: bookingId,
      requested_by: "customer",
      status: "pending",
      requested_booking_date: requestedDate,
      requested_booking_time: formattedTime,
    });
    if (auditErr && !auditErr.message.toLowerCase().includes("does not exist")) {
      throw new Error(auditErr.message);
    }

    const service = Array.isArray(booking.services) ? booking.services[0] : booking.services;
    const serviceName = (service as { name?: string } | null)?.name || "Appointment";

    await createRescheduleRequestNotification(supabase, {
      salonId: booking.salon_id as string,
      bookingId: booking.id as string,
      bookingNo: String(booking.booking_no || ""),
      customerEmail: customerEmail,
      currentDate: String(booking.booking_date || ""),
      currentTime: String(booking.booking_time || ""),
      requestedDate,
      requestedTime: formattedTime,
      serviceName,
    });

    notifyPayload = {
      bookingNo: String(booking.booking_no || ""),
      customerEmail,
      serviceName,
      currentDate: String(booking.booking_date || ""),
      currentTime: String(booking.booking_time || ""),
      requestedDate,
      requestedTime: formattedTime,
    };
  });

  if (!isCustomerDbSuccess(result)) return customerDbFailure(result);

  if (notifyPayload?.bookingNo) {
    void sendOwnerRescheduleRequestWhatsApp(notifyPayload.bookingNo, {
      customerEmail: notifyPayload.customerEmail,
      serviceName: notifyPayload.serviceName,
      currentDate: notifyPayload.currentDate,
      currentTime: notifyPayload.currentTime,
      requestedDate: notifyPayload.requestedDate,
      requestedTime: notifyPayload.requestedTime,
    }).catch((err) => console.error("Owner reschedule-request WhatsApp failed:", err));
  }

  return { success: true as const };
}
