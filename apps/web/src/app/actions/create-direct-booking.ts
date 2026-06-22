"use server";

import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { parseDisplayTimeSlot, resolveStaffForBookingSlot } from "@/lib/booking-availability";
import { filterStaffQualifiedForServices, assertQualifiedStaffForServices, filterServicesWithStaffCoverage, computeBookingStaffCommission } from "@/lib/staff-allocation";
import { enrichBookingsWithDurations } from "@/lib/booking-conflict-data";
import { insertBookingRecord } from "@/lib/booking-insert";
import { calculateCommissionSplit, getReservationDepositPercentForSalon, resolveBookingAgentPercentage } from "@/lib/booking-pricing";
import { createBookingPendingConfirmNotification } from "@/lib/salon-owner-notifications";
import { notifyOwnerPaidBookingRequest } from "@/lib/owner-booking-notifications";
import { sendWhatsAppNotification } from "@/app/actions/whatsapp";
import { getDiscountedServicePrice, isServiceDiscountActive } from "@/lib/service-discount";
import { fetchBookingCommissionRates } from "@/app/actions/booking-public-settings";
import { resolveAgentCommissionAttribution } from "@/lib/agent-hierarchy";
import { computeAgentCommissionSnapshot } from "@/lib/booking-commission-snapshot";

export type CreateDirectBookingInput = {
  salonId: string;
  serviceIds: string[];
  staffId: string;
  bookingDate: string;
  timeSlot: string;
  customerDetails: {
    fullName: string;
    email?: string;
    phone: string;
  };
  paymentMethod: "direct" | "paypal";
  paymentDetails?: Record<string, unknown>;
  promotionPackageId?: string;
  promotionPackagePrice?: number;
  promotionPackageIncludedServices?: string[];
};

export type CreateDirectBookingResult =
  | {
      success: true;
      booking_id: string;
      booking_no: string;
      status: string;
      total_price: number;
    }
  | { success: false; error: string };

function splitCustomerName(fullName: string) {
  const trimmed = fullName.trim() || "Guest Client";
  const parts = trimmed.split(/\s+/);
  const firstName = parts[0] || "Guest";
  const lastName = parts.slice(1).join(" ") || "Client";
  return { customerName: trimmed, firstName, lastName };
}

export async function createDirectBooking(
  input: CreateDirectBookingInput
): Promise<CreateDirectBookingResult> {
  const {
    salonId,
    serviceIds,
    staffId,
    bookingDate,
    timeSlot,
    customerDetails,
    paymentMethod,
    paymentDetails,
    promotionPackageId,
    promotionPackagePrice,
  } = input;

  if (!salonId || !bookingDate || !timeSlot || serviceIds.length === 0) {
    return { success: false, error: "Missing required booking details." };
  }

  if (!customerDetails.fullName?.trim() || !customerDetails.phone?.trim()) {
    return { success: false, error: "Name and phone are required." };
  }

  try {
    const supabase = createSupabaseAdminClient();
    const customerEmail = (customerDetails.email || "guest@trimma.com").trim().toLowerCase();
    const { customerName } = splitCustomerName(customerDetails.fullName);

    const { data: existingUser } = await supabase
      .from("users")
      .select("email")
      .eq("email", customerEmail)
      .maybeSingle();

    if (!existingUser) {
      const { error: userInsertError } = await supabase.from("users").insert({
        email: customerEmail,
        full_name: customerName,
        phone: customerDetails.phone,
        global_role: "customer",
      });
      if (userInsertError) throw new Error(userInsertError.message);
    } else {
      const { error: userUpdateError } = await supabase
        .from("users")
        .update({ full_name: customerName, phone: customerDetails.phone })
        .eq("email", customerEmail);
      if (userUpdateError) throw new Error(userUpdateError.message);
    }

    const isPromotion = Boolean(promotionPackageId && promotionPackagePrice != null);
    let processedServices: Array<{ id: string; name: string; price: number; duration: number }> = [];

    if (isPromotion) {
      const primaryId = serviceIds[0];
      let resolvedPrimaryId = primaryId;
      if (!resolvedPrimaryId) {
        const { data: activeServices } = await supabase
          .from("services")
          .select("id, global_service_id, status")
          .eq("salon_id", salonId)
          .eq("status", "active");
        const { data: salonStaffRows } = await supabase
          .from("salon_staff")
          .select("id, status, working_hours")
          .eq("salon_id", salonId);
        const covered = filterServicesWithStaffCoverage(activeServices || [], salonStaffRows || []);
        resolvedPrimaryId = covered[0]?.id;
        if (!resolvedPrimaryId) {
          return { success: false, error: "No staff-mapped active services for this promotion booking." };
        }
      }
      const duration = 60;
      processedServices = [
        {
          id: resolvedPrimaryId,
          name: "Promotion package",
          price: Number(promotionPackagePrice),
          duration,
        },
      ];
    } else {
      const { data: servicesData, error: svcError } = await supabase
        .from("services")
        .select("*")
        .in("id", serviceIds);

      if (svcError || !servicesData?.length) {
        return { success: false, error: "Invalid service selection." };
      }

      let customRates: Array<{
        service_id: string;
        custom_price: number | string;
        custom_duration_min: number | string;
      }> = [];

      if (staffId && staffId !== "any") {
        const { data: cRates } = await supabase
          .from("service_durations")
          .select("*")
          .eq("staff_id", staffId)
          .in("service_id", serviceIds);
        if (cRates) customRates = cRates;
      }

      processedServices = servicesData.map((s) => {
        const custom = customRates.find((r) => r.service_id === s.id);
        let price = parseFloat(String(s.price || 0));
        let duration = parseInt(String(s.duration || s.duration_min || 30), 10);

        if (custom) {
          price = parseFloat(String(custom.custom_price));
          duration = parseInt(String(custom.custom_duration_min), 10);
        } else if (isServiceDiscountActive(s)) {
          price = getDiscountedServicePrice(s);
        }

        return { id: s.id, name: s.name || "Service", price, duration };
      });
    }

    const basePrice = processedServices.reduce((sum, s) => sum + s.price, 0);
    const totalDuration = processedServices.reduce((sum, s) => sum + s.duration, 0);
    const serviceTotal = basePrice;

    const globalRates = await fetchBookingCommissionRates();
    const { data: salonData } = await supabase
      .from("salons")
      .select(
        "onboarding_agent_email, assign_to, is_verified, business_info_extended, bank_info, name, phone, address"
      )
      .eq("id", salonId)
      .single();

    const depositPercent = getReservationDepositPercentForSalon(salonData || undefined);
    const pricing = calculateCommissionSplit(serviceTotal, globalRates, depositPercent);
    const reservationFee = pricing.reservationFee;

    let agentEmail: string | null = null;
    let fieldAgentEmail: string | null = null;
    let agentCommissionPct = 0;
    let agentCommissionAmount = 0;
    let agentSplitSnapshot = {
      field_agent_commission_amount: 0,
      regional_head_commission_amount: 0,
      agent_split_percent: 0,
    };

    const attribution = await resolveAgentCommissionAttribution(supabase, salonData);
    if (attribution.payeeEmail) {
      agentEmail = attribution.payeeEmail;
      fieldAgentEmail = attribution.fieldAgentEmail;
      agentCommissionPct = resolveBookingAgentPercentage(globalRates.agent);
      agentCommissionAmount = pricing.platformCommission * (agentCommissionPct / 100);
      agentSplitSnapshot = computeAgentCommissionSnapshot(agentCommissionAmount, attribution);
    }

    const formattedTime = parseDisplayTimeSlot(timeSlot);
    const hh = parseInt(formattedTime.split(":")[0], 10);
    const mm = parseInt(formattedTime.split(":")[1], 10);

    const { data: salonStaff } = await supabase
      .from("salon_staff")
      .select("id, working_hours")
      .eq("salon_id", salonId);

    const qualifiedStaff = assertQualifiedStaffForServices(
      salonStaff || [],
      processedServices.map((service) => service.id)
    );
    const staffIds = qualifiedStaff.map((member) => member.id).filter(Boolean);

    const { data: existingBookings } = await supabase
      .from("bookings")
      .select("id, booking_time, staff_id, status, created_at, customer_email, service_id")
      .eq("salon_id", salonId)
      .eq("booking_date", bookingDate);

    const bookings = await enrichBookingsWithDurations(supabase, existingBookings || []);

    const resolvedStaffId = resolveStaffForBookingSlot({
      bookings,
      staffIds,
      preferredStaffId: staffId,
      formattedTime,
      proposedDurationMinutes: totalDuration,
    });

    const { data: staffProfile } = await supabase
      .from("salon_staff")
      .select("id, name, commission_rate, working_hours")
      .eq("id", resolvedStaffId)
      .maybeSingle();

    const staffCommission = staffProfile
      ? computeBookingStaffCommission(
          staffProfile,
          {
            amount: serviceTotal,
            service_id: processedServices[0]?.id || null,
            booking_services: processedServices.map((service) => ({
              service_id: service.id,
              price: service.price,
            })),
          },
          staffProfile ? [staffProfile] : []
        )
      : null;

    const bookingNo = `TRM-${Math.floor(100000 + Math.random() * 900000)}`;
    const isPaid = paymentMethod === "paypal";

    const { data: newBooking } = await insertBookingRecord(supabase, {
      booking_no: bookingNo,
      salon_id: salonId,
      customer_email: customerEmail,
      service_id: processedServices[0]?.id || null,
      staff_id: resolvedStaffId,
      booking_date: bookingDate,
      booking_time: formattedTime,
      amount: serviceTotal,
      status: isPaid ? "confirmed" : "pending",
      payment_status: isPaid ? "reservation_paid" : "unpaid",
      reservation_fee_paid: isPaid,
      reservation_fee_refundable: false,
      total_reservation_fee: reservationFee,
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
      promotion_package_id: promotionPackageId || null,
    });

    await supabase.from("booking_services").insert(
      processedServices.map((s) => ({
        booking_id: newBooking.id,
        service_id: s.id,
        price: s.price,
        duration_min: s.duration,
      }))
    );

    await supabase.from("booking_staff").insert(
      processedServices.map((s) => ({
        booking_id: newBooking.id,
        staff_id: resolvedStaffId,
        service_id: s.id,
      }))
    );

    const { data: salonResources } = await supabase
      .from("resources")
      .select("id")
      .eq("salon_id", salonId);

    if (salonResources?.length) {
      const startMin = hh * 60 + mm;
      const endMin = startMin + totalDuration;
      const endH = Math.floor(endMin / 60);
      const endM = endMin % 60;
      const formattedEndTime = `${endH.toString().padStart(2, "0")}:${endM.toString().padStart(2, "0")}:00`;

      await supabase.from("resource_bookings").insert(
        salonResources.map((res) => ({
          booking_id: newBooking.id,
          resource_id: res.id,
          booking_date: bookingDate,
          start_time: formattedTime,
          end_time: formattedEndTime,
        }))
      );
    }

    if (paymentDetails && isPaid) {
      await supabase.from("payments").insert({
        booking_id: newBooking.id,
        salon_id: salonId,
        provider: "paypal",
        provider_payment_id: String(paymentDetails.id || "N/A"),
        amount: reservationFee,
        currency: "LKR",
        status: "completed",
        raw_response: paymentDetails,
      });
    }

    try {
      let staffName: string | null = null;
      if (resolvedStaffId) {
        const { data: staffRow } = await supabase
          .from("salon_staff")
          .select("name")
          .eq("id", resolvedStaffId)
          .maybeSingle();
        staffName = staffRow?.name || null;
      }

      void createBookingPendingConfirmNotification(supabase, {
        salonId,
        bookingId: newBooking.id,
        bookingNo,
        customerEmail,
        customerName,
        bookingDate,
        bookingTime: formattedTime,
        amount: serviceTotal,
        serviceName: processedServices.map((s) => s.name).join(", "),
        staffName,
        paymentStatus: isPaid ? "reservation_paid" : "unpaid",
      });

      if (isPaid) {
        void sendWhatsAppNotification(bookingNo);
        void notifyOwnerPaidBookingRequest(supabase, bookingNo, "reservation_paid");
      }
    } catch {
      // Non-blocking
    }

    return {
      success: true,
      booking_id: newBooking.id,
      booking_no: bookingNo,
      status: newBooking.status,
      total_price: serviceTotal,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Booking failed.";
    return { success: false, error: message };
  }
}
