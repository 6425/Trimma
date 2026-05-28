import { Resend } from "resend";
import { cleanEnvValue } from "@/lib/supabase-server-env";

export function createResendClient(apiKey: string): Resend {
  const key = apiKey.trim();
  if (!key) {
    throw new Error(
      "Resend API key is missing. Add it in Admin → Global Settings → Resend Email."
    );
  }
  return new Resend(key);
}

/** @deprecated Use createResendClient with resolved credentials from getEmailConfig(). */
export function getResendClient() {
  const apiKey = cleanEnvValue(process.env.RESEND_API_KEY);
  if (!apiKey) {
    throw new Error(
      "RESEND_API_KEY is missing. Add it in Admin → Global Settings → Resend Email."
    );
  }
  return createResendClient(apiKey);
}
