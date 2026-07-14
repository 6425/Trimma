-- SQL Script to remove specific test/guest user accounts
-- This deletes from both the public schema profiles and the auth schema identities.

BEGIN;

-- 1. Remove profiles from the public.users table
DELETE FROM public.users 
WHERE email IN (
  'anu1@trima.lk',
  'col2@timma.lk',
  'col3@trima.lk',
  'dmb1@trima.lk',
  'gam2@trima.lk',
  'gam3@trima.lk',
  'gle1@trima.lk',
  'amal@trimma.io',
  'gle2@trima.lk',
  'gle3@trima.lk',
  'test_dummy_user_123@trimma.io',
  'kdy1@trima.lk',
  'kdy2@trima.lk',
  'kdy3@trima.lk',
  'keg1@trima.lk',
  'mtl1@trima.lk',
  'nue@trima.lk',
  'test@example.com',
  'waruna@gmail.com',
  'guest_checkout@example.com',
  'card_pay_guest@example.com',
  'movi@trimma.com',
  'gam1@trima.lk',
  'test_auth_123@example.com',
  'col1@trimma.lk'
);

-- 2. Remove identities from the Supabase auth.users table
DELETE FROM auth.users 
WHERE email IN (
  'anu1@trima.lk',
  'col2@timma.lk',
  'col3@trima.lk',
  'dmb1@trima.lk',
  'gam2@trima.lk',
  'gam3@trima.lk',
  'gle1@trima.lk',
  'amal@trimma.io',
  'gle2@trima.lk',
  'gle3@trima.lk',
  'test_dummy_user_123@trimma.io',
  'kdy1@trima.lk',
  'kdy2@trima.lk',
  'kdy3@trima.lk',
  'keg1@trima.lk',
  'mtl1@trima.lk',
  'nue@trima.lk',
  'test@example.com',
  'waruna@gmail.com',
  'guest_checkout@example.com',
  'card_pay_guest@example.com',
  'movi@trimma.com',
  'gam1@trima.lk',
  'test_auth_123@example.com',
  'col1@trimma.lk'
);

COMMIT;
