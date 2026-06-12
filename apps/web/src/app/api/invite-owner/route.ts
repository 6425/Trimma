import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { sendTriggeredEmail } from "@/app/actions/email-settings";
import { sendOnboardingInviteAlert } from "@/app/actions/whatsapp";
import { assignSalonOwnerRoleByAdminClient } from "@/app/actions/admin-operations";
import { isEmailSendFailure } from "@/lib/email/result";
import { APP_BASE_URL } from "@/lib/email/config";
import { buildEmailRateLimitKey, getClientIp } from "@/lib/email/rate-limit";
import { requireAgentFromCookies } from "@/lib/server-agent-auth";
import { normalizeEmail } from "@/lib/normalize-email";

export async function POST(request: Request) {
  try {
    const auth = await requireAgentFromCookies();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const { salonId, ownerEmail } = await request.json();
    const normalizedOwnerEmail = String(ownerEmail || "")
      .trim()
      .toLowerCase();

    if (!salonId || !normalizedOwnerEmail) {
      return NextResponse.json({ error: "Salon ID and Owner Email are required" }, { status: 400 });
    }

    const supabaseAdmin = createSupabaseAdminClient();

    const { data: salon, error: salonError } = await supabaseAdmin
      .from("salons")
      .select("id, name, slug, phone, assign_to")
      .eq("id", salonId)
      .maybeSingle();

    if (salonError) throw salonError;
    if (!salon) {
      return NextResponse.json({ error: "Salon not found." }, { status: 404 });
    }

    if (auth.role === "agent") {
      const assignedTo = salon.assign_to ? normalizeEmail(salon.assign_to) : null;
      if (assignedTo && assignedTo !== auth.email) {
        return NextResponse.json({ error: "You do not have access to this lead." }, { status: 403 });
      }
    }

    try {
      await assignSalonOwnerRoleByAdminClient(
        supabaseAdmin,
        normalizedOwnerEmail,
        (salon.name || "Salon") + " Owner",
        salon.phone || ""
      );
    } catch (roleErr: unknown) {
      const message = roleErr instanceof Error ? roleErr.message : "Unknown error";
      console.error("Failed to pre-assign salon_owner role:", roleErr);
      return NextResponse.json({ error: "Failed to assign salon owner role: " + message }, { status: 500 });
    }

    const actorEmail = auth.email;
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

    if (salon.phone) {
      await sendOnboardingInviteAlert(
        salonId,
        salon.phone,
        normalizedOwnerEmail,
        salon.name || "your salon",
        salon.slug
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
