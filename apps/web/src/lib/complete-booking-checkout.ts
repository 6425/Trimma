import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { insertBookingRecord, updateBookingAfterPayment } from "@/lib/booking-insert";
import { runBookingCheckoutNotifications } from "@/lib/booking-checkout-notifications";
import {
  parseDisplayTimeSlot,
  resolveStaffForBookingSlot,
} from "@/lib/booking-availability";
import {
  filterStaffQualifiedForServices,
  assertQualifiedStaffForServices,
  filterServicesWithStaffCoverage,
  computeBookingStaffCommission,
} from "@/lib/staff-allocation";
import { enrichBookingsWithDurations } from "@/lib/booking-conflict-data";
import { calculateCommissionSplit, resolveBookingAgentPercentage } from "@/lib/booking-pricing";
import { resolveAgentCommissionAttribution } from "@/lib/agent-hierarchy";
import { computeAgentCommissionSnapshot } from "@/lib/booking-commission-snapshot";
import { normalizeEmail } from "@/lib/normalize-email";
import { sanitizeText } from "@/lib/sanitize-input";
import { validateBookingCheckoutPrices } from "@/lib/checkout-price-validation";

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
  stripePayment: {
    paymentId: string;
    environment: string;
  };
  reservationFee: number;
  serviceTotal: number;
  clientIp?: string;
};

export type CompleteBookingCheckoutResult = {
  bookingNo: string;
  bookingId: string;
  notificationsPending: boolean;
  whatsappSent: boolean;
  whatsappError: string | null;
  emailSent: boolean;
  emailError: string | null;
  emailId: null;
};

function parseTimeSlot(timeSlot: string) {
  const formattedTime = parseDisplayTimeSlot(timeSlot);
  const hh = parseInt(formattedTime.split(":")[0], 10);
  const mm = parseInt(formattedTime.split(":")[1], 10);
  return { hh, mm, formattedTime };
}

function validateCheckoutInput(input: CompleteBookingCheckoutInput) {
  const customerEmail = normalizeEmail(input.customer.email);
  if (!customerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
    throw new Error("A valid email address is required.");
  }
  if (!input.customer.phone?.trim()) {
    throw new Error("Phone number is required for WhatsApp booking alerts.");
  }
  if (!input.draft?.salonId?.trim()) {
    throw new Error("Salon is required.");
  }
  if (!input.draft?.bookingDate || !input.draft?.timeSlot) {
    throw new Error("Booking date and time are required.");
  }
  if (!Number.isFinite(input.reservationFee) || input.reservationFee <= 0) {
    throw new Error("Invalid reservation fee.");
  }
  if (!Number.isFinite(input.serviceTotal) || input.serviceTotal <= 0) {
    throw new Error("Invalid service total.");
  }
  if (!input.stripePayment?.paymentId) {
    throw new Error("A verified Stripe payment is required.");
  }
}

async function ensureCheckoutCustomer(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  customerEmail: string,
  customerName: string,
  phone: string
) {
  const safeName = sanitizeText(customerName);
  const safePhone = sanitizeText(phone);

  const { data: existingUser } = await supabase
    .from("users")
    .select("email")
    .eq("email", customerEmail)
    .maybeSingle();

  if (!existingUser) {
    const { error } = await supabase.from("users").insert({
      email: customerEmail,
      full_name: safeName,
      phone: safePhone,
      global_role: "customer",
    });
    if (error && error.code !== "23505") throw new Error(error.message);
    return;
  }
}

export async function completeBookingCheckout(
  input: CompleteBookingCheckoutInput
): Promise<CompleteBookingCheckoutResult> {
  validateCheckoutInput(input);

  const validatedPrices = await validateBookingCheckoutPrices({
    draft: {
      salonId: input.draft.salonId,
      serviceIds: input.draft.serviceIds,
      promotionPackageId: input.draft.promotionPackageId,
    },
    serviceTotal: input.serviceTotal,
    reservationFee: input.reservationFee,
  });

  const supabase = createSupabaseAdminClient();
  const {
    draft,
    customer,
    stripePayment,
    clientIp,
  } = input;

  const salon = validatedPrices.salon;
  const serviceTotal = validatedPrices.serviceTotal;
  const inputReservationFee = validatedPrices.reservationFee;
  const rates = validatedPrices.rates;
  const services = validatedPrices.services;
  const totalDuration = services.reduce((sum, service) => {
    const duration = parseInt(String(service.duration || service.duration_min || "30"), 10);
    return sum + (Number.isFinite(duration) && duration > 0 ? duration : 30);
  }, 0);

  const { hh, mm, formattedTime } = parseTimeSlot(draft.timeSlot);
  const bookingNo = `TRM-${Math.floor(100000 + Math.random() * 900000)}`;
  const customerEmail = normalizeEmail(customer.email);
  const customerName = `${customer.firstName} ${customer.lastName}`.trim() || "Guest Client";

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

  const needsFallbackService = isPromotionBooking && !primaryServiceId;

  const [
    ,
    { data: salonStaff },
    { data: existingBookings },
    attribution,
    { data: salonResources },
    fallbackServicesResult,
  ] = await Promise.all([
    ensureCheckoutCustomer(supabase, customerEmail, customerName, customer.phone?.trim() || ""),
    supabase.from("salon_staff").select("id, working_hours").eq("salon_id", salon.id),
    supabase
      .from("bookings")
      .select("id, booking_time, staff_id, status, created_at, customer_email, service_id")
      .eq("salon_id", salon.id)
      .eq("booking_date", draft.bookingDate),
    resolveAgentCommissionAttribution(supabase, salon),
    supabase.from("resources").select("id").eq("salon_id", salon.id),
    needsFallbackService
      ? supabase
          .from("services")
          .select("id, status, global_service_id")
          .eq("salon_id", salon.id)
          .eq("status", "active")
      : Promise.resolve({ data: null }),
  ]);

  if (needsFallbackService) {
    const activeServices = fallbackServicesResult?.data || [];
    const coveredServices = filterServicesWithStaffCoverage(activeServices, salonStaff || []);
    const fallbackServiceId = coveredServices[0]?.id || null;
    if (!fallbackServiceId) {
      throw new Error("This promotion requires at least one active service mapped to staff.");
    }
    bookingServiceLines[0].service_id = fallbackServiceId;
  }

  const serviceIdsForStaff = bookingServiceLines
    .map((line) => line.service_id)
    .filter(Boolean) as string[];

  assertQualifiedStaffForServices(salonStaff || [], serviceIdsForStaff);
  const qualifiedStaff = filterStaffQualifiedForServices(salonStaff || [], serviceIdsForStaff);
  const staffIds = qualifiedStaff.map((member) => member.id).filter(Boolean);

  const bookings = await enrichBookingsWithDurations(supabase, existingBookings || []);

  const resolvedStaffId = resolveStaffForBookingSlot({
    bookings,
    staffIds,
    preferredStaffId: draft.staffId && draft.staffId !== "any" ? draft.staffId : null,
    formattedTime,
    proposedDurationMinutes: totalDuration,
  });

  const pricing = calculateCommissionSplit(serviceTotal, rates);
  const resolvedReservationFee =
    Number.isFinite(inputReservationFee) && inputReservationFee > 0
      ? inputReservationFee
      : pricing.reservationFee;

  let agentEmail: string | null = null;
  let fieldAgentEmail: string | null = null;
  let agentCommissionPct = 0;
  let agentCommissionAmount = 0;
  let agentSplitSnapshot = {
    field_agent_commission_amount: 0,
    regional_head_commission_amount: 0,
    agent_split_percent: 0,
  };

  if (attribution.payeeEmail) {
    agentEmail = attribution.payeeEmail;
    fieldAgentEmail = attribution.fieldAgentEmail;
    agentCommissionPct = resolveBookingAgentPercentage(rates.agent);
    agentCommissionAmount = pricing.platformCommission * (agentCommissionPct / 100);
    agentSplitSnapshot = computeAgentCommissionSnapshot(agentCommissionAmount, attribution);
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
        [staffProfile]
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
    field_agent_commission_amount: agentSplitSnapshot.field_agent_commission_amount,
    regional_head_commission_amount: agentSplitSnapshot.regional_head_commission_amount,
    agent_split_percent: agentSplitSnapshot.agent_split_percent,
    staff_commission_percent: staffCommission?.rate ?? 0,
    staff_commission_amount: staffCommission?.amount ?? 0,
    promotion_package_id: draft.promotionPackageId || null,
  });

  const bookingLineRows = bookingServiceLines.map((line) => ({
    booking_id: newBooking.id,
    service_id: line.service_id,
    price: line.price,
    duration_min: line.duration_min,
  }));
  const staffLineRows = bookingServiceLines.map((line) => ({
    booking_id: newBooking.id,
    staff_id: resolvedStaffId,
    service_id: line.service_id,
  }));

  const writeTasks = [
    (async () => {
      const { error } = await supabase.from("booking_services").insert(bookingLineRows);
      if (error) throw new Error(error.message);
    })(),
    (async () => {
      const { error } = await supabase.from("booking_staff").insert(staffLineRows);
      if (error) throw new Error(error.message);
    })(),
  ];

  if (salonResources?.length) {
    const startMin = hh * 60 + mm;
    const endMin = startMin + totalDuration;
    const endH = Math.floor(endMin / 60);
    const endM = endMin % 60;
    const formattedEndTime = `${endH.toString().padStart(2, "0")}:${endM.toString().padStart(2, "0")}:00`;

    writeTasks.push(
      (async () => {
        const { error } = await supabase.from("resource_bookings").insert(
          salonResources.map((resource) => ({
            booking_id: newBooking.id,
            resource_id: resource.id,
            booking_date: draft.bookingDate,
            start_time: formattedTime,
            end_time: formattedEndTime,
          }))
        );
        if (error) throw new Error(error.message);
      })()
    );
  }

  await Promise.all(writeTasks);

  const { data: paymentRow, error: paymentInsertError } = await supabase
    .from("payments")
    .insert({
      booking_id: newBooking.id,
      salon_id: salon.id,
      provider: "stripe",
      amount: resolvedReservationFee,
      currency: "LKR",
      status: "pending",
    })
    .select("id")
    .single();

  if (paymentInsertError || !paymentRow) {
    throw new Error(paymentInsertError?.message || "Failed to create payment record.");
  }

  const paymentResult = {
    success: true,
    paymentId: stripePayment.paymentId,
    last4: null as string | null,
    provider: "stripe" as const,
    amount: Number(resolvedReservationFee.toFixed(2)),
  };

  await Promise.all([
    (async () => {
      const { error } = await supabase
        .from("payments")
        .update({
          status: "success",
          payment_id: paymentResult.paymentId,
          provider_payment_id: paymentResult.paymentId,
          raw_response: {
            provider: paymentResult.provider,
            last4: paymentResult.last4,
            card_type: null,
            environment: stripePayment.environment,
            stripe_session_id: stripePayment.paymentId,
          },
        })
        .eq("id", paymentRow.id);
      if (error) throw new Error(error.message);
    })(),
    updateBookingAfterPayment(supabase, newBooking.id, {
      status: "confirmed",
      payment_status: "reservation_paid",
      reservation_fee_paid: true,
    }),
  ]);

  const notificationResult = await runBookingCheckoutNotifications({
    supabase,
    bookingNo,
    bookingId: newBooking.id,
    salonId: salon.id,
    customerEmail,
    customerName,
    customerPhone: customer.phone?.trim() || "",
    bookingDate: draft.bookingDate,
    bookingTime: formattedTime,
    serviceTotal,
    reservationFee: resolvedReservationFee,
    promotionPackageName: draft.promotionPackageName,
    services,
    resolvedStaffId,
    clientIp,
  });

  return {
    bookingNo,
    bookingId: newBooking.id,
    notificationsPending: false,
    whatsappSent: notificationResult.whatsappSent,
    whatsappError: notificationResult.whatsappError,
    emailSent: notificationResult.emailSent,
    emailError: notificationResult.emailError,
    emailId: null,
  };
}
