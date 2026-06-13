import Stripe from "stripe";
import { loadStripeGatewaySettings } from "@/lib/stripe-settings";

export async function getStripeServerClient(): Promise<Stripe> {
  const settings = await loadStripeGatewaySettings();
  if (!settings.secretKey) {
    throw new Error(
      "Stripe secret key is not configured. Add keys in Admin → Payments."
    );
  }

  return new Stripe(settings.secretKey);
}
