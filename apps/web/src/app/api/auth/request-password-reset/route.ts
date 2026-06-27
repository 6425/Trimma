import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/config/supabase-admin";
import {
  canUseEmailPassword,
  findAuthUserByEmail,
  isGoogleOnlyAuthUser,
} from "@/lib/auth-admin-lookup";
import { normalizeEmail } from "@/lib/normalize-email";
import { checkPasswordResetRateLimit } from "@/lib/checkout-rate-limit";
import { getClientIp } from "@/lib/email/rate-limit";

const GENERIC_SUCCESS =
  "If an account with that email exists and supports password login, a reset link has been sent.";

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);
    const rateLimit = await checkPasswordResetRateLimit(clientIp);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many reset attempts. Please wait and try again." },
        {
          status: 429,
          headers: rateLimit.retryAfterSec
            ? { "Retry-After": String(rateLimit.retryAfterSec) }
            : undefined,
        }
      );
    }

    const body = await request.json();
    const email = normalizeEmail(body?.email);

    if (!email) {
      return NextResponse.json({ error: "Email address is required." }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

    if (!supabaseUrl || !anonKey) {
      return NextResponse.json({ error: "Auth is not configured." }, { status: 500 });
    }

    let admin;
    try {
      admin = createSupabaseAdminClient();
    } catch {
      return NextResponse.json({ error: "Server auth is not configured." }, { status: 500 });
    }

    const authUser = await findAuthUserByEmail(admin, email);

    if (!authUser) {
      return NextResponse.json({ success: true, message: GENERIC_SUCCESS });
    }

    if (isGoogleOnlyAuthUser(authUser)) {
      return NextResponse.json(
        {
          error:
            "This account uses Google sign-in only. Please use the Google button on the login page.",
        },
        { status: 400 }
      );
    }

    if (!canUseEmailPassword(authUser)) {
      return NextResponse.json(
        { error: "Password reset is not available for this account." },
        { status: 400 }
      );
    }

    const siteUrl =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
      new URL(request.url).origin;

    const supabase = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent("/reset-password")}`,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: GENERIC_SUCCESS });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Request failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
