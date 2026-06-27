function normalizeHost(hostname: string): string {
  return hostname.toLowerCase().replace(/^www\./, "");
}

function hostFromAppUrl(url: string): string | null {
  try {
    return normalizeHost(new URL(url).hostname);
  } catch {
    return null;
  }
}

function isLiveProductionHost(hostname: string): boolean {
  return normalizeHost(hostname) === "trimma.io";
}

function isBetaHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return host === "beta.trimma.io" || host.startsWith("beta.");
}

/**
 * Beta badge is shown only on beta/staging hosts — never on www.trimma.io / trimma.io.
 */
export function shouldShowBetaBadge(hostname?: string | null): boolean {
  const appHost = hostFromAppUrl(process.env.NEXT_PUBLIC_APP_URL || "");
  if (appHost && isLiveProductionHost(appHost)) {
    return false;
  }

  if (hostname) {
    if (isLiveProductionHost(hostname)) return false;
    if (isBetaHost(hostname)) return true;
  }

  if (appHost && isBetaHost(appHost)) {
    return true;
  }

  return false;
}
