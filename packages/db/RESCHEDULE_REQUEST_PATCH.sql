-- ==============================================================================
-- TRIMMA: RESCHEDULE REQUEST — full patch (safe to re-run)
-- ==============================================================================
-- Run in Supabase SQL Editor (all statements, top to bottom).
-- If you only need salon owner reschedule first, run section 1 only.
-- After running: Supabase → Settings → API → Reload schema cache.
-- ==============================================================================

-- ── 1. Required on public.bookings ───────────────────────────────────────────
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS reschedule_requested BOOLEAN DEFAULT false;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS reschedule_status TEXT DEFAULT 'none';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS requested_booking_date DATE;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS requested_booking_time TIME;

BEGIN;
-- Audit table (created here if missing)
CREATE TABLE IF NOT EXISTS public.reschedule_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  requested_by TEXT NOT NULL CHECK (requested_by IN ('customer', 'salon')),
  requested_time TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  handled_by_salon BOOLEAN DEFAULT true,
  requested_booking_date DATE,
  requested_booking_time TIME,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Extra columns when table already existed without them
ALTER TABLE public.reschedule_requests ADD COLUMN IF NOT EXISTS requested_booking_date DATE;
ALTER TABLE public.reschedule_requests ADD COLUMN IF NOT EXISTS requested_booking_time TIME;

ALTER TABLE public.reschedule_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can insert reschedule requests" ON public.reschedule_requests;
CREATE POLICY "Public can insert reschedule requests" ON public.reschedule_requests
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view their own reschedule requests" ON public.reschedule_requests;
CREATE POLICY "Users can view their own reschedule requests" ON public.reschedule_requests
  FOR SELECT USING (true);

COMMIT;
