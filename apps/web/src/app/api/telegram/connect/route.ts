import { NextResponse } from "next/server";
import { getRequestSession } from "@/lib/server-request-auth";
import {
  createTelegramConnectLink,
  getTelegramConnectStatus,
  syncTelegramConnectForUser,
} from "@/app/actions/telegram-connect";

export async function GET(request: Request) {
  const authSession = await getRequestSession(request);
  if (!authSession?.email) {
    return NextResponse.json({ success: false, error: "Please sign in first." }, { status: 401 });
  }

  const status = await getTelegramConnectStatus(authSession.email);
  if (!status.success) {
    return NextResponse.json(status, { status: 500 });
  }

  return NextResponse.json(status);
}

export async function POST(request: Request) {
  const authSession = await getRequestSession(request);
  if (!authSession?.email) {
    return NextResponse.json({ success: false, error: "Please sign in first." }, { status: 401 });
  }

  let action = "link";
  try {
    const body = await request.json();
    action = String(body?.action || "link");
  } catch {
    action = "link";
  }

  if (action === "sync") {
    const result = await syncTelegramConnectForUser(authSession.email);
    return NextResponse.json(result, { status: result.success ? 200 : 500 });
  }

  const result = await createTelegramConnectLink(authSession.email);
  return NextResponse.json(result, { status: result.success ? 200 : 500 });
}
