-- ==============================================================================
-- TRIMMA: RESCHEDULE REQUEST — requested date/time columns
-- ==============================================================================
-- Run in Supabase SQL Editor (safe to re-run).
-- Stores the customer's requested slot while the salon approves or declines.
-- ==============================================================================

BEGIN;

ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS requested_booking_date DATE;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS requested_booking_time TIME;

ALTER TABLE public.reschedule_requests ADD COLUMN IF NOT EXISTS requested_booking_date DATE;
ALTER TABLE public.reschedule_requests ADD COLUMN IF NOT EXISTS requested_booking_time TIME;

COMMIT;
