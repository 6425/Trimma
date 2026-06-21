/**
 * Meta WhatsApp Business Template messages (type: "template").
 * Required for business-initiated booking alerts outside the 24-hour session window.
 * Admin → Global Settings: set exact template names from Meta Business Manager.
 */

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
export function buildMetaBodyParameters(
  trigger: WhatsAppMetaTemplateTrigger,
  variables: Record<string, string>
): string[] {
  const v = (key: string) => String(variables[key] ?? "").trim() || "—";

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

export async function sendWhatsAppMetaTemplateMessage(
  input: WhatsAppMetaSendInput
): Promise<WhatsAppMetaSendResult> {
  const templateName = input.templateName.trim();
  if (!templateName) {
    return { success: false, error: "Meta template name is not configured." };
  }

  const languageCode = (input.languageCode || "en").trim() || "en";
  const bodyParameters = input.bodyParameters.map((text) => ({
    type: "text" as const,
    text: text.slice(0, 1024),
  }));

  try {
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
          name: templateName,
          language: { code: languageCode },
          components: [
            {
              type: "body",
              parameters: bodyParameters,
            },
          ],
        },
      }),
    });

    const result = (await response.json()) as {
      messages?: Array<{ id?: string }>;
      error?: { message?: string; code?: number };
    };

    if (!response.ok) {
      const message = result.error?.message || "Meta template message failed.";
      return { success: false, error: message, usedMetaTemplate: true };
    }

    return {
      success: true,
      messageId: result.messages?.[0]?.id,
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
