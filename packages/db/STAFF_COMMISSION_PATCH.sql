-- ==============================================================================
-- TRIMMA: STAFF COMMISSION ON BOOKINGS
-- ==============================================================================
-- Persist stylist commission at checkout (same pattern as platform/salon/agent).
-- Safe to re-run.
-- ==============================================================================

BEGIN;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS staff_commission_percent DECIMAL(5,2) DEFAULT 0.0,
  ADD COLUMN IF NOT EXISTS staff_commission_amount DECIMAL(10,2) DEFAULT 0.0;

COMMIT;
