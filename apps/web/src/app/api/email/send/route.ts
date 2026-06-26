import { NextResponse } from "next/server";
import { sendTriggeredEmail } from "@/app/actions/email-settings";
import { isEmailSendFailure } from "@/lib/email/result";
import { buildEmailRateLimitKey, getClientIp } from "@/lib/email/rate-limit";
import { getEmailTriggerById, type EmailTriggerId } from "@/lib/email-templates";
import {
  requireStaffFromRequest,
  isRequestAuthError,
} from "@/lib/server-request-auth";

export async function POST(request: Request) {
  try {
    const auth = await requireStaffFromRequest(request);
    if (isRequestAuthError(auth)) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const triggerId = String(body.triggerId || body.template || "") as EmailTriggerId;
    const to = String(body.to || "").trim();
    const variables = body.variables;

    if (!getEmailTriggerById(triggerId)) {
      return NextResponse.json({ error: "Unsupported email trigger." }, { status: 400 });
    }

    if (!to) {
      return NextResponse.json({ error: "Recipient email is required." }, { status: 400 });
    }

    if (!variables || typeof variables !== "object") {
      return NextResponse.json({ error: "Template variables are required." }, { status: 400 });
    }

    const ip = getClientIp(request);
    const actorEmail = (auth.email || "staff").trim().toLowerCase();

    const result = await sendTriggeredEmail({
      triggerId,
      to,
      variables: variables as Record<string, string>,
      rateLimitKey: buildEmailRateLimitKey(ip, actorEmail),
      idempotencyKey: body.idempotencyKey,
    });

    if (isEmailSendFailure(result)) {
      const status = result.rateLimited ? 429 : result.skipped ? 400 : 500;
      return NextResponse.json(
        {
          error: result.error,
          retryAfterSec: result.retryAfterSec,
        },
        {
          status,
          headers: result.retryAfterSec
            ? { "Retry-After": String(result.retryAfterSec) }
            : undefined,
        }
      );
    }

    return NextResponse.json({ success: true, id: result.id });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Email dispatch failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
