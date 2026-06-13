import Stripe from "stripe";
import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { APP_BASE_URL } from "@/lib/email/config";
import { getStripeServerClient } from "@/lib/stripe-client";
import { loadStripeGatewaySettings, toStripeAmountLkr } from "@/lib/stripe-settings";

export type StripeCheckoutType = "booking" | "subscription";

export async function createStripeEmbeddedSession(input: {
  checkoutType: StripeCheckoutType;
  amount: number;
  description: string;
  customerEmail: string;
  payload: Record<string, unknown>;
  returnPath: string;
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
  const returnUrl = `${APP_BASE_URL}${input.returnPath}?session_id={CHECKOUT_SESSION_ID}`;

  const session = await stripe.checkout.sessions.create({
    ui_mode: "embedded",
    mode: "payment",
    customer_email: input.customerEmail,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "lkr",
          unit_amount: toStripeAmountLkr(input.amount),
          product_data: {
            name: input.description,
          },
        },
      },
    ],
    metadata: {
      pending_id: pending.id,
      checkout_type: input.checkoutType,
      environment: settings.environment,
    },
    return_url: returnUrl,
  } as unknown as Stripe.Checkout.SessionCreateParams);

  if (!session.client_secret) {
    throw new Error("Stripe did not return a checkout session.");
  }

  await supabase
    .from("stripe_checkout_pending")
    .update({ stripe_session_id: session.id })
    .eq("id", pending.id);

  return {
    clientSecret: session.client_secret,
    publishableKey: settings.publishableKey,
    sessionId: session.id,
    environment: settings.environment,
  };
}

export async function loadStripePendingCheckout(sessionId: string) {
  const stripe = await getStripeServerClient();
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.payment_status !== "paid") {
    throw new Error("Payment has not been completed yet.");
  }

  const pendingId = session.metadata?.pending_id;
  if (!pendingId) {
    throw new Error("Checkout session is missing metadata.");
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
    return { session, pending, alreadyCompleted: true as const };
  }

  return { session, pending, alreadyCompleted: false as const };
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
