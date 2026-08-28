-- Ja-Ela is in Gampaha District, Western Province. Consolidate any duplicate
-- or incorrectly parented city rows and keep relational salon references valid.
DO $$
DECLARE
  gampaha_district_id public.districts.id%TYPE;
  canonical_city_id public.cities.id%TYPE;
  gampaha_territory_id public.territories.id%TYPE;
BEGIN
  SELECT d.id
  INTO gampaha_district_id
  FROM public.districts d
  JOIN public.provinces p ON p.id = d.province_id
  WHERE lower(d.slug) = 'gampaha'
    AND (lower(p.slug) IN ('western', 'western-province') OR lower(p.name) = 'western province')
  LIMIT 1;

  IF gampaha_district_id IS NULL THEN
    RAISE EXCEPTION 'Gampaha District in Western Province was not found.';
  END IF;

  SELECT c.id
  INTO canonical_city_id
  FROM public.cities c
  WHERE lower(c.slug) = 'ja-ela'
     OR regexp_replace(lower(c.name), '[^a-z0-9]+', '-', 'g') = 'ja-ela'
  ORDER BY
    CASE WHEN lower(c.slug) = 'ja-ela' THEN 0 ELSE 1 END,
    CASE WHEN c.district_id = gampaha_district_id THEN 0 ELSE 1 END
  LIMIT 1;

  IF canonical_city_id IS NULL THEN
    INSERT INTO public.cities (district_id, name, slug)
    VALUES (gampaha_district_id, 'Ja-Ela', 'ja-ela')
    RETURNING id INTO canonical_city_id;
  ELSE
    UPDATE public.cities
    SET district_id = gampaha_district_id,
        name = 'Ja-Ela',
        slug = 'ja-ela'
    WHERE id = canonical_city_id;
  END IF;

  UPDATE public.salons
  SET city_id = canonical_city_id,
      city = CASE
        WHEN regexp_replace(lower(coalesce(city, '')), '[^a-z0-9]+', '-', 'g') = 'ja-ela' THEN 'Ja-Ela'
        ELSE city
      END,
      district_id = CASE
        WHEN regexp_replace(lower(coalesce(city, '')), '[^a-z0-9]+', '-', 'g') = 'ja-ela' THEN gampaha_district_id
        ELSE district_id
      END,
      district = CASE
        WHEN regexp_replace(lower(coalesce(city, '')), '[^a-z0-9]+', '-', 'g') = 'ja-ela' THEN 'Gampaha'
        ELSE district
      END
  WHERE city_id IN (
    SELECT c.id
    FROM public.cities c
    WHERE c.id <> canonical_city_id
      AND (
        lower(c.slug) = 'ja-ela'
        OR regexp_replace(lower(c.name), '[^a-z0-9]+', '-', 'g') = 'ja-ela'
      )
  )
  OR regexp_replace(lower(coalesce(city, '')), '[^a-z0-9]+', '-', 'g') = 'ja-ela';

  DELETE FROM public.cities c
  WHERE c.id <> canonical_city_id
    AND (
      lower(c.slug) = 'ja-ela'
      OR regexp_replace(lower(c.name), '[^a-z0-9]+', '-', 'g') = 'ja-ela'
    );

  SELECT t.id
  INTO gampaha_territory_id
  FROM public.territories t
  WHERE t.type = 'district' AND lower(t.slug) = 'gampaha'
  LIMIT 1;

  IF gampaha_territory_id IS NOT NULL THEN
    UPDATE public.territories
    SET parent_id = gampaha_territory_id,
        name = 'Ja-Ela'
    WHERE type = 'city'
      AND (
        lower(slug) = 'ja-ela'
        OR regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g') = 'ja-ela'
      );
  END IF;
END $$;
