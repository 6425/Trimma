-- ==============================================================================
-- TRIMMA PLATFORM: MASTER DATA RLS FIX
-- ==============================================================================
-- Target: Supabase SQL Editor
-- Description: Disables or opens up Row Level Security (RLS) for master data tables
--              (territories, categories, global_services) so the frontend seeder 
--              can successfully sync marketplace data.
-- ==============================================================================

-- Option A: Disable RLS for simple sandbox seeding (Recommended for local dev)
ALTER TABLE public.territories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_services DISABLE ROW LEVEL SECURITY;

-- Option B: Alternatively, if you want to keep RLS active but permissive:
-- DROP POLICY IF EXISTS "Public can view territories" ON public.territories;
-- CREATE POLICY "Public can view territories" ON public.territories FOR SELECT USING (true);
-- DROP POLICY IF EXISTS "Anyone can modify territories" ON public.territories;
-- CREATE POLICY "Anyone can modify territories" ON public.territories FOR ALL USING (true) WITH CHECK (true);

-- DROP POLICY IF EXISTS "Public can view categories" ON public.categories;
-- CREATE POLICY "Public can view categories" ON public.categories FOR SELECT USING (true);
-- DROP POLICY IF EXISTS "Anyone can modify categories" ON public.categories;
-- CREATE POLICY "Anyone can modify categories" ON public.categories FOR ALL USING (true) WITH CHECK (true);

-- DROP POLICY IF EXISTS "Public can view global_services" ON public.global_services;
-- CREATE POLICY "Public can view global_services" ON public.global_services FOR SELECT USING (true);
-- DROP POLICY IF EXISTS "Anyone can modify global_services" ON public.global_services;
-- CREATE POLICY "Anyone can modify global_services" ON public.global_services FOR ALL USING (true) WITH CHECK (true);

SELECT 'Master data RLS configuration successfully updated!' AS status;
