-- ==============================================================================
-- BACKFILL SUBSCRIPTION COMMISSIONS
-- Run in Supabase SQL Editor AFTER SUBSCRIPTION_COMMISSION_PATCH.sql.
--
-- Creates commission_ledger rows (commission_category = 'subscription') for past
-- successful subscription payments made by referred salons (salons.assign_to set).
--
-- Safe to re-run: it skips payments that already have a matching ledger row
-- (deduplicated by the payment order_id stored in commission_ledger.notes).
-- ==============================================================================

BEGIN;

WITH active_rate AS (
  SELECT COALESCE(
    (SELECT agent_percentage
       FROM public.commission_master
      WHERE commission_type = 'subscription' AND active = true
      ORDER BY created_at DESC
      LIMIT 1),
    20.0
  ) AS agent_percent
)
INSERT INTO public.commission_ledger (
  agent_email,
  salon_id,
  commission_category,
  base_amount,
  agent_percent,
  amount,
  status,
  notes,
  created_at
)
SELECT
  s.assign_to,
  p.salon_id,
  'subscription',
  p.amount,
  ar.agent_percent,
  ROUND(p.amount * ar.agent_percent / 100.0, 2),
  'PENDING',
  'Backfill subscription commission: '
    || COALESCE(p.raw_response ->> 'plan_name', 'subscription')
    || ' payment '
    || COALESCE(p.raw_response ->> 'order_id', p.id::text)
    || '.',
  p.created_at
FROM public.payments p
JOIN public.salons s ON s.id = p.salon_id
CROSS JOIN active_rate ar
WHERE p.status = 'success'
  AND p.raw_response ->> 'type' = 'subscription'
  AND s.assign_to IS NOT NULL
  AND s.assign_to <> ''
  AND NOT EXISTS (
    SELECT 1
    FROM public.commission_ledger cl
    WHERE cl.salon_id = p.salon_id
      AND cl.commission_category = 'subscription'
      AND cl.notes LIKE '%' || COALESCE(p.raw_response ->> 'order_id', p.id::text) || '%'
  );

COMMIT;

-- Verification: how many subscription commission rows now exist, and the total.
SELECT
  'BACKFILL_SUBSCRIPTION_COMMISSIONS applied.' AS status,
  COUNT(*) AS subscription_ledger_rows,
  COALESCE(SUM(amount), 0) AS total_agent_subscription_commission
FROM public.commission_ledger
WHERE commission_category = 'subscription';
