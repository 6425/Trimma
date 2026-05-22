-- ==============================================================================
-- PROMOTE USER TO ADMIN
-- ==============================================================================
-- Run this in your Supabase SQL Editor.
-- It will make your account an official Admin in the database.
-- ==============================================================================

UPDATE public.users 
SET global_role = 'admin' 
WHERE email = 'thusitha.jayalath@gmail.com' 
   OR email = 'thusitha.jayalath@sysenact.com';

SELECT 'You are now an Admin! Database updates will work.' AS status;
