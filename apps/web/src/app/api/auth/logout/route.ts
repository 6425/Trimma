import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookies } from "@/lib/auth/session-cookies";

function safeRedirectPath(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/login";
  if (value.startsWith("/api/")) return "/login";
  return value;
}

export async function GET(request: NextRequest) {
  const redirectTo = safeRedirectPath(request.nextUrl.searchParams.get("redirect"));
  const response = NextResponse.redirect(new URL(redirectTo, request.url));
  clearSessionCookies(response);
  return response;
}

export async function POST(request: NextRequest) {
  const redirectTo = safeRedirectPath(request.nextUrl.searchParams.get("redirect"));
  const response = NextResponse.json({ success: true, redirect: redirectTo });
  clearSessionCookies(response);
  return response;
}
