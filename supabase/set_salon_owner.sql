-- --------------------------------------------------------
-- SCRIPT TO UPDATE AN EXISTING USER TO SALON OWNER (PROVIDER)
-- --------------------------------------------------------
-- Run this script in your Supabase SQL Editor if the user 
-- has already signed in and their record was created.

-- 1. Update the 'users' table
UPDATE public.users 
SET role = 'salon_owner' 
WHERE email = 'trimmalk@gmail.com';

-- 2. Ensure they have the 'salon_owner' role in 'user_roles'
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'salon_owner' FROM public.users WHERE email = 'trimmalk@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- 3. Delete 'customer' role if they shouldn't have it anymore
DELETE FROM public.user_roles 
WHERE role = 'customer' 
  AND user_id IN (SELECT id FROM public.users WHERE email = 'trimmalk@gmail.com');
