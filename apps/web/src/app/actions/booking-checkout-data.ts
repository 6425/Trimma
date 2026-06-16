"use server";

import { createSupabaseAdminClient } from "@/config/supabase-admin";
import {
  parseDisplayTimeSlot,
  resolveStaffForBookingSlot,
  SLOT_UNAVAILABLE_MESSAGE,
} from "@/lib/booking-availability";
import { enrichBookingsWithDurations } from "@/lib/booking-conflict-data";
import { filterStaffQualifiedForServices } from "@/lib/staff-allocation";
import {
  buildPromotionCheckoutService,
  resolvePromotionBookingServices,
} from "@/lib/promotion-booking";
import { mapSalonPromotionRows } from "@/lib/deals";
import { calculateReservationFee, resolveBookingAgentPercentage } from "@/lib/booking-pricing";
import { resolveStripeKeys } from "@/lib/stripe-env";
import { buildBookingStripePayload, type BookingStripeCustomer } from "@/lib/booking-stripe-session";
import { createStripePaymentIntent } from "@/lib/stripe-checkout";

export type CheckoutDataInput = {
  salonId: string;
  serviceIds?: string[];
  staffId?: string;
  bookingDate: string;
  timeSlot: string;
  promotionPackageId?: string;
  promotionPackageName?: string;
  promotionPackagePrice?: number;
  promotionPackageIncludedServices?: string[];
  customer?: BookingStripeCustomer;
};

export type CheckoutDataResult =
  | {
      success: true;
      salon: Record<string, unknown>;
      services: any[];
      staffMember: Record<string, unknown> | null;
      reservationFee: number;
      serviceTotal: number;
      rates: { platform: number; salon: number; agent: number };
      resolvedServiceIds: string[];
      stripeEnabled: boolean;
      stripeEnvironment: string;
      stripePublishableKey: string | null;
      stripeClientSecret: string | null;
      stripePendingId: string | null;
      stripeSessionError: string | null;
    }
  | { success: false; missingDraft?: boolean; error: string };

/**
 * Server-side checkout data loader. The browser cannot reliably run these
 * Supabase queries on production (they hang), so the checkout page calls this.
 */
export async function fetchBookingCheckoutData(
  draft: CheckoutDataInput
): Promise<CheckoutDataResult> {
  const hasPromotion = Boolean(draft.promotionPackageId);
  const hasServices = Boolean(draft.serviceIds?.length);

  if (!draft.salonId || !draft.bookingDate || !draft.timeSlot || (!hasPromotion && !hasServices)) {
    return { success: false, missingDraft: true, error: "Incomplete booking details." };
  }

  try {
    const supabase = createSupabaseAdminClient();

    const [
      { data: salon },
      { data: servicesData },
      { data: promotionData },
      { data: salonServicesData },
      { data: ratesData },
      { data: paymentSettings },
    ] = await Promise.all([
      supabase.from("salons").select("*").eq("id", draft.salonId).maybeSingle(),
      hasServices
        ? supabase.from("services").select("*").in("id", draft.serviceIds!)
        : Promise.resolve({ data: [] as any[] }),
      hasPromotion
        ? supabase
            .from("salon_promotion_packages")
            .select("*")
            .eq("id", draft.promotionPackageId!)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      hasPromotion
        ? supabase.from("services").select("*").eq("salon_id", draft.salonId).eq("status", "active")
        : Promise.resolve({ data: [] as any[] }),
      supabase
        .from("commission_master")
        .select("*")
        .eq("commission_type", "booking")
        .eq("active", true)
        .maybeSingle(),
      supabase
        .from("global_payment_settings")
        .select("stripe_enabled, stripe_environment, stripe_publishable_key_sandbox, stripe_publishable_key_live")
        .eq("id", "00000000-0000-0000-0000-000000000001")
        .maybeSingle(),
    ]);

    let services = servicesData || [];
    let resolvedServiceIds = draft.serviceIds || [];
    let promotionPackage = promotionData ? mapSalonPromotionRows([promotionData])[0] || null : null;

    if (hasPromotion) {
      if (!promotionPackage) {
        promotionPackage = {
          id: draft.promotionPackageId!,
          name: draft.promotionPackageName || "Promotion Package",
          description: null,
          package_price: draft.promotionPackagePrice || 0,
          original_price: draft.promotionPackagePrice || 0,
          included_services: draft.promotionPackageIncludedServices || [],
          start_date: null,
          end_date: null,
          status: "active",
          promotion_type: null,
        } as any;
      }

      const salonServices = (salonServicesData || []).map((service: any) => ({
        id: service.id,
        name: service.name,
        duration: service.duration_min,
        duration_min: service.duration_min,
        price: service.price,
        description: service.description,
      }));

      const resolution = resolvePromotionBookingServices(promotionPackage, salonServices);
      resolvedServiceIds = resolution.serviceIds;
      services = [buildPromotionCheckoutService(promotionPackage, salonServices, resolution)];
    }

    if (!salon || !services.length) {
      return { success: false, missingDraft: true, error: "Salon or services not found." };
    }

    const proposedDuration =
      services.reduce(
        (sum, s) => sum + parseInt(String(s.duration || s.duration_min || "30"), 10),
        0
      ) || 30;
    const formattedTime = parseDisplayTimeSlot(draft.timeSlot);

    const [{ data: salonStaff }, { data: dayBookings }] = await Promise.all([
      supabase.from("salon_staff").select("id, working_hours").eq("salon_id", draft.salonId),
      supabase
        .from("bookings")
        .select("id, booking_time, staff_id, status, created_at, service_id")
        .eq("salon_id", draft.salonId)
        .eq("booking_date", draft.bookingDate),
    ]);

    const enrichedBookings = await enrichBookingsWithDurations(supabase, dayBookings || []);

    const qualifiedStaff = filterStaffQualifiedForServices(
      salonStaff || [],
      services.map((service) => service.id)
    );
    const staffIds = qualifiedStaff.map((member) => member.id).filter(Boolean);

    let resolvedStaffId: string;
    try {
      resolvedStaffId = resolveStaffForBookingSlot({
        bookings: enrichedBookings,
        staffIds,
        preferredStaffId: draft.staffId,
        formattedTime,
        proposedDurationMinutes: proposedDuration,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : SLOT_UNAVAILABLE_MESSAGE;
      return { success: false, error: message };
    }

    const { data: staffData } = await supabase
      .from("salon_staff")
      .select("*")
      .eq("id", resolvedStaffId)
      .maybeSingle();
    const staffMember: Record<string, unknown> | null = staffData;

    const rates = {
      platform: ratesData?.platform_percentage || 10,
      salon: ratesData?.salon_percentage || 10,
      agent: resolveBookingAgentPercentage(ratesData?.agent_percentage),
    };

    const serviceTotal =
      typeof draft.promotionPackagePrice === "number" && draft.promotionPackagePrice > 0
        ? draft.promotionPackagePrice
        : services.reduce((sum, service) => sum + parseFloat(service.price || 0), 0);
    const reservationFee = calculateReservationFee(serviceTotal);

    const stripeEnvironment =
      paymentSettings?.stripe_environment === "live" ? "live" : "sandbox";
    const stripeEnabled = paymentSettings?.stripe_enabled !== false;
    const stripeKeys = resolveStripeKeys(stripeEnvironment, paymentSettings || undefined);
    const totalDuration =
      services.reduce(
        (sum, service) => sum + parseInt(String(service.duration || service.duration_min || "30"), 10),
        0
      ) || 30;

    let stripeClientSecret: string | null = null;
    let stripePendingId: string | null = null;
    let stripeSessionError: string | null = null;

    if (stripeEnabled && stripeKeys.publishableKey && draft.customer?.email?.trim()) {
      try {
        const serviceLabel =
          draft.promotionPackageName ||
          services.map((service) => service.name).filter(Boolean).join(" + ") ||
          "Salon booking deposit";

        const stripePayload = buildBookingStripePayload({
          draft: {
            salonId: draft.salonId,
            serviceIds: resolvedServiceIds,
            staffId: draft.staffId || resolvedStaffId,
            bookingDate: draft.bookingDate,
            timeSlot: draft.timeSlot,
            promotionPackageId: draft.promotionPackageId,
            promotionPackageName: draft.promotionPackageName,
            promotionPackagePrice: draft.promotionPackagePrice,
            promotionPackageIncludedServices: draft.promotionPackageIncludedServices,
            customerDetails: {
              fullName: `${draft.customer.firstName} ${draft.customer.lastName}`.trim(),
              email: draft.customer.email,
              phone: draft.customer.phone,
            },
          },
          customer: draft.customer,
          reservationFee,
          serviceTotal,
          rates,
          salon: salon as Record<string, unknown>,
          services,
          staffMemberId: (staffMember?.id as string | null) || null,
          totalDuration,
        });

        const stripeSession = await createStripePaymentIntent({
          checkoutType: "booking",
          amount: reservationFee,
          description: `Trimma booking deposit — ${serviceLabel}`,
          customerEmail: draft.customer.email.trim(),
          payload: stripePayload,
        });

        stripeClientSecret = stripeSession.clientSecret;
        stripePendingId = stripeSession.pendingId;
      } catch (error) {
        stripeSessionError =
          error instanceof Error ? error.message : "Could not prepare Stripe checkout.";
        console.warn("[fetchBookingCheckoutData] Stripe session:", stripeSessionError);
      }
    }

    return {
      success: true,
      salon: salon as Record<string, unknown>,
      services,
      staffMember,
      reservationFee,
      serviceTotal,
      rates,
      resolvedServiceIds,
      stripeEnabled,
      stripeEnvironment,
      stripePublishableKey: stripeKeys.publishableKey,
      stripeClientSecret,
      stripePendingId,
      stripeSessionError,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not load checkout.";
    return { success: false, error: message };
  }
}
