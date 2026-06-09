-- ==============================================================================
-- TRIMMA: Review engine readiness check (read-only — run in Supabase SQL Editor)
-- ==============================================================================

-- 1. Core review columns (should all be 1 if BOOKING_REVIEWS_PATCH applied)
SELECT
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='reviews' AND column_name='booking_id') AS reviews_has_booking_id,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='reviews' AND column_name='customer_email') AS reviews_has_customer_email,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='reviews' AND column_name='status') AS reviews_has_status,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='reviews' AND column_name='updated_at') AS reviews_has_updated_at;

-- 2. Salon denormalized stats columns
SELECT
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='salons' AND column_name='rating') AS salons_has_rating,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='salons' AND column_name='review_count') AS salons_has_review_count;

-- 3. Reply + staff review support
SELECT
  to_regclass('public.review_replies') IS NOT NULL AS review_replies_table,
  to_regclass('public.staff_reviews') IS NOT NULL AS staff_reviews_table,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='staff_reviews' AND column_name='booking_id') AS staff_reviews_has_booking_id;

-- 4. Stats trigger (auto-updates salons.rating / review_count)
SELECT
  EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    WHERE c.relname = 'reviews' AND t.tgname = 'tr_reviews_stats' AND NOT t.tgisinternal
  ) AS has_review_stats_trigger;

-- 5. Sample counts
SELECT
  (SELECT count(*) FROM public.reviews) AS total_reviews,
  (SELECT count(*) FROM public.reviews WHERE booking_id IS NOT NULL) AS verified_reviews,
  (SELECT count(*) FROM public.review_replies) AS total_replies,
  (SELECT count(*) FROM public.staff_reviews) AS total_staff_reviews;
