-- Sync listing queue + marketplace counts with real Postgres totals.
-- Run in Supabase SQL Editor, then wait for the beta deploy that calls these functions.
--
-- PostgREST max_rows (often 500) cannot truncate these: each function returns ONE row.

ALTER ROLE authenticator SET pgrst.db_max_rows = 100000;
ALTER ROLE anon SET pgrst.db_max_rows = 100000;
ALTER ROLE authenticated SET pgrst.db_max_rows = 100000;
ALTER ROLE service_role SET pgrst.db_max_rows = 100000;
NOTIFY pgrst, 'reload config';

CREATE OR REPLACE FUNCTION public.published_listing_count()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer
  FROM public.salons
  WHERE onboarding_status = 'LISTING_PUBLISHED';
$$;

CREATE OR REPLACE FUNCTION public.pending_listing_count()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer
  FROM public.salons
  WHERE onboarding_status = 'LISTING_CAPTURED';
$$;

CREATE OR REPLACE FUNCTION public.listing_generation_queue_page(p_after_id uuid DEFAULT NULL, p_limit integer DEFAULT 100)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(jsonb_agg(to_jsonb(q) ORDER BY q.id), '[]'::jsonb)
  FROM (
    SELECT
      s.id,
      s.name,
      s.slug,
      s.category,
      s.province,
      s.district,
      s.city,
      s.address,
      s.place_id,
      s.rating,
      s.review_count,
      s.onboarding_status,
      s.public_visibility,
      s.source_type,
      s.created_at,
      s.business_info_extended
    FROM public.salons s
    WHERE s.onboarding_status IN ('LISTING_CAPTURED', 'LISTING_PUBLISHED')
      AND (p_after_id IS NULL OR s.id > p_after_id)
    ORDER BY s.id
    LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 100), 200))
  ) q;
$$;

CREATE OR REPLACE FUNCTION public.listing_generation_queue_payload()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'pendingCount', (
      SELECT COUNT(*)::integer
      FROM public.salons
      WHERE onboarding_status = 'LISTING_CAPTURED'
    ),
    'listedCount', (
      SELECT COUNT(*)::integer
      FROM public.salons
      WHERE onboarding_status = 'LISTING_PUBLISHED'
    ),
    'rows', COALESCE((
      SELECT jsonb_agg(q ORDER BY q.created_at DESC)
      FROM (
        SELECT
          s.id,
          s.name,
          s.slug,
          s.category,
          s.province,
          s.district,
          s.city,
          s.address,
          s.place_id,
          s.rating,
          s.review_count,
          s.onboarding_status,
          s.public_visibility,
          s.source_type,
          s.created_at,
          s.business_info_extended
        FROM public.salons s
        WHERE s.onboarding_status IN ('LISTING_CAPTURED', 'LISTING_PUBLISHED')
      ) q
    ), '[]'::jsonb)
  );
$$;

CREATE OR REPLACE FUNCTION public.published_marketplace_listings()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(jsonb_agg(to_jsonb(s)), '[]'::jsonb)
  FROM (
    SELECT
      s.id,
      s.name,
      s.slug,
      s.rating,
      s.review_count,
      s.city,
      s.district,
      s.province,
      s.category,
      s.logo_url,
      s.cover_url,
      s.hero_url,
      s.featured_images,
      s.is_featured,
      s.is_verified,
      s.working_hours,
      s.status,
      s.public_visibility,
      s.booking_enabled,
      s.source_type,
      s.onboarding_status,
      s.phone,
      s.owner_email,
      s.owner_gmail,
      s.website,
      s.map_url,
      s.business_info_extended,
      s.address,
      s.latitude,
      s.longitude,
      s.place_id
    FROM public.salons s
    WHERE s.onboarding_status = 'LISTING_PUBLISHED'
      AND s.source_type IN ('GOOGLE_PLACES', 'LISTING_GENERATION')
  ) s;
$$;

REVOKE ALL ON FUNCTION public.published_listing_count() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.pending_listing_count() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.listing_generation_queue_page(uuid, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.listing_generation_queue_payload() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.published_marketplace_listings() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.published_listing_count() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.pending_listing_count() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.listing_generation_queue_page(uuid, integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.listing_generation_queue_payload() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.published_marketplace_listings() TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';

SELECT
  public.published_listing_count() AS listed_published,
  public.pending_listing_count() AS pending_captured,
  jsonb_array_length(public.listing_generation_queue_page(NULL, 200)) AS first_page_rows;
