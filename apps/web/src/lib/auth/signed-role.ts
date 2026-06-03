import type { TrimmaUserRole } from "@/lib/auth-routes";
import { getSessionSecret } from "@/lib/auth/session-secret";

const SESSION_MAX_AGE_SEC = 60 * 60 * 24; // 24 hours

export type SignedSessionPayload = {
  userId: string;
  role: TrimmaUserRole;
  exp: number;
};

function toBase64Url(bytes: ArrayBuffer): string {
  const bin = String.fromCharCode(...new Uint8Array(bytes));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  const bin = atob(padded + pad);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

async function sign(value: string, secret: string): Promise<string> {
  const key = await importHmacKey(secret);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return toBase64Url(signature);
}

async function verify(value: string, signature: string, secret: string): Promise<boolean> {
  try {
    const key = await importHmacKey(secret);
    return crypto.subtle.verify(
      "HMAC",
      key,
      fromBase64Url(signature),
      new TextEncoder().encode(value)
    );
  } catch {
    return false;
  }
}

export function encodeSignedSessionPayload(payload: SignedSessionPayload): string {
  return btoa(JSON.stringify(payload))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function decodeSignedSessionPayload(encoded: string): SignedSessionPayload | null {
  try {
    const padded = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
    const json = atob(padded + pad);
    const parsed = JSON.parse(json) as SignedSessionPayload;
    if (!parsed?.userId || !parsed?.role || typeof parsed.exp !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Create `trimma-session` value: base64url(payload).base64url(hmac). */
export async function createSignedSessionCookie(
  userId: string,
  role: TrimmaUserRole
): Promise<string> {
  const payload: SignedSessionPayload = {
    userId,
    role,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SEC,
  };
  const encodedPayload = encodeSignedSessionPayload(payload);
  const signature = await sign(encodedPayload, getSessionSecret());
  return `${encodedPayload}.${signature}`;
}

export async function verifySignedSessionCookie(
  value: string | undefined | null
): Promise<SignedSessionPayload | null> {
  if (!value) return null;

  const dot = value.lastIndexOf(".");
  if (dot <= 0) return null;

  const encodedPayload = value.slice(0, dot);
  const signature = value.slice(dot + 1);
  const valid = await verify(encodedPayload, signature, getSessionSecret());
  if (!valid) return null;

  const payload = decodeSignedSessionPayload(encodedPayload);
  if (!payload) return null;
  if (payload.exp < Math.floor(Date.now() / 1000)) return null;

  return payload;
}

export { SESSION_MAX_AGE_SEC };
