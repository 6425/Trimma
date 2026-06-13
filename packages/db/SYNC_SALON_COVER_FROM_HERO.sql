-- Copy hero image to cover for salons that only have hero_url set.
-- Listing cards historically read cover_url first; this backfills missing covers.

UPDATE public.salons
SET cover_url = hero_url
WHERE (cover_url IS NULL OR BTRIM(cover_url) = '')
  AND hero_url IS NOT NULL
  AND BTRIM(hero_url) <> '';

-- Salon LuxeLab specifically
UPDATE public.salons
SET cover_url = hero_url
WHERE id = '1b8bec8f-88cb-4a9a-a5e8-9c2bdab838fe'
  AND hero_url IS NOT NULL
  AND BTRIM(hero_url) <> '';

SELECT id, name, cover_url, hero_url
FROM public.salons
WHERE name ILIKE '%LuxeLab%';
