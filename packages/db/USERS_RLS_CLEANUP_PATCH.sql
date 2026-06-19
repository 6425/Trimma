-- ==============================================================================
-- TRIMMA: USERS RLS LEGACY CLEANUP
-- ==============================================================================
-- Run in Supabase SQL Editor after BOOKINGS_CHECKOUT_RLS_PATCH.sql.
-- Safe to re-run. Drops redundant wide-open policies; keeps checkout + admin.
--
-- Removes duplicate legacy policies that overlap with:
--   • Checkout can view / insert / update users
--   • Platform admins manage users
--   • Users can read/update own profile
-- ==============================================================================

BEGIN;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Legacy permissive policies (pre-checkout patch naming)
DROP POLICY IF EXISTS "Public permissive insert user" ON public.users;
DROP POLICY IF EXISTS "Public permissive select user" ON public.users;
DROP POLICY IF EXISTS "Public permissive update user" ON public.users;

-- Older admin policy (superseded by Platform admins manage users)
DROP POLICY IF EXISTS "Admins can manage all users" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;

-- Older checkout-era naming (superseded by Checkout can * policies)
DROP POLICY IF EXISTS "Anyone can select users" ON public.users;
DROP POLICY IF EXISTS "Anyone can insert users" ON public.users;
DROP POLICY IF EXISTS "Anyone can update their own user record" ON public.users;
DROP POLICY IF EXISTS "Anyone can insert customer profiles" ON public.users;

COMMIT;

-- Verification: expect Checkout can *, Platform admins manage users,
-- and Users can read/update own profile (names may vary slightly).
SELECT policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'users'
ORDER BY policyname;
