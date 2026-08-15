-- Delta only: run this if you already ran LISTING_QUEUE_DB_SYNC.sql once.
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

REVOKE ALL ON FUNCTION public.pending_listing_count() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.listing_generation_queue_page(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.pending_listing_count() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.listing_generation_queue_page(uuid, integer) TO authenticated, service_role;
NOTIFY pgrst, 'reload schema';
