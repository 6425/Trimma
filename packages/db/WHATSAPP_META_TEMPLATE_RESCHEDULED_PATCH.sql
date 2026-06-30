-- ==============================================================================
-- WhatsApp Meta template name for booking reschedule alerts (customer)
-- ==============================================================================
-- Run in Supabase SQL Editor, then create + approve the template in Meta Business
-- Manager with the same name (default: appointment_rescheduled).
-- ==============================================================================

ALTER TABLE public.global_payment_settings
  ADD COLUMN IF NOT EXISTS whatsapp_meta_template_rescheduled TEXT;

UPDATE public.global_payment_settings
SET whatsapp_meta_template_rescheduled = COALESCE(
  NULLIF(TRIM(whatsapp_meta_template_rescheduled), ''),
  'appointment_rescheduled'
)
WHERE id = '00000000-0000-0000-0000-000000000001';

SELECT whatsapp_meta_template_rescheduled AS reschedule_meta_template
FROM public.global_payment_settings
WHERE id = '00000000-0000-0000-0000-000000000001';
