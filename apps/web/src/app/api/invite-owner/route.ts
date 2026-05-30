import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendTriggeredEmail } from "@/app/actions/email-settings";
import { isEmailSendFailure } from "@/lib/email/result";
import { APP_BASE_URL } from "@/lib/email/config";
import { buildEmailRateLimitKey, getClientIp } from "@/lib/email/rate-limit";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

function getAccessTokenFromCookie(request: Request) {
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(/(?:^|;\s*)sb-access-token=([^;]+)/);
  return match?.[1] || null;
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
    const { salonId, ownerEmail, actorEmail: bodyActorEmail } = await request.json();
    const normalizedOwnerEmail = String(ownerEmail || "")
      .trim()
      .toLowerCase();

    if (!salonId || !normalizedOwnerEmail) {
      return NextResponse.json({ error: "Salon ID and Owner Email are required" }, { status: 400 });
    }

    const { data: salon, error: salonError } = await supabaseAdmin
      .from("salons")
      .select("id, name, slug")
      .eq("id", salonId)
      .maybeSingle();

    if (salonError) throw salonError;
    if (!salon) {
      return NextResponse.json({ error: "Salon not found." }, { status: 404 });
    }

    const sessionEmail = await getRequestUserEmail(request);
    const actorEmail = String(bodyActorEmail || sessionEmail || "system@trimma.io")
      .trim()
      .toLowerCase();

    const ip = getClientIp(request);
    const rateLimitKey = buildEmailRateLimitKey(ip, actorEmail);
    const loginLink = `${APP_BASE_URL}/login?email=${encodeURIComponent(normalizedOwnerEmail)}&next=${encodeURIComponent("/dashboard/profile")}`;

    const draftLink = `${APP_BASE_URL}/salons/${salon.slug || salonId}?preview=true`;

    const emailResult = await sendTriggeredEmail({
      triggerId: "onboarding",
      to: normalizedOwnerEmail,
      variables: {
        salon_name: salon.name || "your salon",
        owner_gmail: normalizedOwnerEmail,
        login_link: loginLink,
        draft_link: draftLink,
      },
      rateLimitKey,
      idempotencyKey: `owner-invite/${salonId}/${normalizedOwnerEmail}`,
    });

    if (isEmailSendFailure(emailResult) && !emailResult.skipped) {
      const status = emailResult.rateLimited ? 429 : 500;
      return NextResponse.json(
        {
          error: emailResult.error,
          retryAfterSec: emailResult.retryAfterSec,
        },
        {
          status,
          headers: emailResult.retryAfterSec
            ? { "Retry-After": String(emailResult.retryAfterSec) }
            : undefined,
        }
      );
    }

    const { error: updateError } = await supabaseAdmin
      .from("salons")
      .update({
        onboarding_status: "OWNER_INVITED",
        owner_invited_at: new Date().toISOString(),
        owner_gmail: normalizedOwnerEmail,
      })
      .eq("id", salonId);

    if (updateError) throw updateError;

    await supabaseAdmin.from("onboarding_logs").insert({
      salon_id: salonId,
      actor_email: actorEmail,
      action: "OWNER_INVITED",
      notes: `Owner invite email sent to ${normalizedOwnerEmail}${emailResult.success ? ` (Resend id: ${emailResult.id})` : " (email skipped/disabled)"}.`,
    });

    return NextResponse.json({
      success: true,
      message: "Owner successfully invited.",
      emailId: emailResult.success ? emailResult.id : null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Owner invitation failed.";
    console.error("Owner invitation failed:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
