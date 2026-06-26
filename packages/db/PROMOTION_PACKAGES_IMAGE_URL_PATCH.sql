-- TRIMMA: Promotion package square image (image_url)
-- Run in Supabase SQL Editor if promotion image uploads fail.

ALTER TABLE public.salon_promotion_packages
  ADD COLUMN IF NOT EXISTS image_url TEXT;

COMMENT ON COLUMN public.salon_promotion_packages.image_url IS
  'Square promotion package image URL (public-assets/salon-promotions/{salon_id}/).';

SELECT 'salon_promotion_packages.image_url ready' AS status;
