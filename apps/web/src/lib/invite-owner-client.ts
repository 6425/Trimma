import { supabase } from "@/config/supabase";
import { getTrimmaAccessToken } from "@/lib/client-auth";

/** POST /api/invite-owner with cookie + Bearer fallback so invites work when HttpOnly cookies mis-read. */
export async function postInviteOwner(input: {
  salonId: string;
  ownerEmail: string;
}): Promise<{ success: true } | { success: false; error: string }> {
  const token =
    (await getTrimmaAccessToken()) ||
    (await supabase.auth.getSession()).data.session?.access_token ||
    null;

  const response = await fetch("/api/invite-owner", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      salonId: input.salonId,
      ownerEmail: input.ownerEmail,
    }),
  });

  let payload: { error?: string; success?: boolean } = {};
  try {
    payload = await response.json();
  } catch {
    return {
      success: false,
      error: response.ok
        ? "Invite failed: invalid server response."
        : `Invite failed (${response.status}). Sign out and sign in again.`,
    };
  }

  if (!response.ok || payload.success === false) {
    return {
      success: false,
      error: payload.error || `Invite failed (${response.status}).`,
    };
  }

  return { success: true };
}
