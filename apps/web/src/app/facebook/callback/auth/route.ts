import { handleFacebookOAuthCallback } from "@/lib/facebook-oauth-callback-handler";

/** Meta-registered OAuth redirect: /facebook/callback/auth */
export async function GET(request: Request) {
  return handleFacebookOAuthCallback(request);
}
