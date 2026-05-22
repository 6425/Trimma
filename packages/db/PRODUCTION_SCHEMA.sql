-- ==============================================================================
-- TRIMMA PRODUCTION DATABASE ARCHITECTURE (SELF-HEALING & IDEMPOTENT)
-- Execution Target: Supabase SQL Editor
-- ==============================================================================

-- ==============================================================================
-- SECTION A: GLOBAL TABLES (No Tenant Scope)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS users (
  email TEXT PRIMARY KEY,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  global_role TEXT DEFAULT 'customer', -- admin | agent | customer | salon_owner
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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
-- SECTION B: TENANT CORE TABLES (Salon Scope)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS salons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_email TEXT REFERENCES users(email),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  province TEXT,
  district TEXT,
  city TEXT,
  address TEXT,
  location TEXT,
  status TEXT DEFAULT 'pending',
  is_verified BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  subscription_plan_id UUID REFERENCES subscription_plans(id) DEFAULT 'f0000000-0000-0000-0000-000000000001'::uuid,
  logo_url TEXT,
  cover_url TEXT,
  hero_url TEXT,
  featured_images TEXT[] DEFAULT '{}',
  description TEXT,
  phone TEXT,
  working_hours TEXT DEFAULT 'Mon - Sun: 9:00 AM - 8:00 PM',
  ai_settings JSONB DEFAULT '{"agent_name": "Zara - Assistant", "voice_tone": "Warm & Welcoming (Female)", "instructions": "You are a polite booking coordinator. Offer customized add-on massage treatments if clients book a full cut or color."}'::jsonb,
  social_settings JSONB DEFAULT '{"facebook_connected": false, "instagram_connected": false, "whatsapp_connected": false, "google_maps_connected": false}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migrations for Automated Onboarding Engine & Discovery
ALTER TABLE salons ADD COLUMN IF NOT EXISTS booking_enabled boolean DEFAULT false;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS public_visibility text DEFAULT 'hidden';
ALTER TABLE salons ADD COLUMN IF NOT EXISTS owner_invited_at timestamptz;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS owner_activated_at timestamptz;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS verification_completed_at timestamptz;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS onboarding_completion_score int DEFAULT 0;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS verification_notes text;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS draft_created_at timestamptz DEFAULT now();
ALTER TABLE salons ADD COLUMN IF NOT EXISTS amenities jsonb DEFAULT '{"chairs": 0, "waiting_capacity": 0, "ac": false, "wifi": false, "parking": false, "parking_capacity": 0, "refreshment": false}'::jsonb;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS place_id TEXT UNIQUE;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS map_url TEXT;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS source_type TEXT;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS onboarding_status TEXT DEFAULT 'DISCOVERED';
ALTER TABLE salons ADD COLUMN IF NOT EXISTS activation_status TEXT DEFAULT 'INACTIVE';
ALTER TABLE salons ADD COLUMN IF NOT EXISTS price_level TEXT;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS summary TEXT;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS latitude NUMERIC;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS longitude NUMERIC;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS rating NUMERIC;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS assign_to TEXT;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS agent_notes TEXT;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS owner_gmail TEXT;

CREATE TABLE IF NOT EXISTS salon_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  role TEXT DEFAULT 'stylist', -- barber | stylist | manager
  skill_level TEXT,
  commission_rate NUMERIC DEFAULT 0,
  working_hours JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price NUMERIC NOT NULL,
  duration_min INT NOT NULL,
  description TEXT,
  image_url TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_no TEXT UNIQUE NOT NULL,
  salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
  customer_email TEXT REFERENCES users(email),
  service_id UUID REFERENCES services(id),
  staff_id UUID REFERENCES salon_staff(id),
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending', -- pending | confirmed | completed | cancelled
  payment_status TEXT DEFAULT 'unpaid',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- payhere | paypal
  provider_payment_id TEXT,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'LKR',
  status TEXT DEFAULT 'pending',
  raw_response JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- SECTION C: GROWTH, SEO & INTELLIGENCE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS seo_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL, -- province | district | category | salon
  reference_id UUID,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  meta_description TEXT,
  h1 TEXT,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_place_id TEXT UNIQUE,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  province TEXT,
  district TEXT,
  city TEXT,
  status TEXT DEFAULT 'new', -- new | assigned | contacted | onboarded
  agent_email TEXT REFERENCES users(email),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT REFERENCES users(email) ON DELETE CASCADE,
  territory_id UUID REFERENCES territories(id),
  commission_rate NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS customer_ai_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_email TEXT REFERENCES users(email) ON DELETE CASCADE,
  salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
  preferred_staff_id UUID REFERENCES salon_staff(id),
  favorite_services UUID[],
  visit_count INT DEFAULT 0,
  total_spend NUMERIC DEFAULT 0,
  last_visit_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS staff_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES salon_staff(id) ON DELETE CASCADE,
  customer_email TEXT REFERENCES users(email),
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS salon_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
  total_bookings INT DEFAULT 0,
  total_revenue NUMERIC DEFAULT 0,
  total_customers INT DEFAULT 0,
  date DATE NOT NULL,
  UNIQUE(salon_id, date)
);

-- ==============================================================================
-- SECTION D: INDEXING FOR PERFORMANCE
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
-- SECTION E: ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on core tables
ALTER TABLE salons ENABLE ROW LEVEL SECURITY;
ALTER TABLE salon_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- 1. SALONS: Public can read, Owners can insert & update their own
DROP POLICY IF EXISTS "Public salons are viewable by everyone" ON salons;
CREATE POLICY "Public salons are viewable by everyone" ON salons FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert their own salon" ON salons;
CREATE POLICY "Authenticated users can insert their own salon" ON salons FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND owner_email = auth.jwt() ->> 'email');

DROP POLICY IF EXISTS "Owners can update their own salon" ON salons;
CREATE POLICY "Owners can update their own salon" ON salons FOR UPDATE USING (owner_email = auth.jwt() ->> 'email');

-- 2. BOOKINGS: Salon Isolation (Example Rule from your architecture)
DROP POLICY IF EXISTS "Salon isolation for bookings (Salon side)" ON bookings;
CREATE POLICY "Salon isolation for bookings (Salon side)" ON bookings FOR SELECT USING (
  salon_id::text = auth.jwt() ->> 'salon_id'
);

DROP POLICY IF EXISTS "Customers can see their own bookings" ON bookings;
CREATE POLICY "Customers can see their own bookings" ON bookings FOR SELECT USING (
  customer_email = auth.jwt() ->> 'email'
);

-- 3. SERVICES: Public can read, Owners can fully manage their own salon's services
DROP POLICY IF EXISTS "Public can view active services" ON services;
CREATE POLICY "Public can view active services" ON services FOR SELECT USING (true);

DROP POLICY IF EXISTS "Owners can insert their own services" ON services;
CREATE POLICY "Owners can insert their own services" ON services FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM salons 
    WHERE salons.id = services.salon_id 
    AND salons.owner_email = auth.jwt() ->> 'email'
  )
);

DROP POLICY IF EXISTS "Owners can update their own services" ON services;
CREATE POLICY "Owners can update their own services" ON services FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM salons 
    WHERE salons.id = services.salon_id 
    AND salons.owner_email = auth.jwt() ->> 'email'
  )
);

DROP POLICY IF EXISTS "Owners can delete their own services" ON services;
CREATE POLICY "Owners can delete their own services" ON services FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM salons 
    WHERE salons.id = services.salon_id 
    AND salons.owner_email = auth.jwt() ->> 'email'
  )
);

-- 4. SALON_STAFF: Public can read, Owners can fully manage their own salon's staff
DROP POLICY IF EXISTS "Public can view active staff" ON salon_staff;
CREATE POLICY "Public can view active staff" ON salon_staff FOR SELECT USING (true);

DROP POLICY IF EXISTS "Owners can insert their own staff" ON salon_staff;
CREATE POLICY "Owners can insert their own staff" ON salon_staff FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM salons 
    WHERE salons.id = salon_staff.salon_id 
    AND salons.owner_email = auth.jwt() ->> 'email'
  )
);

DROP POLICY IF EXISTS "Owners can update their own staff" ON salon_staff;
CREATE POLICY "Owners can update their own staff" ON salon_staff FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM salons 
    WHERE salons.id = salon_staff.salon_id 
    AND salons.owner_email = auth.jwt() ->> 'email'
  )
);

DROP POLICY IF EXISTS "Owners can delete their own staff" ON salon_staff;
CREATE POLICY "Owners can delete their own staff" ON salon_staff FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM salons 
    WHERE salons.id = salon_staff.salon_id 
    AND salons.owner_email = auth.jwt() ->> 'email'
  )
);

-- ==============================================================================
-- SECTION F: ENTERPRISE SCHEDULING & RESOURCE SCHEMAS
-- ==============================================================================

-- 1. Salon Operating Hours
CREATE TABLE IF NOT EXISTS salon_operating_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL, -- 0 (Sunday) to 6 (Saturday)
  opening_time TIME,
  closing_time TIME,
  is_closed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(salon_id, day_of_week)
);

-- 2. Staff Schedules (Weekly Shifts)
CREATE TABLE IF NOT EXISTS staff_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES salon_staff(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL, -- 0 to 6
  start_time TIME,
  end_time TIME,
  is_working BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(staff_id, day_of_week)
);

-- 3. Staff Breaks (Lunch/Rest intervals)
CREATE TABLE IF NOT EXISTS staff_breaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES salon_staff(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL,
  break_start TIME NOT NULL,
  break_end TIME NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Multi-Service Booking Association (Many-to-Many)
CREATE TABLE IF NOT EXISTS booking_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  price NUMERIC NOT NULL,
  duration_min INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Multi-Staff Booking Association (Many-to-Many)
CREATE TABLE IF NOT EXISTS booking_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES salon_staff(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Service Durations & Custom Rates per Stylist
CREATE TABLE IF NOT EXISTS service_durations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES salon_staff(id) ON DELETE CASCADE,
  custom_duration_min INT NOT NULL,
  custom_price NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(service_id, staff_id)
);

-- 7. Shared Salon Resources (Treatment Rooms, Wash Basins)
CREATE TABLE IF NOT EXISTS resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Shared Resource Bookings (Reservation mapping to avoid double-bookings)
CREATE TABLE IF NOT EXISTS resource_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  resource_id UUID REFERENCES resources(id) ON DELETE CASCADE,
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS POLICIES FOR NEW TABLES
ALTER TABLE salon_operating_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_breaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_durations ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_bookings ENABLE ROW LEVEL SECURITY;

-- Operating Hours Policies
CREATE POLICY "Public can view operating hours" ON salon_operating_hours FOR SELECT USING (true);
CREATE POLICY "Owners can manage operating hours" ON salon_operating_hours FOR ALL USING (
  EXISTS (SELECT 1 FROM salons WHERE salons.id = salon_operating_hours.salon_id AND salons.owner_email = auth.jwt() ->> 'email')
);

-- Staff Schedules Policies
CREATE POLICY "Public can view staff schedules" ON staff_schedules FOR SELECT USING (true);
CREATE POLICY "Owners can manage staff schedules" ON staff_schedules FOR ALL USING (
  EXISTS (SELECT 1 FROM salon_staff JOIN salons ON salon_staff.salon_id = salons.id WHERE salon_staff.id = staff_schedules.staff_id AND salons.owner_email = auth.jwt() ->> 'email')
);

-- Staff Breaks Policies
CREATE POLICY "Public can view staff breaks" ON staff_breaks FOR SELECT USING (true);
CREATE POLICY "Owners can manage staff breaks" ON staff_breaks FOR ALL USING (
  EXISTS (SELECT 1 FROM salon_staff JOIN salons ON salon_staff.salon_id = salons.id WHERE salon_staff.id = staff_breaks.staff_id AND salons.owner_email = auth.jwt() ->> 'email')
);

-- Booking Mappings Policies (Public can insert for checkouts, Owners can view)
CREATE POLICY "Anyone can insert booking services" ON booking_services FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view their booking services" ON booking_services FOR SELECT USING (true);

CREATE POLICY "Anyone can insert booking staff" ON booking_staff FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view their booking staff" ON booking_staff FOR SELECT USING (true);

-- Service Durations Policies
CREATE POLICY "Public can view service durations" ON service_durations FOR SELECT USING (true);
CREATE POLICY "Owners can manage service durations" ON service_durations FOR ALL USING (
  EXISTS (SELECT 1 FROM salon_staff JOIN salons ON salon_staff.salon_id = salons.id WHERE salon_staff.id = service_durations.staff_id AND salons.owner_email = auth.jwt() ->> 'email')
);

-- Resources Policies
CREATE POLICY "Public can view resources" ON resources FOR SELECT USING (true);
CREATE POLICY "Owners can manage resources" ON resources FOR ALL USING (
  EXISTS (SELECT 1 FROM salons WHERE salons.id = resources.salon_id AND salons.owner_email = auth.jwt() ->> 'email')
);

-- Resource Bookings Policies
CREATE POLICY "Anyone can insert resource bookings" ON resource_bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view resource bookings" ON resource_bookings FOR SELECT USING (true);
