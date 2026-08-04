export async function register() {
  // Reserved for future server boot hooks (OpenTelemetry, etc.).
}

export async function onRequestError(
  err: { digest?: string } & Error,
  request: {
    path: string;
    method: string;
    headers: { cookie?: string | string[] };
  },
  context: {
    routerKind: "Pages Router" | "App Router";
    routePath: string;
    routeType: "render" | "route" | "action" | "middleware";
  }
) {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { getPostHogServer } = await import("@/lib/posthog-server");
  const posthog = getPostHogServer();
  if (!posthog) return;

  let distinctId: string | undefined;

  try {
    const cookieHeader = request.headers.cookie;
    const cookieString = Array.isArray(cookieHeader)
      ? cookieHeader.join("; ")
      : cookieHeader || "";

    const match = cookieString.match(/ph_phc_.*?_posthog=([^;]+)/);
    if (match?.[1]) {
      const decoded = decodeURIComponent(match[1]);
      const data = JSON.parse(decoded) as { distinct_id?: string };
      if (typeof data.distinct_id === "string") {
        distinctId = data.distinct_id;
      }
    }
  } catch {
    // Best-effort distinct id from PostHog cookie.
  }

  posthog.captureException(err, distinctId, {
    $exception_source: "next_on_request_error",
    path: request.path,
    method: request.method,
    routerKind: context.routerKind,
    routePath: context.routePath,
    routeType: context.routeType,
    digest: err.digest,
  });

  await posthog.flush();
}
