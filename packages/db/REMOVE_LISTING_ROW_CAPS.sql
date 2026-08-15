-- Trimma: lift PostgREST 500-row API cap (run in Supabase SQL Editor)
--
-- The 500 freeze is NOT a CHECK constraint on salons.
-- Hosted Supabase / PostgREST often sets pgrst.db_max_rows = 500 (or 1000).
-- Offset queries then cannot return row 501+.
--
-- The "60 per category" capture cap is Google Places Text Search
-- (max 3 pages × 20 = 60 results per query). SQL cannot raise that.
--
-- After this script: Project Settings → API → Restart if counts still cap at 500.

-- 1) See current API row caps
SELECT
  rolname,
  rolconfig
FROM pg_roles
WHERE rolname IN ('authenticator', 'anon', 'authenticated', 'service_role', 'postgres')
ORDER BY rolname;

-- 2) Raise max rows (100000 = effectively unlimited for Trimma listings)
ALTER ROLE authenticator SET pgrst.db_max_rows = 100000;
ALTER ROLE anon SET pgrst.db_max_rows = 100000;
ALTER ROLE authenticated SET pgrst.db_max_rows = 100000;
ALTER ROLE service_role SET pgrst.db_max_rows = 100000;

-- 3) Ask PostgREST to reload (if this is ignored, restart the API in the dashboard)
NOTIFY pgrst, 'reload config';
NOTIFY pgrst, 'reload schema';

-- 4) Confirm role settings now include 100000
SELECT
  rolname,
  rolconfig
FROM pg_roles
WHERE rolname IN ('authenticator', 'anon', 'authenticated', 'service_role')
ORDER BY rolname;

-- 5) True listing totals (not limited by max_rows)
SELECT
  COUNT(*) FILTER (WHERE onboarding_status = 'LISTING_CAPTURED') AS pending_captured,
  COUNT(*) FILTER (WHERE onboarding_status = 'LISTING_PUBLISHED') AS listed_published,
  COUNT(*) FILTER (
    WHERE onboarding_status IN ('LISTING_CAPTURED', 'LISTING_PUBLISHED')
  ) AS queue_total,
  COUNT(*) AS all_salons
FROM public.salons;

-- 6) Published listings per primary category (full table, not a 60 cap)
SELECT
  COALESCE(NULLIF(TRIM(category), ''), '(no category)') AS category,
  COUNT(*) AS published_count
FROM public.salons
WHERE onboarding_status = 'LISTING_PUBLISHED'
GROUP BY 1
ORDER BY published_count DESC, category;
