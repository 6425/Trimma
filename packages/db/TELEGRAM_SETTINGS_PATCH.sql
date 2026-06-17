-- ==============================================================================
-- TRIMMA: TELEGRAM MESSAGING CHANNEL — FULL PATCH
-- ==============================================================================
-- Run in Supabase SQL Editor (safe to re-run).
-- Adds Telegram as a second messaging channel alongside WhatsApp on
-- global_payment_settings, plus optional telegram_chat_id on users for delivery.
-- ==============================================================================

BEGIN;

-- Core Telegram API credentials (from https://my.telegram.org/apps)
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS telegram_enabled BOOLEAN DEFAULT false;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS telegram_api_id TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS telegram_api_hash TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS telegram_production_dc TEXT DEFAULT '2';
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS telegram_production_public_key TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS telegram_bot_token TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS telegram_admin_alert_chat_id TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS telegram_admin_alert_phone TEXT;

-- Trigger toggles (mirror WhatsApp)
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS telegram_reservation_paid_enabled BOOLEAN DEFAULT true;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS telegram_booking_confirmed_enabled BOOLEAN DEFAULT true;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS telegram_booking_rescheduled_enabled BOOLEAN DEFAULT true;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS telegram_booking_cancelled_enabled BOOLEAN DEFAULT true;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS telegram_booking_review_enabled BOOLEAN DEFAULT true;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS telegram_onboarding_invite_enabled BOOLEAN DEFAULT true;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS telegram_booking_created_enabled BOOLEAN DEFAULT true;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS telegram_agent_approval_enabled BOOLEAN DEFAULT true;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS telegram_admin_approval_enabled BOOLEAN DEFAULT true;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS telegram_welcome_customer_enabled BOOLEAN DEFAULT true;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS telegram_agent_lead_assigned_enabled BOOLEAN DEFAULT true;

-- Message templates (mirror WhatsApp defaults)
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS telegram_template_reservation_paid TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS telegram_template_confirmed TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS telegram_template_rescheduled TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS telegram_template_cancelled TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS telegram_template_review TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS telegram_template_onboarding_invite TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS telegram_template_booking_created_customer TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS telegram_template_booking_created_owner TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS telegram_template_agent_approval_owner TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS telegram_template_agent_approval_admin TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS telegram_template_admin_approval_owner TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS telegram_template_admin_approval_admin TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS telegram_template_welcome_customer TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS telegram_template_agent_lead_assigned TEXT;

-- Optional per-user Telegram chat ID for Bot API delivery
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT;

INSERT INTO public.global_payment_settings (id)
VALUES ('00000000-0000-0000-0000-000000000001'::uuid)
ON CONFLICT (id) DO NOTHING;

UPDATE public.global_payment_settings
SET
  telegram_enabled = COALESCE(telegram_enabled, false),
  telegram_production_dc = COALESCE(NULLIF(btrim(telegram_production_dc), ''), '2'),
  telegram_reservation_paid_enabled = COALESCE(telegram_reservation_paid_enabled, true),
  telegram_booking_confirmed_enabled = COALESCE(telegram_booking_confirmed_enabled, true),
  telegram_booking_rescheduled_enabled = COALESCE(telegram_booking_rescheduled_enabled, true),
  telegram_booking_cancelled_enabled = COALESCE(telegram_booking_cancelled_enabled, true),
  telegram_booking_review_enabled = COALESCE(telegram_booking_review_enabled, true),
  telegram_onboarding_invite_enabled = COALESCE(telegram_onboarding_invite_enabled, true),
  telegram_booking_created_enabled = COALESCE(telegram_booking_created_enabled, true),
  telegram_agent_approval_enabled = COALESCE(telegram_agent_approval_enabled, true),
  telegram_admin_approval_enabled = COALESCE(telegram_admin_approval_enabled, true),
  telegram_welcome_customer_enabled = COALESCE(telegram_welcome_customer_enabled, true),
  telegram_agent_lead_assigned_enabled = COALESCE(telegram_agent_lead_assigned_enabled, true)
WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;

COMMIT;

-- After running: Supabase → Settings → API → Reload schema cache
