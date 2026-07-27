import { cookies } from "next/headers";
import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { assertPlatformAdmin } from "@/lib/platform-admin";
import { withTimeout } from "@/lib/promise-timeout";

export async function getAdminAccessTokenFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();

  const fullRaw = cookieStore.get("sb-access-token")?.value;
  if (fullRaw) {
    try {
      const decoded = decodeURIComponent(fullRaw);
      if (decoded.split(".").length === 3) return decoded;
    } catch {
      if (fullRaw.split(".").length === 3) return fullRaw;
    }
  }

  let chunkedToken = "";
  for (let i = 0; i < 5; i++) {
    const chunk = cookieStore.get(`sb-access-token.${i}`)?.value;
    if (chunk) chunkedToken += chunk;
  }
  if (!chunkedToken) return null;
  try {
    return decodeURIComponent(chunkedToken);
  } catch {
    return chunkedToken;
  }
}

export async function requirePlatformAdminFromCookies(): Promise<
  { accessToken: string } | { error: string }
> {
  const accessToken = await getAdminAccessTokenFromCookies();
  if (!accessToken) {
    return { error: "You must be signed in as an admin. Go to /admin/login." };
  }

  try {
    await withTimeout(
      assertPlatformAdmin(accessToken),
      12000,
      "Admin session verification timed out. Sign out and sign in again at /admin/login."
    );
    return { accessToken };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Admin access required.";
    return { error: message };
  }
}

export async function getAdminActorEmail(): Promise<string> {
  const accessToken = await getAdminAccessTokenFromCookies();
  if (!accessToken) return "admin@trimma.lk";

  try {
    const supabase = createSupabaseAdminClient();
    const {
      data: { user },
    } = await supabase.auth.getUser(accessToken);
    return user?.email || "admin@trimma.lk";
  } catch {
    return "admin@trimma.lk";
  }
}
