-- ==============================================================================
-- DIAGNOSTIC: Check invited owner Gmail login readiness
-- Replace the email below, then run in Supabase SQL Editor.
-- ==============================================================================

-- SELECT
--   s.id,
--   s.name,
--   s.owner_gmail,
--   s.owner_email,
--   s.onboarding_status,
--   s.is_verified,
--   au.id AS auth_user_id,
--   au.email AS auth_email,
--   u.global_role,
--   ur.role AS user_roles_role
-- FROM public.salons s
-- LEFT JOIN auth.users au ON lower(au.email) = lower(s.owner_gmail)
-- LEFT JOIN public.users u ON lower(u.email) = lower(s.owner_gmail)
-- LEFT JOIN public.user_roles ur ON ur.user_id = au.id
-- WHERE lower(s.owner_gmail) = lower('ceylonwildtourslk@gmail.com');

-- Expected for a working invited owner:
--   owner_gmail = ceylonwildtourslk@gmail.com
--   onboarding_status in (OWNER_INVITED, AGENT_VERIFIED, OWNER_ACTIVATED, ...)
--   After first Google login:
--     owner_email should match owner_gmail
--     global_role / user_roles.role should be salon_owner

SELECT 'Replace the email in the commented query above and run it.' AS note;
