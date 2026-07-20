-- ==============================================================================
-- TRIMMA: Booking reservation fee 30% (platform 10% / salon 20%)
-- ==============================================================================
-- Run in Supabase SQL Editor after deploying the app that expects 30% deposit.
-- Safe to re-run. No CHECK constraint currently enforces platform+salon sum;
-- admin/app validation enforces sum === 30.
--
-- Deactivates the current active booking commission_master row and inserts
-- the new 10/20 split (keeps agent_percentage / payhere_percentage from the
-- previous active row when present).
-- ==============================================================================

BEGIN;

UPDATE public.commission_master
SET active = false,
    effective_to = NOW(),
    updated_at = NOW()
WHERE commission_type = 'booking'
  AND active = true
  AND (
    platform_percentage IS DISTINCT FROM 10.0
    OR salon_percentage IS DISTINCT FROM 20.0
  );

INSERT INTO public.commission_master (
  commission_type,
  platform_percentage,
  salon_percentage,
  agent_percentage,
  payhere_percentage,
  active
)
SELECT
  'booking',
  10.0,
  20.0,
  COALESCE(
    (
      SELECT agent_percentage
      FROM public.commission_master
      WHERE commission_type = 'booking'
      ORDER BY created_at DESC
      LIMIT 1
    ),
    20.0
  ),
  COALESCE(
    (
      SELECT payhere_percentage
      FROM public.commission_master
      WHERE commission_type = 'booking'
      ORDER BY created_at DESC
      LIMIT 1
    ),
    3.0
  ),
  true
WHERE NOT EXISTS (
  SELECT 1
  FROM public.commission_master
  WHERE commission_type = 'booking'
    AND active = true
    AND platform_percentage = 10.0
    AND salon_percentage = 20.0
);

-- Ensure at least one active booking row exists (fresh environments).
INSERT INTO public.commission_master (
  commission_type,
  platform_percentage,
  salon_percentage,
  agent_percentage,
  payhere_percentage,
  active
)
SELECT 'booking', 10.0, 20.0, 20.0, 3.0, true
WHERE NOT EXISTS (
  SELECT 1 FROM public.commission_master
  WHERE commission_type = 'booking' AND active = true
);

COMMIT;

SELECT
  id,
  commission_type,
  platform_percentage,
  salon_percentage,
  agent_percentage,
  payhere_percentage,
  active,
  created_at
FROM public.commission_master
WHERE commission_type = 'booking'
ORDER BY active DESC, created_at DESC
LIMIT 5;
