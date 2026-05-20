-- ==============================================================================
-- WHATSAPP NOTIFICATION TRIGGERS SCHEMAS PATCH (SELF-HEALING)
-- ==============================================================================
-- Run this script in your Supabase SQL Editor.
-- It extends the global_payment_settings table to support dynamic notification triggers.
-- ==============================================================================

-- 1. Add toggle columns if they do not exist
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS whatsapp_booking_confirmed_enabled BOOLEAN DEFAULT true;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS whatsapp_booking_rescheduled_enabled BOOLEAN DEFAULT true;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS whatsapp_booking_cancelled_enabled BOOLEAN DEFAULT true;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS whatsapp_booking_review_enabled BOOLEAN DEFAULT true;

-- 2. Populate default values for dynamic hot-toggles
UPDATE public.global_payment_settings 
SET 
  whatsapp_booking_confirmed_enabled = COALESCE(whatsapp_booking_confirmed_enabled, true),
  whatsapp_booking_rescheduled_enabled = COALESCE(whatsapp_booking_rescheduled_enabled, true),
  whatsapp_booking_cancelled_enabled = COALESCE(whatsapp_booking_cancelled_enabled, true),
  whatsapp_booking_review_enabled = COALESCE(whatsapp_booking_review_enabled, true)
WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;

-- ==============================================================================
-- SUCCESS MESSAGE
-- ==============================================================================
SELECT 'WhatsApp trigger columns added successfully!' AS status;
