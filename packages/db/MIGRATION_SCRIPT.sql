-- ==============================================================================
-- TRIMMA PRODUCTION DATABASE MIGRATION SCRIPT
-- Safely applies the new Architecture without dropping existing tables or data
-- Execution Target: Supabase SQL Editor
-- ==============================================================================

-- ==============================================================================
-- SECTION 1: GLOBAL TABLES & SAFE PATCHING
-- ==============================================================================

CREATE TABLE IF NOT EXISTS users (
  email TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safely add columns if the users table already exists (e.g. from Supabase Auth)
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS global_role TEXT DEFAULT 'customer';

CREATE TABLE IF NOT EXISTS territories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- province | district | city
  parent_id UUID REFERENCES territories(id),
  slug TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  monthly_price NUMERIC DEFAULT 0,
  annual_price NUMERIC DEFAULT 0,
  max_staff INT DEFAULT 1,
  max_services INT DEFAULT 10,
  max_images INT DEFAULT 5,
  max_branches INT DEFAULT 1,
  feature_flags JSONB DEFAULT '{}'::jsonb
);

-- ==============================================================================
-- SECTION 2: GEO-DATA TRANSFORMATION
-- Extracts data from old provinces/districts/cities tables into 'territories'
-- ==============================================================================

-- 2a. Migrate Provinces
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'provinces') THEN
    INSERT INTO territories (name, type, slug)
    SELECT name, 'province', slug FROM provinces
    ON CONFLICT (slug) DO NOTHING;
  END IF;
END $$;

-- 2b. Migrate Districts
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'districts') THEN
    INSERT INTO territories (name, type, slug, parent_id)
    SELECT d.name, 'district', d.slug, t.id
    FROM districts d
    JOIN provinces p ON d.province_id = p.id
    JOIN territories t ON t.slug = p.slug AND t.type = 'province'
    ON CONFLICT (slug) DO NOTHING;
  END IF;
END $$;

-- 2c. Migrate Cities
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'cities') THEN
    INSERT INTO territories (name, type, slug, parent_id)
    SELECT c.name, 'city', c.slug, t.id
    FROM cities c
    JOIN districts d ON c.district_id = d.id
    JOIN territories t ON t.slug = d.slug AND t.type = 'district'
    ON CONFLICT (slug) DO NOTHING;
  END IF;
END $$;

-- ==============================================================================
-- SECTION 3: TENANT CORE TABLES (Salon Scope)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS salons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

-- ROBUST PATCH: Ensure all fields exist in case 'salons' was partially created before
ALTER TABLE salons ADD COLUMN IF NOT EXISTS owner_email TEXT REFERENCES users(email);
ALTER TABLE salons ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS province TEXT;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS district TEXT;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE salons ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS subscription_plan_id UUID REFERENCES subscription_plans(id);
ALTER TABLE salons ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS cover_url TEXT;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS hero_url TEXT;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS featured_images TEXT[] DEFAULT '{}';
ALTER TABLE salons ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS working_hours TEXT DEFAULT 'Mon - Sun: 9:00 AM - 8:00 PM';
ALTER TABLE salons ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

CREATE TABLE IF NOT EXISTS salon_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

ALTER TABLE salon_staff ADD COLUMN IF NOT EXISTS salon_id UUID REFERENCES salons(id) ON DELETE CASCADE;
ALTER TABLE salon_staff ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE salon_staff ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE salon_staff ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'stylist';
ALTER TABLE salon_staff ADD COLUMN IF NOT EXISTS skill_level TEXT;
ALTER TABLE salon_staff ADD COLUMN IF NOT EXISTS commission_rate NUMERIC DEFAULT 0;
ALTER TABLE salon_staff ADD COLUMN IF NOT EXISTS working_hours JSONB DEFAULT '{}'::jsonb;
ALTER TABLE salon_staff ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE salon_staff ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

ALTER TABLE services ADD COLUMN IF NOT EXISTS salon_id UUID REFERENCES salons(id) ON DELETE CASCADE;
ALTER TABLE services ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS price NUMERIC;
ALTER TABLE services ADD COLUMN IF NOT EXISTS duration_min INT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE services ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booking_no TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS salon_id UUID REFERENCES salons(id) ON DELETE CASCADE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS customer_email TEXT REFERENCES users(email);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES services(id);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS staff_id UUID REFERENCES salon_staff(id);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booking_date DATE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booking_time TIME;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS amount NUMERIC;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

ALTER TABLE payments ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS salon_id UUID REFERENCES salons(id) ON DELETE CASCADE;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS provider TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS provider_payment_id TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS amount NUMERIC;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'LKR';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS raw_response JSONB;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- ==============================================================================
-- SECTION 4: GROWTH, SEO & INTELLIGENCE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS seo_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
ALTER TABLE seo_pages ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE seo_pages ADD COLUMN IF NOT EXISTS reference_id UUID;
ALTER TABLE seo_pages ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE seo_pages ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE seo_pages ADD COLUMN IF NOT EXISTS meta_description TEXT;
ALTER TABLE seo_pages ADD COLUMN IF NOT EXISTS h1 TEXT;
ALTER TABLE seo_pages ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE seo_pages ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS google_place_id TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS province TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS district TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'new';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS agent_email TEXT REFERENCES users(email);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
ALTER TABLE agents ADD COLUMN IF NOT EXISTS user_email TEXT REFERENCES users(email) ON DELETE CASCADE;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS territory_id UUID REFERENCES territories(id);
ALTER TABLE agents ADD COLUMN IF NOT EXISTS commission_rate NUMERIC DEFAULT 0;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

CREATE TABLE IF NOT EXISTS customer_ai_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
ALTER TABLE customer_ai_memory ADD COLUMN IF NOT EXISTS customer_email TEXT REFERENCES users(email) ON DELETE CASCADE;
ALTER TABLE customer_ai_memory ADD COLUMN IF NOT EXISTS salon_id UUID REFERENCES salons(id) ON DELETE CASCADE;
ALTER TABLE customer_ai_memory ADD COLUMN IF NOT EXISTS preferred_staff_id UUID REFERENCES salon_staff(id);
ALTER TABLE customer_ai_memory ADD COLUMN IF NOT EXISTS favorite_services UUID[];
ALTER TABLE customer_ai_memory ADD COLUMN IF NOT EXISTS visit_count INT DEFAULT 0;
ALTER TABLE customer_ai_memory ADD COLUMN IF NOT EXISTS total_spend NUMERIC DEFAULT 0;
ALTER TABLE customer_ai_memory ADD COLUMN IF NOT EXISTS last_visit_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS staff_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
ALTER TABLE staff_reviews ADD COLUMN IF NOT EXISTS salon_id UUID REFERENCES salons(id) ON DELETE CASCADE;
ALTER TABLE staff_reviews ADD COLUMN IF NOT EXISTS staff_id UUID REFERENCES salon_staff(id) ON DELETE CASCADE;
ALTER TABLE staff_reviews ADD COLUMN IF NOT EXISTS customer_email TEXT REFERENCES users(email);
ALTER TABLE staff_reviews ADD COLUMN IF NOT EXISTS rating INT;
ALTER TABLE staff_reviews ADD COLUMN IF NOT EXISTS comment TEXT;
ALTER TABLE staff_reviews ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

CREATE TABLE IF NOT EXISTS salon_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
ALTER TABLE salon_analytics ADD COLUMN IF NOT EXISTS salon_id UUID REFERENCES salons(id) ON DELETE CASCADE;
ALTER TABLE salon_analytics ADD COLUMN IF NOT EXISTS total_bookings INT DEFAULT 0;
ALTER TABLE salon_analytics ADD COLUMN IF NOT EXISTS total_revenue NUMERIC DEFAULT 0;
ALTER TABLE salon_analytics ADD COLUMN IF NOT EXISTS total_customers INT DEFAULT 0;
ALTER TABLE salon_analytics ADD COLUMN IF NOT EXISTS date DATE;

-- ==============================================================================
-- SECTION 5: INDEXING FOR PERFORMANCE
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_salons_slug ON salons(slug);
CREATE INDEX IF NOT EXISTS idx_territories_slug ON territories(slug);
CREATE INDEX IF NOT EXISTS idx_seo_pages_slug ON seo_pages(slug);
CREATE INDEX IF NOT EXISTS idx_bookings_salon_id ON bookings(salon_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_services_salon_id ON services(salon_id);
CREATE INDEX IF NOT EXISTS idx_staff_salon_id ON salon_staff(salon_id);
CREATE INDEX IF NOT EXISTS idx_payments_salon_id ON payments(salon_id);

-- ==============================================================================
-- SECTION 6: ROW LEVEL SECURITY (RLS)
-- ==============================================================================

ALTER TABLE salons ENABLE ROW LEVEL SECURITY;
ALTER TABLE salon_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public salons are viewable by everyone" ON salons;
CREATE POLICY "Public salons are viewable by everyone" ON salons FOR SELECT USING (true);

DROP POLICY IF EXISTS "Owners can update their own salon" ON salons;
CREATE POLICY "Owners can update their own salon" ON salons FOR UPDATE USING (owner_email = auth.jwt() ->> 'email');

DROP POLICY IF EXISTS "Salon isolation for bookings (Salon side)" ON bookings;
CREATE POLICY "Salon isolation for bookings (Salon side)" ON bookings FOR SELECT USING (
  salon_id::text = auth.jwt() ->> 'salon_id'
);

DROP POLICY IF EXISTS "Customers can see their own bookings" ON bookings;
CREATE POLICY "Customers can see their own bookings" ON bookings FOR SELECT USING (
  customer_email = auth.jwt() ->> 'email'
);
