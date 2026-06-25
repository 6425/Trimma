import { createHmac, timingSafeEqual } from "node:crypto";
import { readFacebookRedirectUri } from "@/lib/facebook-env";
import { requireFacebookAppConfig } from "@/lib/facebook-graph";

const STATE_TTL_MS = 15 * 60 * 1000;

type FacebookOAuthStatePayload = {
  salonId: string;
  issuedAt: number;
  redirectUri?: string;
};

function encodePayload(payload: FacebookOAuthStatePayload): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decodePayload(encoded: string): FacebookOAuthStatePayload | null {
  try {
    const parsed = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as FacebookOAuthStatePayload;
    if (!parsed?.salonId || typeof parsed.issuedAt !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

function sign(encodedPayload: string, secret: string): string {
  return createHmac("sha256", secret).update(encodedPayload).digest("base64url");
}

export function createFacebookOAuthState(salonId: string, requestOrigin?: string): string {
  const { appSecret } = requireFacebookAppConfig(requestOrigin);
  const redirectUri = readFacebookRedirectUri(requestOrigin);
  const payload = encodePayload({ salonId, issuedAt: Date.now(), redirectUri });
  const signature = sign(payload, appSecret);
  return `${payload}.${signature}`;
}

export function verifyFacebookOAuthState(state: string): { salonId: string; redirectUri?: string } | null {
  const [encodedPayload, signature] = state.split(".");
  if (!encodedPayload || !signature) return null;

  const { appSecret } = requireFacebookAppConfig();
  const expected = sign(encodedPayload, appSecret);

  const left = Buffer.from(signature, "utf8");
  const right = Buffer.from(expected, "utf8");
  if (left.length !== right.length || !timingSafeEqual(left, right)) {
    return null;
  }

  const payload = decodePayload(encodedPayload);
  if (!payload) return null;
  if (Date.now() - payload.issuedAt > STATE_TTL_MS) return null;

  return {
    salonId: payload.salonId,
    redirectUri: payload.redirectUri?.replace(/\/$/, ""),
  };
}
