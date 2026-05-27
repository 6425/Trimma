import { Resend } from "resend";

let client: Resend | null = null;

export function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "RESEND_API_KEY is missing. Add it to apps/web/.env to enable transactional email."
    );
  }

  if (!client) {
    client = new Resend(apiKey);
  }

  return client;
}
