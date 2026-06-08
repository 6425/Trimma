"use server";

import { createSupabaseAdminClient } from "@/config/supabase-admin";
import {
  parseDisplayTimeSlot,
  resolveAvailableStaffId,
  type BookingConflictRow,
} from "@/lib/booking-availability";
import {
  buildPromotionCheckoutService,
  resolvePromotionBookingServices,
} from "@/lib/promotion-booking";
import { mapSalonPromotionRows } from "@/lib/deals";
import { calculateReservationFee } from "@/lib/booking-pricing";

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
      payhereEnabled: boolean;
      payhereEnvironment: string;
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
        .select("payhere_enabled, environment")
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

    let staffMember: Record<string, unknown> | null = null;
    if (draft.staffId && draft.staffId !== "any") {
      const { data: staffData } = await supabase
        .from("salon_staff")
        .select("*")
        .eq("id", draft.staffId)
        .maybeSingle();
      staffMember = staffData;
    } else {
      const [{ data: staffList }, { data: dayBookings }] = await Promise.all([
        supabase.from("salon_staff").select("*").eq("salon_id", draft.salonId),
        supabase
          .from("bookings")
          .select("id, booking_time, staff_id, status, created_at")
          .eq("salon_id", draft.salonId)
          .eq("booking_date", draft.bookingDate),
      ]);

      // Fetch per-booking durations for overlap detection
      const dayBookingIds = (dayBookings || []).map((b) => b.id).filter(Boolean);
      const bookingDurations = new Map<string, number>();
      if (dayBookingIds.length > 0) {
        const { data: bsRows } = await supabase
          .from("booking_services")
          .select("booking_id, duration_min")
          .in("booking_id", dayBookingIds);
        if (bsRows) {
          for (const row of bsRows) {
            const dur = parseInt(String(row.duration_min || 0), 10);
            bookingDurations.set(row.booking_id, (bookingDurations.get(row.booking_id) || 0) + dur);
          }
        }
      }

      const enrichedBookings: BookingConflictRow[] = (dayBookings || []).map((b) => ({
        ...b,
        duration_minutes: bookingDurations.get(b.id) || 30,
      }));

      // Estimate proposed duration from services
      const proposedDuration = services.reduce(
        (sum, s) => sum + parseInt(String(s.duration || s.duration_min || "30"), 10),
        0
      ) || 30;

      const staffIds = (staffList || []).map((member) => member.id).filter(Boolean);
      const formattedTime = parseDisplayTimeSlot(draft.timeSlot);
      const availableStaffId = resolveAvailableStaffId(
        staffIds,
        enrichedBookings,
        formattedTime,
        proposedDuration
      );
      staffMember =
        staffList?.find((member) => member.id === availableStaffId) || staffList?.[0] || null;
    }

    const rates = {
      platform: ratesData?.platform_percentage || 10,
      salon: ratesData?.salon_percentage || 10,
      agent: ratesData?.agent_percentage || 20,
    };

    const serviceTotal =
      typeof draft.promotionPackagePrice === "number" && draft.promotionPackagePrice > 0
        ? draft.promotionPackagePrice
        : services.reduce((sum, service) => sum + parseFloat(service.price || 0), 0);
    const reservationFee = calculateReservationFee(serviceTotal);

    return {
      success: true,
      salon: salon as Record<string, unknown>,
      services,
      staffMember,
      reservationFee,
      serviceTotal,
      rates,
      resolvedServiceIds,
      payhereEnabled: paymentSettings?.payhere_enabled !== false,
      payhereEnvironment: paymentSettings?.environment || "sandbox",
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not load checkout.";
    return { success: false, error: message };
  }
}
