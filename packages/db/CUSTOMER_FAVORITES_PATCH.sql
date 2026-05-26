-- ==============================================================================
-- TRIMMA: CUSTOMER FAVORITE SALONS
-- ==============================================================================
-- Run in Supabase SQL Editor (safe to re-run).
-- Powers /customer/favorites — saved salons per logged-in user.
-- ==============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.customer_favorite_salons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, salon_id)
);

CREATE INDEX IF NOT EXISTS idx_customer_favorite_salons_user_id
  ON public.customer_favorite_salons (user_id);

CREATE INDEX IF NOT EXISTS idx_customer_favorite_salons_salon_id
  ON public.customer_favorite_salons (salon_id);

ALTER TABLE public.customer_favorite_salons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers can view own favorite salons" ON public.customer_favorite_salons;
DROP POLICY IF EXISTS "Customers can add own favorite salons" ON public.customer_favorite_salons;
DROP POLICY IF EXISTS "Customers can remove own favorite salons" ON public.customer_favorite_salons;

CREATE POLICY "Customers can view own favorite salons"
  ON public.customer_favorite_salons
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Customers can add own favorite salons"
  ON public.customer_favorite_salons
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Customers can remove own favorite salons"
  ON public.customer_favorite_salons
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

COMMIT;

NOTIFY pgrst, 'reload schema';

SELECT 'customer_favorite_salons ready' AS status;
