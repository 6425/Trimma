-- TRIMMA AI: MASTER DATA & RLS INITIALIZATION
-- Run this in your Supabase SQL Editor to bypass Frontend RLS issues.

-- 0. SCHEMA PATCHES
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS description text;

CREATE TABLE IF NOT EXISTS public.global_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    name text NOT NULL,
    slug text UNIQUE NOT NULL,
    description text,
    suggested_price numeric,
    suggested_duration_minutes integer,
    icon text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by uuid
);

-- 1. ENABLE RLS
ALTER TABLE provinces ENABLE ROW LEVEL SECURITY;
ALTER TABLE districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_services ENABLE ROW LEVEL SECURITY;

-- 2. CREATE POLICIES (Allow Public/Auth Read, allow Admin Write)
-- Drop existing to avoid conflicts
DROP POLICY IF EXISTS "Allow Public Read Provinces" ON provinces;
DROP POLICY IF EXISTS "Allow Admin All Provinces" ON provinces;
DROP POLICY IF EXISTS "Allow Public Read Districts" ON districts;
DROP POLICY IF EXISTS "Allow Admin All Districts" ON districts;
DROP POLICY IF EXISTS "Allow Public Read Cities" ON cities;
DROP POLICY IF EXISTS "Allow Admin All Cities" ON cities;
DROP POLICY IF EXISTS "Allow Public Read Categories" ON categories;
DROP POLICY IF EXISTS "Allow Admin All Categories" ON categories;
DROP POLICY IF EXISTS "Allow Public Read Global Services" ON global_services;
DROP POLICY IF EXISTS "Allow Admin All Global Services" ON global_services;

-- Provinces
CREATE POLICY "Allow Public Read Provinces" ON provinces FOR SELECT USING (true);
CREATE POLICY "Allow Admin All Provinces" ON provinces FOR ALL TO authenticated USING (auth.jwt() ->> 'email' = 'trimhublk@gmail.com');

-- Districts
CREATE POLICY "Allow Public Read Districts" ON districts FOR SELECT USING (true);
CREATE POLICY "Allow Admin All Districts" ON districts FOR ALL TO authenticated USING (auth.jwt() ->> 'email' = 'trimhublk@gmail.com');

-- Cities
CREATE POLICY "Allow Public Read Cities" ON cities FOR SELECT USING (true);
CREATE POLICY "Allow Admin All Cities" ON cities FOR ALL TO authenticated USING (auth.jwt() ->> 'email' = 'trimhublk@gmail.com');

-- Categories
CREATE POLICY "Allow Public Read Categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Allow Admin All Categories" ON categories FOR ALL TO authenticated USING (auth.jwt() ->> 'email' = 'trimhublk@gmail.com');

-- Global Services
CREATE POLICY "Allow Public Read Global Services" ON global_services FOR SELECT USING (true);
CREATE POLICY "Allow Admin All Global Services" ON global_services FOR ALL TO authenticated USING (auth.jwt() ->> 'email' = 'trimhublk@gmail.com');

-- 3. SEED PROVINCES
INSERT INTO provinces (name, slug)
VALUES 
  ('Central Province', 'central-province'),
  ('Eastern Province', 'eastern-province'),
  ('North Central Province', 'north-central-province'),
  ('North Western Province', 'north-western-province'),
  ('Northern Province', 'northern-province'),
  ('Sabaragamuwa Province', 'sabaragamuwa-province'),
  ('Southern Province', 'southern-province'),
  ('Uva Province', 'uva-province'),
  ('Western Province', 'western-province')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

-- 4. SEED CATEGORIES
INSERT INTO categories (name, slug, description)
VALUES 
  ('Barber Salon', 'barber-salon', 'Traditional and modern gents grooming.'),
  ('Beauty Parlours', 'beauty-parlours', 'Complete beauty care for ladies.'),
  ('Bridal & Beauty', 'bridal-beauty', 'Premium bridal dressing and event makeup.'),
  ('Nail Studio', 'nail-studio', 'Professional nail care and art.'),
  ('Skincare Clinics', 'skincare-clinics', 'Advanced dermatological treatments.'),
  ('Spa & Wellness', 'spa-wellness', 'Relaxation and holistic body care.'),
  ('Yoga Studio', 'yoga-studio', 'Physical and mental wellness classes.'),
  ('Men''s Grooming', 'mens-grooming', 'Executive level grooming for men.'),
  ('Kids & Family', 'kids-family', 'Salon services for children and families.'),
  ('Tattoo Studio', 'tattoo-studio', 'Custom body art and piercings.')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

-- 5. SEED DISTRICTS
INSERT INTO districts (province_id, name, slug)
VALUES 
  ((SELECT id FROM provinces WHERE name = 'Western Province' LIMIT 1), 'Colombo', 'colombo'),
  ((SELECT id FROM provinces WHERE name = 'Western Province' LIMIT 1), 'Gampaha', 'gampaha'),
  ((SELECT id FROM provinces WHERE name = 'Western Province' LIMIT 1), 'Kalutara', 'kalutara'),
  ((SELECT id FROM provinces WHERE name = 'Central Province' LIMIT 1), 'Kandy', 'kandy'),
  ((SELECT id FROM provinces WHERE name = 'Central Province' LIMIT 1), 'Matale', 'matale'),
  ((SELECT id FROM provinces WHERE name = 'Central Province' LIMIT 1), 'Nuwara Eliya', 'nuwara-eliya'),
  ((SELECT id FROM provinces WHERE name = 'Southern Province' LIMIT 1), 'Galle', 'galle'),
  ((SELECT id FROM provinces WHERE name = 'Southern Province' LIMIT 1), 'Matara', 'matara'),
  ((SELECT id FROM provinces WHERE name = 'Southern Province' LIMIT 1), 'Hambantota', 'hambantota'),
  ((SELECT id FROM provinces WHERE name = 'Northern Province' LIMIT 1), 'Jaffna', 'jaffna'),
  ((SELECT id FROM provinces WHERE name = 'North Western Province' LIMIT 1), 'Kurunegala', 'kurunegala'),
  ((SELECT id FROM provinces WHERE name = 'Eastern Province' LIMIT 1), 'Trincomalee', 'trincomalee')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, province_id = EXCLUDED.province_id;

-- 6. SEED CITIES
INSERT INTO cities (district_id, name, slug)
VALUES 
  ((SELECT id FROM districts WHERE name = 'Colombo' LIMIT 1), 'Colombo 01 - Fort', 'colombo-fort'),
  ((SELECT id FROM districts WHERE name = 'Colombo' LIMIT 1), 'Colombo 03 - Colpetty', 'colombo-colpetty'),
  ((SELECT id FROM districts WHERE name = 'Colombo' LIMIT 1), 'Colombo 07 - Cinnamon Gardens', 'colombo-cinnamon-gardens'),
  ((SELECT id FROM districts WHERE name = 'Gampaha' LIMIT 1), 'Negombo', 'negombo'),
  ((SELECT id FROM districts WHERE name = 'Kandy' LIMIT 1), 'Kandy City', 'kandy-city'),
  ((SELECT id FROM districts WHERE name = 'Galle' LIMIT 1), 'Galle Fort', 'galle-fort'),
  ((SELECT id FROM districts WHERE name = 'Jaffna' LIMIT 1), 'Jaffna Town', 'jaffna-town'),
  ((SELECT id FROM districts WHERE name = 'Kurunegala' LIMIT 1), 'Kurunegala Town', 'kurunegala-town')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, district_id = EXCLUDED.district_id;

-- 7. SEED GLOBAL SERVICES
INSERT INTO global_services (category_id, name, slug, description, suggested_price, icon)
VALUES 
  ((SELECT id FROM categories WHERE name = 'Barber Salon' LIMIT 1), 'Gents Haircut & Wash', 'gents-haircut-wash', 'Professional hair trimming, shampooing, and basic styling.', 1500, 'Scissors'),
  ((SELECT id FROM categories WHERE name = 'Barber Salon' LIMIT 1), 'Beard Trimming & Shape', 'beard-trimming-shape', 'Classic line-up and beard shaping using clippers or razors.', 600, 'Scissors'),
  ((SELECT id FROM categories WHERE name = 'Bridal & Beauty' LIMIT 1), 'Complete Bridal Dressing', 'complete-bridal-dressing', 'Full wedding day package including makeup, hair, and dressing.', 60000, 'Heart'),
  ((SELECT id FROM categories WHERE name = 'Beauty Parlours' LIMIT 1), 'Clean Up Facial', 'clean-up-facial', 'Standard face exfoliation, steam, and pack for daily upkeep.', 3500, 'Sparkles'),
  ((SELECT id FROM categories WHERE name = 'Nail Studio' LIMIT 1), 'Gel Polish Application', 'gel-polish-application', 'Standard long-lasting gel color cured under a UV/LED lamp.', 4000, 'Paintbrush')
ON CONFLICT (slug) DO UPDATE SET 
  name = EXCLUDED.name, 
  description = EXCLUDED.description, 
  suggested_price = EXCLUDED.suggested_price, 
  icon = EXCLUDED.icon;
