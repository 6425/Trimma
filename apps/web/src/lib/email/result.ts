import type { SendTriggeredEmailResult } from "@/app/actions/email-settings";

export function isEmailSendFailure(
  result: SendTriggeredEmailResult
): result is Extract<SendTriggeredEmailResult, { success: false }> {
  return result.success === false;
}
