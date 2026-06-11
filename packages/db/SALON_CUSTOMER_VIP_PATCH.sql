-- ==============================================================================
-- TRIMMA: SALON CUSTOMER VIP FLAGS (per salon, per customer email)
-- ==============================================================================
-- Run in Supabase SQL Editor (safe to re-run).
-- Lets salon owners manually mark customers as VIP from /dashboard/customers.
-- ==============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.salon_customer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  customer_email TEXT NOT NULL,
  is_vip BOOLEAN NOT NULL DEFAULT FALSE,
  marked_vip_at TIMESTAMPTZ,
  marked_vip_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (salon_id, customer_email)
);

CREATE INDEX IF NOT EXISTS idx_salon_customer_profiles_salon_id
  ON public.salon_customer_profiles (salon_id);

CREATE INDEX IF NOT EXISTS idx_salon_customer_profiles_salon_vip
  ON public.salon_customer_profiles (salon_id, is_vip)
  WHERE is_vip = TRUE;

ALTER TABLE public.salon_customer_profiles ENABLE ROW LEVEL SECURITY;

COMMIT;

NOTIFY pgrst, 'reload schema';

SELECT 'salon_customer_profiles ready' AS status;
