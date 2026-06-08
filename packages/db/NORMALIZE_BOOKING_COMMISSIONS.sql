-- ==============================================================================
-- NORMALIZE BOOKING COMMISSIONS
-- Run in Supabase SQL Editor.
--
-- Older bookings stored the platform/salon/agent commission computed on a
-- net-of-15% base (e.g. LKR 1,500 booking -> platform 130.43, agent 26.09).
-- Current logic computes commission on the booking amount directly
-- (LKR 1,500 -> platform 150, agent 30).
--
-- This script recomputes commission columns for ALL bookings from the active
-- booking commission rates so historical and new bookings are consistent:
--   platform_commission_amount = amount * platform%
--   salon_upfront_amount       = amount * salon%
--   agent_commission_amount    = platform_commission * agent% (only if agent_email set)
--
-- It is idempotent: bookings already on the new model are left unchanged
-- (only rows whose stored values differ by > 0.01 are updated).
-- ==============================================================================

BEGIN;

WITH rates AS (
  SELECT
    platform_percentage AS platform_pct,
    salon_percentage    AS salon_pct,
    agent_percentage    AS agent_pct
  FROM public.commission_master
  WHERE commission_type = 'booking' AND active = true
  ORDER BY created_at DESC
  LIMIT 1
),
computed AS (
  SELECT
    b.id,
    ROUND(COALESCE(b.amount, 0) * r.platform_pct / 100.0, 2) AS new_platform,
    ROUND(COALESCE(b.amount, 0) * r.salon_pct / 100.0, 2)    AS new_salon,
    CASE
      WHEN b.agent_email IS NOT NULL AND b.agent_email <> '' THEN
        ROUND(
          (COALESCE(b.amount, 0) * r.platform_pct / 100.0)
          * COALESCE(NULLIF(b.agent_commission_percent, 0), r.agent_pct) / 100.0,
          2
        )
      ELSE COALESCE(b.agent_commission_amount, 0)
    END AS new_agent_amount,
    CASE
      WHEN b.agent_email IS NOT NULL AND b.agent_email <> '' THEN
        COALESCE(NULLIF(b.agent_commission_percent, 0), r.agent_pct)
      ELSE b.agent_commission_percent
    END AS new_agent_pct
  FROM public.bookings b
  CROSS JOIN rates r
)
UPDATE public.bookings b
SET
  platform_commission_amount = c.new_platform,
  salon_upfront_amount       = c.new_salon,
  agent_commission_amount    = c.new_agent_amount,
  agent_commission_percent   = c.new_agent_pct
FROM computed c
WHERE b.id = c.id
  AND (
    ABS(COALESCE(b.platform_commission_amount, 0) - c.new_platform) > 0.01
    OR ABS(COALESCE(b.salon_upfront_amount, 0) - c.new_salon) > 0.01
    OR ABS(COALESCE(b.agent_commission_amount, 0) - c.new_agent_amount) > 0.01
  );

COMMIT;

-- Verification: a sample of bookings after normalization.
SELECT
  booking_no,
  amount,
  platform_commission_amount,
  salon_upfront_amount,
  agent_commission_percent,
  agent_commission_amount
FROM public.bookings
WHERE agent_email IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;
