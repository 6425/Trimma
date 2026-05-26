-- ==============================================================================
-- TRIMMA: BOOKING PRICING & PROMOTION CHECKOUT PATCH
-- ==============================================================================
-- Run in Supabase SQL Editor after app deploy (safe to re-run).
--
-- Customer pays 20% reservation deposit; platform/salon/PayHere split that deposit
-- using commission_master (typically 10% + 10% + 3% of service total = 23% internal
-- allocation inside the 20% deposit — not charged to the customer on top).
--
-- Prerequisite for deals on salon pages (run first if not applied yet):
--   packages/db/PROMOTION_PACKAGES_PATCH.sql
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. Booking financial breakdown (checkout writes these on insert)
-- ------------------------------------------------------------------------------
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS reservation_fee_paid BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS reservation_fee_refundable BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS total_reservation_fee DECIMAL(10,2) DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS salon_upfront_amount DECIMAL(10,2) DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS platform_commission_percent DECIMAL(5,2) DEFAULT 10.0,
  ADD COLUMN IF NOT EXISTS platform_commission_amount DECIMAL(10,2) DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS salon_payout_amount DECIMAL(10,2) DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS payhere_fee_amount DECIMAL(10,2) DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS agent_email TEXT,
  ADD COLUMN IF NOT EXISTS agent_commission_percent DECIMAL(5,2) DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS agent_commission_amount DECIMAL(10,2) DEFAULT 0.0;

-- Link promotion-package bookings for reporting / WhatsApp / dashboards
-- (requires PROMOTION_PACKAGES_PATCH.sql — skipped automatically if table missing)
DO $$
BEGIN
  IF to_regclass('public.salon_promotion_packages') IS NOT NULL THEN
    ALTER TABLE public.bookings
      ADD COLUMN IF NOT EXISTS promotion_package_id UUID REFERENCES public.salon_promotion_packages(id) ON DELETE SET NULL;

    CREATE INDEX IF NOT EXISTS idx_bookings_promotion_package_id
      ON public.bookings (promotion_package_id)
      WHERE promotion_package_id IS NOT NULL;
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 2. Commission master (admin → Commissions page; checkout reads booking row)
-- ------------------------------------------------------------------------------
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

ALTER TABLE public.commission_master
  ADD COLUMN IF NOT EXISTS payhere_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.0;

INSERT INTO public.commission_master (
  commission_type,
  platform_percentage,
  salon_percentage,
  agent_percentage,
  payhere_percentage
)
SELECT 'booking', 10.0, 10.0, 0.0, 3.0
WHERE NOT EXISTS (
  SELECT 1 FROM public.commission_master WHERE commission_type = 'booking'
);

INSERT INTO public.commission_master (
  commission_type,
  platform_percentage,
  salon_percentage,
  agent_percentage,
  payhere_percentage
)
SELECT 'subscription', 80.0, 0.0, 20.0, 0.0
WHERE NOT EXISTS (
  SELECT 1 FROM public.commission_master WHERE commission_type = 'subscription'
);

COMMIT;
