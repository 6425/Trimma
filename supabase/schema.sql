-- --------------------------------------------------------
-- TRIMMA - SUPABASE INITIAL SCHEMA MIGRATION
-- --------------------------------------------------------
-- This script creates the core architecture for the Trimma 
-- marketplace, SaaS dashboards, booking engine, and SEO system.
-- 
-- KEY ADDITION: `is_featured` column added to `salons` for admin control.
-- --------------------------------------------------------

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================================
-- 1. USERS & ROLES
-- ========================================================

-- Users table extending Supabase auth.users
CREATE TABLE IF NOT EXISTS public.users (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email text UNIQUE NOT NULL,
  full_name text,
  phone text,
  role text DEFAULT 'customer' CHECK (role IN ('customer', 'salon_owner', 'admin', 'agent')),
  avatar_url text,
  province text,
  district text,
  city text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger to automatically create a user profile when a new Supabase Auth user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url, role)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    CASE 
      WHEN new.email = 'thusitha.jayalath@gmail.com' THEN 'admin'
      WHEN new.email = 'trimhublk@gmail.com' THEN 'admin'
      WHEN new.email = 'trimmalk@gmail.com' THEN 'salon_owner'
      WHEN new.raw_user_meta_data->>'desired_role' IS NOT NULL THEN new.raw_user_meta_data->>'desired_role'
      ELSE 'customer'
    END
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    new.id, 
    CASE 
      WHEN new.email = 'thusitha.jayalath@gmail.com' THEN 'admin'
      WHEN new.email = 'trimhublk@gmail.com' THEN 'admin'
      WHEN new.email = 'trimmalk@gmail.com' THEN 'salon_owner'
      WHEN new.raw_user_meta_data->>'desired_role' IS NOT NULL THEN (new.raw_user_meta_data->>'desired_role')
      ELSE 'customer'
    END
  );

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind the trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- User roles (for multi-role per user flexibility)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('customer', 'salon_owner', 'admin', 'agent')),
  UNIQUE(user_id, role)
);

-- ========================================================
-- 2. GEO SYSTEM (PROVINCES, DISTRICTS, CITIES)
-- ========================================================

CREATE TABLE IF NOT EXISTS public.provinces (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL,
  slug text UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS public.districts (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  province_id uuid REFERENCES public.provinces(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS public.cities (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  district_id uuid REFERENCES public.districts(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text UNIQUE NOT NULL
);

-- ========================================================
-- 3. CATEGORIES
-- ========================================================

CREATE TABLE IF NOT EXISTS public.categories (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  icon text
);

-- ========================================================
-- 4. SALONS (CORE)
-- ========================================================

CREATE TABLE IF NOT EXISTS public.salons (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  email text,
  phone text,
  address text,
  
  -- Denormalized text fields for fast SEO querying
  province text,
  district text,
  city text,
  
  -- Relational fields for Geo hierarchy mappings
  province_id uuid REFERENCES public.provinces(id) ON DELETE SET NULL,
  district_id uuid REFERENCES public.districts(id) ON DELETE SET NULL,
  city_id uuid REFERENCES public.cities(id) ON DELETE SET NULL,

  latitude numeric,
  longitude numeric,
  rating numeric DEFAULT 0.0,
  review_count integer DEFAULT 0,
  is_verified boolean DEFAULT false,
  
  -- Feature flag managed by Admin
  is_featured boolean DEFAULT false, 
  
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ========================================================
-- 5. SERVICES & STAFF
-- ========================================================

CREATE TABLE IF NOT EXISTS public.services (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  salon_id uuid REFERENCES public.salons(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  category text, -- Denormalized for faster UI access
  price numeric NOT NULL,
  duration_min integer NOT NULL,
  description text,
  image_url text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.staff (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  salon_id uuid REFERENCES public.salons(id) ON DELETE CASCADE,
  name text NOT NULL,
  role text,
  email text,
  phone text,
  rating numeric DEFAULT 0.0,
  commission_rate numeric DEFAULT 0.0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ========================================================
-- 6. BOOKINGS & PAYMENTS
-- ========================================================

CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  booking_no text UNIQUE NOT NULL,
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL, -- nullable for guest checkouts
  salon_id uuid REFERENCES public.salons(id) ON DELETE CASCADE,
  service_id uuid REFERENCES public.services(id) ON DELETE SET NULL,
  staff_id uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  booking_date date NOT NULL,
  booking_time time without time zone NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  amount numeric NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.payments (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  provider text DEFAULT 'PayHere',
  order_id text,
  payment_id text,
  amount numeric NOT NULL,
  currency text DEFAULT 'LKR',
  status text DEFAULT 'pending',
  raw_response jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ========================================================
-- 7. REVIEWS & RATINGS
-- ========================================================

CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  salon_id uuid REFERENCES public.salons(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ========================================================
-- 8. AGENT & LEADS SYSTEM (ADMIN/SALES)
-- ========================================================

CREATE TABLE IF NOT EXISTS public.agents (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  territory text,
  performance_score numeric DEFAULT 0.0,
  last_password_reset timestamp with time zone,
  must_change_password boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.leads (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  google_place_id text UNIQUE,
  name text NOT NULL,
  phone text,
  address text,
  province text,
  district text,
  city text,
  status text DEFAULT 'new' CHECK (status IN ('new', 'assigned', 'contacted', 'converted')),
  agent_id uuid REFERENCES public.agents(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ========================================================
-- 9. SUBSCRIPTIONS (SAAS LAYER)
-- ========================================================

CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL,
  monthly_price numeric NOT NULL,
  max_staff integer,
  features jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  salon_id uuid REFERENCES public.salons(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES public.subscription_plans(id) ON DELETE RESTRICT,
  status text DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'canceled', 'trialing')),
  start_date timestamp with time zone NOT NULL,
  end_date timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ========================================================
-- 10. ROW LEVEL SECURITY (RLS)
-- ========================================================

-- Enable RLS on core tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Users RLS
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Salons RLS
DROP POLICY IF EXISTS "Public can view active salons" ON public.salons;
CREATE POLICY "Public can view active salons" ON public.salons FOR SELECT USING (status = 'active');

DROP POLICY IF EXISTS "Salon owners can manage their salons" ON public.salons;
CREATE POLICY "Salon owners can manage their salons" ON public.salons FOR ALL USING (auth.uid() = owner_id);

-- Services RLS
DROP POLICY IF EXISTS "Public can view services of active salons" ON public.services;
CREATE POLICY "Public can view services of active salons" ON public.services FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Salon owners can manage services for their salons" ON public.services;
CREATE POLICY "Salon owners can manage services for their salons" ON public.services FOR ALL USING (
  salon_id IN (SELECT id FROM public.salons WHERE owner_id = auth.uid())
);

-- Bookings RLS
DROP POLICY IF EXISTS "Customers can view own bookings" ON public.bookings;
CREATE POLICY "Customers can view own bookings" ON public.bookings FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Salon owners can view bookings for their salons" ON public.bookings;
CREATE POLICY "Salon owners can view bookings for their salons" ON public.bookings FOR SELECT USING (
  salon_id IN (SELECT id FROM public.salons WHERE owner_id = auth.uid())
);

DROP POLICY IF EXISTS "Customers can create bookings" ON public.bookings;
CREATE POLICY "Customers can create bookings" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Note: Admin RLS bypass is typically handled via Supabase custom claims or by extending policies to check `role = 'admin'` from the users table.
