import { NextRequest, NextResponse } from "next/server";

const AUTH_COOKIES = ["sb-access-token", "user-role", "supabase-auth-token"];

function safeRedirectPath(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

function clearAuthCookies(response: NextResponse) {
  for (const name of AUTH_COOKIES) {
    response.cookies.set(name, "", { path: "/", maxAge: 0 });
    response.cookies.set(name, "", { path: "/", maxAge: 0, sameSite: "lax" });
    response.cookies.set(name, "", { path: "/", maxAge: 0, sameSite: "lax", secure: true });
  }
}

export async function GET(request: NextRequest) {
  const redirectTo = safeRedirectPath(request.nextUrl.searchParams.get("redirect"));
  const response = NextResponse.redirect(new URL(redirectTo, request.url));
  clearAuthCookies(response);
  return response;
}

export async function POST(request: NextRequest) {
  return GET(request);
}
