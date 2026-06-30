import type { SupabaseClient } from "@supabase/supabase-js";
import { sendTriggeredEmail } from "@/app/actions/email-settings";
import { APP_BASE_URL } from "@/lib/email/config";
import { formatLkr } from "@/lib/subscription-pricing";
import {
  createSubscriptionUpgradedNotification,
  resolveSalonOwnerEmail,
} from "@/lib/salon-owner-notifications";

export type SubscriptionCheckoutNotificationInput = {
  supabase: SupabaseClient;
  salonId: string;
  planName: string;
  billingCycle: "monthly" | "annual";
  chargeAmount: number;
  orderId: string;
};

export type SubscriptionCheckoutNotificationResult = {
  emailSent: boolean;
  emailError: string | null;
  inAppSent: boolean;
  inAppError: string | null;
};

export async function runSubscriptionCheckoutNotifications(
  input: SubscriptionCheckoutNotificationInput
): Promise<SubscriptionCheckoutNotificationResult> {
  const { supabase, salonId, planName, billingCycle, chargeAmount, orderId } = input;

  const [{ data: salonRow }, ownerEmail] = await Promise.all([
    supabase.from("salons").select("name").eq("id", salonId).maybeSingle(),
    resolveSalonOwnerEmail(supabase, salonId),
  ]);

  const salonName = (salonRow?.name as string | undefined) || "Your salon";
  const cycleLabel = billingCycle === "annual" ? "Annual" : "Monthly";
  const amountPaid = formatLkr(chargeAmount);
  const dashboardLink = `${APP_BASE_URL}/dashboard/billing`;

  let emailSent = false;
  let emailError: string | null = null;

  if (ownerEmail) {
    const emailResult = await sendTriggeredEmail({
      triggerId: "subscription-upgraded",
      to: ownerEmail,
      variables: {
        salon_name: salonName,
        plan_name: planName,
        billing_cycle: cycleLabel,
        amount_paid: amountPaid,
        order_id: orderId,
        dashboard_link: dashboardLink,
      },
      rateLimitKey: `subscription-upgraded:${orderId}`,
      idempotencyKey: `subscription-upgraded/${orderId}`,
    });

    if (emailResult.success) {
      emailSent = true;
    } else if (!emailResult.skipped) {
      emailError = emailResult.error || "Email could not be sent.";
    }
  } else {
    emailError = "Salon owner email not configured.";
  }

  const inAppResult = await createSubscriptionUpgradedNotification(supabase, {
    salonId,
    planName,
    billingCycle,
    amount: chargeAmount,
    orderId,
  });

  return {
    emailSent,
    emailError,
    inAppSent: inAppResult.success,
    inAppError: inAppResult.error ?? null,
  };
}
