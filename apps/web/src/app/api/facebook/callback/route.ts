import { NextResponse } from "next/server";
import { completeFacebookOAuthCallback } from "@/app/actions/facebook-connect";
import { APP_BASE_URL } from "@/lib/email/config";

function redirectToSocial(query: Record<string, string>) {
  const params = new URLSearchParams(query);
  return NextResponse.redirect(`${APP_BASE_URL}/dashboard/social?${params.toString()}`);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");
  const oauthDescription = url.searchParams.get("error_description");

  if (oauthError) {
    return redirectToSocial({
      facebook: "error",
      message: oauthDescription || oauthError,
    });
  }

  if (!code || !state) {
    return redirectToSocial({
      facebook: "error",
      message: "Missing Facebook authorization code.",
    });
  }

  const result = await completeFacebookOAuthCallback(code, state);
  if (result.success === false) {
    return redirectToSocial({
      facebook: "error",
      message: result.error,
    });
  }

  if (result.mode === "select_page") {
    return redirectToSocial({
      facebook: "select_page",
    });
  }

  return redirectToSocial({
    facebook: "connected",
    page: result.pageName,
  });
}
