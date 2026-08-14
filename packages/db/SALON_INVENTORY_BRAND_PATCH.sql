-- Salon inventory: brand column + backfill from global catalog
-- Safe to re-run.

ALTER TABLE public.salon_inventory_items
  ADD COLUMN IF NOT EXISTS brand TEXT;

UPDATE public.salon_inventory_items si
SET
  category_id = COALESCE(si.category_id, gp.category_id),
  brand = COALESCE(NULLIF(btrim(si.brand), ''), gp.brand)
FROM public.global_inventory_products gp
WHERE si.global_product_id = gp.id
  AND (si.category_id IS NULL OR si.brand IS NULL OR btrim(si.brand) = '');
