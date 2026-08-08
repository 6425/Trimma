"use client";

import { completeOAuthLogin } from "@/app/actions/login-session";
import { supabase } from "@/config/supabase";
import {
  canAccessTrimmaRoute,
  resolvePostAuthRedirect,
  sanitizeNextPath,
  type TrimmaUserRole,
} from "@/lib/auth-routes";
import { pickHighestRole } from "@/lib/trimma-role-core";
import { redirectAfterAuth, syncTrimmaSecureSession } from "@/lib/trimma-role";

async function readSignedSessionRole(): Promise<TrimmaUserRole | null> {
  try {
    const response = await fetch("/api/auth/session", { credentials: "include" });
    if (!response.ok) return null;
    const payload = (await response.json()) as { role?: TrimmaUserRole };
    return payload.role ?? null;
  } catch {
    return null;
  }
}

/** Re-link salon owners and refresh trimma-session when middleware role is stale. */
export async function recoverTrimmaSessionAccess(fromPath?: string | null): Promise<{
  recovered: boolean;
  destination?: string;
}> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    return { recovered: false };
  }

  const safeFrom = sanitizeNextPath(fromPath);
  const signedRole = await readSignedSessionRole();

  if (safeFrom && signedRole && canAccessTrimmaRoute(signedRole, safeFrom)) {
    return { recovered: true, destination: safeFrom };
  }

  const loginResult = await completeOAuthLogin(session.access_token);
  if (!loginResult.success) {
    return { recovered: false };
  }

  const syncResult = await syncTrimmaSecureSession(session.access_token);
  if ("error" in syncResult) {
    return { recovered: false };
  }

  const effectiveRole =
    pickHighestRole(loginResult.role, syncResult.role) ?? syncResult.role;

  if (safeFrom && canAccessTrimmaRoute(effectiveRole, safeFrom)) {
    return { recovered: true, destination: safeFrom };
  }

  return {
    recovered: true,
    destination: resolvePostAuthRedirect(effectiveRole, safeFrom),
  };
}

export async function tryRecoverAndRedirect(fromPath?: string | null): Promise<boolean> {
  const result = await recoverTrimmaSessionAccess(fromPath);
  if (result.recovered && result.destination) {
    redirectAfterAuth(result.destination);
    return true;
  }
  return false;
}
