-- ==============================================================================
-- WHATSAPP NOTIFICATION TEMPLATES PATCH (SELF-HEALING) — PARTIAL (4 templates)
-- ==============================================================================
-- ⚠️  SUPERSEDED: For all 11 triggers + admin alert phone, run instead:
--     packages/db/WHATSAPP_TEMPLATES_FULL_PATCH.sql
--     (or WHATSAPP_MISSING_COLUMNS_PATCH.sql if you already ran this file)
-- ==============================================================================
-- Run this script in your Supabase SQL Editor.
-- It extends the global_payment_settings table to support customizable template text.
-- ==============================================================================

-- 1. Add template text columns if they do not exist
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS whatsapp_template_confirmed TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS whatsapp_template_rescheduled TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS whatsapp_template_cancelled TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS whatsapp_template_review TEXT;

-- 2. Populate default template content
UPDATE public.global_payment_settings 
SET 
  whatsapp_template_confirmed = COALESCE(
    whatsapp_template_confirmed, 
    'Hi {customer_name}! 🌟' || E'\n\n' ||
    'Your appointment at *{salon_name}* has been successfully secured!' || E'\n\n' ||
    '📅 *Date:* {booking_date}' || E'\n' ||
    '⏰ *Time:* {booking_time}' || E'\n' ||
    '💇 *Service:* {service_name}' || E'\n' ||
    '💰 *Total Price:* LKR {total_price}' || E'\n' ||
    '✅ *20% Deposit Paid:* LKR {deposit_paid}' || E'\n' ||
    '💵 *Balance to pay at salon:* LKR {balance_to_pay}' || E'\n\n' ||
    '📍 *Salon Location:* {salon_address}' || E'\n' ||
    '🗺️ *Navigate on Google Maps:* {maps_link}' || E'\n\n' ||
    'Thank you for choosing Trimma! See you soon! ✂️'
  ),
  whatsapp_template_rescheduled = COALESCE(
    whatsapp_template_rescheduled, 
    'Hi {customer_name}! 🌟' || E'\n\n' ||
    'Your appointment at *{salon_name}* has been successfully *RESCHEDULED* to a new date and time!' || E'\n\n' ||
    '📅 *New Date:* {booking_date}' || E'\n' ||
    '⏰ *New Time:* {booking_time}' || E'\n' ||
    '💇 *Service:* {service_name}' || E'\n\n' ||
    '📍 *Salon Location:* {salon_address}' || E'\n' ||
    '🗺️ *Navigate on Google Maps:* {maps_link}' || E'\n\n' ||
    'Thank you for choosing Trimma! See you soon! ✂️'
  ),
  whatsapp_template_cancelled = COALESCE(
    whatsapp_template_cancelled, 
    'Hello {customer_name},' || E'\n\n' ||
    'This is to notify you that your appointment at *{salon_name}* has been successfully *CANCELLED*.' || E'\n\n' ||
    '📅 *Original Date:* {booking_date}' || E'\n' ||
    '⏰ *Original Time:* {booking_time}' || E'\n' ||
    '💇 *Service:* {service_name}' || E'\n\n' ||
    'Your 20% online reservation deposit is non-refundable. For any questions about your booking, please contact the salon directly.' || E'\n\n' ||
    'Trimma Notification Services ✂️'
  ),
  whatsapp_template_review = COALESCE(
    whatsapp_template_review, 
    'Hi {customer_name}! 🌟' || E'\n\n' ||
    'How was your styling at *{salon_name}* today? We would love to hear your feedback!' || E'\n\n' ||
    'Rate your stylist and share your experience here: {review_link}' || E'\n\n' ||
    'Thank you for choosing Trimma! ✂️'
  )
WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;

-- ==============================================================================
-- SUCCESS MESSAGE
-- ==============================================================================
SELECT 'WhatsApp template columns added and populated successfully!' AS status;
