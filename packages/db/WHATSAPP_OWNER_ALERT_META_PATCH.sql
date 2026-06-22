-- Meta template name for salon owner new-booking WhatsApp (trigger #6).
-- Run in Supabase SQL Editor after WHATSAPP_META_TEMPLATES_PATCH.sql
--
-- Set to your exact Meta Business Manager template name for owner alerts.
-- Body variables: customer, salon, service, date, time, payment_status.

ALTER TABLE public.global_payment_settings
  ADD COLUMN IF NOT EXISTS whatsapp_meta_template_booking_created_owner TEXT;

NOTIFY pgrst, 'reload schema';

SELECT whatsapp_meta_template_booking_created_owner AS owner_booking_meta_template
FROM public.global_payment_settings
WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;
