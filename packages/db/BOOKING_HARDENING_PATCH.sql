-- ====================================================================
-- TRIMMA BOOKING ENGINE HARDENING SQL PATCH
-- ====================================================================

-- 1. PREVENT DOUBLE BOOKINGS AT DATABASE CORE (Checklist #6)
-- Creates a Partial Unique Index that makes duplicate active bookings mathematically impossible.
-- This ensures that only ONE active ('confirmed' or 'pending') booking can exist 
-- for a specific staff member, date, and timeslot.
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_staff_booking_slot 
ON public.bookings (staff_id, booking_date, booking_time) 
WHERE (status = 'confirmed' OR status = 'pending');
