import { processBookingCardPayment } from "@/app/actions/booking-checkout";
import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { requireSalonOwnerFromCookies } from "@/lib/server-salon-auth";
import { resolveReferringAgentEmail } from "@/lib/resolve-referring-agent";
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
  card: {
    cardType: CardType;
    cardNumber: string;
    expiry: string;
    cvv: string;
    cardholderName: string;
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

    const agentEmail = resolveReferringAgentEmail(salon);
    if (!agentEmail) return;

    const { data: master } = await supabase
      .from("commission_master")
      .select("agent_percentage")
      .eq("commission_type", "subscription")
      .eq("active", true)
      .maybeSingle();

    const agentPercent = Number(master?.agent_percentage) || 20;
    const amount = Math.round(baseAmount * (agentPercent / 100) * 100) / 100;

    const { error } = await supabase.from("commission_ledger").insert({
      agent_email: agentEmail,
      salon_id: salonId,
      commission_category: "subscription",
      base_amount: baseAmount,
      agent_percent: agentPercent,
      amount,
      status: "PENDING",
      notes: `Subscription commission: ${planName} (${billingCycle}) payment ${orderId}.`,
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

  const supabase = createSupabaseAdminClient();
  const { data: plan, error: planError } = await supabase
    .from("subscription_plans")
    .select("id, name")
    .ilike("name", input.planName.trim())
    .maybeSingle();

  if (planError) throw new Error(planError.message);
  if (!plan?.id) throw new Error("Subscription plan not found.");

  const orderId = createSubscriptionOrderId();

  const { data: paymentRow, error: paymentInsertError } = await supabase
    .from("payments")
    .insert({
      salon_id: auth.salonId,
      provider: "payhere",
      amount: input.chargeAmount,
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

  const paymentResult = await processBookingCardPayment({
    cardType: input.card.cardType,
    cardNumber: input.card.cardNumber,
    expiry: input.card.expiry,
    cvv: input.card.cvv,
    cardholderName: input.card.cardholderName,
    amount: input.chargeAmount,
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
        card_type: input.card.cardType,
        environment: input.payhereEnvironment,
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
    baseAmount: input.chargeAmount,
    orderId,
    planName: plan.name as string,
    billingCycle: input.billingCycle,
  });

  return {
    success: true as const,
    orderId,
    planName: plan.name as string,
    paymentId: paymentResult.paymentId,
  };
}
