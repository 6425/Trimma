-- ==============================================================================
-- TRIMMA: salons.rejection_reason (admin / agent reject flows)
-- ==============================================================================
-- Run once in Supabase SQL Editor when admin reject fails with a missing-column
-- / schema-cache error mentioning rejection_reason.
--
-- Idempotent. Same change as:
--   supabase/migrations/20260720120000_add_salon_rejection_reason.sql
-- ==============================================================================

ALTER TABLE public.salons
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

SELECT 'ADD_SALON_REJECTION_REASON applied successfully.' AS status;
