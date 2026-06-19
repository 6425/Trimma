"use server";

import type { TrimmaUserRole } from "@/lib/auth-routes";
import { verifyAccessToken } from "@/lib/auth/verify-access-token";
import { resolveTrimmaUserRoleServer } from "@/lib/trimma-role-server";
import { linkInvitedOwnerAccount } from "@/lib/link-owner-account";
import { sendWelcomeCustomerWhatsApp } from "@/app/actions/whatsapp";
import { sendWelcomeCustomerEmail } from "@/app/actions/email-settings";

/**
 * App-managed login role resolution (server action, NOT an /api route).
 *
 * Mirrors the admin login pattern: the client signs in with Supabase, then this
 * server action verifies the token and resolves the authoritative DB role. The
 * client then writes the middleware cookies and redirects by role.
 */
export async function resolveLoginRole(accessToken: string) {
  if (!accessToken?.trim()) {
    return { success: false as const, error: "Missing session token. Please sign in again." };
  }

  try {
    const verified = await verifyAccessToken(accessToken);
    if (!verified) {
      return { success: false as const, error: "Invalid or expired session. Please sign in again." };
    }

    const role = (await resolveTrimmaUserRoleServer(verified.userId, verified.email)) ?? "customer";
    return { success: true as const, role, userId: verified.userId };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not verify your account.";
    return { success: false as const, error: message };
  }
}

/**
 * Google OAuth completion for customers and salon owners (server action).
 *
 * Links an invited salon-owner account when applicable and resolves the role +
 * onboarding status. No /api route is involved.
 */
export async function completeOAuthLogin(
  accessToken: string,
  options?: { salonOwnerIntent?: boolean }
) {
  if (!accessToken?.trim()) {
    return { success: false as const, error: "Missing session token. Please sign in again." };
  }

  try {
    const verified = await verifyAccessToken(accessToken);
    if (!verified) {
      return { success: false as const, error: "Invalid or expired session. Please sign in again." };
    }

    let onboardingStatus: string | null = null;
    let linkedRole: TrimmaUserRole | null = null;

    let isNewUser = false;

    try {
      const linkResult = await linkInvitedOwnerAccount(
        verified.userId,
        verified.email,
        verified.userMetadata?.full_name || verified.userMetadata?.first_name,
        verified.userMetadata?.avatar_url,
        { salonOwnerIntent: options?.salonOwnerIntent }
      );
      onboardingStatus = linkResult.onboardingStatus;
      linkedRole = linkResult.role;
      if (
        options?.salonOwnerIntent &&
        linkResult.linked &&
        linkResult.role !== "admin" &&
        linkResult.role !== "agent" &&
        linkResult.role !== "regional_head"
      ) {
        linkedRole = "salon_owner";
      }
      isNewUser = linkResult.isNewUser;
    } catch (linkErr) {
      console.error("Owner link step failed:", linkErr);
    }

    if (isNewUser && verified.email && !options?.salonOwnerIntent) {
      const fullName = verified.userMetadata?.full_name || verified.userMetadata?.first_name || verified.email.split("@")[0];
      const phone = verified.userMetadata?.phone || verified.phone || null;
      if (phone) {
        await sendWelcomeCustomerWhatsApp(fullName, phone);
      }
      await sendWelcomeCustomerEmail(fullName, verified.email);
    }

    const role =
      linkedRole ??
      (await resolveTrimmaUserRoleServer(verified.userId, verified.email)) ??
      (options?.salonOwnerIntent ? "salon_owner" : "customer");

    return { success: true as const, role, onboardingStatus };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not complete sign-in.";
    return { success: false as const, error: message };
  }
}
