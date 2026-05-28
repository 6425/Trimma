-- ==============================================================================
-- TRIMMA: Clear stale WhatsApp access token from Supabase
-- ==============================================================================
-- Use when WHATSAPP_ACCESS_TOKEN is set in Vercel (permanent token) but Admin
-- Settings still shows an old expired token from the database.
-- Production always prefers Vercel env; this removes the stale DB copy.
-- Does NOT change whatsapp_phone_number_id.
-- ==============================================================================

UPDATE public.global_payment_settings
SET whatsapp_access_token = NULL
WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;

SELECT
  whatsapp_phone_number_id AS phone_number_id,
  CASE
    WHEN whatsapp_access_token IS NULL OR btrim(whatsapp_access_token) = ''
      THEN 'DB token cleared — app uses Vercel WHATSAPP_ACCESS_TOKEN'
    ELSE 'DB token still present'
  END AS token_status
FROM public.global_payment_settings
WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;
