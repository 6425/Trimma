import { cookies } from "next/headers";
import { assertPlatformAdmin } from "@/lib/platform-admin";

export async function getAdminAccessTokenFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get("sb-access-token")?.value;
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
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
    await assertPlatformAdmin(accessToken);
    return { accessToken };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Admin access required.";
    return { error: message };
  }
}
