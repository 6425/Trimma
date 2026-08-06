import { NextResponse } from "next/server";
import { posthogLog } from "@/lib/posthog-logger";

export const dynamic = "force-dynamic";

export async function GET() {
  posthogLog.info("Health check called", {
    route: "/api/health",
  });

  return NextResponse.json({
    ok: true,
    service: "trimma-web",
    timestamp: new Date().toISOString(),
  });
}
