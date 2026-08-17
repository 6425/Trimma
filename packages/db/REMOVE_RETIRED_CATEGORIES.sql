-- Permanently remove Beauty Parlours, Kids & Family, and the Spa & Wellness
-- duplicate without an image (slug spa-and-wellness).
-- Keep Spa & Wellness with slug spa-wellness.
-- Run this in the Supabase SQL Editor for each environment (live and beta).

-- Preview
SELECT id, name, slug
FROM categories
WHERE slug IN (
    'beauty-parlours',
    'beauty-salon',
    'kids-family',
    'kids-and-family',
    'spa-and-wellness'
  )
  OR name IN ('Beauty Parlours', 'Beauty Parlors', 'Kids & Family', 'Kids and Family');

-- Detach / delete dependent global services
DELETE FROM global_services
WHERE category_id IN (
  SELECT id FROM categories
  WHERE slug IN (
      'beauty-parlours',
      'beauty-salon',
      'kids-family',
      'kids-and-family',
      'spa-and-wellness'
    )
    OR name IN ('Beauty Parlours', 'Beauty Parlors', 'Kids & Family', 'Kids and Family')
);

-- Salon services: drop the retired category FK, keep the service rows
UPDATE services
SET category_id = NULL
WHERE category_id IN (
  SELECT id FROM categories
  WHERE slug IN (
      'beauty-parlours',
      'beauty-salon',
      'kids-family',
      'kids-and-family',
      'spa-and-wellness'
    )
    OR name IN ('Beauty Parlours', 'Beauty Parlors', 'Kids & Family', 'Kids and Family')
);

DELETE FROM categories
WHERE slug IN (
    'beauty-parlours',
    'beauty-salon',
    'kids-family',
    'kids-and-family',
    'spa-and-wellness'
  )
  OR name IN ('Beauty Parlours', 'Beauty Parlors', 'Kids & Family', 'Kids and Family');

-- Remap listing labels so cards do not keep showing retired names
UPDATE salons
SET category = 'Bridal & Beauty'
WHERE category IN ('Beauty Parlours', 'Beauty Parlors', 'Beauty Salon');

UPDATE salons
SET category = NULL
WHERE category IN ('Kids & Family', 'Kids and Family');
