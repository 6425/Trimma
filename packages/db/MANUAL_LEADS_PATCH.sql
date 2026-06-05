-- ==============================================================================
-- TRIMMA PLATFORM: ADD MANUAL LEADS FIELDS TO SALON LEADS
-- ==============================================================================

-- 1. Add missing columns for manual managed onboarding
ALTER TABLE public.salon_leads ADD COLUMN IF NOT EXISTS owner_name TEXT;
ALTER TABLE public.salon_leads ADD COLUMN IF NOT EXISTS owner_email TEXT;
ALTER TABLE public.salon_leads ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;
ALTER TABLE public.salon_leads ADD COLUMN IF NOT EXISTS province TEXT;
ALTER TABLE public.salon_leads ADD COLUMN IF NOT EXISTS district TEXT;
ALTER TABLE public.salon_leads ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.salon_leads ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2. Relax constraints on place_id to allow manual leads
-- A manual lead won't have a place_id initially. We'll drop the NOT NULL.
ALTER TABLE public.salon_leads ALTER COLUMN place_id DROP NOT NULL;

-- Note: place_id has a UNIQUE constraint, so multiple NULLs are allowed in Postgres,
-- which is fine for our manual leads!
