-- PROMOTION_PACKAGES_PATCH.sql
-- Run in Supabase SQL Editor after deploying the app changes.
-- Mirrors categories/global_services with promotion_types/global_promotion_packages/salon_promotion_packages.

-- 1. Promotion types (admin-managed, like service categories)
CREATE TABLE IF NOT EXISTS promotion_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'Gift',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Global promotion package templates (admin-managed, like global_services)
CREATE TABLE IF NOT EXISTS global_promotion_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_type_id UUID REFERENCES promotion_types(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  package_price NUMERIC DEFAULT 0,
  original_price NUMERIC DEFAULT 0,
  included_services JSONB DEFAULT '[]'::jsonb,
  icon TEXT DEFAULT 'Gift',
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Salon-scoped promotion packages (salon owner catalog, like services)
CREATE TABLE IF NOT EXISTS salon_promotion_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  global_promotion_package_id UUID REFERENCES global_promotion_packages(id) ON DELETE SET NULL,
  promotion_type_id UUID REFERENCES promotion_types(id) ON DELETE SET NULL,
  promotion_type TEXT,
  name TEXT NOT NULL,
  description TEXT,
  package_price NUMERIC DEFAULT 0,
  original_price NUMERIC DEFAULT 0,
  included_services JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'active',
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_global_promotion_packages_type ON global_promotion_packages(promotion_type_id);
CREATE INDEX IF NOT EXISTS idx_salon_promotion_packages_salon ON salon_promotion_packages(salon_id);

-- 4. Subscription plan limits for promotion packages
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS max_promotion_packages INT DEFAULT 3;

UPDATE subscription_plans SET max_promotion_packages = 2,
  feature_flags = COALESCE(feature_flags, '{}'::jsonb) || '{"allowed_promotion_types_limit": 2}'::jsonb
WHERE name IN ('Beginner', 'Free');

UPDATE subscription_plans SET max_promotion_packages = 4,
  feature_flags = COALESCE(feature_flags, '{}'::jsonb) || '{"allowed_promotion_types_limit": 4}'::jsonb
WHERE name = 'Starter';

UPDATE subscription_plans SET max_promotion_packages = 6,
  feature_flags = COALESCE(feature_flags, '{}'::jsonb) || '{"allowed_promotion_types_limit": 6}'::jsonb
WHERE name = 'Pro';

UPDATE subscription_plans SET max_promotion_packages = 12,
  feature_flags = COALESCE(feature_flags, '{}'::jsonb) || '{"allowed_promotion_types_limit": 12}'::jsonb
WHERE name = 'Elite';

-- 5. RLS
ALTER TABLE promotion_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_promotion_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE salon_promotion_packages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view promotion types" ON promotion_types;
CREATE POLICY "Public can view promotion types" ON promotion_types FOR SELECT USING (true);

DROP POLICY IF EXISTS "Auth can modify promotion types" ON promotion_types;
CREATE POLICY "Auth can modify promotion types" ON promotion_types FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Public can view global promotion packages" ON global_promotion_packages;
CREATE POLICY "Public can view global promotion packages" ON global_promotion_packages FOR SELECT USING (true);

DROP POLICY IF EXISTS "Auth can modify global promotion packages" ON global_promotion_packages;
CREATE POLICY "Auth can modify global promotion packages" ON global_promotion_packages FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Public can view salon promotion packages" ON salon_promotion_packages;
CREATE POLICY "Public can view salon promotion packages" ON salon_promotion_packages FOR SELECT USING (true);

DROP POLICY IF EXISTS "Auth can modify salon promotion packages" ON salon_promotion_packages;
CREATE POLICY "Auth can modify salon promotion packages" ON salon_promotion_packages FOR ALL USING (auth.role() = 'authenticated');

-- 6. Seed default promotion types and sample global packages (idempotent by slug)
INSERT INTO promotion_types (name, slug, description, icon) VALUES
  ('Bundle Offers', 'bundle-offers', 'Multi-service promotional bundles', 'Gift'),
  ('Seasonal Deals', 'seasonal-deals', 'Limited-time seasonal promotions', 'Sparkles'),
  ('Membership Packages', 'membership-packages', 'Recurring membership style packages', 'Star'),
  ('Flash Sales', 'flash-sales', 'Short-window high-discount offers', 'Zap')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO global_promotion_packages (
  promotion_type_id, name, slug, description, package_price, original_price, included_services, icon, start_date, end_date, is_active
)
SELECT
  pt.id,
  'Bridal Glow Premium Bundle',
  'bridal-glow-premium-bundle',
  'Complete bridal preparation package.',
  18500,
  22700,
  '["Luxury Hair Spa", "Complete Hair Makeover", "Classic Mani-Pedi", "Hydrafacial Glow Treatment"]'::jsonb,
  'Gift',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '60 days',
  TRUE
FROM promotion_types pt WHERE pt.slug = 'bundle-offers'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO global_promotion_packages (
  promotion_type_id, name, slug, description, package_price, original_price, included_services, icon, start_date, end_date, is_active
)
SELECT
  pt.id,
  'Men''s Ultra Grooming Kit',
  'mens-ultra-grooming-kit',
  'Premium grooming bundle for men.',
  4500,
  5700,
  '["Classic Haircut", "Hot Towel Beard Shave", "Charcoal Face Mask", "Head & Shoulder Massage"]'::jsonb,
  'Tag',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '14 days',
  TRUE
FROM promotion_types pt WHERE pt.slug = 'bundle-offers'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO global_promotion_packages (
  promotion_type_id, name, slug, description, package_price, original_price, included_services, icon, start_date, end_date, is_active
)
SELECT
  pt.id,
  'Signature Nail & Spa Deal',
  'signature-nail-spa-deal',
  'Relaxing nail and spa combination.',
  8000,
  9800,
  '["Gel Nail Extension", "Paraffin Hand Treatment", "Foot Spa Aromatherapy"]'::jsonb,
  'Sparkles',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '21 days',
  TRUE
FROM promotion_types pt WHERE pt.slug = 'seasonal-deals'
ON CONFLICT (slug) DO NOTHING;

-- Schedule columns for databases created before this update
ALTER TABLE global_promotion_packages ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE global_promotion_packages ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE salon_promotion_packages ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE salon_promotion_packages ADD COLUMN IF NOT EXISTS end_date DATE;
