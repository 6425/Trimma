import type { Logger } from "@opentelemetry/api-logs";
import { SeverityNumber } from "@opentelemetry/api-logs";

declare global {
  // eslint-disable-next-line no-var
  var __posthogLogger: Logger | undefined;
}

export type PostHogLogAttributes = Record<
  string,
  string | number | boolean | undefined | null
>;

function getLogger(): Logger | null {
  if (typeof globalThis === "undefined") return null;
  return globalThis.__posthogLogger ?? null;
}

function emit(
  severityNumber: SeverityNumber,
  severityText: string,
  body: string,
  attributes?: PostHogLogAttributes
) {
  const logger = getLogger();
  if (!logger) return;

  const cleaned: Record<string, string | number | boolean> = {};
  if (attributes) {
    for (const [key, value] of Object.entries(attributes)) {
      if (value === undefined || value === null) continue;
      cleaned[key] = value;
    }
  }

  logger.emit({
    severityNumber,
    severityText,
    body,
    attributes: cleaned,
  });
}

export const posthogLog = {
  info(body: string, attributes?: PostHogLogAttributes) {
    emit(SeverityNumber.INFO, "INFO", body, attributes);
  },
  warn(body: string, attributes?: PostHogLogAttributes) {
    emit(SeverityNumber.WARN, "WARN", body, attributes);
  },
  error(body: string, attributes?: PostHogLogAttributes) {
    emit(SeverityNumber.ERROR, "ERROR", body, attributes);
  },
};
