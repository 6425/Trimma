/**
 * Print the Facebook OAuth URL for manual testing.
 * Usage: node scripts/facebook-oauth-url.mjs
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });
dotenv.config({ path: path.join(__dirname, "..", "..", "..", ".env") });

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
const base =
  process.env.FACEBOOK_REDIRECT_URI?.trim() ||
  `${(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "")}/facebook/callback/auth`;
const scopes = ["pages_show_list", "pages_read_engagement", "pages_manage_posts"];

if (!appId || !appSecret) {
  console.error("Set FACEBOOK_APP_ID and FACEBOOK_APP_SECRET in apps/web/.env first.");
  process.exit(1);
}

const params = new URLSearchParams({
  client_id: appId,
  redirect_uri: base,
  state: "manual-test",
  scope: scopes.join(","),
  response_type: "code",
});

const url = `https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`;

console.log("Redirect URI (add to Meta app):");
console.log(base);
console.log("");
console.log("OAuth URL:");
console.log(url);
