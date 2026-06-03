import type { NextRequest } from "next/server";

export const ACCESS_TOKEN_COOKIE = "sb-access-token";
export const ROLE_COOKIE = "user-role";
export const SIGNED_SESSION_COOKIE = "trimma-session";

export const ACCESS_TOKEN_CHUNK_COUNT = 5;

/** Extract the Supabase access token from a raw Cookie header string. */
export function getAccessTokenFromCookieHeader(cookieHeader: string): string | null {
  if (!cookieHeader) return null;

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

  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${ACCESS_TOKEN_COOKIE}=([^;]+)`));
  if (!match?.[1]) return null;

  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

export function getAccessTokenFromRequest(request: NextRequest | Request): string | null {
  const header = request.headers.get("cookie") || "";
  return getAccessTokenFromCookieHeader(header);
}

/** Read access token from Next.js cookies() store (server components / route handlers). */
export async function getAccessTokenFromCookieStore(
  getCookie: (name: string) => { value: string } | undefined
): Promise<string | null> {
  let chunkedToken = "";
  for (let i = 0; i < ACCESS_TOKEN_CHUNK_COUNT; i++) {
    const chunk = getCookie(`${ACCESS_TOKEN_COOKIE}.${i}`)?.value;
    if (chunk) chunkedToken += chunk;
  }

  const raw = chunkedToken || getCookie(ACCESS_TOKEN_COOKIE)?.value;
  if (!raw) return null;

  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}
