-- Customer reschedule request → salon owner WhatsApp trigger + templates

ALTER TABLE public.global_payment_settings
  ADD COLUMN IF NOT EXISTS whatsapp_reschedule_request_enabled BOOLEAN DEFAULT true;

ALTER TABLE public.global_payment_settings
  ADD COLUMN IF NOT EXISTS whatsapp_template_reschedule_request_owner TEXT;

ALTER TABLE public.global_payment_settings
  ADD COLUMN IF NOT EXISTS whatsapp_meta_template_reschedule_request_owner TEXT;

ALTER TABLE public.global_payment_settings
  ADD COLUMN IF NOT EXISTS whatsapp_meta_template_rescheduled TEXT;

UPDATE public.global_payment_settings
SET
  whatsapp_reschedule_request_enabled = COALESCE(whatsapp_reschedule_request_enabled, true),
  whatsapp_template_reschedule_request_owner = COALESCE(
    whatsapp_template_reschedule_request_owner,
    '🔔 *RESCHEDULE REQUEST* 🔔

*{customer_name}* ({customer_email}) asked to move *{service_name}*.

📅 Current: {booking_date} · ⏰ {booking_time}
📅 Requested: {requested_date} · ⏰ {requested_time}
📋 Ref: {booking_no}

Open Trimma Dashboard → Bookings to approve or decline:
{dashboard_link}'
  ),
  whatsapp_meta_template_rescheduled = COALESCE(
    NULLIF(TRIM(whatsapp_meta_template_rescheduled), ''),
    'appointment_rescheduled'
  ),
  whatsapp_meta_template_reschedule_request_owner = COALESCE(
    NULLIF(TRIM(whatsapp_meta_template_reschedule_request_owner), ''),
    'appointment_reschedule_request'
  )
WHERE id = '00000000-0000-0000-0000-000000000001';
