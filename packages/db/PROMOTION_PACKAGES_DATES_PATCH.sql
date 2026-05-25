-- PROMOTION_PACKAGES_DATES_PATCH.sql
-- Run in Supabase if promotion tables already exist without schedule fields.

ALTER TABLE global_promotion_packages ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE global_promotion_packages ADD COLUMN IF NOT EXISTS end_date DATE;

ALTER TABLE salon_promotion_packages ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE salon_promotion_packages ADD COLUMN IF NOT EXISTS end_date DATE;

-- Backfill sample tentative periods for seeded global templates
UPDATE global_promotion_packages
SET
  start_date = COALESCE(start_date, CURRENT_DATE),
  end_date = COALESCE(end_date, CURRENT_DATE + INTERVAL '30 days')
WHERE slug IN (
  'bridal-glow-premium-bundle',
  'mens-ultra-grooming-kit',
  'signature-nail-spa-deal'
);

UPDATE global_promotion_packages
SET end_date = start_date + INTERVAL '60 days'
WHERE slug = 'bridal-glow-premium-bundle' AND start_date IS NOT NULL;

UPDATE global_promotion_packages
SET end_date = start_date + INTERVAL '14 days'
WHERE slug = 'mens-ultra-grooming-kit' AND start_date IS NOT NULL;

UPDATE global_promotion_packages
SET end_date = start_date + INTERVAL '21 days'
WHERE slug = 'signature-nail-spa-deal' AND start_date IS NOT NULL;
