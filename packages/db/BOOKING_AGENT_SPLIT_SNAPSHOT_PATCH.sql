-- ==============================================================================
-- BOOKING AGENT SPLIT SNAPSHOT
-- Run in Supabase SQL Editor after deploy (safe to re-run).
--
-- Freezes regional-head vs field-agent commission splits on each booking at
-- checkout time so payouts stay accurate if hierarchy rates change later.
-- ==============================================================================

BEGIN;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS field_agent_commission_amount DECIMAL(10,2) DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS regional_head_commission_amount DECIMAL(10,2) DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS agent_split_percent DECIMAL(5,2) DEFAULT 0.0;

-- Regional head is direct payee (no field agent on booking).
UPDATE public.bookings b
SET
  field_agent_commission_amount = 0,
  regional_head_commission_amount = COALESCE(b.agent_commission_amount, 0),
  agent_split_percent = 0
WHERE COALESCE(b.agent_commission_amount, 0) > 0
  AND b.agent_email IS NOT NULL
  AND b.agent_email <> ''
  AND (b.field_agent_email IS NULL OR b.field_agent_email = '')
  AND COALESCE(b.regional_head_commission_amount, 0) = 0;

-- Field agent bookings: derive split from agents.sub_agent_split_percent.
UPDATE public.bookings b
SET
  field_agent_commission_amount = ROUND(
    COALESCE(b.agent_commission_amount, 0) * COALESCE(a.sub_agent_split_percent, 50) / 100.0,
    2
  ),
  regional_head_commission_amount = ROUND(
    COALESCE(b.agent_commission_amount, 0)
    * (100 - COALESCE(a.sub_agent_split_percent, 50)) / 100.0,
    2
  ),
  agent_split_percent = COALESCE(a.sub_agent_split_percent, 50)
FROM public.agents a
WHERE COALESCE(b.agent_commission_amount, 0) > 0
  AND b.field_agent_email IS NOT NULL
  AND b.field_agent_email <> ''
  AND lower(a.user_email) = lower(b.field_agent_email)
  AND COALESCE(b.field_agent_commission_amount, 0) = 0
  AND COALESCE(b.regional_head_commission_amount, 0) = 0;

COMMIT;

SELECT
  booking_no,
  agent_commission_amount,
  field_agent_commission_amount,
  regional_head_commission_amount,
  agent_split_percent
FROM public.bookings
WHERE agent_email IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;
