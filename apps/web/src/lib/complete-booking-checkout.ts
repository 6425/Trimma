import { processBookingCardPayment } from "@/app/actions/booking-checkout";
import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { insertBookingRecord, updateBookingAfterPayment } from "@/lib/booking-insert";
import { createBookingPendingConfirmNotification } from "@/lib/salon-owner-notifications";
import { notifyOwnerPaidBookingRequest } from "@/lib/owner-booking-notifications";
import { sendWhatsAppReservationPaidNotification } from "@/app/actions/whatsapp";
import { sendTriggeredEmail } from "@/app/actions/email-settings";
import { isEmailSendFailure } from "@/lib/email/result";
import { APP_BASE_URL } from "@/lib/email/config";
import { buildEmailRateLimitKey } from "@/lib/email/rate-limit";
import {
  parseDisplayTimeSlot,
  resolveStaffForBookingSlot,
} from "@/lib/booking-availability";
import { filterStaffQualifiedForServices, computeBookingStaffCommission } from "@/lib/staff-allocation";
import { enrichBookingsWithDurations } from "@/lib/booking-conflict-data";
import { calculateCommissionSplit, resolveBookingAgentPercentage } from "@/lib/booking-pricing";
import { resolveAgentCommissionAttribution } from "@/lib/agent-hierarchy";
import type { CardType } from "@/lib/card-payment";

export type CompleteBookingCheckoutInput = {
  draft: {
    salonId: string;
    serviceIds: string[];
    staffId: string;
    bookingDate: string;
    timeSlot: string;
    promotionPackageId?: string;
    promotionPackageName?: string;
    promotionPackagePrice?: number;
    promotionPackageIncludedServices?: string[];
  };
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  card?: {
    cardType: CardType;
    cardNumber: string;
    expiry: string;
    cvv: string;
    cardholderName: string;
  };
  stripePayment?: {
    paymentId: string;
    environment: string;
  };
  payhereEnvironment: string;
  reservationFee: number;
  serviceTotal: number;
  rates: {
    platform: number;
    salon: number;
    agent: number;
  };
  salon: {
    id: string;
    onboarding_agent_email?: string | null;
    assign_to?: string | null;
  };
  services: Array<{
    id: string;
    name?: string | null;
    price?: number | string | null;
    duration?: number | string | null;
    duration_min?: number | string | null;
  }>;
  staffMemberId: string | null;
  totalDuration: number;
  clientIp?: string;
};

function parseTimeSlot(timeSlot: string) {
  const formattedTime = parseDisplayTimeSlot(timeSlot);
  const hh = parseInt(formattedTime.split(":")[0], 10);
  const mm = parseInt(formattedTime.split(":")[1], 10);
  return { hh, mm, formattedTime };
}

export async function completeBookingCheckout(input: CompleteBookingCheckoutInput) {
  const supabase = createSupabaseAdminClient();
  const { draft, customer, card, stripePayment, payhereEnvironment, reservationFee, serviceTotal, rates, salon, services, staffMemberId, totalDuration, clientIp } = input;

  const { hh, mm, formattedTime } = parseTimeSlot(draft.timeSlot);
  const bookingNo = `TRM-${Math.floor(100000 + Math.random() * 900000)}`;
  const customerEmail = customer.email || "guest@trimma.com";
  const customerName = `${customer.firstName} ${customer.lastName}`.trim() || "Guest Client";

  const { data: existingUser } = await supabase
    .from("users")
    .select("email")
    .eq("email", customerEmail)
    .maybeSingle();

  if (!existingUser) {
    const { error: userInsertError } = await supabase.from("users").insert({
      email: customerEmail,
      full_name: customerName,
      phone: customer.phone,
      global_role: "customer",
    });
    if (userInsertError) throw new Error(userInsertError.message);
  } else {
    const { error: userUpdateError } = await supabase
      .from("users")
      .update({ full_name: customerName, phone: customer.phone })
      .eq("email", customerEmail);
    if (userUpdateError) throw new Error(userUpdateError.message);
  }

  let agentEmail: string | null = null;
  let fieldAgentEmail: string | null = null;
  let agentCommissionPct = 0;
  let agentCommissionAmount = 0;

  const primaryServiceId = draft.serviceIds[0] || null;
  const isPromotionBooking = Boolean(draft.promotionPackageId);
  const bookingServiceLines = isPromotionBooking
    ? [
        {
          service_id: primaryServiceId,
          price: serviceTotal,
          duration_min: totalDuration,
        },
      ]
    : services.map((service) => ({
        service_id: service.id,
        price: parseFloat(String(service.price || 0)),
        duration_min: parseInt(String(service.duration || service.duration_min || "30"), 10),
      }));

  if (isPromotionBooking && !primaryServiceId) {
    const { data: fallbackServices } = await supabase
      .from("services")
      .select("id")
      .eq("salon_id", salon.id)
      .eq("status", "active")
      .limit(1);

    const fallbackServiceId = fallbackServices?.[0]?.id || null;
    if (!fallbackServiceId) {
      throw new Error("This salon has no active services configured for promotion bookings.");
    }
    bookingServiceLines[0].service_id = fallbackServiceId;
  }

  const serviceIdsForStaff = bookingServiceLines
    .map((line) => line.service_id)
    .filter(Boolean) as string[];

  const { data: salonStaff } = await supabase
    .from("salon_staff")
    .select("id, working_hours")
    .eq("salon_id", salon.id);

  const qualifiedStaff = filterStaffQualifiedForServices(salonStaff || [], serviceIdsForStaff);
  const staffIds = qualifiedStaff.map((member) => member.id).filter(Boolean);

  const { data: existingBookings } = await supabase
    .from("bookings")
    .select("id, booking_time, staff_id, status, created_at, customer_email, service_id")
    .eq("salon_id", salon.id)
    .eq("booking_date", draft.bookingDate);

  const bookings = await enrichBookingsWithDurations(supabase, existingBookings || []);

  const resolvedStaffId = resolveStaffForBookingSlot({
    bookings,
    staffIds,
    preferredStaffId: draft.staffId && draft.staffId !== "any" ? draft.staffId : staffMemberId,
    formattedTime,
    proposedDurationMinutes: totalDuration,
  });

  const pricing = calculateCommissionSplit(serviceTotal, rates);
  const resolvedReservationFee = pricing.reservationFee;

  const attribution = await resolveAgentCommissionAttribution(supabase, salon);
  if (attribution.payeeEmail) {
    agentEmail = attribution.payeeEmail;
    fieldAgentEmail = attribution.fieldAgentEmail;
    agentCommissionPct = resolveBookingAgentPercentage(rates.agent);
    agentCommissionAmount = pricing.platformCommission * (agentCommissionPct / 100);
  }

  const { data: staffProfile } = resolvedStaffId
    ? await supabase
        .from("salon_staff")
        .select("id, name, commission_rate, working_hours")
        .eq("id", resolvedStaffId)
        .maybeSingle()
    : { data: null };

  const staffCommission = staffProfile
    ? computeBookingStaffCommission(
        staffProfile,
        {
          amount: serviceTotal,
          service_id: bookingServiceLines[0]?.service_id || primaryServiceId,
          booking_services: bookingServiceLines.map((line) => ({
            service_id: line.service_id,
            price: line.price,
          })),
        },
        staffProfile ? [staffProfile] : []
      )
    : null;

  const { data: newBooking } = await insertBookingRecord(supabase, {
    booking_no: bookingNo,
    salon_id: salon.id,
    customer_email: customerEmail,
    service_id: bookingServiceLines[0]?.service_id || primaryServiceId,
    staff_id: resolvedStaffId,
    booking_date: draft.bookingDate,
    booking_time: formattedTime,
    amount: serviceTotal,
    status: "pending",
    payment_status: "unpaid",
    reservation_fee_paid: false,
    reservation_fee_refundable: false,
    total_reservation_fee: resolvedReservationFee,
    salon_upfront_amount: pricing.salonUpfront,
    platform_commission_amount: pricing.platformCommission,
    agent_email: agentEmail,
    field_agent_email: fieldAgentEmail,
    agent_commission_percent: agentCommissionPct,
    agent_commission_amount: agentCommissionAmount,
    staff_commission_percent: staffCommission?.rate ?? 0,
    staff_commission_amount: staffCommission?.amount ?? 0,
    promotion_package_id: draft.promotionPackageId || null,
  });

  const resolvedPrimaryServiceId = bookingServiceLines[0]?.service_id || primaryServiceId;

  const { error: servicesError } = await supabase.from("booking_services").insert(
    bookingServiceLines.map((line) => ({
      booking_id: newBooking.id,
      service_id: line.service_id,
      price: line.price,
      duration_min: line.duration_min,
    }))
  );
  if (servicesError) throw new Error(servicesError.message);

  const { error: staffError } = await supabase.from("booking_staff").insert(
    bookingServiceLines.map((line) => ({
      booking_id: newBooking.id,
      staff_id: resolvedStaffId,
      service_id: line.service_id,
    }))
  );
  if (staffError) throw new Error(staffError.message);

  const { data: salonResources } = await supabase
    .from("resources")
    .select("id")
    .eq("salon_id", salon.id);

  if (salonResources?.length) {
    const startMin = hh * 60 + mm;
    const endMin = startMin + totalDuration;
    const endH = Math.floor(endMin / 60);
    const endM = endMin % 60;
    const formattedEndTime = `${endH.toString().padStart(2, "0")}:${endM.toString().padStart(2, "0")}:00`;

    const { error: resourceError } = await supabase.from("resource_bookings").insert(
      salonResources.map((resource) => ({
        booking_id: newBooking.id,
        resource_id: resource.id,
        booking_date: draft.bookingDate,
        start_time: formattedTime,
        end_time: formattedEndTime,
      }))
    );
    if (resourceError) throw new Error(resourceError.message);
  }

  const { data: paymentRow, error: paymentInsertError } = await supabase
    .from("payments")
    .insert({
      booking_id: newBooking.id,
      salon_id: salon.id,
      provider: stripePayment ? "stripe" : "payhere",
      amount: resolvedReservationFee,
      currency: "LKR",
      status: "pending",
    })
    .select("id")
    .single();

  if (paymentInsertError || !paymentRow) {
    throw new Error(paymentInsertError?.message || "Failed to create payment record.");
  }

  const paymentResult = stripePayment
    ? {
        success: true,
        paymentId: stripePayment.paymentId,
        last4: null as string | null,
        provider: "stripe" as const,
        amount: Number(resolvedReservationFee.toFixed(2)),
      }
    : await processBookingCardPayment({
        cardType: card!.cardType,
        cardNumber: card!.cardNumber,
        expiry: card!.expiry,
        cvv: card!.cvv,
        cardholderName: card!.cardholderName,
        amount: resolvedReservationFee,
        bookingNo,
        environment: payhereEnvironment,
      });

  const { error: paymentUpdateError } = await supabase
    .from("payments")
    .update({
      status: "success",
      payment_id: paymentResult.paymentId,
      provider_payment_id: paymentResult.paymentId,
      raw_response: {
        provider: paymentResult.provider,
        last4: paymentResult.last4,
        card_type: card?.cardType || null,
        environment: stripePayment?.environment || payhereEnvironment,
        stripe_session_id: stripePayment?.paymentId || null,
      },
    })
    .eq("id", paymentRow.id);

  if (paymentUpdateError) throw new Error(paymentUpdateError.message);

  await updateBookingAfterPayment(supabase, newBooking.id, {
    status: "pending",
    payment_status: "reservation_paid",
    reservation_fee_paid: true,
  });

  try {
    const [{ data: salonRow }, { data: staffRow }] = await Promise.all([
      supabase.from("salons").select("name, address, location, slug").eq("id", salon.id).maybeSingle(),
      resolvedStaffId
        ? supabase.from("salon_staff").select("name").eq("id", resolvedStaffId).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    void sendWhatsAppReservationPaidNotification(bookingNo, {
      customerPhone: customer.phone,
      customerName,
      serviceName: draft.promotionPackageName || services[0]?.name || undefined,
    }).then((whatsappResult) => {
      if (!whatsappResult.success) {
        console.error("WhatsApp confirmation failed after checkout:", whatsappResult.error);
      }
    }).catch((err) => {
      console.error("WhatsApp confirmation failed after checkout:", err);
    });

    const salonName = salonRow?.name || "your salon";
    const salonAddress = salonRow?.address || salonRow?.location || "See Trimma for details";
    const mapsLink = salonRow?.slug
      ? `${APP_BASE_URL}/salons/${salonRow.slug}`
      : APP_BASE_URL;
    const serviceName =
      draft.promotionPackageName ||
      services
        .map((service) => service.name)
        .filter(Boolean)
        .join(", ") ||
      "Salon service";
    const balanceToPay = Math.max(0, serviceTotal - resolvedReservationFee);

    void createBookingPendingConfirmNotification(supabase, {
      salonId: salon.id,
      bookingId: newBooking.id,
      bookingNo,
      customerEmail,
      customerName,
      bookingDate: draft.bookingDate,
      bookingTime: formattedTime,
      amount: serviceTotal,
      serviceName,
      staffName: staffRow?.name || null,
      paymentStatus: "reservation_paid",
    });

    void notifyOwnerPaidBookingRequest(supabase, bookingNo, "reservation_paid");

    const emailResult = await sendTriggeredEmail({
      triggerId: "reservation-paid",
      to: customerEmail,
      variables: {
        customer_name: customerName,
        booking_no: bookingNo,
        salon_name: salonName,
        booking_date: draft.bookingDate,
        booking_time: formattedTime,
        service_name: serviceName,
        deposit_paid: Number(resolvedReservationFee).toLocaleString("en-LK"),
        balance_to_pay: balanceToPay.toLocaleString("en-LK"),
        dashboard_link: `${APP_BASE_URL}/customer`,
      },
      rateLimitKey: buildEmailRateLimitKey(clientIp || "checkout", customerEmail),
      idempotencyKey: `booking-reservation-paid/${bookingNo}`,
    });

    if (isEmailSendFailure(emailResult) && !emailResult.skipped) {
      console.error("Reservation payment email failed:", emailResult.error);
    }

    return {
      bookingNo,
      bookingId: newBooking.id,
      whatsappSent: true,
      whatsappError: null,
      emailSent: emailResult.success,
      emailError: isEmailSendFailure(emailResult) ? emailResult.error : null,
      emailId: emailResult.success ? emailResult.id : null,
    };
  } catch (notificationError) {
    console.error("Post-checkout notifications failed:", notificationError);
    return {
      bookingNo,
      bookingId: newBooking.id,
      whatsappSent: false,
      whatsappError:
        notificationError instanceof Error ? notificationError.message : "Notification dispatch failed.",
      emailSent: false,
      emailError:
        notificationError instanceof Error ? notificationError.message : "Email dispatch failed.",
      emailId: null,
    };
  }
}
