-- TRIMMA: Meta Facebook app credentials on global_payment_settings (admin UI)
-- Run in Supabase SQL editor after WHATSAPP_SETTINGS_PATCH.sql

ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS facebook_app_id TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS facebook_app_secret TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS facebook_redirect_uri TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS facebook_login_config_id TEXT;

SELECT 'facebook platform settings columns ready' AS status;
