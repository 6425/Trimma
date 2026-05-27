-- ==============================================================================
-- TRIMMA: Global service square service image (icon_image_url)
-- ==============================================================================
-- Run in Supabase SQL Editor (safe to re-run).
--
-- Stores a public URL for a square service icon uploaded from Admin → Global Services.
-- Files live in storage bucket: public-assets/global-services/{filename}
-- (Ensure public-assets bucket exists — see STORAGE_PUBLIC_ASSETS_PATCH.sql)
-- ==============================================================================

BEGIN;

ALTER TABLE public.global_services
  ADD COLUMN IF NOT EXISTS icon_image_url TEXT;

COMMENT ON COLUMN public.global_services.icon_image_url IS
  'Optional square service image URL (public-assets/global-services/). Falls back to lucide icon name in icon column.';

-- Refresh PostgREST schema cache so Supabase client sees the new column immediately.
NOTIFY pgrst, 'reload schema';

COMMIT;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'global_services'
  AND column_name IN ('icon', 'icon_image_url')
ORDER BY column_name;
