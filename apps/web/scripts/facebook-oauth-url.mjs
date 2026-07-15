/**
 * Print Facebook OAuth URLs and optionally validate App ID + Secret with Meta.
 *
 * Usage:
 *   node scripts/facebook-oauth-url.mjs
 *   node scripts/facebook-oauth-url.mjs --validate
 *
 * Env (apps/web/.env or repo root .env):
 *   FACEBOOK_APP_ID / APPID
 *   FACEBOOK_APP_SECRET / APP_SECRET
 *   FACEBOOK_REDIRECT_URI (default: https://beta.trimma.io/facebook/callback/auth)
 *   FACEBOOK_LOGIN_CONFIG_ID (Business apps — preferred over scope)
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });
dotenv.config({ path: path.join(__dirname, "..", "..", "..", ".env") });

const GRAPH_VERSION = "v19.0";
const SCOPES = ["pages_show_list", "pages_read_engagement", "pages_manage_posts"];

const appId =
  process.env.FACEBOOK_APP_ID?.trim() ||
  process.env.APPID?.trim() ||
  process.env.META_APP_ID?.trim() ||
  "";
const appSecret =
  process.env.FACEBOOK_APP_SECRET?.trim() ||
  process.env.APP_SECRET?.trim() ||
  process.env.META_APP_SECRET?.trim() ||
  "";
const redirectUri =
  process.env.FACEBOOK_REDIRECT_URI?.trim() ||
  "https://beta.trimma.io/facebook/callback/auth";
const loginConfigId =
  process.env.FACEBOOK_LOGIN_CONFIG_ID?.trim() ||
  process.env.META_FACEBOOK_LOGIN_CONFIG_ID?.trim() ||
  "";

if (!appId || !appSecret) {
  console.error("Set FACEBOOK_APP_ID and FACEBOOK_APP_SECRET (or APPID / APP_SECRET) in .env");
  process.exit(1);
}

function buildOAuthUrl({ useConfigId }) {
  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri.replace(/\/$/, ""),
    state: "manual-test",
    response_type: "code",
  });
  if (useConfigId && loginConfigId) {
    params.set("config_id", loginConfigId);
  } else {
    params.set("scope", SCOPES.join(","));
  }
  return `https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth?${params.toString()}`;
}

console.log("App ID:", appId);
console.log("Redirect URI:", redirectUri.replace(/\/$/, ""));
console.log("Scopes (Business config or legacy):", SCOPES.join(", "));
console.log("");

if (loginConfigId) {
  console.log("=== OAuth URL (Facebook Login for Business — recommended) ===");
  console.log(buildOAuthUrl({ useConfigId: true }));
  console.log("");
}

console.log("=== OAuth URL (legacy scope= — may show Invalid Scopes on Business apps) ===");
console.log(buildOAuthUrl({ useConfigId: false }));
console.log("");

console.log("After login, Meta redirects to:");
console.log(`${redirectUri.replace(/\/$/, "")}?code=...&state=...`);
console.log("");
console.log("Trimma callback route exchanges code → user token → GET /v19.0/me/accounts → page token → POST /{PAGE_ID}/feed");

const validate = process.argv.includes("--validate");
if (validate) {
  console.log("");
  console.log("=== Validating App ID + Secret with Meta ===");
  const tokenParams = new URLSearchParams({
    client_id: appId,
    client_secret: appSecret,
    grant_type: "client_credentials",
  });
  const tokenRes = await fetch(
    `https://graph.facebook.com/${GRAPH_VERSION}/oauth/access_token?${tokenParams}`
  );
  const tokenJson = await tokenRes.json();
  if (!tokenRes.ok || !tokenJson.access_token) {
    console.error("FAILED:", tokenJson.error?.message || tokenJson);
    process.exit(1);
  }
  const appRes = await fetch(
    `https://graph.facebook.com/${GRAPH_VERSION}/${appId}?fields=name&access_token=${encodeURIComponent(tokenJson.access_token)}`
  );
  const appJson = await appRes.json();
  console.log("OK — App name:", appJson.name || "(unknown)");
  console.log("me/accounts endpoint:", `https://graph.facebook.com/${GRAPH_VERSION}/me/accounts?access_token={USER_TOKEN}`);
}
