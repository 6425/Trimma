import { NextResponse } from "next/server";
import {
  createTelegramConnectLink,
  getTelegramConnectStatus,
  syncTelegramConnectForUser,
} from "@/app/actions/telegram-connect";
import {
  isRequestAuthError,
  requireRequestRoles,
} from "@/lib/server-request-auth";

export async function GET(request: Request) {
  const auth = await requireRequestRoles(request, ["salon_owner"]);
  if (isRequestAuthError(auth)) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const status = await getTelegramConnectStatus(auth.email || "");
  if (!status.success) {
    return NextResponse.json(status, { status: 500 });
  }

  return NextResponse.json(status);
}

export async function POST(request: Request) {
  const auth = await requireRequestRoles(request, ["salon_owner"]);
  if (isRequestAuthError(auth)) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  let action = "link";
  try {
    const body = await request.json();
    action = String(body?.action || "link");
  } catch {
    action = "link";
  }

  const ownerEmail = auth.email || "";

  if (action === "sync") {
    const result = await syncTelegramConnectForUser(ownerEmail);
    return NextResponse.json(result, { status: result.success ? 200 : 500 });
  }

  const result = await createTelegramConnectLink(ownerEmail);
  return NextResponse.json(result, { status: result.success ? 200 : 500 });
}
