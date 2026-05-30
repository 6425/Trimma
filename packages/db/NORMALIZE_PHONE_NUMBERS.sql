-- ==============================================================================
-- OPTIONAL: Normalize existing Sri Lankan mobile numbers to E.164 (+947XXXXXXXX)
-- ==============================================================================
-- Not required by any feature — the app already handles mixed formats. This just
-- makes stored numbers consistent with the new "+94 7" prefixed inputs.
--
-- Safe & idempotent: only rewrites values that are valid LK mobiles
-- (947XXXXXXXX / 07XXXXXXXX / 7XXXXXXXX after stripping non-digits).
-- Foreign or malformed numbers are left untouched.
-- ==============================================================================

-- users.phone
UPDATE public.users
SET phone = '+94' || substring(regexp_replace(phone, '\D', '', 'g') from '7\d{8}$')
WHERE phone IS NOT NULL
  AND regexp_replace(phone, '\D', '', 'g') ~ '^(947\d{8}|07\d{8}|7\d{8})$'
  AND phone <> '+94' || substring(regexp_replace(phone, '\D', '', 'g') from '7\d{8}$');

-- salons.phone (also used as the salon owner "Contact Number")
UPDATE public.salons
SET phone = '+94' || substring(regexp_replace(phone, '\D', '', 'g') from '7\d{8}$')
WHERE phone IS NOT NULL
  AND regexp_replace(phone, '\D', '', 'g') ~ '^(947\d{8}|07\d{8}|7\d{8})$'
  AND phone <> '+94' || substring(regexp_replace(phone, '\D', '', 'g') from '7\d{8}$');

-- salon_leads.phone (admin/agent lead capture)
UPDATE public.salon_leads
SET phone = '+94' || substring(regexp_replace(phone, '\D', '', 'g') from '7\d{8}$')
WHERE phone IS NOT NULL
  AND regexp_replace(phone, '\D', '', 'g') ~ '^(947\d{8}|07\d{8}|7\d{8})$'
  AND phone <> '+94' || substring(regexp_replace(phone, '\D', '', 'g') from '7\d{8}$');

-- Verify
SELECT 'users' AS tbl, count(*) AS lk_mobiles FROM public.users
  WHERE phone ~ '^\+947\d{8}$'
UNION ALL
SELECT 'salons', count(*) FROM public.salons WHERE phone ~ '^\+947\d{8}$'
UNION ALL
SELECT 'salon_leads', count(*) FROM public.salon_leads WHERE phone ~ '^\+947\d{8}$';
