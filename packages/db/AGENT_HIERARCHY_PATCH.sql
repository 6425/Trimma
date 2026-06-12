-- Regional Head / Sub-agent hierarchy
-- Run once in Supabase SQL Editor.
-- Existing agents become Regional Heads. New field agents default to 50% split of head commission.

BEGIN;

-- ── agents: tier + reporting + sub-agent split ───────────────────────────────
ALTER TABLE public.agents
  ADD COLUMN IF NOT EXISTS agent_tier TEXT;

ALTER TABLE public.agents
  ADD COLUMN IF NOT EXISTS reports_to_agent_id UUID;

ALTER TABLE public.agents
  ADD COLUMN IF NOT EXISTS sub_agent_split_percent NUMERIC;

UPDATE public.agents
SET agent_tier = 'regional_head'
WHERE agent_tier IS NULL OR btrim(agent_tier) = '';

ALTER TABLE public.agents
  ALTER COLUMN agent_tier SET DEFAULT 'regional_head';

ALTER TABLE public.agents
  ALTER COLUMN agent_tier SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'agents_agent_tier_check'
      AND conrelid = 'public.agents'::regclass
  ) THEN
    ALTER TABLE public.agents
      ADD CONSTRAINT agents_agent_tier_check
      CHECK (agent_tier IN ('regional_head', 'field_agent'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'agents_reports_to_agent_id_fkey'
      AND conrelid = 'public.agents'::regclass
  ) THEN
    ALTER TABLE public.agents
      ADD CONSTRAINT agents_reports_to_agent_id_fkey
      FOREIGN KEY (reports_to_agent_id) REFERENCES public.agents(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'agents_sub_agent_split_percent_check'
      AND conrelid = 'public.agents'::regclass
  ) THEN
    ALTER TABLE public.agents
      ADD CONSTRAINT agents_sub_agent_split_percent_check
      CHECK (
        sub_agent_split_percent IS NULL
        OR (sub_agent_split_percent >= 0 AND sub_agent_split_percent <= 100)
      );
  END IF;
END $$;

-- Field agents must report to a regional head; heads have no parent.
UPDATE public.agents
SET reports_to_agent_id = NULL,
    sub_agent_split_percent = NULL
WHERE agent_tier = 'regional_head';

UPDATE public.agents
SET sub_agent_split_percent = COALESCE(sub_agent_split_percent, 50)
WHERE agent_tier = 'field_agent';

CREATE INDEX IF NOT EXISTS idx_agents_reports_to_agent_id
  ON public.agents (reports_to_agent_id);

CREATE INDEX IF NOT EXISTS idx_agents_agent_tier
  ON public.agents (agent_tier);

-- ── bookings: track field agent separately from commission payee ─────────────
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS field_agent_email TEXT;

CREATE INDEX IF NOT EXISTS idx_bookings_field_agent_email
  ON public.bookings (field_agent_email);

-- ── commission_ledger: subscription splits ───────────────────────────────────
ALTER TABLE public.commission_ledger
  ADD COLUMN IF NOT EXISTS field_agent_email TEXT;

CREATE INDEX IF NOT EXISTS idx_commission_ledger_field_agent_email
  ON public.commission_ledger (field_agent_email);

COMMIT;
