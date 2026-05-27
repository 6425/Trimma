-- Global service image column (run in Supabase SQL Editor)
ALTER TABLE public.global_services
  ADD COLUMN IF NOT EXISTS icon_image_url TEXT;

COMMENT ON COLUMN public.global_services.icon_image_url IS
  'Optional square service image URL (public-assets/global-services/). Falls back to lucide icon name in icon column.';

NOTIFY pgrst, 'reload schema';
