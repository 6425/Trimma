-- ==============================================================================
-- WHATSAPP BUSINESS CLOUD API SCHEMAS PATCH (SELF-HEALING)
-- ==============================================================================
-- Run this script in your Supabase SQL Editor.
-- It extends the global_payment_settings table to support dynamic WhatsApp configurations.
-- ==============================================================================

-- 1. Add WhatsApp config columns if they do not exist
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS whatsapp_phone_number_id TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS whatsapp_access_token TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS whatsapp_enabled BOOLEAN DEFAULT true;

-- 2. Populate default values for sandbox fallback (using the Phone ID we successfully configured)
UPDATE public.global_payment_settings 
SET 
  whatsapp_phone_number_id = COALESCE(whatsapp_phone_number_id, '1167527226439884'),
  whatsapp_enabled = COALESCE(whatsapp_enabled, true)
WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;

-- ==============================================================================
-- SUCCESS MESSAGE
-- ==============================================================================
SELECT 'WhatsApp Configuration columns added successfully!' AS status;
