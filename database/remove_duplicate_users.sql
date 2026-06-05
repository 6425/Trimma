-- SQL Script to remove specific duplicate user accounts
-- This deletes from both the public schema profiles and the auth schema identities.

BEGIN;

-- 1. Remove profiles from the public.users table
DELETE FROM public.users 
WHERE email IN (
  'ruchika.siiriyaoatabandi@gmail.com',
  'ruchika.sooriyapatabendi@gmail.com',
  'thusitha.jayalath@sysenact.com',
  'skiruba56+trimma@gmail.com'
);

-- 2. Remove identities from the Supabase auth.users table
DELETE FROM auth.users 
WHERE email IN (
  'ruchika.siiriyaoatabandi@gmail.com',
  'ruchika.sooriyapatabendi@gmail.com',
  'thusitha.jayalath@sysenact.com',
  'skiruba56+trimma@gmail.com'
);

COMMIT;
