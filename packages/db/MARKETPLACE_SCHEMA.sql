-- ==============================================================================
-- TRIMMA MARKETPLACE SCHEMA EXTENSION
-- ==============================================================================
-- Run this script in your Supabase SQL Editor to create the missing tables 
-- required for the Admin Marketplace (Categories & Global Services)
-- ==============================================================================

-- 1. CREATE CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CREATE GLOBAL SERVICES TABLE
CREATE TABLE IF NOT EXISTS global_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  suggested_price NUMERIC,
  icon TEXT,
  icon_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ENABLE RLS (Row Level Security)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_services ENABLE ROW LEVEL SECURITY;

-- 4. ADD RLS POLICIES
-- Everyone can read the marketplace catalogs
CREATE POLICY "Public can view categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Public can view global services" ON global_services FOR SELECT USING (true);

-- Only authenticated users (admins) can modify them (In production, you'd add a role check here)
CREATE POLICY "Auth can modify categories" ON categories FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Auth can modify global services" ON global_services FOR ALL USING (auth.role() = 'authenticated');
