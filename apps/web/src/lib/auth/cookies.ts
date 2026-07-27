import type { NextRequest } from "next/server";

export const ACCESS_TOKEN_COOKIE = "sb-access-token";
export const ROLE_COOKIE = "user-role";
export const SIGNED_SESSION_COOKIE = "trimma-session";

export const ACCESS_TOKEN_CHUNK_COUNT = 5;

/** Extract the Supabase access token from a raw Cookie header string. */
export function getAccessTokenFromCookieHeader(cookieHeader: string): string | null {
  if (!cookieHeader) return null;

  const fullMatch = cookieHeader.match(new RegExp(`(?:^|;\\s*)${ACCESS_TOKEN_COOKIE}=([^;]+)`));
  if (fullMatch?.[1]) {
    try {
      const decoded = decodeURIComponent(fullMatch[1]);
      if (decoded.split(".").length === 3) return decoded;
    } catch {
      if (fullMatch[1].split(".").length === 3) return fullMatch[1];
    }
  }

  let chunkedToken = "";
  for (let i = 0; i < ACCESS_TOKEN_CHUNK_COUNT; i++) {
    const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${ACCESS_TOKEN_COOKIE}\\.${i}=([^;]+)`));
    if (match?.[1]) chunkedToken += match[1];
  }

  if (chunkedToken) {
    try {
      return decodeURIComponent(chunkedToken);
    } catch {
      return chunkedToken;
    }
  }

  return null;
}

export function getAccessTokenFromRequest(request: NextRequest | Request): string | null {
  const header = request.headers.get("cookie") || "";
  return getAccessTokenFromCookieHeader(header);
}

/** Read access token from Next.js cookies() store (server components / route handlers). */
export async function getAccessTokenFromCookieStore(
  getCookie: (name: string) => { value: string } | undefined
): Promise<string | null> {
  const fullRaw = getCookie(ACCESS_TOKEN_COOKIE)?.value;
  if (fullRaw) {
    try {
      const decoded = decodeURIComponent(fullRaw);
      if (decoded.split(".").length === 3) return decoded;
    } catch {
      if (fullRaw.split(".").length === 3) return fullRaw;
    }
  }

  let chunkedToken = "";
  for (let i = 0; i < ACCESS_TOKEN_CHUNK_COUNT; i++) {
    const chunk = getCookie(`${ACCESS_TOKEN_COOKIE}.${i}`)?.value;
    if (chunk) chunkedToken += chunk;
  }
  if (!chunkedToken) return null;

  try {
    return decodeURIComponent(chunkedToken);
  } catch {
    return chunkedToken;
  }
}
