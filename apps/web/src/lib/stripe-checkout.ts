import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { getStripeServerClient } from "@/lib/stripe-client";
import { loadStripeGatewaySettings, toStripeAmountLkr } from "@/lib/stripe-settings";

export type StripeCheckoutType = "booking" | "subscription";

export async function createStripePaymentIntent(input: {
  checkoutType: StripeCheckoutType;
  amount: number;
  description: string;
  customerEmail: string;
  payload: Record<string, unknown>;
}) {
  const settings = await loadStripeGatewaySettings();
  if (!settings.enabled) {
    throw new Error("Stripe payments are disabled.");
  }
  if (!settings.secretKey || !settings.publishableKey) {
    throw new Error("Stripe keys are not configured.");
  }

  const supabase = createSupabaseAdminClient();
  const { data: pending, error: pendingError } = await supabase
    .from("stripe_checkout_pending")
    .insert({
      checkout_type: input.checkoutType,
      payload: input.payload,
      status: "pending",
    })
    .select("id")
    .single();

  if (pendingError || !pending) {
    if (
      pendingError?.message.toLowerCase().includes("does not exist") ||
      pendingError?.message.toLowerCase().includes("schema cache")
    ) {
      throw new Error(
        "Stripe checkout table is missing. Run packages/db/STRIPE_PAYMENT_PATCH.sql in Supabase."
      );
    }
    throw new Error(pendingError?.message || "Failed to start checkout.");
  }

  const stripe = await getStripeServerClient();

  const paymentIntent = await stripe.paymentIntents.create({
    amount: toStripeAmountLkr(input.amount),
    currency: "lkr",
    description: input.description,
    ...(input.customerEmail ? { receipt_email: input.customerEmail } : {}),
    automatic_payment_methods: { enabled: true },
    metadata: {
      pending_id: pending.id,
      checkout_type: input.checkoutType,
      environment: settings.environment,
    },
  });

  if (!paymentIntent.client_secret) {
    throw new Error("Stripe did not return a payment intent.");
  }

  await supabase
    .from("stripe_checkout_pending")
    .update({ stripe_session_id: paymentIntent.id })
    .eq("id", pending.id);

  return {
    clientSecret: paymentIntent.client_secret,
    publishableKey: settings.publishableKey,
    paymentIntentId: paymentIntent.id,
    pendingId: pending.id,
    environment: settings.environment,
  };
}

export async function updateStripePendingPayload(
  pendingId: string,
  payload: Record<string, unknown>
) {
  const supabase = createSupabaseAdminClient();
  const { data: existing, error: readError } = await supabase
    .from("stripe_checkout_pending")
    .select("payload, status")
    .eq("id", pendingId)
    .maybeSingle();

  if (readError) throw new Error(readError.message);
  if (!existing) throw new Error("Checkout session not found.");
  if (existing.status !== "pending") return;

  const mergedPayload = {
    ...((existing.payload as Record<string, unknown> | null) || {}),
    ...payload,
  };

  const { error } = await supabase
    .from("stripe_checkout_pending")
    .update({ payload: mergedPayload })
    .eq("id", pendingId);

  if (error) throw new Error(error.message);
}

export async function loadStripePendingCheckout(paymentIntentId: string) {
  const stripe = await getStripeServerClient();
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  if (paymentIntent.status !== "succeeded") {
    throw new Error("Payment has not been completed yet.");
  }

  const pendingId = paymentIntent.metadata?.pending_id;
  if (!pendingId) {
    throw new Error("Payment is missing checkout metadata.");
  }

  const supabase = createSupabaseAdminClient();
  const { data: pending, error } = await supabase
    .from("stripe_checkout_pending")
    .select("*")
    .eq("id", pendingId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!pending) throw new Error("Checkout session expired or not found.");
  if (pending.status === "completed") {
    return { paymentIntent, pending, alreadyCompleted: true as const };
  }

  return { paymentIntent, pending, alreadyCompleted: false as const };
}

export async function markStripePendingCompleted(
  pendingId: string,
  resultPayload?: Record<string, unknown>
) {
  const supabase = createSupabaseAdminClient();
  const { data: existing } = await supabase
    .from("stripe_checkout_pending")
    .select("payload")
    .eq("id", pendingId)
    .maybeSingle();

  const mergedPayload = {
    ...((existing?.payload as Record<string, unknown> | null) || {}),
    ...(resultPayload || {}),
  };

  await supabase
    .from("stripe_checkout_pending")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      payload: mergedPayload,
    })
    .eq("id", pendingId);
}
