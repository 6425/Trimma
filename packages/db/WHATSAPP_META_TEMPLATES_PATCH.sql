-- WHATSAPP_META_TEMPLATES_PATCH.sql
-- Maps Trimma booking triggers to Meta-approved WhatsApp Business template names.
-- Run in Supabase SQL Editor after WHATSAPP_TEMPLATES_FULL_PATCH.sql
--
-- Template 1 (slot locked / reservation paid): whatsapp_meta_template_reservation_paid
-- Template 2 (booking confirmed):            whatsapp_meta_template_confirmed
--
-- Use the EXACT template name from Meta Business Manager → WhatsApp → Message templates.

ALTER TABLE public.global_payment_settings
  ADD COLUMN IF NOT EXISTS whatsapp_meta_template_reservation_paid TEXT;

ALTER TABLE public.global_payment_settings
  ADD COLUMN IF NOT EXISTS whatsapp_meta_template_confirmed TEXT;

ALTER TABLE public.global_payment_settings
  ADD COLUMN IF NOT EXISTS whatsapp_meta_template_language TEXT DEFAULT 'en_US';

UPDATE public.global_payment_settings
SET
  whatsapp_meta_template_language = COALESCE(NULLIF(TRIM(whatsapp_meta_template_language), ''), 'en_US'),
  whatsapp_meta_template_confirmed = COALESCE(
    NULLIF(TRIM(whatsapp_meta_template_confirmed), ''),
    'confirmmessage'
  )
WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;

NOTIFY pgrst, 'reload schema';

SELECT
  whatsapp_meta_template_reservation_paid AS template_1_slot_locked,
  whatsapp_meta_template_confirmed AS template_2_confirmed,
  whatsapp_meta_template_language AS language_code
FROM public.global_payment_settings
WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;
