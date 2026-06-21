import { sanitizeWhatsAppPhoneNumberId } from "@/lib/whatsapp-env";

const GRAPH_API_VERSION = "v18.0";

type GraphJson = Record<string, unknown> & {
  error?: { message?: string; code?: number; type?: string };
  data?: Array<{
    id?: string;
    display_phone_number?: string;
    verified_name?: string;
  }>;
  id?: string;
  name?: string;
  display_phone_number?: string;
  verified_name?: string;
};

export type WhatsAppPhoneResolution =
  | {
      success: true;
      phoneNumberId: string;
      accountName?: string;
      verifiedName?: string;
      displayPhoneNumber?: string;
    }
  | { success: false; error: string };

type CachedResolution = {
  accountId: string;
  accessToken: string;
  phoneNumberId: string;
  expiresAt: number;
};

let resolutionCache: CachedResolution | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000;

function graphUrl(path: string, fields?: string): string {
  const base = `https://graph.facebook.com/${GRAPH_API_VERSION}/${path}`;
  if (!fields) return base;
  return `${base}?fields=${encodeURIComponent(fields)}`;
}

async function graphGet(path: string, accessToken: string, fields?: string): Promise<GraphJson> {
  const response = await fetch(graphUrl(path, fields), {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  return (await response.json()) as GraphJson;
}

function readGraphError(result: GraphJson, fallback: string): string {
  return result.error?.message || fallback;
}

/**
 * Trimma stores a Meta WhatsApp Business Account ID (WABA) in settings.
 * Message sends still require a Phone Number ID — resolve it from the WABA when needed.
 */
export async function resolveWhatsAppPhoneNumberId(
  accountId: string,
  accessToken: string
): Promise<WhatsAppPhoneResolution> {
  const trimmedAccountId = sanitizeWhatsAppPhoneNumberId(accountId);
  const trimmedToken = accessToken.trim();

  if (!trimmedAccountId || !trimmedToken) {
    return { success: false, error: "WhatsApp credentials are not configured." };
  }

  if (
    resolutionCache &&
    resolutionCache.accountId === trimmedAccountId &&
    resolutionCache.accessToken === trimmedToken &&
    resolutionCache.expiresAt > Date.now()
  ) {
    return { success: true, phoneNumberId: resolutionCache.phoneNumberId };
  }

  const wabaPhones = await graphGet(
    `${trimmedAccountId}/phone_numbers`,
    trimmedToken,
    "id,display_phone_number,verified_name"
  );

  if (!wabaPhones.error && Array.isArray(wabaPhones.data) && wabaPhones.data.length > 0) {
    const phone = wabaPhones.data[0];
    if (phone?.id) {
      resolutionCache = {
        accountId: trimmedAccountId,
        accessToken: trimmedToken,
        phoneNumberId: phone.id,
        expiresAt: Date.now() + CACHE_TTL_MS,
      };
      return {
        success: true,
        phoneNumberId: phone.id,
        verifiedName: phone.verified_name,
        displayPhoneNumber: phone.display_phone_number,
      };
    }
  }

  const directPhone = await graphGet(trimmedAccountId, trimmedToken, "id,display_phone_number,verified_name");
  if (!directPhone.error && directPhone.display_phone_number) {
    resolutionCache = {
      accountId: trimmedAccountId,
      accessToken: trimmedToken,
      phoneNumberId: trimmedAccountId,
      expiresAt: Date.now() + CACHE_TTL_MS,
    };
    return {
      success: true,
      phoneNumberId: trimmedAccountId,
      verifiedName: directPhone.verified_name,
      displayPhoneNumber: directPhone.display_phone_number,
    };
  }

  const businessAccount = await graphGet(trimmedAccountId, trimmedToken, "id,name");
  if (!businessAccount.error && businessAccount.id) {
    return {
      success: false,
      error:
        "Meta Business account ID is valid, but no WhatsApp phone number is linked yet. Add a phone number in Meta Developer Console → WhatsApp → API Setup.",
    };
  }

  return {
    success: false,
    error: readGraphError(
      wabaPhones.error ? wabaPhones : directPhone.error ? directPhone : businessAccount,
      "Could not resolve a WhatsApp phone number for this Meta account ID."
    ),
  };
}

export async function validateWhatsAppMetaAccount(
  accountId: string,
  accessToken: string
): Promise<
  | {
      valid: true;
      accountId: string;
      phoneNumberId: string;
      accountName?: string;
      verifiedName?: string;
      displayPhoneNumber?: string;
    }
  | { valid: false; error: string }
> {
  if (!accountId.trim() || !accessToken.trim()) {
    return { valid: false, error: "WhatsApp credentials are not configured." };
  }

  const resolved = await resolveWhatsAppPhoneNumberId(accountId, accessToken);
  if (resolved.success === false) {
    return { valid: false, error: resolved.error };
  }

  return {
    valid: true,
    accountId: accountId.trim(),
    phoneNumberId: resolved.phoneNumberId,
    accountName: resolved.verifiedName || resolved.displayPhoneNumber,
    verifiedName: resolved.verifiedName,
    displayPhoneNumber: resolved.displayPhoneNumber,
  };
}

export function clearWhatsAppPhoneResolutionCache() {
  resolutionCache = null;
}
