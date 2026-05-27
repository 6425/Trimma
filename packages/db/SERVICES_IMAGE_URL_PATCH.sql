-- TRIMMA: Salon service square image (image_url)
-- Run in Supabase SQL Editor if salon service image uploads fail.

ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS image_url TEXT;

COMMENT ON COLUMN public.services.image_url IS
  'Square service image URL (public-assets/salon-services/{salon_id}/). Copied from global_services.icon_image_url on import.';
