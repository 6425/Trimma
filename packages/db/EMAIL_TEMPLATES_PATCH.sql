-- ==============================================================================
-- TRIMMA: Resend email templates on global_payment_settings (mirrors WhatsApp)
-- ==============================================================================
-- Run in Supabase SQL Editor (safe to re-run).
-- Stores admin-editable subject/body templates and per-trigger toggles.
-- ==============================================================================

BEGIN;

ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS email_enabled BOOLEAN DEFAULT true;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS email_admin_alert_email TEXT;

ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS email_booking_confirmed_enabled BOOLEAN DEFAULT true;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS email_booking_rescheduled_enabled BOOLEAN DEFAULT true;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS email_booking_cancelled_enabled BOOLEAN DEFAULT true;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS email_booking_review_enabled BOOLEAN DEFAULT true;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS email_onboarding_invite_enabled BOOLEAN DEFAULT true;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS email_booking_created_enabled BOOLEAN DEFAULT true;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS email_agent_approval_enabled BOOLEAN DEFAULT true;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS email_admin_approval_enabled BOOLEAN DEFAULT true;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS email_welcome_customer_enabled BOOLEAN DEFAULT true;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS email_agent_lead_assigned_enabled BOOLEAN DEFAULT true;

ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS email_subject_confirmed TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS email_subject_rescheduled TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS email_subject_cancelled TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS email_subject_review TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS email_subject_onboarding_invite TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS email_subject_booking_created_customer TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS email_subject_booking_created_owner TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS email_subject_agent_approval_owner TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS email_subject_agent_approval_admin TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS email_subject_admin_approval_owner TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS email_subject_admin_approval_admin TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS email_subject_welcome_customer TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS email_subject_agent_lead_assigned TEXT;

ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS email_template_confirmed TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS email_template_rescheduled TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS email_template_cancelled TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS email_template_review TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS email_template_onboarding_invite TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS email_template_booking_created_customer TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS email_template_booking_created_owner TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS email_template_agent_approval_owner TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS email_template_agent_approval_admin TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS email_template_admin_approval_owner TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS email_template_admin_approval_admin TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS email_template_welcome_customer TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS email_template_agent_lead_assigned TEXT;

INSERT INTO public.global_payment_settings (id)
VALUES ('00000000-0000-0000-0000-000000000001'::uuid)
ON CONFLICT (id) DO NOTHING;

NOTIFY pgrst, 'reload schema';

COMMIT;

SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'global_payment_settings'
  AND column_name LIKE 'email_%'
ORDER BY column_name;
