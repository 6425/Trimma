-- ==============================================================================
-- PROMOTE USER TO ADMIN
-- ==============================================================================
-- Run this in your Supabase SQL Editor.
--
-- Schema notes:
--   public.users      → primary key is email (no id column)
--   public.user_roles → user_id references auth.users.id
--   auth.users        → source of truth for user UUID
-- ==============================================================================

BEGIN;

-- 1) Set platform role on the public profile
UPDATE public.users
SET global_role = 'admin'
WHERE email IN ('thusitha.jayalath@gmail.com', 'thusitha.jayalath@sysenact.com');

-- 2) Remove stale customer role rows
DELETE FROM public.user_roles ur
USING auth.users au
WHERE ur.user_id = au.id
  AND au.email IN ('thusitha.jayalath@gmail.com', 'thusitha.jayalath@sysenact.com')
  AND ur.role = 'customer';

-- 3) Ensure admin role exists in user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT au.id, 'admin'
FROM auth.users au
WHERE au.email IN ('thusitha.jayalath@gmail.com', 'thusitha.jayalath@sysenact.com')
  AND NOT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = au.id
      AND ur.role = 'admin'
  );

COMMIT;

-- 4) Verify both tables are in sync
SELECT
  u.email,
  u.global_role,
  au.id AS auth_user_id,
  ur.role AS user_roles_role
FROM public.users u
JOIN auth.users au ON au.email = u.email
LEFT JOIN public.user_roles ur ON ur.user_id = au.id
WHERE u.email IN ('thusitha.jayalath@gmail.com', 'thusitha.jayalath@sysenact.com')
ORDER BY u.email, ur.role;
