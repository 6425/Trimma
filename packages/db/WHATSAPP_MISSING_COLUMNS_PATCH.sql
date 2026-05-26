-- ==============================================================================
-- WHATSAPP: ADD MISSING COLUMNS (run if save fails on whatsapp_admin_alert_phone)
-- ==============================================================================
-- Safe to re-run. Use this if you already ran WHATSAPP_TEMPLATES_PATCH.sql
-- (4 templates only). For a full setup, prefer WHATSAPP_TEMPLATES_FULL_PATCH.sql.
-- ==============================================================================

BEGIN;

ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS whatsapp_admin_alert_phone TEXT;

ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS whatsapp_onboarding_invite_enabled BOOLEAN DEFAULT true;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS whatsapp_booking_created_enabled BOOLEAN DEFAULT true;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS whatsapp_agent_approval_enabled BOOLEAN DEFAULT true;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS whatsapp_admin_approval_enabled BOOLEAN DEFAULT true;

ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS whatsapp_template_onboarding_invite TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS whatsapp_template_booking_created_customer TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS whatsapp_template_booking_created_owner TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS whatsapp_template_agent_approval_owner TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS whatsapp_template_agent_approval_admin TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS whatsapp_template_admin_approval_owner TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS whatsapp_template_admin_approval_admin TEXT;

INSERT INTO public.global_payment_settings (id)
VALUES ('00000000-0000-0000-0000-000000000001'::uuid)
ON CONFLICT (id) DO NOTHING;

UPDATE public.global_payment_settings
SET
  whatsapp_onboarding_invite_enabled = COALESCE(whatsapp_onboarding_invite_enabled, true),
  whatsapp_booking_created_enabled = COALESCE(whatsapp_booking_created_enabled, true),
  whatsapp_agent_approval_enabled = COALESCE(whatsapp_agent_approval_enabled, true),
  whatsapp_admin_approval_enabled = COALESCE(whatsapp_admin_approval_enabled, true)
WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;

COMMIT;

-- Refresh PostgREST schema cache so Supabase API sees new columns immediately
NOTIFY pgrst, 'reload schema';

SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'global_payment_settings'
  AND column_name LIKE 'whatsapp_%'
ORDER BY column_name;
