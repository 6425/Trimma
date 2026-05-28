-- Resend API credentials (admin-managed, same pattern as WhatsApp)
-- Run once in Supabase SQL Editor

ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS resend_api_key TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS resend_from_email TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS resend_from_name TEXT;
