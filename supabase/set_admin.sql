-- --------------------------------------------------------
-- SCRIPT TO UPDATE AN EXISTING USER TO ADMIN
-- --------------------------------------------------------
-- Run this in your Supabase SQL Editor.
--
-- public.users uses email as primary key.
-- user_roles.user_id must come from auth.users.id.
-- --------------------------------------------------------

BEGIN;

UPDATE public.users
SET global_role = 'admin'
WHERE email = 'thusitha.jayalath@gmail.com';

DELETE FROM public.user_roles ur
USING auth.users au
WHERE ur.user_id = au.id
  AND au.email = 'thusitha.jayalath@gmail.com'
  AND ur.role = 'customer';

INSERT INTO public.user_roles (user_id, role)
SELECT au.id, 'admin'
FROM auth.users au
WHERE au.email = 'thusitha.jayalath@gmail.com'
  AND NOT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = au.id
      AND ur.role = 'admin'
  );

COMMIT;

SELECT
  u.email,
  u.global_role,
  au.id AS auth_user_id,
  ur.role AS user_roles_role
FROM public.users u
JOIN auth.users au ON au.email = u.email
LEFT JOIN public.user_roles ur ON ur.user_id = au.id
WHERE u.email = 'thusitha.jayalath@gmail.com';
