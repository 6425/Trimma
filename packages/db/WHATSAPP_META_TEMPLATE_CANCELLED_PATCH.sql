-- Meta templates for customer cancellation & reschedule outside the 24h booking session window

ALTER TABLE public.global_payment_settings
  ADD COLUMN IF NOT EXISTS whatsapp_meta_template_cancelled TEXT;

UPDATE public.global_payment_settings
SET
  whatsapp_meta_template_cancelled = COALESCE(
    NULLIF(TRIM(whatsapp_meta_template_cancelled), ''),
    'appointment_cancelled'
  ),
  whatsapp_meta_template_rescheduled = COALESCE(
    NULLIF(TRIM(whatsapp_meta_template_rescheduled), ''),
    'appointment_rescheduled'
  )
WHERE id = '00000000-0000-0000-0000-000000000001';

SELECT
  whatsapp_meta_template_cancelled AS cancel_meta_template,
  whatsapp_meta_template_rescheduled AS reschedule_meta_template
FROM public.global_payment_settings
WHERE id = '00000000-0000-0000-0000-000000000001';
