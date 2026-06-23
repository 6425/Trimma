export function formatPromoLkr(amount: number): string {
  return `LKR ${amount.toLocaleString()}`;
}

export function buildPromoOfferCopy(input: {
  customerName: string;
  salonName: string;
  packageName: string;
  packagePrice: number;
  originalPrice: number;
  shareUrl: string;
  packageDescription?: string | null;
}): { whatsappBody: string; emailSubject: string; emailBody: string } {
  const savings =
    input.originalPrice > input.packagePrice
      ? ` (was ${formatPromoLkr(input.originalPrice)})`
      : "";
  const description = input.packageDescription?.trim()
    ? `\n\n${input.packageDescription.trim()}`
    : "";

  const whatsappBody = `Hi ${input.customerName}! ✨

As a valued VIP client, *${input.salonName}* has an exclusive offer for you:

🎁 *${input.packageName}*
💰 ${formatPromoLkr(input.packagePrice)}${savings}${description}

Book on Trimma: ${input.shareUrl}

We look forward to seeing you!`;

  const emailSubject = `VIP offer from ${input.salonName}: ${input.packageName}`;
  const emailBody = `Hi ${input.customerName},

As a valued VIP client, ${input.salonName} has an exclusive promotion for you:

${input.packageName} — ${formatPromoLkr(input.packagePrice)}${savings}${description}

Book on Trimma: ${input.shareUrl}

Thank you for your loyalty!`;

  return { whatsappBody, emailSubject, emailBody };
}
