-- ==============================================================================
-- GOLDEN ARCHITECTURE ONBOARDING CRM DATABASE PATCH
-- Safe, production-grade schema migration for lead pipeline stages & audit logs
-- Target: Supabase SQL Editor
-- ==============================================================================

-- 1. Create the Lead Activity logs (Audit Trail)
CREATE TABLE IF NOT EXISTS public.lead_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL, -- References salon_leads(id)
  actor_email TEXT NOT NULL,
  action TEXT NOT NULL, -- e.g., 'STATUS_CHANGE', 'STAGE_CHANGE', 'NOTE_ADDED', 'AGENT_ASSIGNED'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Safely add columns to salon_leads table
ALTER TABLE public.salon_leads ADD COLUMN IF NOT EXISTS lead_status TEXT DEFAULT 'NEW';
ALTER TABLE public.salon_leads ADD COLUMN IF NOT EXISTS onboarding_stage TEXT DEFAULT 'NOT_STARTED';
ALTER TABLE public.salon_leads ADD COLUMN IF NOT EXISTS lead_score INTEGER DEFAULT 0;

-- 2. Apply strict constraints on status and onboarding stage columns
ALTER TABLE public.salon_leads DROP CONSTRAINT IF EXISTS check_lead_status;
ALTER TABLE public.salon_leads ADD CONSTRAINT check_lead_status 
  CHECK (lead_status IN ('NEW', 'UNDER_REVIEW', 'ASSIGNED_TO_AGENT', 'CONTACTED', 'INTERESTED', 'NOT_INTERESTED', 'REJECTED', 'DUPLICATE'));

ALTER TABLE public.salon_leads DROP CONSTRAINT IF EXISTS check_onboarding_stage;
ALTER TABLE public.salon_leads ADD CONSTRAINT check_onboarding_stage 
  CHECK (onboarding_stage IN ('NOT_STARTED', 'CONTACT_ESTABLISHED', 'DATA_COLLECTION', 'SUBMITTED_FOR_APPROVAL', 'CONVERTED'));

-- 3. Safely establish foreign key relationships if not already present
-- We check if foreign key constraint exists first to prevent failure
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_lead_activity_logs_lead'
  ) THEN
    ALTER TABLE public.lead_activity_logs 
      ADD CONSTRAINT fk_lead_activity_logs_lead 
      FOREIGN KEY (lead_id) REFERENCES public.salon_leads(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 4. Enable Row Level Security (RLS) on both tables
ALTER TABLE public.salon_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_activity_logs ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies for salon_leads
DROP POLICY IF EXISTS "Admins can fully manage all salon leads" ON public.salon_leads;
CREATE POLICY "Admins can fully manage all salon leads" 
ON public.salon_leads 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE email = auth.jwt() ->> 'email' 
    AND global_role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE email = auth.jwt() ->> 'email' 
    AND global_role = 'admin'
  )
);

DROP POLICY IF EXISTS "Assigned agents can view and update their leads" ON public.salon_leads;
CREATE POLICY "Assigned agents can view and update their leads" 
ON public.salon_leads 
FOR ALL 
USING (
  auth.jwt() ->> 'email' = assign_to
)
WITH CHECK (
  auth.jwt() ->> 'email' = assign_to
);

-- 6. Create RLS Policies for lead_activity_logs
DROP POLICY IF EXISTS "Admins can fully manage all lead logs" ON public.lead_activity_logs;
CREATE POLICY "Admins can fully manage all lead logs" 
ON public.lead_activity_logs 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE email = auth.jwt() ->> 'email' 
    AND global_role = 'admin'
  )
);

DROP POLICY IF EXISTS "Assigned agents can view their own activity logs" ON public.lead_activity_logs;
CREATE POLICY "Assigned agents can view their own activity logs" 
ON public.lead_activity_logs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.salon_leads 
    WHERE id = lead_activity_logs.lead_id 
    AND assign_to = auth.jwt() ->> 'email'
  )
);

DROP POLICY IF EXISTS "Assigned agents can create activity logs" ON public.lead_activity_logs;
CREATE POLICY "Assigned agents can create activity logs" 
ON public.lead_activity_logs 
FOR INSERT 
WITH CHECK (
  actor_email = auth.jwt() ->> 'email' AND
  EXISTS (
    SELECT 1 FROM public.salon_leads 
    WHERE id = lead_activity_logs.lead_id 
    AND assign_to = auth.jwt() ->> 'email'
  )
);

-- 7. Trigger to automatically backfill lead_status and onboarding_stage from old status column (if old column has data)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'salon_leads' AND column_name = 'status'
  ) THEN
    -- Migrate existing data
    UPDATE public.salon_leads SET 
      lead_status = CASE 
        WHEN status = 'new' THEN 'NEW'
        WHEN status = 'assigned' THEN 'ASSIGNED_TO_AGENT'
        WHEN status = 'contacted' THEN 'CONTACTED'
        WHEN status = 'converted' THEN 'CONVERTED'
        WHEN status = 'rejected' THEN 'REJECTED'
        ELSE 'NEW'
      END,
      onboarding_stage = CASE 
        WHEN status = 'new' THEN 'NOT_STARTED'
        WHEN status = 'assigned' THEN 'NOT_STARTED'
        WHEN status = 'contacted' THEN 'CONTACT_ESTABLISHED'
        WHEN status = 'converted' THEN 'CONVERTED'
        ELSE 'NOT_STARTED'
      END
    WHERE lead_status = 'NEW' AND onboarding_stage = 'NOT_STARTED';
  END IF;
END $$;
