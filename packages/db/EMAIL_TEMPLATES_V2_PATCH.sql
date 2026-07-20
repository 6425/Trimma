-- ==============================================================================
-- TRIMMA: Email & WhatsApp Templates V2
-- ==============================================================================
-- Run in Supabase SQL Editor (safe to re-run).
--
-- Adds:
--   • Trigger #1: Reservation payment received (30% fee, slot locked)
--   • Sinhala (_si) and Tamil (_ta) email body columns for all 14 triggers
--   • Matching WhatsApp reservation-paid + welcome + agent-lead templates
-- ==============================================================================

BEGIN;

-- ── Email toggles ─────────────────────────────────────────────────────────────
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS email_reservation_paid_enabled BOOLEAN DEFAULT true;

-- ── Email subjects ────────────────────────────────────────────────────────────
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS email_subject_reservation_paid TEXT;

-- ── Email bodies (English + Sinhala + Tamil) ──────────────────────────────────
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS email_template_reservation_paid TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS email_template_reservation_paid_si TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS email_template_reservation_paid_ta TEXT;

ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS email_template_confirmed_si TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS email_template_confirmed_ta TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS email_template_rescheduled_si TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS email_template_rescheduled_ta TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS email_template_cancelled_si TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS email_template_cancelled_ta TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS email_template_review_si TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS email_template_review_ta TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS email_template_onboarding_invite_si TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS email_template_onboarding_invite_ta TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS email_template_booking_created_customer_si TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS email_template_booking_created_customer_ta TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS email_template_booking_created_owner_si TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS email_template_booking_created_owner_ta TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS email_template_agent_approval_owner_si TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS email_template_agent_approval_owner_ta TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS email_template_agent_approval_admin_si TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS email_template_agent_approval_admin_ta TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS email_template_admin_approval_owner_si TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS email_template_admin_approval_owner_ta TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS email_template_admin_approval_admin_si TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS email_template_admin_approval_admin_ta TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS email_template_welcome_customer_si TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS email_template_welcome_customer_ta TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS email_template_agent_lead_assigned_si TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS email_template_agent_lead_assigned_ta TEXT;

-- ── WhatsApp toggles & templates ────────────────────────────────────────────
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS whatsapp_reservation_paid_enabled BOOLEAN DEFAULT true;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS whatsapp_welcome_customer_enabled BOOLEAN DEFAULT true;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS whatsapp_agent_lead_assigned_enabled BOOLEAN DEFAULT true;

ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS whatsapp_template_reservation_paid TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS whatsapp_template_welcome_customer TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS whatsapp_template_agent_lead_assigned TEXT;

INSERT INTO public.global_payment_settings (id)
VALUES ('00000000-0000-0000-0000-000000000001'::uuid)
ON CONFLICT (id) DO NOTHING;

NOTIFY pgrst, 'reload schema';

COMMIT;

SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'global_payment_settings'
  AND (
    column_name LIKE 'email_%reservation%'
    OR column_name LIKE 'email_%_si'
    OR column_name LIKE 'email_%_ta'
    OR column_name LIKE 'whatsapp_%reservation%'
    OR column_name LIKE 'whatsapp_%welcome%'
    OR column_name LIKE 'whatsapp_%agent_lead%'
  )
ORDER BY column_name;
