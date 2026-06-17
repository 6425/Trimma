import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SETTINGS_ID = "00000000-0000-0000-0000-000000000001";

function maskToken(token) {
  if (!token) return "(missing)";
  if (token.length <= 10) return "***";
  return `${token.slice(0, 6)}...${token.slice(-4)}`;
}

async function main() {
  const { data, error } = await supabase
    .from("global_payment_settings")
    .select(
      "telegram_enabled, telegram_api_id, telegram_api_hash, telegram_production_dc, telegram_bot_token, telegram_admin_alert_chat_id, telegram_admin_alert_phone, telegram_template_confirmed"
    )
    .eq("id", SETTINGS_ID)
    .maybeSingle();

  if (error) {
    console.error("DB_ERROR:", error.message);
    process.exit(1);
  }

  if (!data) {
    console.log("STATUS: NO_SETTINGS_ROW");
    process.exit(1);
  }

  const envToken = process.env.TELEGRAM_BOT_TOKEN?.trim() || "";
  const botToken = envToken || data.telegram_bot_token?.trim() || "";
  const tokenSource = envToken ? "vercel/env" : data.telegram_bot_token ? "database" : "none";

  console.log("--- Telegram config (from Supabase) ---");
  console.log("enabled:", data.telegram_enabled === true);
  console.log("api_id:", data.telegram_api_id ? "set" : "not set");
  console.log("api_hash:", data.telegram_api_hash ? "set" : "not set");
  console.log("production_dc:", data.telegram_production_dc || "2");
  console.log("bot_token:", maskToken(botToken), `(${tokenSource})`);
  console.log("admin_alert_chat_id:", data.telegram_admin_alert_chat_id || "(not set)");
  console.log("admin_alert_phone:", data.telegram_admin_alert_phone || "(not set)");
  console.log("template_confirmed:", data.telegram_template_confirmed ? "custom" : "default");

  const issues = [];
  const ok = [];

  if (data.telegram_enabled !== true) issues.push("Telegram is disabled in settings.");
  else ok.push("Telegram is enabled.");

  if (!botToken) issues.push("Bot token is missing (save in Admin or set TELEGRAM_BOT_TOKEN).");
  else ok.push("Bot token is present.");

  if (!data.telegram_admin_alert_chat_id?.trim()) {
    issues.push("Admin alert chat ID is not set (tap Start on bot, then Detect).");
  } else ok.push(`Admin chat ID configured: ${data.telegram_admin_alert_chat_id}`);

  if (botToken) {
    const meRes = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
    const me = await meRes.json();
    if (me.ok) {
      ok.push(`Bot validated: @${me.result.username} (${me.result.first_name})`);
    } else {
      issues.push(`Bot token rejected by Telegram: ${me.description || "invalid"}`);
    }

    const updatesRes = await fetch(`https://api.telegram.org/bot${botToken}/getUpdates?limit=10`);
    const updates = await updatesRes.json();
    if (updates.ok) {
      const chatIds = new Set();
      for (const u of updates.result || []) {
        const chat = u.message?.chat || u.edited_message?.chat;
        if (chat?.id) chatIds.add(String(chat.id));
      }
      if (chatIds.size) {
        ok.push(`Bot inbox has ${chatIds.size} starter(s): ${[...chatIds].join(", ")}`);
        if (
          data.telegram_admin_alert_chat_id?.trim() &&
          !chatIds.has(data.telegram_admin_alert_chat_id.trim())
        ) {
          issues.push(
            "Admin chat ID is set but not seen in recent bot starters — re-detect or send /start again."
          );
        }
      } else {
        issues.push("No one has pressed Start on the bot yet (getUpdates empty).");
      }
    }

    if (data.telegram_admin_alert_chat_id?.trim() && me.ok) {
      const testRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: data.telegram_admin_alert_chat_id.trim(),
          text: "Trimma setup check: your Telegram admin alerts are configured correctly.",
        }),
      });
      const test = await testRes.json();
      if (test.ok) ok.push("Test message sent to admin chat ID successfully.");
      else
        issues.push(
          `Could not message admin chat ID: ${test.description || "failed"} (user must /start bot first).`
        );
    }
  }

  console.log("\n--- OK ---");
  ok.forEach((line) => console.log("✓", line));
  if (issues.length) {
    console.log("\n--- Issues ---");
    issues.forEach((line) => console.log("✗", line));
    process.exit(issues.some((i) => i.includes("rejected") || i.includes("missing")) ? 1 : 0);
  }
  console.log("\nOVERALL: Setup looks good.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
