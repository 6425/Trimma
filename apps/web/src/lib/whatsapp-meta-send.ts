/**
 * Meta WhatsApp Business Template messages (type: "template").
 * Required for business-initiated booking alerts outside the 24-hour session window.
 * Admin → Global Settings: set exact template names from Meta Business Manager.
 */

/** Meta-approved template for first customer booking confirmation (checkout). */
export const TRIMMA_META_TEMPLATE_CONFIRMED = "confirmmessage";

/** Default when Admin language is blank — most Meta English templates use en_US. */
export const TRIMMA_META_TEMPLATE_LANGUAGE = "en_US";

export type WhatsAppMetaTemplateTrigger = "reservation-paid" | "confirmed";

export type WhatsAppMetaSendInput = {
  phoneId: string;
  accessToken: string;
  to: string;
  templateName: string;
  languageCode?: string;
  bodyParameters: string[];
};

export type WhatsAppMetaSendResult = {
  success: boolean;
  messageId?: string;
  error?: string;
  usedMetaTemplate?: boolean;
};

/** Parameter order must match Meta Template body {{1}}, {{2}}, … */
function formatMetaBookingDate(raw: string): string {
  const value = raw.trim();
  if (!value) return "—";
  const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const date = new Date(`${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}T12:00:00`);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    }
  }
  return value;
}

function formatMetaBookingTime(raw: string): string {
  const value = raw.trim();
  if (!value) return "—";
  const match = value.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!match) return value;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return value;
  const period = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;
  return `${hour12}:${String(minutes).padStart(2, "0")} ${period}`;
}

/**
 * confirmmessage (Meta):
 * Hello {{1}}, … {{2}} … {{3}} on {{4}} at {{5}} is confirmed
 */
function buildConfirmMessageParameters(variables: Record<string, string>): string[] {
  const v = (key: string) => String(variables[key] ?? "").trim() || "—";
  return [
    v("customer_name"),
    v("salon_name"),
    v("service_name"),
    formatMetaBookingDate(v("booking_date")),
    formatMetaBookingTime(v("booking_time")),
  ];
}

export function buildMetaBodyParameters(
  trigger: WhatsAppMetaTemplateTrigger,
  variables: Record<string, string>,
  templateName?: string
): string[] {
  const v = (key: string) => String(variables[key] ?? "").trim() || "—";
  const normalizedTemplate = (templateName || "").trim().toLowerCase();

  if (trigger === "confirmed" && normalizedTemplate === TRIMMA_META_TEMPLATE_CONFIRMED) {
    return buildConfirmMessageParameters(variables);
  }

  if (trigger === "reservation-paid") {
    return [
      v("customer_name"),
      v("salon_name"),
      v("booking_date"),
      v("booking_time"),
      v("service_name"),
      v("booking_no"),
      v("deposit_paid"),
      v("balance_to_pay"),
    ];
  }

  return [
    v("customer_name"),
    v("salon_name"),
    v("booking_date"),
    v("booking_time"),
    v("service_name"),
    v("booking_no"),
    v("total_price"),
    v("deposit_paid"),
    v("balance_to_pay"),
    v("salon_address"),
    v("maps_link"),
  ];
}

function buildLanguageCandidates(preferred?: string | null): string[] {
  const candidates = [
    (preferred || "").trim(),
    TRIMMA_META_TEMPLATE_LANGUAGE,
    "en_US",
    "en_GB",
    "en",
  ].filter(Boolean);
  return [...new Set(candidates)];
}

async function postMetaTemplateMessage(input: {
  phoneId: string;
  accessToken: string;
  to: string;
  templateName: string;
  languageCode: string;
  bodyParameters: Array<{ type: "text"; text: string }>;
}) {
  const response = await fetch(`https://graph.facebook.com/v18.0/${input.phoneId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: input.to,
      type: "template",
      template: {
        name: input.templateName,
        language: { code: input.languageCode },
        components: [
          {
            type: "body",
            parameters: input.bodyParameters,
          },
        ],
      },
    }),
  });

  const result = (await response.json()) as {
    messages?: Array<{ id?: string }>;
    error?: { message?: string; code?: number };
  };

  return { response, result };
}

export async function sendWhatsAppMetaTemplateMessage(
  input: WhatsAppMetaSendInput
): Promise<WhatsAppMetaSendResult> {
  const templateName = input.templateName.trim();
  if (!templateName) {
    return { success: false, error: "Meta template name is not configured." };
  }

  const bodyParameters = input.bodyParameters.map((text) => ({
    type: "text" as const,
    text: text.slice(0, 1024),
  }));

  const languageCandidates = buildLanguageCandidates(input.languageCode);
  let lastError = "Meta template message failed.";
  let lastCode: number | undefined;

  try {
    for (const languageCode of languageCandidates) {
      const { response, result } = await postMetaTemplateMessage({
        phoneId: input.phoneId,
        accessToken: input.accessToken,
        to: input.to,
        templateName,
        languageCode,
        bodyParameters,
      });

      if (response.ok) {
        return {
          success: true,
          messageId: result.messages?.[0]?.id,
          usedMetaTemplate: true,
        };
      }

      lastError = result.error?.message || lastError;
      lastCode = result.error?.code;

      const retryableLanguageError =
        lastCode === 132001 ||
        lastError.toLowerCase().includes("does not exist in the translation");

      if (!retryableLanguageError) {
        return { success: false, error: lastError, usedMetaTemplate: true };
      }
    }

    return {
      success: false,
      error: `${lastError} Tried languages: ${languageCandidates.join(", ")}. In Meta Business Manager, open template "${templateName}" and copy its exact Language code into Admin → Global Settings.`,
      usedMetaTemplate: true,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Meta template message failed.",
      usedMetaTemplate: true,
    };
  }
}
