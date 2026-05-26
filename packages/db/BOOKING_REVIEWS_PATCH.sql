-- ==============================================================================
-- TRIMMA: VERIFIED BOOKING REVIEWS (Phase 1)
-- ==============================================================================
-- Run in Supabase SQL Editor (safe to re-run).
-- Ties reviews to completed bookings — one review per booking.
-- ==============================================================================

BEGIN;

ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS customer_email TEXT;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published';
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_booking_id_unique
  ON public.reviews (booking_id)
  WHERE booking_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_reviews_salon_id
  ON public.reviews (salon_id);

CREATE INDEX IF NOT EXISTS idx_reviews_customer_email
  ON public.reviews (customer_email);

CREATE TABLE IF NOT EXISTS public.review_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  salon_owner_email TEXT NOT NULL,
  reply_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (review_id)
);

CREATE INDEX IF NOT EXISTS idx_review_replies_review_id
  ON public.review_replies (review_id);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_replies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view published reviews" ON public.reviews;
DROP POLICY IF EXISTS "Customers can view own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Salon owners can view salon reviews" ON public.reviews;
DROP POLICY IF EXISTS "Platform admins manage reviews" ON public.reviews;

CREATE POLICY "Public can view published reviews"
  ON public.reviews FOR SELECT
  USING (COALESCE(status, 'published') = 'published');

CREATE POLICY "Customers can view own reviews"
  ON public.reviews FOR SELECT TO authenticated
  USING (lower(customer_email) = lower(auth.jwt() ->> 'email'));

CREATE POLICY "Salon owners can view salon reviews"
  ON public.reviews FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.salons s
      WHERE s.id = reviews.salon_id
        AND (
          lower(s.owner_email) = lower(auth.jwt() ->> 'email')
          OR lower(s.owner_gmail) = lower(auth.jwt() ->> 'email')
        )
    )
  );

CREATE POLICY "Platform admins manage reviews"
  ON public.reviews FOR ALL TO authenticated
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

DROP POLICY IF EXISTS "Public can view review replies" ON public.review_replies;
DROP POLICY IF EXISTS "Salon owners manage review replies" ON public.review_replies;

CREATE POLICY "Public can view review replies"
  ON public.review_replies FOR SELECT
  USING (true);

CREATE POLICY "Salon owners manage review replies"
  ON public.review_replies FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.reviews r
      JOIN public.salons s ON s.id = r.salon_id
      WHERE r.id = review_replies.review_id
        AND (
          lower(s.owner_email) = lower(auth.jwt() ->> 'email')
          OR lower(s.owner_gmail) = lower(auth.jwt() ->> 'email')
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.reviews r
      JOIN public.salons s ON s.id = r.salon_id
      WHERE r.id = review_replies.review_id
        AND (
          lower(s.owner_email) = lower(auth.jwt() ->> 'email')
          OR lower(s.owner_gmail) = lower(auth.jwt() ->> 'email')
        )
    )
  );

CREATE OR REPLACE FUNCTION public.refresh_salon_review_stats(p_salon_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.salons s
  SET
    rating = COALESCE((
      SELECT ROUND(AVG(r.rating)::numeric, 1)
      FROM public.reviews r
      WHERE r.salon_id = p_salon_id
        AND COALESCE(r.status, 'published') = 'published'
    ), 0),
    review_count = (
      SELECT COUNT(*)
      FROM public.reviews r
      WHERE r.salon_id = p_salon_id
        AND COALESCE(r.status, 'published') = 'published'
    )
  WHERE s.id = p_salon_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_review_stats_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.refresh_salon_review_stats(OLD.salon_id);
    RETURN OLD;
  END IF;

  PERFORM public.refresh_salon_review_stats(NEW.salon_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_reviews_stats ON public.reviews;
CREATE TRIGGER tr_reviews_stats
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.handle_review_stats_change();

COMMIT;

NOTIFY pgrst, 'reload schema';

SELECT
  (SELECT count(*) FROM public.reviews) AS total_reviews,
  (SELECT count(*) FROM public.review_replies) AS total_replies,
  'Booking reviews ready' AS status;
