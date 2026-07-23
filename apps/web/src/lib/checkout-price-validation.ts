import { createSupabaseAdminClient } from "@/config/supabase-admin";
import {
  calculateReservationFee,
  DEFAULT_BOOKING_PLATFORM_PERCENT,
  DEFAULT_BOOKING_SALON_PERCENT,
  getReservationDepositPercentForSalon,
  resolveBookingAgentPercentage,
  type BookingCommissionRates,
} from "@/lib/booking-pricing";
import { isActivePromotionPackage, mapSalonPromotionRows } from "@/lib/deals";
import { getCheckoutAmount, normalizePublicSubscriptionPlan, type SubscriptionPlanPricing } from "@/lib/subscription-pricing";
import { assertMinServicePrice } from "@/lib/service-pricing";

/** Allow minor rounding differences (LKR cents). */
export const CHECKOUT_PRICE_TOLERANCE = 0.02;

export type BookingCheckoutPriceDraft = {
  salonId: string;
  serviceIds?: string[];
  promotionPackageId?: string;
};

export type ValidatedBookingCheckoutPrices = {
  serviceTotal: number;
  reservationFee: number;
  depositPercent: number;
  rates: BookingCommissionRates & { agent: number };
  services: Array<{
    id: string;
    name?: string | null;
    price: number;
    duration?: number | string | null;
    duration_min?: number | string | null;
  }>;
};

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function assertPriceMatch(label: string, actual: number, expected: number): void {
  if (!Number.isFinite(actual) || actual <= 0) {
    throw new Error(`Invalid ${label}.`);
  }
  if (Math.abs(roundMoney(actual) - roundMoney(expected)) > CHECKOUT_PRICE_TOLERANCE) {
    throw new Error(`${label} does not match salon pricing. Please refresh checkout and try again.`);
  }
}

async function loadBookingCommissionRates(
  supabase: ReturnType<typeof createSupabaseAdminClient>
): Promise<BookingCommissionRates & { agent: number }> {
  const { data: ratesData } = await supabase
    .from("commission_master")
    .select("platform_percentage, salon_percentage, agent_percentage")
    .eq("commission_type", "booking")
    .eq("active", true)
    .maybeSingle();

  return {
    platform: Number(ratesData?.platform_percentage) || DEFAULT_BOOKING_PLATFORM_PERCENT,
    salon: Number(ratesData?.salon_percentage) || DEFAULT_BOOKING_SALON_PERCENT,
    agent: resolveBookingAgentPercentage(ratesData?.agent_percentage),
  };
}

/**
 * Recompute booking totals from the database and reject tampered client amounts.
 */
export async function validateBookingCheckoutPrices(input: {
  draft: BookingCheckoutPriceDraft;
  serviceTotal: number;
  reservationFee: number;
  rates?: Partial<BookingCommissionRates & { agent: number }>;
  services?: Array<{ id?: string; price?: number | string | null }>;
}): Promise<ValidatedBookingCheckoutPrices> {
  const supabase = createSupabaseAdminClient();
  const salonId = input.draft.salonId?.trim();

  if (!salonId) {
    throw new Error("Salon is required.");
  }

  const { data: salon, error: salonError } = await supabase
    .from("salons")
    .select("*")
    .eq("id", salonId)
    .maybeSingle();

  if (salonError) throw new Error(salonError.message);
  if (!salon) throw new Error("Salon not found.");

  const authoritativeRates = await loadBookingCommissionRates(supabase);

  if (input.rates) {
    assertPriceMatch("Platform commission rate", Number(input.rates.platform), authoritativeRates.platform);
    assertPriceMatch("Salon commission rate", Number(input.rates.salon), authoritativeRates.salon);
    assertPriceMatch("Agent commission rate", Number(input.rates.agent), authoritativeRates.agent);
  }

  let services: ValidatedBookingCheckoutPrices["services"] = [];
  let serviceTotal = 0;

  if (input.draft.promotionPackageId) {
    const { data: promotionRow, error: promotionError } = await supabase
      .from("salon_promotion_packages")
      .select("*")
      .eq("id", input.draft.promotionPackageId)
      .eq("salon_id", salonId)
      .maybeSingle();

    if (promotionError) throw new Error(promotionError.message);
    if (!promotionRow) throw new Error("Promotion package not found.");

    const [promotion] = mapSalonPromotionRows([promotionRow]);
    if (!promotion || !isActivePromotionPackage(promotion)) {
      throw new Error("This promotion is no longer available.");
    }

    serviceTotal = roundMoney(promotion.package_price);
    if (serviceTotal <= 0) {
      throw new Error("Invalid promotion price.");
    }
    assertMinServicePrice(serviceTotal);

    const primaryServiceId = input.draft.serviceIds?.[0] || null;
    if (primaryServiceId) {
      const { data: serviceRow } = await supabase
        .from("services")
        .select("id, name, price, duration_min")
        .eq("id", primaryServiceId)
        .eq("salon_id", salonId)
        .eq("status", "active")
        .maybeSingle();

      if (serviceRow) {
        services = [
          {
            id: serviceRow.id,
            name: serviceRow.name,
            price: serviceTotal,
            duration_min: serviceRow.duration_min,
          },
        ];
      }
    }

    if (services.length === 0) {
      services = [
        {
          id: primaryServiceId || promotion.id,
          name: promotion.name,
          price: serviceTotal,
          duration_min: 30,
        },
      ];
    }
  } else {
    const serviceIds = (input.draft.serviceIds || []).filter(Boolean);
    if (serviceIds.length === 0) {
      throw new Error("At least one service is required.");
    }

    const { data: serviceRows, error: servicesError } = await supabase
      .from("services")
      .select("id, name, price, duration_min, status")
      .eq("salon_id", salonId)
      .in("id", serviceIds);

    if (servicesError) throw new Error(servicesError.message);

    const activeRows = (serviceRows || []).filter(
      (row) => String(row.status || "").toLowerCase() === "active"
    );

    if (activeRows.length !== serviceIds.length) {
      throw new Error("One or more selected services are unavailable.");
    }

    services = activeRows.map((row) => ({
      id: row.id,
      name: row.name,
      price: roundMoney(parseFloat(String(row.price || 0))),
      duration_min: row.duration_min,
    }));

    for (const service of services) {
      assertMinServicePrice(service.price);
    }

    serviceTotal = roundMoney(
      services.reduce((sum, service) => sum + service.price, 0)
    );

    if (serviceTotal <= 0) {
      throw new Error("Invalid service total.");
    }

    if (input.services?.length) {
      for (const clientService of input.services) {
        const authoritative = services.find((service) => service.id === clientService.id);
        if (!authoritative) continue;
        assertPriceMatch(
          `Service price (${authoritative.name || authoritative.id})`,
          parseFloat(String(clientService.price || 0)),
          authoritative.price
        );
      }
    }
  }

  assertPriceMatch("Service total", input.serviceTotal, serviceTotal);

  const depositPercent = getReservationDepositPercentForSalon(salon);
  const reservationFee = roundMoney(calculateReservationFee(serviceTotal, depositPercent));
  assertPriceMatch("Reservation fee", input.reservationFee, reservationFee);

  return {
    serviceTotal,
    reservationFee,
    depositPercent,
    rates: authoritativeRates,
    services,
  };
}

/**
 * Validate subscription checkout charge against subscription_plans row.
 */
export async function validateSubscriptionCheckoutPrice(input: {
  planName: string;
  billingCycle: "monthly" | "annual";
  chargeAmount: number;
}): Promise<{ plan: SubscriptionPlanPricing & { id: string; name: string }; chargeAmount: number }> {
  const rawPlanName = input.planName?.trim();
  if (!rawPlanName) {
    throw new Error("Subscription plan is required.");
  }
  // Legacy Free slug → Beginner (paid entry tier).
  const planName = rawPlanName.toLowerCase() === "free" ? "Beginner" : rawPlanName;

  const supabase = createSupabaseAdminClient();
  let { data: planRow, error } = await supabase
    .from("subscription_plans")
    .select(
      "id, name, monthly_price, list_monthly_price, intro_monthly_price, annual_price, discount_percentage"
    )
    .ilike("name", planName)
    .maybeSingle();

  if (error) throw new Error(error.message);

  // Stale DB may still use name Free for the entry tier.
  if (!planRow?.id && planName.toLowerCase() === "beginner") {
    const freeRes = await supabase
      .from("subscription_plans")
      .select(
        "id, name, monthly_price, list_monthly_price, intro_monthly_price, annual_price, discount_percentage"
      )
      .ilike("name", "Free")
      .maybeSingle();
    if (freeRes.error) throw new Error(freeRes.error.message);
    planRow = freeRes.data;
  }

  if (!planRow?.id) throw new Error("Subscription plan not found.");

  const plan = normalizePublicSubscriptionPlan(
    planRow as SubscriptionPlanPricing & { id: string; name: string }
  );
  const expectedAmount = roundMoney(getCheckoutAmount(plan, input.billingCycle));

  if (expectedAmount <= 0) {
    throw new Error("This plan cannot be purchased online.");
  }

  assertPriceMatch("Subscription charge", input.chargeAmount, expectedAmount);

  return { plan, chargeAmount: expectedAmount };
}
