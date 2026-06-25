import { NextResponse } from "next/server";
import { completeFacebookOAuthCallback } from "@/app/actions/facebook-connect";

function redirectToSocial(origin: string, query: Record<string, string>) {
  const params = new URLSearchParams(query);
  return NextResponse.redirect(`${origin.replace(/\/$/, "")}/dashboard/social?${params.toString()}`);
}

export async function handleFacebookOAuthCallback(request: Request) {
  const origin = new URL(request.url).origin;
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");
  const oauthDescription = url.searchParams.get("error_description");

  if (oauthError) {
    return redirectToSocial(origin, {
      facebook: "error",
      message: oauthDescription || oauthError,
    });
  }

  if (!code || !state) {
    return redirectToSocial(origin, {
      facebook: "error",
      message: "Missing Facebook authorization code.",
    });
  }

  const result = await completeFacebookOAuthCallback(code, state, origin);
  if (result.success === false) {
    return redirectToSocial(origin, {
      facebook: "error",
      message: result.error,
    });
  }

  if (result.mode === "select_page") {
    return redirectToSocial(origin, { facebook: "select_page" });
  }

  return redirectToSocial(origin, {
    facebook: "connected",
    page: result.pageName,
  });
}
