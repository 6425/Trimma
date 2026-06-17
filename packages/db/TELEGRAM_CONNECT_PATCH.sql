-- ==============================================================================
-- TRIMMA: TELEGRAM CONNECT FLOW — PATCH
-- ==============================================================================
-- One-time link tokens so customers/salon owners can connect Telegram without
-- entering chat IDs. Safe to re-run.
-- ==============================================================================

BEGIN;

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT;

CREATE TABLE IF NOT EXISTS public.telegram_connect_tokens (
  token TEXT PRIMARY KEY,
  user_email TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_telegram_connect_tokens_email
  ON public.telegram_connect_tokens (user_email);

CREATE INDEX IF NOT EXISTS idx_telegram_connect_tokens_expires
  ON public.telegram_connect_tokens (expires_at);

COMMIT;
