-- ==============================================================================
-- FIX: Salon owner / admin access denied on beta
-- ==============================================================================
-- Schema notes (beta):
--   public.users        → primary key is email (no id column)
--   public.user_roles   → primary key is id; user_id must be auth.users.id
--   auth.users          → source of truth for login UUID
--
-- Replace YOUR_EMAIL below, run in Supabase SQL Editor, then sign out + back in.
-- ==============================================================================

-- ── STEP 1: DIAGNOSE (run first) ─────────────────────────────────────────────
SELECT
  au.id AS auth_user_id,
  au.email AS auth_email,
  u.email AS users_email,
  u.global_role,
  ur.id AS user_roles_row_id,
  ur.user_id AS user_roles_user_id,
  ur.role AS user_roles_role,
  s.id AS salon_id,
  s.name AS salon_name,
  s.owner_email,
  s.owner_gmail
FROM auth.users au
LEFT JOIN public.users u ON lower(u.email) = lower(au.email)
LEFT JOIN public.user_roles ur ON ur.user_id = au.id
LEFT JOIN public.salons s ON lower(s.owner_gmail) = lower(au.email)
   OR lower(s.owner_email) = lower(au.email)
WHERE lower(au.email) = lower('YOUR_EMAIL@gmail.com');

-- Expected for salon owner dashboard access:
--   global_role = salon_owner
--   user_roles_user_id = auth_user_id  (must match!)
--   user_roles_role = salon_owner

-- ── STEP 2: FIX (uncomment and replace email, then run) ─────────────────────
/*
BEGIN;

-- A) Ensure public.users profile + global_role (users PK = email)
INSERT INTO public.users (email, full_name, global_role)
SELECT
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)),
  'salon_owner'
FROM auth.users au
WHERE lower(au.email) = lower('YOUR_EMAIL@gmail.com')
ON CONFLICT (email) DO UPDATE
SET global_role = 'salon_owner';

-- B) Remove stale customer rows for this auth user
DELETE FROM public.user_roles ur
USING auth.users au
WHERE ur.user_id = au.id
  AND lower(au.email) = lower('YOUR_EMAIL@gmail.com')
  AND ur.role = 'customer';

-- C) Ensure salon_owner row (user_id MUST be auth.users.id — no ON CONFLICT on user_id alone)
INSERT INTO public.user_roles (user_id, role)
SELECT au.id, 'salon_owner'
FROM auth.users au
WHERE lower(au.email) = lower('YOUR_EMAIL@gmail.com')
  AND NOT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = au.id
      AND ur.role = 'salon_owner'
  );

-- D) Link salon owner_email if invited via owner_gmail
UPDATE public.salons s
SET owner_email = au.email
FROM auth.users au
WHERE lower(au.email) = lower('YOUR_EMAIL@gmail.com')
  AND lower(s.owner_gmail) = lower(au.email)
  AND (s.owner_email IS NULL OR lower(s.owner_email) <> lower(au.email));

COMMIT;
*/

-- ── STEP 3: VERIFY (run after fix) ─────────────────────────────────────────
-- SELECT au.id, au.email, u.global_role, ur.role
-- FROM auth.users au
-- LEFT JOIN public.users u ON lower(u.email) = lower(au.email)
-- LEFT JOIN public.user_roles ur ON ur.user_id = au.id
-- WHERE lower(au.email) = lower('YOUR_EMAIL@gmail.com');

SELECT 'Replace YOUR_EMAIL@gmail.com in STEP 1, then uncomment STEP 2.' AS note;
