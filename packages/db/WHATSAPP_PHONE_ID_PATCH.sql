-- ==============================================================================
-- TRIMMA: Update WhatsApp Phone Number ID (App ID)
-- ==============================================================================
-- Run once in Supabase SQL Editor.
-- Sets the Meta WhatsApp Phone Number ID used by Trimma for Cloud API sends.
-- Does NOT change whatsapp_access_token — keep your permanent token in Vercel
-- (WHATSAPP_ACCESS_TOKEN) and/or Admin → Global Settings as-is.
-- ==============================================================================

UPDATE public.global_payment_settings
SET
  whatsapp_phone_number_id = '100068412247940',
  whatsapp_enabled = true
WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;

SELECT
  whatsapp_phone_number_id AS phone_number_id,
  whatsapp_enabled,
  CASE
    WHEN whatsapp_access_token IS NOT NULL AND btrim(whatsapp_access_token) <> ''
      THEN 'access token present (unchanged by this script)'
    ELSE 'no token stored in DB — production uses Vercel WHATSAPP_ACCESS_TOKEN'
  END AS token_status
FROM public.global_payment_settings
WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;
