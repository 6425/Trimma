import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/config/supabase-admin";
import { getTelegramConfig } from "@/app/actions/telegram";
import {
  buildTelegramWebhookSecret,
  parseTelegramConnectStartText,
  completeTelegramConnectToken,
} from "@/lib/telegram-connect-core";

export async function POST(request: Request) {
  try {
    const config = await getTelegramConfig();
    if (!config.botToken) {
      return NextResponse.json({ ok: true });
    }

    const expectedSecret = buildTelegramWebhookSecret(config.botToken);
    const receivedSecret = request.headers.get("x-telegram-bot-api-secret-token") || "";
    if (receivedSecret !== expectedSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const update = await request.json();
    const message = update?.message || update?.edited_message;
    const token = parseTelegramConnectStartText(message?.text);
    const chatId = message?.chat?.id;

    if (!token || chatId == null) {
      return NextResponse.json({ ok: true });
    }

    const supabase = createSupabaseAdminClient();
    const result = await completeTelegramConnectToken(supabase, token, String(chatId));

    if (result.linked) {
      await fetch(`https://api.telegram.org/bot${config.botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: String(chatId),
          text: "✅ Trimma notifications connected! You'll receive booking alerts here on Telegram. Your WhatsApp number stays the same — no extra details needed.",
        }),
      });
    }

    return NextResponse.json({ ok: true, linked: result.linked });
  } catch (err: unknown) {
    console.error("[telegram/webhook]", err);
    return NextResponse.json({ ok: true });
  }
}
