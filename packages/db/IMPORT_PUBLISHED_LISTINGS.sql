-- Import / refresh published marketplace listings (LISTING_PUBLISHED) into LIVE.
-- Run this ONCE on the LIVE Supabase SQL Editor first.
-- Then call: SELECT * FROM public.import_published_listing_batch('<json from beta>'::jsonb);
--
-- Does NOT touch verified / booking salons.
-- Existing listing-pipeline rows (same id, slug, or place_id) are UPDATED.
-- New rows are inserted. Owner/plan/agent fields are cleared to avoid FK failures.

DROP FUNCTION IF EXISTS public.import_published_listing_batch(jsonb);

CREATE OR REPLACE FUNCTION public.import_published_listing_batch(p_rows jsonb)
RETURNS TABLE(inserted integer, updated integer, skipped integer)
LANGUAGE plpgsql
AS $$
DECLARE
  rec jsonb;
  ins integer := 0;
  upd integer := 0;
  skip integer := 0;
  new_slug text;
  place text;
  target_id uuid;
  existing_status text;
BEGIN
  IF p_rows IS NULL OR jsonb_typeof(p_rows) <> 'array' THEN
    RAISE EXCEPTION 'Expected a JSON array of salon objects';
  END IF;

  FOR rec IN SELECT value FROM jsonb_array_elements(p_rows)
  LOOP
    place := NULLIF(btrim(COALESCE(rec->>'place_id', '')), '');
    new_slug := NULLIF(btrim(COALESCE(rec->>'slug', '')), '');
    target_id := NULL;

    IF (rec->>'id') IS NULL OR new_slug IS NULL THEN
      skip := skip + 1;
      CONTINUE;
    END IF;

    SELECT s.id, COALESCE(s.onboarding_status, '')
      INTO target_id, existing_status
    FROM public.salons s
    WHERE s.id = (rec->>'id')::uuid
       OR s.slug = new_slug
       OR (place IS NOT NULL AND s.place_id = place)
    ORDER BY
      CASE
        WHEN s.id = (rec->>'id')::uuid THEN 0
        WHEN place IS NOT NULL AND s.place_id = place THEN 1
        ELSE 2
      END
    LIMIT 1;

    IF target_id IS NOT NULL AND existing_status IN (
      'OWNER_INVITED',
      'ASSIGNED_TO_AGENT',
      'OWNER_ACTIVATED',
      'PENDING_ADMIN_VERIFICATION',
      'VERIFIED',
      'REJECTED'
    ) THEN
      skip := skip + 1;
      CONTINUE;
    END IF;

    IF target_id IS NOT NULL THEN
      UPDATE public.salons SET
        name = COALESCE(NULLIF(rec->>'name', ''), name),
        province = rec->>'province',
        district = rec->>'district',
        city = rec->>'city',
        address = rec->>'address',
        location = rec->>'location',
        status = 'active',
        is_featured = COALESCE((rec->>'is_featured')::boolean, is_featured),
        logo_url = rec->>'logo_url',
        cover_url = rec->>'cover_url',
        hero_url = rec->>'hero_url',
        featured_images = COALESCE(
          ARRAY(SELECT jsonb_array_elements_text(COALESCE(rec->'featured_images', '[]'::jsonb))),
          featured_images
        ),
        description = rec->>'description',
        phone = rec->>'phone',
        working_hours = rec->>'working_hours',
        booking_enabled = false,
        public_visibility = 'public',
        map_url = rec->>'map_url',
        source_type = CASE
          WHEN rec->>'source_type' IN ('GOOGLE_PLACES', 'LISTING_GENERATION') THEN rec->>'source_type'
          ELSE 'LISTING_GENERATION'
        END,
        onboarding_status = 'LISTING_PUBLISHED',
        activation_status = 'INACTIVE',
        price_level = rec->>'price_level',
        summary = rec->>'summary',
        latitude = NULLIF(rec->>'latitude', '')::numeric,
        longitude = NULLIF(rec->>'longitude', '')::numeric,
        category = rec->>'category',
        website = rec->>'website',
        rating = NULLIF(rec->>'rating', '')::numeric,
        review_count = COALESCE(NULLIF(rec->>'review_count', '')::integer, review_count),
        business_info_extended = COALESCE(rec->'business_info_extended', business_info_extended)
      WHERE id = target_id;

      upd := upd + 1;
      CONTINUE;
    END IF;

    IF EXISTS (SELECT 1 FROM public.salons WHERE slug = new_slug) THEN
      new_slug := new_slug || '-listing';
      IF EXISTS (SELECT 1 FROM public.salons WHERE slug = new_slug) THEN
        skip := skip + 1;
        CONTINUE;
      END IF;
    END IF;

    INSERT INTO public.salons (
      id, name, slug, province, district, city, address, location,
      status, is_verified, is_featured, logo_url, cover_url, hero_url, featured_images,
      description, phone, working_hours, booking_enabled, public_visibility,
      place_id, map_url, source_type, onboarding_status, activation_status,
      price_level, summary, latitude, longitude, category, website, rating,
      review_count, business_info_extended, owner_email, owner_gmail,
      subscription_plan_id, assign_to
    ) VALUES (
      (rec->>'id')::uuid,
      COALESCE(NULLIF(rec->>'name', ''), 'Unnamed business'),
      new_slug,
      rec->>'province',
      rec->>'district',
      rec->>'city',
      rec->>'address',
      rec->>'location',
      COALESCE(NULLIF(rec->>'status', ''), 'active'),
      false,
      COALESCE((rec->>'is_featured')::boolean, false),
      rec->>'logo_url',
      rec->>'cover_url',
      rec->>'hero_url',
      COALESCE(
        ARRAY(SELECT jsonb_array_elements_text(COALESCE(rec->'featured_images', '[]'::jsonb))),
        '{}'::text[]
      ),
      rec->>'description',
      rec->>'phone',
      rec->>'working_hours',
      false,
      'public',
      place,
      rec->>'map_url',
      CASE
        WHEN rec->>'source_type' IN ('GOOGLE_PLACES', 'LISTING_GENERATION') THEN rec->>'source_type'
        ELSE 'LISTING_GENERATION'
      END,
      'LISTING_PUBLISHED',
      'INACTIVE',
      rec->>'price_level',
      rec->>'summary',
      NULLIF(rec->>'latitude', '')::numeric,
      NULLIF(rec->>'longitude', '')::numeric,
      rec->>'category',
      rec->>'website',
      NULLIF(rec->>'rating', '')::numeric,
      COALESCE(NULLIF(rec->>'review_count', '')::integer, 0),
      COALESCE(rec->'business_info_extended', '{}'::jsonb),
      NULL,
      NULL,
      NULL,
      NULL
    );

    ins := ins + 1;
  END LOOP;

  inserted := ins;
  updated := upd;
  skipped := skip;
  RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.import_published_listing_batch(jsonb) TO postgres, service_role;
