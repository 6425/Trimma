-- ==============================================================================
-- BOOKINGS & PAYMENT SCHEMAS UPDATE
-- ==============================================================================
-- Run this script in your Supabase SQL Editor.
-- It extends public.bookings and creates the reschedule_requests table with RLS.
-- ==============================================================================

-- 1. Extend the bookings table with new reservation and reschedule tracking columns
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS reservation_fee_paid BOOLEAN DEFAULT false;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS reservation_fee_refundable BOOLEAN DEFAULT false;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS reschedule_requested BOOLEAN DEFAULT false;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS reschedule_status TEXT DEFAULT 'none'; -- none / pending_salon / approved / rejected

-- 2. Create the reschedule_requests table for clean audit logs
CREATE TABLE IF NOT EXISTS public.reschedule_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  requested_by TEXT NOT NULL CHECK (requested_by IN ('customer', 'salon')),
  requested_time TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  handled_by_salon BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Enable RLS on the reschedule_requests table
ALTER TABLE public.reschedule_requests ENABLE ROW LEVEL SECURITY;

-- 4. Set up RLS Policies for reschedule_requests
DROP POLICY IF EXISTS "Public can insert reschedule requests" ON public.reschedule_requests;
CREATE POLICY "Public can insert reschedule requests" ON public.reschedule_requests 
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view their own reschedule requests" ON public.reschedule_requests;
CREATE POLICY "Users can view their own reschedule requests" ON public.reschedule_requests 
  FOR SELECT USING (true);
