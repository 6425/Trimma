-- ==============================================================================
-- TRIMMA: BOOKINGS CHECKOUT RLS PATCH
-- ==============================================================================
-- Target: Supabase SQL Editor
--
-- Fixes: "new row violates row-level security policy for table bookings"
-- during checkout when logged in as admin (or when no INSERT policy exists).
--
-- Allows booking creation for:
--   • Guest checkout (anon)
--   • Customers, salon owners, agents (authenticated)
--   • Platform admins / superadmins
--
-- Safe to re-run (drops named policies first).
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. Admin helper (email-based JWT lookup)
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
-- 2. BOOKINGS
-- ------------------------------------------------------------------------------
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers can create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Customers can view own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Salon owners can view bookings for their salons" ON public.bookings;
DROP POLICY IF EXISTS "Salon isolation for bookings (Salon side)" ON public.bookings;
DROP POLICY IF EXISTS "Customers can see their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Anyone can create a booking" ON public.bookings;
DROP POLICY IF EXISTS "Users can read own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can update own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Anyone can insert bookings" ON public.bookings;
DROP POLICY IF EXISTS "Anyone can select bookings" ON public.bookings;
DROP POLICY IF EXISTS "Anyone can update bookings" ON public.bookings;
DROP POLICY IF EXISTS "Checkout can insert bookings" ON public.bookings;
DROP POLICY IF EXISTS "Checkout can update bookings" ON public.bookings;
DROP POLICY IF EXISTS "Customers can view their bookings" ON public.bookings;
DROP POLICY IF EXISTS "Salon owners can view salon bookings" ON public.bookings;
DROP POLICY IF EXISTS "Platform admins manage bookings" ON public.bookings;

CREATE POLICY "Platform admins manage bookings"
ON public.bookings
FOR ALL
USING (public.is_platform_admin())
WITH CHECK (public.is_platform_admin());

CREATE POLICY "Checkout can insert bookings"
ON public.bookings
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Checkout can update bookings"
ON public.bookings
FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Customers can view their bookings"
ON public.bookings
FOR SELECT
USING (
  customer_email = auth.jwt() ->> 'email'
  OR user_id = auth.uid()
);

CREATE POLICY "Salon owners can view salon bookings"
ON public.bookings
FOR SELECT
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
-- 3. BOOKING CHILD TABLES (checkout inserts)
-- ------------------------------------------------------------------------------
ALTER TABLE public.booking_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_staff ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert booking services" ON public.booking_services;
DROP POLICY IF EXISTS "Anyone can view their booking services" ON public.booking_services;
DROP POLICY IF EXISTS "Checkout can insert booking services" ON public.booking_services;
DROP POLICY IF EXISTS "Checkout can view booking services" ON public.booking_services;
DROP POLICY IF EXISTS "Platform admins manage booking services" ON public.booking_services;

CREATE POLICY "Platform admins manage booking services"
ON public.booking_services
FOR ALL
USING (public.is_platform_admin())
WITH CHECK (public.is_platform_admin());

CREATE POLICY "Checkout can insert booking services"
ON public.booking_services
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Checkout can view booking services"
ON public.booking_services
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Anyone can insert booking staff" ON public.booking_staff;
DROP POLICY IF EXISTS "Anyone can view their booking staff" ON public.booking_staff;
DROP POLICY IF EXISTS "Checkout can insert booking staff" ON public.booking_staff;
DROP POLICY IF EXISTS "Checkout can view booking staff" ON public.booking_staff;
DROP POLICY IF EXISTS "Platform admins manage booking staff" ON public.booking_staff;

CREATE POLICY "Platform admins manage booking staff"
ON public.booking_staff
FOR ALL
USING (public.is_platform_admin())
WITH CHECK (public.is_platform_admin());

CREATE POLICY "Checkout can insert booking staff"
ON public.booking_staff
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Checkout can view booking staff"
ON public.booking_staff
FOR SELECT
USING (true);

-- ------------------------------------------------------------------------------
-- 4. PAYMENTS (checkout insert + post-payment update)
-- ------------------------------------------------------------------------------
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can select payments" ON public.payments;
DROP POLICY IF EXISTS "Public can insert payments" ON public.payments;
DROP POLICY IF EXISTS "Public can update payments" ON public.payments;
DROP POLICY IF EXISTS "Checkout can insert payments" ON public.payments;
DROP POLICY IF EXISTS "Checkout can update payments" ON public.payments;
DROP POLICY IF EXISTS "Checkout can view payments" ON public.payments;
DROP POLICY IF EXISTS "Platform admins manage payments" ON public.payments;

CREATE POLICY "Platform admins manage payments"
ON public.payments
FOR ALL
USING (public.is_platform_admin())
WITH CHECK (public.is_platform_admin());

CREATE POLICY "Checkout can insert payments"
ON public.payments
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Checkout can update payments"
ON public.payments
FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Checkout can view payments"
ON public.payments
FOR SELECT
USING (true);

-- ------------------------------------------------------------------------------
-- 5. USERS (guest registration during checkout)
-- ------------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can select users" ON public.users;
DROP POLICY IF EXISTS "Anyone can insert users" ON public.users;
DROP POLICY IF EXISTS "Anyone can update their own user record" ON public.users;
DROP POLICY IF EXISTS "Checkout can insert users" ON public.users;
DROP POLICY IF EXISTS "Checkout can update users" ON public.users;
DROP POLICY IF EXISTS "Checkout can view users" ON public.users;

CREATE POLICY "Checkout can view users"
ON public.users
FOR SELECT
USING (true);

CREATE POLICY "Checkout can insert users"
ON public.users
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Checkout can update users"
ON public.users
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Keep admin identity management if not already present
DROP POLICY IF EXISTS "Platform admins manage users" ON public.users;
CREATE POLICY "Platform admins manage users"
ON public.users
FOR ALL
USING (public.is_platform_admin())
WITH CHECK (public.is_platform_admin());

-- ------------------------------------------------------------------------------
-- 6. RESOURCE BOOKINGS (optional salon resources during checkout)
-- ------------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.resource_bookings') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.resource_bookings ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can insert resource bookings" ON public.resource_bookings';
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can view resource bookings" ON public.resource_bookings';
    EXECUTE 'DROP POLICY IF EXISTS "Checkout can insert resource bookings" ON public.resource_bookings';
    EXECUTE 'DROP POLICY IF EXISTS "Checkout can view resource bookings" ON public.resource_bookings';
    EXECUTE 'DROP POLICY IF EXISTS "Platform admins manage resource bookings" ON public.resource_bookings';

    EXECUTE '
      CREATE POLICY "Platform admins manage resource bookings"
      ON public.resource_bookings
      FOR ALL
      USING (public.is_platform_admin())
      WITH CHECK (public.is_platform_admin())
    ';

    EXECUTE '
      CREATE POLICY "Checkout can insert resource bookings"
      ON public.resource_bookings
      FOR INSERT
      WITH CHECK (true)
    ';

    EXECUTE '
      CREATE POLICY "Checkout can view resource bookings"
      ON public.resource_bookings
      FOR SELECT
      USING (true)
    ';
  END IF;
END $$;

COMMIT;

-- Quick verification
SELECT
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('bookings', 'booking_services', 'booking_staff', 'payments', 'users')
ORDER BY tablename, policyname;
