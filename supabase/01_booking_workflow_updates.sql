-- 01_booking_workflow_updates.sql

-- This script adds the necessary columns to the 'bookings' table to support the advanced Salon Booking Management workflow.

-- 1. Add internal salon-facing notes (not visible to customers)
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS internal_notes TEXT;

-- 2. Add cancellation reason for when a booking is declined or cancelled by the salon
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

-- 3. Ensure reschedule request tracking columns exist
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS reschedule_requested BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS reschedule_status TEXT;

-- 4. Ensure payment specific trackers exist
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS reservation_fee_paid BOOLEAN DEFAULT false;

-- NOTE on existing columns:
-- The 'status' column already exists as TEXT. The application logic will now populate it with:
-- 'pending', 'confirmed', 'checked_in', 'in_progress', 'completed', 'cancelled', 'declined', 'no_show'
--
-- The 'payment_status' column already exists as TEXT. The application logic will now populate it with:
-- 'unpaid', 'partial', 'paid', 'refunded'
