-- 03_fix_booking_status_constraint.sql
-- Fix the CHECK constraints on bookings table.
-- IMPORTANT: Clean up existing data BEFORE applying new constraints.

-- =============================================
-- STEP 1: DROP old constraints first
-- =============================================
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_payment_status_check;

-- =============================================
-- STEP 2: Clean up existing rows to match new values
-- =============================================

-- Fix status values
UPDATE public.bookings SET status = 'canceled' WHERE status IN ('declined', 'cancelled');
UPDATE public.bookings SET status = 'confirmed' WHERE status = 'checked_in';
UPDATE public.bookings SET status = 'in_progress' WHERE status = 'started';
UPDATE public.bookings SET status = 'pending' WHERE status NOT IN ('pending', 'confirmed', 'in_progress', 'completed', 'canceled', 'no_show', 'rescheduled');

-- Fix payment_status values
UPDATE public.bookings SET payment_status = 'reservation_paid' WHERE payment_status IN ('partially_paid', 'partial');
UPDATE public.bookings SET payment_status = 'unpaid' WHERE payment_status NOT IN ('unpaid', 'reservation_paid', 'paid', 'refunded');

-- =============================================
-- STEP 3: Now apply the new constraints
-- =============================================
ALTER TABLE public.bookings 
  ADD CONSTRAINT bookings_status_check 
  CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'canceled', 'no_show', 'rescheduled'));

ALTER TABLE public.bookings 
  ADD CONSTRAINT bookings_payment_status_check 
  CHECK (payment_status IN ('unpaid', 'reservation_paid', 'paid', 'refunded'));
