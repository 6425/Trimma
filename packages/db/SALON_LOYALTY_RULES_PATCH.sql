-- ==============================================================================
-- TRIMMA: SALON LOYALTY VISIT RULES (per salon, owner-configurable)
-- ==============================================================================
-- Run in Supabase SQL Editor (safe to re-run).
-- Lets salon owners set visit thresholds for loyalty tiers from /dashboard/crm.
-- Does not alter bookings, payments, or salon_customer_profiles.
-- ==============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.salon_loyalty_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  tier_key TEXT NOT NULL,
  tier_label TEXT NOT NULL,
  min_visits INT NOT NULL DEFAULT 1 CHECK (min_visits >= 1),
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (salon_id, tier_key)
);

CREATE INDEX IF NOT EXISTS idx_salon_loyalty_rules_salon_id
  ON public.salon_loyalty_rules (salon_id);

CREATE INDEX IF NOT EXISTS idx_salon_loyalty_rules_salon_sort
  ON public.salon_loyalty_rules (salon_id, sort_order);

ALTER TABLE public.salon_loyalty_rules ENABLE ROW LEVEL SECURITY;

COMMIT;

NOTIFY pgrst, 'reload schema';

SELECT 'salon_loyalty_rules ready' AS status;
