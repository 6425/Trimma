-- ==============================================================================
-- SUBSCRIPTION COMMISSION PATCH
-- Run in Supabase SQL Editor.
-- Seeds subscription split in commission_master and extends commission_ledger
-- for subscription payouts shown on Agent → Commissions.
-- ==============================================================================

BEGIN;

-- 1. Ensure commission_master table exists (from BOOKING_PRICING_PATCH)
CREATE TABLE IF NOT EXISTS public.commission_master (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commission_type VARCHAR(50) NOT NULL CHECK (commission_type IN ('booking', 'subscription')),
  platform_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.0,
  salon_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.0,
  agent_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.0,
  payhere_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.0,
  active BOOLEAN DEFAULT true,
  effective_from TIMESTAMPTZ DEFAULT NOW(),
  effective_to TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Default active subscription commission: Platform 80% / Agent 20%
INSERT INTO public.commission_master (
  commission_type,
  platform_percentage,
  salon_percentage,
  agent_percentage,
  payhere_percentage,
  active
)
SELECT 'subscription', 80.0, 0.0, 20.0, 0.0, true
WHERE NOT EXISTS (
  SELECT 1 FROM public.commission_master
  WHERE commission_type = 'subscription' AND active = true
);

-- 3. Extend commission_ledger for subscription + lead rewards
ALTER TABLE public.commission_ledger
  ADD COLUMN IF NOT EXISTS commission_category TEXT NOT NULL DEFAULT 'lead_conversion';

ALTER TABLE public.commission_ledger
  ADD COLUMN IF NOT EXISTS salon_id UUID REFERENCES public.salons(id) ON DELETE SET NULL;

ALTER TABLE public.commission_ledger
  ADD COLUMN IF NOT EXISTS base_amount NUMERIC(10, 2);

ALTER TABLE public.commission_ledger
  ADD COLUMN IF NOT EXISTS agent_percent NUMERIC(5, 2);

-- lead_id was required for salon_leads only — allow subscription rows without a lead
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'commission_ledger'
      AND column_name = 'lead_id'
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.commission_ledger ALTER COLUMN lead_id DROP NOT NULL;
  END IF;
END $$;

COMMENT ON COLUMN public.commission_ledger.commission_category IS
  'lead_conversion = salon lead reward; subscription = agent % of salon SaaS payment';

COMMIT;

SELECT
  'SUBSCRIPTION_COMMISSION_PATCH applied.' AS status,
  (SELECT agent_percentage FROM public.commission_master WHERE commission_type = 'subscription' AND active = true LIMIT 1) AS active_subscription_agent_pct;
