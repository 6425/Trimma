-- --------------------------------------------------------
-- SCRIPT TO UPDATE AN EXISTING USER TO ADMIN
-- --------------------------------------------------------
-- Run this script in your Supabase SQL Editor if the user 
-- has already signed in and their record was created.

-- 1. Update the 'users' table
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'thusitha.jayalath@gmail.com';

-- 2. Ensure they have the 'admin' role in 'user_roles'
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM public.users WHERE email = 'thusitha.jayalath@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- 3. Delete 'customer' role if they shouldn't have it anymore
DELETE FROM public.user_roles 
WHERE role = 'customer' 
  AND user_id IN (SELECT id FROM public.users WHERE email = 'thusitha.jayalath@gmail.com');
