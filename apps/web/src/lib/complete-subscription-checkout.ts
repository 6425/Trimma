import { processBookingCardPayment } from "@/app/actions/booking-checkout";
import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { requireSalonOwnerFromCookies } from "@/lib/server-salon-auth";
import { resolveAgentCommissionAttribution } from "@/lib/agent-hierarchy";
import { validateSubscriptionCheckoutPrice } from "@/lib/checkout-price-validation";
import { runSubscriptionCheckoutNotifications } from "@/lib/subscription-checkout-notifications";
import type { CardType } from "@/lib/card-payment";

export type CompleteSubscriptionCheckoutInput = {
  planName: string;
  billingCycle: "monthly" | "annual";
  chargeAmount: number;
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
};

function createSubscriptionOrderId() {
  return `SUB-${Math.floor(100000 + Math.random() * 900000)}`;
}

/**
 * Best-effort: when a referred salon pays a subscription, record the referring
 * agent's commission in commission_ledger (commission_category = 'subscription').
 *
 * This never throws — a missing SUBSCRIPTION_COMMISSION_PATCH (no salon_id /
 * commission_category columns, or a NOT NULL lead_id) must not fail the payment.
 */
async function recordSubscriptionCommission(params: {
  supabase: ReturnType<typeof createSupabaseAdminClient>;
  salonId: string;
  baseAmount: number;
  orderId: string;
  planName: string;
  billingCycle: "monthly" | "annual";
}) {
  const { supabase, salonId, baseAmount, orderId, planName, billingCycle } = params;
  try {
    const { data: salon } = await supabase
      .from("salons")
      .select("onboarding_agent_email, assign_to")
      .eq("id", salonId)
      .maybeSingle();

    const attribution = await resolveAgentCommissionAttribution(supabase, salon);
    if (!attribution.payeeEmail) return;

    const { data: master } = await supabase
      .from("commission_master")
      .select("agent_percentage")
      .eq("commission_type", "subscription")
      .eq("active", true)
      .maybeSingle();

    const agentPercent = Number(master?.agent_percentage) || 20;
    const amount = Math.round(baseAmount * (agentPercent / 100) * 100) / 100;

    const { error } = await supabase.from("commission_ledger").insert({
      agent_email: attribution.payeeEmail,
      field_agent_email: attribution.fieldAgentEmail,
      salon_id: salonId,
      commission_category: "subscription",
      base_amount: baseAmount,
      agent_percent: agentPercent,
      amount,
      status: "PENDING",
      notes: attribution.fieldAgentEmail
        ? `Subscription commission: ${planName} (${billingCycle}) payment ${orderId}. Field agent: ${attribution.fieldAgentEmail} (${attribution.splitPercent}% split).`
        : `Subscription commission: ${planName} (${billingCycle}) payment ${orderId}.`,
    });

    if (error) {
      console.warn(
        "[recordSubscriptionCommission] Ledger insert skipped:",
        error.message,
        "— ensure SUBSCRIPTION_COMMISSION_PATCH.sql is applied."
      );
    }
  } catch (err) {
    console.warn(
      "[recordSubscriptionCommission] Unexpected error (non-fatal):",
      err instanceof Error ? err.message : err
    );
  }
}

export async function completeSubscriptionCheckout(input: CompleteSubscriptionCheckoutInput) {
  const auth = await requireSalonOwnerFromCookies();
  if ("error" in auth) {
    throw new Error(auth.error);
  }

  const validated = await validateSubscriptionCheckoutPrice({
    planName: input.planName,
    billingCycle: input.billingCycle,
    chargeAmount: input.chargeAmount,
  });

  const chargeAmount = validated.chargeAmount;

  const supabase = createSupabaseAdminClient();
  const { data: plan, error: planError } = await supabase
    .from("subscription_plans")
    .select("id, name")
    .eq("id", validated.plan.id)
    .maybeSingle();

  if (planError) throw new Error(planError.message);
  if (!plan?.id) throw new Error("Subscription plan not found.");

  const orderId = createSubscriptionOrderId();

  const { data: paymentRow, error: paymentInsertError } = await supabase
    .from("payments")
    .insert({
      salon_id: auth.salonId,
      provider: input.stripePayment ? "stripe" : "payhere",
      amount: chargeAmount,
      currency: "LKR",
      status: "pending",
      raw_response: {
        type: "subscription",
        plan_name: plan.name,
        billing_cycle: input.billingCycle,
        order_id: orderId,
      },
    })
    .select("id")
    .single();

  if (paymentInsertError || !paymentRow) {
    throw new Error(paymentInsertError?.message || "Failed to create payment record.");
  }

  const paymentResult = input.stripePayment
    ? {
        success: true,
        paymentId: input.stripePayment.paymentId,
        last4: null as string | null,
        provider: "stripe" as const,
        amount: Number(chargeAmount.toFixed(2)),
      }
    : await processBookingCardPayment({
        cardType: input.card!.cardType,
        cardNumber: input.card!.cardNumber,
        expiry: input.card!.expiry,
        cvv: input.card!.cvv,
        cardholderName: input.card!.cardholderName,
        amount: chargeAmount,
        bookingNo: orderId,
        environment: input.payhereEnvironment,
      });

  const { error: paymentUpdateError } = await supabase
    .from("payments")
    .update({
      status: "success",
      payment_id: paymentResult.paymentId,
      provider_payment_id: paymentResult.paymentId,
      raw_response: {
        type: "subscription",
        plan_name: plan.name,
        billing_cycle: input.billingCycle,
        order_id: orderId,
        provider: paymentResult.provider,
        last4: paymentResult.last4,
        card_type: input.card?.cardType || null,
        environment: input.stripePayment?.environment || input.payhereEnvironment,
        stripe_session_id: input.stripePayment?.paymentId || null,
      },
    })
    .eq("id", paymentRow.id);

  if (paymentUpdateError) throw new Error(paymentUpdateError.message);

  const { error: salonUpdateError } = await supabase
    .from("salons")
    .update({ subscription_plan_id: plan.id })
    .eq("id", auth.salonId);

  if (salonUpdateError) throw new Error(salonUpdateError.message);

  await recordSubscriptionCommission({
    supabase,
    salonId: auth.salonId,
    baseAmount: chargeAmount,
    orderId,
    planName: plan.name as string,
    billingCycle: input.billingCycle,
  });

  const notificationResult = await runSubscriptionCheckoutNotifications({
    supabase,
    salonId: auth.salonId,
    planName: plan.name as string,
    billingCycle: input.billingCycle,
    chargeAmount,
    orderId,
  });

  if (!notificationResult.emailSent && notificationResult.emailError) {
    console.warn(
      "[completeSubscriptionCheckout] Owner email notification failed:",
      notificationResult.emailError
    );
  }
  if (!notificationResult.inAppSent && notificationResult.inAppError) {
    console.warn(
      "[completeSubscriptionCheckout] In-app notification failed:",
      notificationResult.inAppError
    );
  }

  return {
    success: true as const,
    orderId,
    planName: plan.name as string,
    paymentId: paymentResult.paymentId,
    emailSent: notificationResult.emailSent,
    emailError: notificationResult.emailError,
  };
}
