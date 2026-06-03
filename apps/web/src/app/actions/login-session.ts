"use server";

import type { TrimmaUserRole } from "@/lib/auth-routes";
import { verifyAccessToken } from "@/lib/auth/verify-access-token";
import { resolveTrimmaUserRoleServer } from "@/lib/trimma-role-server";
import { linkInvitedOwnerAccount } from "@/lib/link-owner-account";

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
export async function completeOAuthLogin(accessToken: string) {
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

    try {
      const linkResult = await linkInvitedOwnerAccount(verified.userId, verified.email);
      onboardingStatus = linkResult.onboardingStatus;
      linkedRole = linkResult.role;
    } catch (linkErr) {
      console.error("Owner link step failed:", linkErr);
    }

    const role =
      linkedRole ??
      (await resolveTrimmaUserRoleServer(verified.userId, verified.email)) ??
      "customer";

    return { success: true as const, role, onboardingStatus };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not complete sign-in.";
    return { success: false as const, error: message };
  }
}
