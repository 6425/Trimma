-- ==============================================================================
-- ADD WHATSAPP ONBOARDING TEMPLATE COLUMNS
-- ==============================================================================
-- Target: Supabase SQL Editor
-- Description: Adds configuration for the Salon Onboarding WhatsApp trigger.
-- ==============================================================================

ALTER TABLE public.global_payment_settings
ADD COLUMN IF NOT EXISTS whatsapp_onboarding_invite_enabled BOOLEAN DEFAULT true;

ALTER TABLE public.global_payment_settings
ADD COLUMN IF NOT EXISTS whatsapp_template_onboarding_invite TEXT;

-- Also ensure the other missing columns from previous actions are properly added
ALTER TABLE public.global_payment_settings
ADD COLUMN IF NOT EXISTS whatsapp_booking_confirmed_enabled BOOLEAN DEFAULT true;

ALTER TABLE public.global_payment_settings
ADD COLUMN IF NOT EXISTS whatsapp_booking_rescheduled_enabled BOOLEAN DEFAULT true;

ALTER TABLE public.global_payment_settings
ADD COLUMN IF NOT EXISTS whatsapp_booking_cancelled_enabled BOOLEAN DEFAULT true;

ALTER TABLE public.global_payment_settings
ADD COLUMN IF NOT EXISTS whatsapp_booking_review_enabled BOOLEAN DEFAULT true;

SELECT 'WhatsApp onboarding columns added successfully!' AS status;
