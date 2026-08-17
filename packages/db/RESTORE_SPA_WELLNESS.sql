-- Restore Spa & Wellness if the last deploy removed the live slug (spa-and-wellness).
-- Keep the existing row and image when present; only insert if none remain.
-- Run in the Supabase SQL Editor for live and beta.

INSERT INTO categories (name, slug, icon, image_url, description)
SELECT
  'Spa & Wellness',
  'spa-wellness',
  'Flower2',
  '/assets/category-spa-wellness-hero.webp',
  'Relaxation and holistic body care.'
WHERE NOT EXISTS (
  SELECT 1
  FROM categories
  WHERE slug IN ('spa-wellness', 'spa-and-wellness')
     OR name = 'Spa & Wellness'
);

UPDATE categories
SET slug = 'spa-wellness',
    name = 'Spa & Wellness'
WHERE slug = 'spa-and-wellness'
  AND NOT EXISTS (
    SELECT 1 FROM categories WHERE slug = 'spa-wellness'
  );

UPDATE categories
SET image_url = COALESCE(NULLIF(btrim(image_url), ''), '/assets/category-spa-wellness-hero.webp'),
    icon = COALESCE(NULLIF(btrim(icon), ''), 'Flower2')
WHERE slug IN ('spa-wellness', 'spa-and-wellness')
   OR name = 'Spa & Wellness';
