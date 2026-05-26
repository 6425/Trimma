-- ==============================================================================
-- TRIMMA: WHATSAPP TEMPLATES & TRIGGERS — FULL PATCH
-- ==============================================================================
-- Run in Supabase SQL Editor (safe to re-run).
-- Ensures all WhatsApp trigger toggles, templates, and admin alert phone exist
-- on global_payment_settings with Trimma default copy.
-- ==============================================================================

BEGIN;

ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS whatsapp_phone_number_id TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS whatsapp_access_token TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS whatsapp_enabled BOOLEAN DEFAULT true;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS whatsapp_admin_alert_phone TEXT;

ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS whatsapp_booking_confirmed_enabled BOOLEAN DEFAULT true;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS whatsapp_booking_rescheduled_enabled BOOLEAN DEFAULT true;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS whatsapp_booking_cancelled_enabled BOOLEAN DEFAULT true;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS whatsapp_booking_review_enabled BOOLEAN DEFAULT true;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS whatsapp_onboarding_invite_enabled BOOLEAN DEFAULT true;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS whatsapp_booking_created_enabled BOOLEAN DEFAULT true;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS whatsapp_agent_approval_enabled BOOLEAN DEFAULT true;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS whatsapp_admin_approval_enabled BOOLEAN DEFAULT true;

ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS whatsapp_template_confirmed TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS whatsapp_template_rescheduled TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS whatsapp_template_cancelled TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS whatsapp_template_review TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS whatsapp_template_onboarding_invite TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS whatsapp_template_booking_created_customer TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS whatsapp_template_booking_created_owner TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS whatsapp_template_agent_approval_owner TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS whatsapp_template_agent_approval_admin TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS whatsapp_template_admin_approval_owner TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS whatsapp_template_admin_approval_admin TEXT;

-- Ensure singleton settings row exists
INSERT INTO public.global_payment_settings (id)
VALUES ('00000000-0000-0000-0000-000000000001'::uuid)
ON CONFLICT (id) DO NOTHING;

UPDATE public.global_payment_settings
SET
  whatsapp_enabled = COALESCE(whatsapp_enabled, true),
  whatsapp_booking_confirmed_enabled = COALESCE(whatsapp_booking_confirmed_enabled, true),
  whatsapp_booking_rescheduled_enabled = COALESCE(whatsapp_booking_rescheduled_enabled, true),
  whatsapp_booking_cancelled_enabled = COALESCE(whatsapp_booking_cancelled_enabled, true),
  whatsapp_booking_review_enabled = COALESCE(whatsapp_booking_review_enabled, true),
  whatsapp_onboarding_invite_enabled = COALESCE(whatsapp_onboarding_invite_enabled, true),
  whatsapp_booking_created_enabled = COALESCE(whatsapp_booking_created_enabled, true),
  whatsapp_agent_approval_enabled = COALESCE(whatsapp_agent_approval_enabled, true),
  whatsapp_admin_approval_enabled = COALESCE(whatsapp_admin_approval_enabled, true),

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
    'This is to notify you that your appointment at *{salon_name}* has been *CANCELLED* by the salon.' || E'\n\n' ||
    '📅 *Original Date:* {booking_date}' || E'\n' ||
    '⏰ *Original Time:* {booking_time}' || E'\n' ||
    '💇 *Service:* {service_name}' || E'\n\n' ||
    'Your 20% online reservation deposit is non-refundable. For any questions about your booking, please contact *{salon_name}* directly.' || E'\n\n' ||
    'Trimma Notification Services ✂️'
  ),

  whatsapp_template_review = COALESCE(
    whatsapp_template_review,
    'Hi {customer_name}! 🌟' || E'\n\n' ||
    'How was your styling at *{salon_name}* today? We would love to hear your feedback!' || E'\n\n' ||
    'Rate your stylist and share your experience here: {review_link}' || E'\n\n' ||
    'Thank you for choosing Trimma! ✂️'
  ),

  whatsapp_template_onboarding_invite = COALESCE(
    whatsapp_template_onboarding_invite,
    'Hi {salon_name} Owner! 🌟' || E'\n\n' ||
    'Your Trimma Salon Partner Profile is ready!' || E'\n\n' ||
    'Please login using your registered Gmail: {owner_gmail}' || E'\n\n' ||
    'Login securely here: {login_link}' || E'\n\n' ||
    'Welcome to Trimma! ✂️'
  ),

  whatsapp_template_booking_created_customer = COALESCE(
    whatsapp_template_booking_created_customer,
    'Hello {customer_name}! 🌟' || E'\n\n' ||
    'Your booking request at *{salon_name}* for *{service_name}* on {booking_date} at {booking_time} has been received and is currently *PENDING* confirmation from the salon.' || E'\n\n' ||
    'We will notify you once they confirm! ✂️'
  ),

  whatsapp_template_booking_created_owner = COALESCE(
    whatsapp_template_booking_created_owner,
    '🔔 *NEW BOOKING REQUEST* 🔔' || E'\n\n' ||
    'You have a new booking request from {customer_name}.' || E'\n\n' ||
    '📅 Date: {booking_date}' || E'\n' ||
    '⏰ Time: {booking_time}' || E'\n' ||
    '💇 Service: {service_name}' || E'\n' ||
    '💳 Payment Status: {payment_status}' || E'\n\n' ||
    'Please open your Trimma Dashboard to Confirm or Decline this request.'
  ),

  whatsapp_template_agent_approval_owner = COALESCE(
    whatsapp_template_agent_approval_owner,
    '🎉 *Congratulations from Trimma!* 🎉' || E'\n\n' ||
    'Your salon, *{salon_name}*, has been approved by your assigned agent and is now *LIVE* for bookings on the marketplace! 🚀' || E'\n\n' ||
    'The platform admin will now review your profile to grant you the official *Approved* badge.'
  ),

  whatsapp_template_agent_approval_admin = COALESCE(
    whatsapp_template_agent_approval_admin,
    '🔔 *AGENT APPROVAL ALERT* 🔔' || E'\n\n' ||
    'Salon *{salon_name}* has just been approved by their agent and is now live.' || E'\n\n' ||
    'Please review their profile in the Admin Dashboard to grant them the *Approved Badge*.'
  ),

  whatsapp_template_admin_approval_owner = COALESCE(
    whatsapp_template_admin_approval_owner,
    '🌟 *TRIMMA VERIFIED STATUS ACHIEVED!* 🌟' || E'\n\n' ||
    'Congratulations! The Trimma Admin Team has reviewed your profile and officially granted *{salon_name}* the *Approved Badge*! ✅' || E'\n\n' ||
    'This badge builds trust with customers and boosts your visibility.'
  ),

  whatsapp_template_admin_approval_admin = COALESCE(
    whatsapp_template_admin_approval_admin,
    '✅ *BADGE GRANTED* ✅' || E'\n\n' ||
    'You have successfully verified and granted the Approved Badge to *{salon_name}*.'
  )
WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;

-- Refresh legacy cancel templates that still mention automatic refunds
UPDATE public.global_payment_settings
SET whatsapp_template_cancelled =
  'Hello {customer_name},' || E'\n\n' ||
  'This is to notify you that your appointment at *{salon_name}* has been *CANCELLED* by the salon.' || E'\n\n' ||
  '📅 *Original Date:* {booking_date}' || E'\n' ||
  '⏰ *Original Time:* {booking_time}' || E'\n' ||
  '💇 *Service:* {service_name}' || E'\n\n' ||
  'Your 20% online reservation deposit is non-refundable. For any questions about your booking, please contact *{salon_name}* directly.' || E'\n\n' ||
  'Trimma Notification Services ✂️'
WHERE id = '00000000-0000-0000-0000-000000000001'::uuid
  AND (
    whatsapp_template_cancelled IS NULL
    OR whatsapp_template_cancelled ILIKE '%refund%'
  );

COMMIT;

SELECT
  whatsapp_booking_confirmed_enabled,
  whatsapp_booking_created_enabled,
  whatsapp_agent_approval_enabled,
  whatsapp_admin_approval_enabled,
  length(whatsapp_template_confirmed) AS confirmed_len,
  length(whatsapp_template_cancelled) AS cancelled_len
FROM public.global_payment_settings
WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;
