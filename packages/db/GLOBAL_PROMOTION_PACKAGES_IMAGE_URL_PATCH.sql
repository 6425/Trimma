-- TRIMMA: Global promotion package square image (image_url)
-- Run in Supabase SQL Editor so admin global templates can store a package image.

ALTER TABLE public.global_promotion_packages
  ADD COLUMN IF NOT EXISTS image_url TEXT;

COMMENT ON COLUMN public.global_promotion_packages.image_url IS
  'Square promotion template image URL (public-assets/global-promotions/). Copied to salon packages on import.';

SELECT 'global_promotion_packages.image_url ready' AS status;
