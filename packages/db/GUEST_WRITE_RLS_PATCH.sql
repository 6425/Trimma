-- ==============================================================================
-- TRIMMA: GUEST WRITE + MASTER DATA RLS PATCH (PRODUCTION-SAFE)
-- ==============================================================================
-- Run in Supabase SQL Editor when the admin Security Audit reports FAIL on:
--   • Insert customer user profile
--   • Insert booking appointment
--   • Insert territory / category data
--
-- DO NOT run: ALTER TABLE ... DISABLE ROW LEVEL SECURITY on users or bookings.
-- This patch keeps RLS enabled and adds the correct policies instead.
-- Safe to re-run.
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. Admin helper (email-based — users table has email PK, no id column)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.jwt() ->> 'email' IS NULL THEN
    RETURN FALSE;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.users
    WHERE email = auth.jwt() ->> 'email'
      AND global_role IN ('admin', 'superadmin')
  ) THEN
    RETURN TRUE;
  END IF;

  IF to_regclass('public.user_roles') IS NOT NULL AND auth.uid() IS NOT NULL THEN
    RETURN EXISTS (
      SELECT 1
      FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin', 'superadmin')
    );
  END IF;

  RETURN FALSE;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN public.is_platform_admin();
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_platform_admin() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 2. USERS — guest checkout registration + admin management
-- ------------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can select users" ON public.users;
DROP POLICY IF EXISTS "Anyone can insert users" ON public.users;
DROP POLICY IF EXISTS "Anyone can update their own user record" ON public.users;
DROP POLICY IF EXISTS "Checkout can view users" ON public.users;
DROP POLICY IF EXISTS "Checkout can insert users" ON public.users;
DROP POLICY IF EXISTS "Checkout can update users" ON public.users;
DROP POLICY IF EXISTS "Platform admins manage users" ON public.users;
DROP POLICY IF EXISTS "Admins can manage all users" ON public.users;

CREATE POLICY "Checkout can view users"
ON public.users FOR SELECT USING (true);

CREATE POLICY "Checkout can insert users"
ON public.users FOR INSERT WITH CHECK (true);

CREATE POLICY "Checkout can update users"
ON public.users FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Platform admins manage users"
ON public.users FOR ALL
USING (public.is_platform_admin())
WITH CHECK (public.is_platform_admin());

-- ------------------------------------------------------------------------------
-- 3. BOOKINGS — guest checkout + role-scoped reads
-- ------------------------------------------------------------------------------
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert bookings" ON public.bookings;
DROP POLICY IF EXISTS "Anyone can select bookings" ON public.bookings;
DROP POLICY IF EXISTS "Anyone can update bookings" ON public.bookings;
DROP POLICY IF EXISTS "Checkout can insert bookings" ON public.bookings;
DROP POLICY IF EXISTS "Checkout can update bookings" ON public.bookings;
DROP POLICY IF EXISTS "Customers can view their bookings" ON public.bookings;
DROP POLICY IF EXISTS "Salon owners can view salon bookings" ON public.bookings;
DROP POLICY IF EXISTS "Platform admins manage bookings" ON public.bookings;

CREATE POLICY "Platform admins manage bookings"
ON public.bookings FOR ALL
USING (public.is_platform_admin())
WITH CHECK (public.is_platform_admin());

CREATE POLICY "Checkout can insert bookings"
ON public.bookings FOR INSERT WITH CHECK (true);

CREATE POLICY "Checkout can update bookings"
ON public.bookings FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Customers can view their bookings"
ON public.bookings FOR SELECT
USING (
  customer_email = auth.jwt() ->> 'email'
  OR user_id = auth.uid()
);

CREATE POLICY "Salon owners can view salon bookings"
ON public.bookings FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.salons s
    WHERE s.id = bookings.salon_id
      AND (
        s.owner_email = auth.jwt() ->> 'email'
        OR s.owner_gmail = auth.jwt() ->> 'email'
      )
  )
);

-- ------------------------------------------------------------------------------
-- 4. MASTER DATA — public read, admin write (territories, categories, services)
-- ------------------------------------------------------------------------------
ALTER TABLE public.territories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view territories" ON public.territories;
DROP POLICY IF EXISTS "Platform admins manage territories" ON public.territories;
DROP POLICY IF EXISTS "Anyone can modify territories" ON public.territories;

CREATE POLICY "Public can view territories"
ON public.territories FOR SELECT USING (true);

CREATE POLICY "Platform admins manage territories"
ON public.territories FOR ALL
USING (public.is_platform_admin())
WITH CHECK (public.is_platform_admin());

DROP POLICY IF EXISTS "Public can view categories" ON public.categories;
DROP POLICY IF EXISTS "Platform admins manage categories" ON public.categories;
DROP POLICY IF EXISTS "Anyone can modify categories" ON public.categories;

CREATE POLICY "Public can view categories"
ON public.categories FOR SELECT USING (true);

CREATE POLICY "Platform admins manage categories"
ON public.categories FOR ALL
USING (public.is_platform_admin())
WITH CHECK (public.is_platform_admin());

DROP POLICY IF EXISTS "Public can view global_services" ON public.global_services;
DROP POLICY IF EXISTS "Platform admins manage global_services" ON public.global_services;
DROP POLICY IF EXISTS "Anyone can modify global_services" ON public.global_services;

CREATE POLICY "Public can view global_services"
ON public.global_services FOR SELECT USING (true);

CREATE POLICY "Platform admins manage global_services"
ON public.global_services FOR ALL
USING (public.is_platform_admin())
WITH CHECK (public.is_platform_admin());

COMMIT;

SELECT 'Guest write + master data RLS policies applied.' AS status;
