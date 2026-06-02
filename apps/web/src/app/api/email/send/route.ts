import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendTriggeredEmail } from "@/app/actions/email-settings";
import { isEmailSendFailure } from "@/lib/email/result";
import { buildEmailRateLimitKey, getClientIp } from "@/lib/email/rate-limit";
import { getEmailTriggerById, type EmailTriggerId } from "@/lib/email-templates";

function getAccessTokenFromCookie(request: Request) {
  const cookieHeader = request.headers.get("cookie") || "";
  
  let chunkedToken = "";
  for (let i = 0; i < 5; i++) {
    const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)sb-access-token\\.${i}=([^;]+)`));
    if (match) chunkedToken += match[1];
  }
  if (chunkedToken) return decodeURIComponent(chunkedToken);

  const match = cookieHeader.match(/(?:^|;\s*)sb-access-token=([^;]+)/);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

async function getRequestUserEmail(request: Request): Promise<string | null> {
  const token = getAccessTokenFromCookie(request);
  if (!token) return null;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) return null;

  const supabase = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user?.email) return null;
  return data.user.email.toLowerCase();
}

export async function POST(request: Request) {
  try {
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
    const sessionEmail = await getRequestUserEmail(request);
    const actorEmail = String(body.actorEmail || sessionEmail || "anonymous")
      .trim()
      .toLowerCase();

    if (!sessionEmail && !body.actorEmail) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

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
