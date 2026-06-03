import type { NextResponse } from "next/server";
import type { TrimmaUserRole } from "@/lib/auth-routes";
import {
  ACCESS_TOKEN_CHUNK_COUNT,
  ACCESS_TOKEN_COOKIE,
  ROLE_COOKIE,
  SIGNED_SESSION_COOKIE,
} from "@/lib/auth/cookies";
import { createSignedSessionCookie, SESSION_MAX_AGE_SEC } from "@/lib/auth/signed-role";

const BASE_COOKIE = {
  path: "/",
  sameSite: "lax" as const,
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  maxAge: SESSION_MAX_AGE_SEC,
};

function chunkAccessToken(accessToken: string): string[] {
  const maxChunkSize = 2500;
  const chunks: string[] = [];
  for (let i = 0; i < accessToken.length; i += maxChunkSize) {
    chunks.push(accessToken.slice(i, i + maxChunkSize));
  }
  return chunks;
}

/** Set HttpOnly auth cookies on a NextResponse (server-controlled session). */
export async function applySessionCookies(
  response: NextResponse,
  accessToken: string,
  role: TrimmaUserRole,
  userId: string
): Promise<void> {
  const chunks = chunkAccessToken(accessToken);

  // Primary token cookie (may exceed 4KB — chunks are authoritative).
  response.cookies.set(ACCESS_TOKEN_COOKIE, encodeURIComponent(accessToken), BASE_COOKIE);

  for (let i = 0; i < ACCESS_TOKEN_CHUNK_COUNT; i++) {
    const chunk = chunks[i];
    if (chunk) {
      response.cookies.set(`${ACCESS_TOKEN_COOKIE}.${i}`, encodeURIComponent(chunk), BASE_COOKIE);
    } else {
      response.cookies.set(`${ACCESS_TOKEN_COOKIE}.${i}`, "", { ...BASE_COOKIE, maxAge: 0 });
    }
  }

  response.cookies.set(ROLE_COOKIE, role, BASE_COOKIE);

  const signedSession = await createSignedSessionCookie(userId, role);
  response.cookies.set(SIGNED_SESSION_COOKIE, signedSession, BASE_COOKIE);
}

/** Clear all Trimma auth cookies. */
export function clearSessionCookies(response: NextResponse): void {
  const clear = { path: "/", maxAge: 0 };

  for (const name of [ACCESS_TOKEN_COOKIE, ROLE_COOKIE, SIGNED_SESSION_COOKIE, "supabase-auth-token"]) {
    response.cookies.set(name, "", clear);
    response.cookies.set(name, "", { ...clear, sameSite: "lax" });
    response.cookies.set(name, "", { ...clear, sameSite: "lax", secure: true });
  }

  for (let i = 0; i < ACCESS_TOKEN_CHUNK_COUNT; i++) {
    response.cookies.set(`${ACCESS_TOKEN_COOKIE}.${i}`, "", clear);
  }
}
