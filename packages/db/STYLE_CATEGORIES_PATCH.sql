-- ==============================================================================
-- TRIMMA: STYLE MANAGEMENT — FULL SETUP (tables + categories link)
-- ==============================================================================
-- Run this ONE script in Supabase SQL Editor (safe to re-run).
-- Creates platform_styles + customer_saved_styles if missing, links to categories,
-- and sets RLS. Supersedes running STYLE_MANAGEMENT_PATCH.sql separately.
--
-- Requires: public.categories table (from MARKETPLACE_SCHEMA.sql / admin categories).
-- ==============================================================================

BEGIN;

-- ── 1. Core tables ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.platform_styles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  tags TEXT[] DEFAULT '{}'::TEXT[],
  image_url TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.platform_styles ADD COLUMN IF NOT EXISTS category_id UUID;
ALTER TABLE public.platform_styles ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.platform_styles ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.platform_styles ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}'::TEXT[];
ALTER TABLE public.platform_styles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.platform_styles ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;
ALTER TABLE public.platform_styles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'platform_styles_category_id_fkey'
  ) THEN
    ALTER TABLE public.platform_styles
      ADD CONSTRAINT platform_styles_category_id_fkey
      FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;
  END IF;
EXCEPTION
  WHEN undefined_table THEN
    RAISE NOTICE 'categories table not found — create it via MARKETPLACE_SCHEMA.sql first, then re-run this script.';
END $$;

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

-- ── 2. RLS ───────────────────────────────────────────────────────────────────

ALTER TABLE public.platform_styles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_saved_styles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active platform styles" ON public.platform_styles;
DROP POLICY IF EXISTS "Authenticated can manage platform styles" ON public.platform_styles;
DROP POLICY IF EXISTS "Authenticated can view all platform styles" ON public.platform_styles;
DROP POLICY IF EXISTS "Customers can view own saved styles" ON public.customer_saved_styles;
DROP POLICY IF EXISTS "Customers can save styles" ON public.customer_saved_styles;
DROP POLICY IF EXISTS "Customers can remove saved styles" ON public.customer_saved_styles;

CREATE POLICY "Public can view active platform styles"
  ON public.platform_styles FOR SELECT
  USING (is_active = true);

CREATE POLICY "Authenticated can manage platform styles"
  ON public.platform_styles FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated can view all platform styles"
  ON public.platform_styles FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Customers can view own saved styles"
  ON public.customer_saved_styles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Customers can save styles"
  ON public.customer_saved_styles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Customers can remove saved styles"
  ON public.customer_saved_styles FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ── 3. Backfill category_id from legacy text ─────────────────────────────────

UPDATE public.platform_styles ps
SET category_id = c.id
FROM public.categories c
WHERE ps.category_id IS NULL
  AND ps.category IS NOT NULL
  AND lower(trim(ps.category)) = lower(trim(c.name));

UPDATE public.platform_styles ps
SET category = c.name
FROM public.categories c
WHERE ps.category_id = c.id
  AND (ps.category IS NULL OR ps.category <> c.name);

COMMIT;

NOTIFY pgrst, 'reload schema';

SELECT
  (SELECT count(*) FROM public.platform_styles) AS total_styles,
  (SELECT count(*) FROM public.platform_styles WHERE category_id IS NOT NULL) AS linked_styles,
  (SELECT count(*) FROM public.customer_saved_styles) AS saved_style_rows,
  'Style management ready' AS status;
