export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { validateProductionEnv } = await import("@/lib/env");
    validateProductionEnv();

    const token =
      process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN?.trim() ||
      process.env.POSTHOG_PROJECT_TOKEN?.trim();
    if (!token) return;

    const host = (
      process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() || "https://us.i.posthog.com"
    ).replace(/\/$/, "");

    const [{ OTLPLogExporter }, { resourceFromAttributes }, { LoggerProvider, SimpleLogRecordProcessor }] =
      await Promise.all([
        import("@opentelemetry/exporter-logs-otlp-http"),
        import("@opentelemetry/resources"),
        import("@opentelemetry/sdk-logs"),
      ]);

    const exporter = new OTLPLogExporter({
      url: `${host}/otlp/v1/logs`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const serviceName =
      process.env.POSTHOG_SERVICE_NAME?.trim() || "trimma-web";

    const loggerProvider = new LoggerProvider({
      resource: resourceFromAttributes({
        "service.name": serviceName,
        "deployment.environment":
          process.env.VERCEL_ENV || process.env.NODE_ENV || "development",
      }),
      processors: [new SimpleLogRecordProcessor({ exporter })],
    });

    globalThis.__posthogLogger = loggerProvider.getLogger(serviceName);
  }
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

  const [{ getPostHogServer }, { posthogLog }] = await Promise.all([
    import("@/lib/posthog-server"),
    import("@/lib/posthog-logger"),
  ]);

  posthogLog.error(err.message || "Unhandled Next.js request error", {
    $exception_source: "next_on_request_error",
    path: request.path,
    method: request.method,
    routerKind: context.routerKind,
    routePath: context.routePath,
    routeType: context.routeType,
    digest: err.digest,
    error_name: err.name,
  });

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
