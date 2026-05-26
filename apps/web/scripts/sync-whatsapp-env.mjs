import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.join(__dirname, "..");
dotenv.config({ path: path.join(webRoot, ".env") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function updateEnvFile(filePath, token, phoneId) {
  if (!fs.existsSync(filePath)) return false;
  let content = fs.readFileSync(filePath, "utf8");
  content = content.replace(
    /WHATSAPP_ACCESS_TOKEN="[^"]*"/,
    `WHATSAPP_ACCESS_TOKEN="${token}"`
  );
  if (phoneId) {
    content = content.replace(
      /WHATSAPP_PHONE_NUMBER_ID="[^"]*"/,
      `WHATSAPP_PHONE_NUMBER_ID="${phoneId}"`
    );
  }
  fs.writeFileSync(filePath, content);
  return true;
}

const { data, error } = await supabase
  .from("global_payment_settings")
  .select("whatsapp_access_token, whatsapp_phone_number_id")
  .eq("id", "00000000-0000-0000-0000-000000000001")
  .single();

if (error || !data?.whatsapp_access_token) {
  console.error("Could not load WhatsApp settings from database:", error?.message);
  process.exit(1);
}

const token = data.whatsapp_access_token.trim();
const phoneId = (data.whatsapp_phone_number_id || process.env.WHATSAPP_PHONE_NUMBER_ID || "").trim();

updateEnvFile(path.join(webRoot, ".env"), token, phoneId);
updateEnvFile(path.join(webRoot, "..", "..", ".env"), token, phoneId);

const response = await fetch(
  `https://graph.facebook.com/v18.0/${phoneId}?fields=verified_name`,
  { headers: { Authorization: `Bearer ${token}` } }
);
const result = await response.json();

if (!response.ok) {
  console.error("Meta token validation failed:", result.error?.message || "unknown");
  process.exit(1);
}

console.log("ENV_SYNCED_OK");
console.log("META_VALIDATE_OK", result.verified_name || "connected");
