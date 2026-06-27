import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { checkCheckoutRateLimit } from "@/lib/checkout-rate-limit";
import { getClientIp } from "@/lib/email/rate-limit";
import { requireSalonOwnerFromCookies } from "@/lib/server-salon-auth";
import { updateStripePendingPayload } from "@/lib/stripe-checkout";
import { verifyStripePendingToken } from "@/lib/stripe-pending-token";

const BOOKING_PENDING_KEYS = new Set([
  "draft",
  "customer",
  "reservationFee",
  "serviceTotal",
  "rates",
  "salon",
  "services",
  "staffMemberId",
  "totalDuration",
]);

const SUBSCRIPTION_PENDING_KEYS = new Set([
  "planName",
  "billingCycle",
  "chargeAmount",
  "customer",
]);

function pickAllowedPayload(
  payload: Record<string, unknown>,
  allowedKeys: Set<string>
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(payload).filter(([key]) => allowedKeys.has(key))
  );
}

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);
    const rateLimit = await checkCheckoutRateLimit(clientIp);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please wait and try again." },
        {
          status: 429,
          headers: rateLimit.retryAfterSec
            ? { "Retry-After": String(rateLimit.retryAfterSec) }
            : undefined,
        }
      );
    }

    const body = await request.json();
    const pendingId = String(body.pendingId || "").trim();
    const pendingToken = String(body.pendingToken || "").trim();

    if (!pendingId) {
      return NextResponse.json({ error: "Missing pending checkout id." }, { status: 400 });
    }

    if (!verifyStripePendingToken(pendingId, pendingToken)) {
      return NextResponse.json({ error: "Invalid checkout session." }, { status: 403 });
    }

    const supabase = createSupabaseAdminClient();
    const { data: pending, error: pendingError } = await supabase
      .from("stripe_checkout_pending")
      .select("checkout_type, status")
      .eq("id", pendingId)
      .maybeSingle();

    if (pendingError) {
      return NextResponse.json({ error: pendingError.message }, { status: 500 });
    }

    if (!pending) {
      return NextResponse.json({ error: "Checkout session not found." }, { status: 404 });
    }

    if (pending.status !== "pending") {
      return NextResponse.json({ error: "Checkout session is no longer editable." }, { status: 400 });
    }

    const { pendingId: _ignored, pendingToken: _tokenIgnored, ...rawPayload } = body;

    if (pending.checkout_type === "subscription") {
      const ownerAuth = await requireSalonOwnerFromCookies();
      if ("error" in ownerAuth) {
        return NextResponse.json({ error: ownerAuth.error }, { status: 401 });
      }
    }

    const allowedKeys =
      pending.checkout_type === "subscription"
        ? SUBSCRIPTION_PENDING_KEYS
        : BOOKING_PENDING_KEYS;

    const payload = pickAllowedPayload(rawPayload as Record<string, unknown>, allowedKeys);
    await updateStripePendingPayload(pendingId, payload);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[stripe/update-pending]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update checkout details." },
      { status: 500 }
    );
  }
}
