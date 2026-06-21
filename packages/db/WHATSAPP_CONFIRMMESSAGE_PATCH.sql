-- Set Meta WhatsApp confirmation template for first customer booking message.
-- Template name in Meta Business Manager: confirmmessage

UPDATE public.global_payment_settings
SET
  whatsapp_meta_template_confirmed = 'confirmmessage',
  whatsapp_meta_template_language = 'en_US'
WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;

NOTIFY pgrst, 'reload schema';

SELECT whatsapp_meta_template_confirmed AS template_2_confirmed
FROM public.global_payment_settings
WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;
