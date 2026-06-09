-- ==============================================================================
-- TRIMMA: STAFF REVIEWS — booking-linked stylist ratings (additive only)
-- ==============================================================================
-- Safe to re-run on production schema you shared (staff_reviews already exists).
-- Only adds booking_id + updated_at + indexes/RLS. Does NOT recreate reviews/salons.
-- Prerequisite: BOOKING_REVIEWS_PATCH.sql already applied (reviews.booking_id exists).
-- ==============================================================================

BEGIN;

-- Existing live columns: id, salon_id, staff_id, customer_email, rating, comment, created_at
ALTER TABLE public.staff_reviews
  ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE;

ALTER TABLE public.staff_reviews
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE UNIQUE INDEX IF NOT EXISTS idx_staff_reviews_booking_unique
  ON public.staff_reviews (booking_id)
  WHERE booking_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_staff_reviews_staff_id
  ON public.staff_reviews (staff_id);

ALTER TABLE public.staff_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view staff reviews" ON public.staff_reviews;
DROP POLICY IF EXISTS "Platform admins manage staff reviews" ON public.staff_reviews;

CREATE POLICY "Public can view staff reviews"
  ON public.staff_reviews FOR SELECT
  USING (booking_id IS NOT NULL);

-- Matches BOOKING_REVIEWS_PATCH admin policy (users.global_role = 'admin')
CREATE POLICY "Platform admins manage staff reviews"
  ON public.staff_reviews FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE lower(u.email) = lower(auth.jwt() ->> 'email')
        AND u.global_role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE lower(u.email) = lower(auth.jwt() ->> 'email')
        AND u.global_role = 'admin'
    )
  );

COMMIT;

NOTIFY pgrst, 'reload schema';

SELECT
  (SELECT count(*) FROM public.staff_reviews) AS staff_reviews_count,
  (SELECT count(*) FROM information_schema.columns
   WHERE table_schema = 'public' AND table_name = 'staff_reviews' AND column_name = 'booking_id') AS has_booking_id;
