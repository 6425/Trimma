-- ==============================================================================
-- TRIMMA: STYLE MANAGEMENT (admin catalog + customer saved styles)
-- ==============================================================================
-- ⚠️  SUPERSEDED: Run STYLE_CATEGORIES_PATCH.sql instead — it creates tables
--     AND links salon categories in one script (safe to re-run).
-- ==============================================================================
-- Run in Supabase SQL Editor (safe to re-run).
-- Powers /admin/styles, /styles, and /customer/styles
-- Images: upload to public-assets bucket under styles/*.webp (3:4 portrait)
-- ==============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.platform_styles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  category TEXT,
  tags TEXT[] DEFAULT '{}'::TEXT[],
  image_url TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platform_styles_category_id
  ON public.platform_styles (category_id);

CREATE INDEX IF NOT EXISTS idx_platform_styles_active_sort
  ON public.platform_styles (is_active, sort_order DESC, created_at DESC);

CREATE TABLE IF NOT EXISTS public.customer_saved_styles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  style_id UUID NOT NULL REFERENCES public.platform_styles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, style_id)
);

CREATE INDEX IF NOT EXISTS idx_customer_saved_styles_user_id
  ON public.customer_saved_styles (user_id);

CREATE INDEX IF NOT EXISTS idx_customer_saved_styles_style_id
  ON public.customer_saved_styles (style_id);

ALTER TABLE public.platform_styles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_saved_styles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active platform styles" ON public.platform_styles;
DROP POLICY IF EXISTS "Authenticated can manage platform styles" ON public.platform_styles;
DROP POLICY IF EXISTS "Customers can view own saved styles" ON public.customer_saved_styles;
DROP POLICY IF EXISTS "Customers can save styles" ON public.customer_saved_styles;
DROP POLICY IF EXISTS "Customers can remove saved styles" ON public.customer_saved_styles;

CREATE POLICY "Public can view active platform styles"
  ON public.platform_styles
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Authenticated can manage platform styles"
  ON public.platform_styles
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Customers can view own saved styles"
  ON public.customer_saved_styles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Customers can save styles"
  ON public.customer_saved_styles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Customers can remove saved styles"
  ON public.customer_saved_styles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins need to read inactive styles in the dashboard
DROP POLICY IF EXISTS "Authenticated can view all platform styles" ON public.platform_styles;
CREATE POLICY "Authenticated can view all platform styles"
  ON public.platform_styles
  FOR SELECT
  TO authenticated
  USING (true);

COMMIT;

NOTIFY pgrst, 'reload schema';

SELECT 'platform_styles + customer_saved_styles ready' AS status;
