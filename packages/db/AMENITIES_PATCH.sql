-- ==============================================================================
-- TRIMMA: SALON AMENITIES (global catalog + per-salon values)
-- ==============================================================================
-- Run in Supabase SQL Editor (safe to re-run).
-- Matches apps/web dashboard profile + public salon page.
-- ==============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.global_amenities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('boolean', 'number')),
  icon_name TEXT NOT NULL DEFAULT 'LayoutGrid',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.salon_amenities (
  salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  amenity_id UUID NOT NULL REFERENCES public.global_amenities(id) ON DELETE CASCADE,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (salon_id, amenity_id)
);

CREATE INDEX IF NOT EXISTS idx_salon_amenities_salon_id
  ON public.salon_amenities (salon_id);

ALTER TABLE public.global_amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salon_amenities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view global amenities" ON public.global_amenities;
DROP POLICY IF EXISTS "Authenticated can manage global amenities" ON public.global_amenities;
DROP POLICY IF EXISTS "Public can view salon amenities" ON public.salon_amenities;
DROP POLICY IF EXISTS "Owners can manage salon amenities" ON public.salon_amenities;

CREATE POLICY "Public can view global amenities"
  ON public.global_amenities FOR SELECT
  USING (true);

CREATE POLICY "Authenticated can manage global amenities"
  ON public.global_amenities FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Public can view salon amenities"
  ON public.salon_amenities FOR SELECT
  USING (true);

CREATE POLICY "Owners can manage salon amenities"
  ON public.salon_amenities FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.salons
      WHERE salons.id = salon_amenities.salon_id
        AND salons.owner_email = auth.jwt() ->> 'email'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.salons
      WHERE salons.id = salon_amenities.salon_id
        AND salons.owner_email = auth.jwt() ->> 'email'
    )
  );

INSERT INTO public.global_amenities (name, type, icon_name)
SELECT seed.name, seed.type, seed.icon_name
FROM (
  VALUES
    ('Free WiFi', 'boolean', 'Wifi'),
    ('Parking Available', 'boolean', 'Car'),
    ('Number of Chairs', 'number', 'Armchair'),
    ('Air Conditioning', 'boolean', 'Wind'),
    ('Complimentary Refreshments', 'boolean', 'Coffee')
) AS seed(name, type, icon_name)
WHERE NOT EXISTS (SELECT 1 FROM public.global_amenities LIMIT 1);

COMMIT;

NOTIFY pgrst, 'reload schema';

SELECT
  (SELECT count(*) FROM public.global_amenities) AS global_amenities,
  (SELECT count(*) FROM public.salon_amenities) AS salon_amenity_rows,
  'Amenities ready' AS status;
