-- ==============================================================================
-- TRIMMA: ONBOARDING WEB FORM — SALON LEADS PATCH
-- Safe to re-run. Run in Supabase SQL Editor if onboarding form submissions fail.
-- ==============================================================================

BEGIN;

ALTER TABLE public.salon_leads ADD COLUMN IF NOT EXISTS owner_name TEXT;
ALTER TABLE public.salon_leads ADD COLUMN IF NOT EXISTS owner_email TEXT;
ALTER TABLE public.salon_leads ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;
ALTER TABLE public.salon_leads ADD COLUMN IF NOT EXISTS province TEXT;
ALTER TABLE public.salon_leads ADD COLUMN IF NOT EXISTS district TEXT;
ALTER TABLE public.salon_leads ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.salon_leads ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.salon_leads ADD COLUMN IF NOT EXISTS lead_source TEXT DEFAULT 'system';
ALTER TABLE public.salon_leads ADD COLUMN IF NOT EXISTS lead_status TEXT DEFAULT 'NEW';
ALTER TABLE public.salon_leads ADD COLUMN IF NOT EXISTS onboarding_stage TEXT DEFAULT 'NOT_STARTED';

ALTER TABLE public.salon_leads ALTER COLUMN place_id DROP NOT NULL;

ALTER TABLE public.salon_leads DROP CONSTRAINT IF EXISTS check_lead_status;
ALTER TABLE public.salon_leads ADD CONSTRAINT check_lead_status
  CHECK (lead_status IN ('NEW', 'UNDER_REVIEW', 'ASSIGNED_TO_AGENT', 'CONTACTED', 'INTERESTED', 'NOT_INTERESTED', 'REJECTED', 'DUPLICATE'));

ALTER TABLE public.salon_leads DROP CONSTRAINT IF EXISTS check_onboarding_stage;
ALTER TABLE public.salon_leads ADD CONSTRAINT check_onboarding_stage
  CHECK (onboarding_stage IN ('NOT_STARTED', 'CONTACT_ESTABLISHED', 'DATA_COLLECTION', 'SUBMITTED_FOR_APPROVAL', 'CONVERTED'));

COMMIT;
