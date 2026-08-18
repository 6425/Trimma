-- Permanently remove Beauty Parlours and Kids & Family.
-- Do not delete Spa & Wellness (including slug spa-and-wellness).
-- Run this in the Supabase SQL Editor for each environment (live and beta).

-- Preview
SELECT id, name, slug
FROM categories
WHERE slug IN (
    'beauty-parlours',
    'beauty-salon',
    'kids-family',
    'kids-and-family'
  )
  OR name IN ('Beauty Parlours', 'Beauty Parlors', 'Kids & Family', 'Kids and Family');

DELETE FROM global_services
WHERE category_id IN (
  SELECT id FROM categories
  WHERE slug IN (
      'beauty-parlours',
      'beauty-salon',
      'kids-family',
      'kids-and-family'
    )
    OR name IN ('Beauty Parlours', 'Beauty Parlors', 'Kids & Family', 'Kids and Family')
);

UPDATE services
SET category_id = NULL
WHERE category_id IN (
  SELECT id FROM categories
  WHERE slug IN (
      'beauty-parlours',
      'beauty-salon',
      'kids-family',
      'kids-and-family'
    )
    OR name IN ('Beauty Parlours', 'Beauty Parlors', 'Kids & Family', 'Kids and Family')
);

DELETE FROM categories
WHERE slug IN (
    'beauty-parlours',
    'beauty-salon',
    'kids-family',
    'kids-and-family'
  )
  OR name IN ('Beauty Parlours', 'Beauty Parlors', 'Kids & Family', 'Kids and Family');

UPDATE salons
SET category = 'Barber Salon'
WHERE category IN ('Beauty Parlours', 'Beauty Parlors');

UPDATE salons
SET category = 'Barber Salon'
WHERE category IN ('Kids & Family', 'Kids and Family');
