-- TRIMMA: Global services admin RLS hardening
-- Run in Supabase SQL Editor if admin global service saves fail from the browser.
-- The app also uses a server action with service role, but this keeps direct client writes working.

BEGIN;

CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  jwt_email TEXT;
BEGIN
  jwt_email := lower(trim(auth.jwt() ->> 'email'));
  IF jwt_email IS NULL OR jwt_email = '' THEN
    RETURN FALSE;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.users
    WHERE lower(trim(email)) = jwt_email
      AND global_role IN ('admin', 'superadmin')
  ) THEN
    RETURN TRUE;
  END IF;

  IF to_regclass('public.user_roles') IS NOT NULL AND auth.uid() IS NOT NULL THEN
    RETURN EXISTS (
      SELECT 1
      FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin', 'superadmin')
    );
  END IF;

  RETURN FALSE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_platform_admin() TO anon, authenticated, service_role;

ALTER TABLE public.global_services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view global services" ON public.global_services;
DROP POLICY IF EXISTS "Auth can modify global services" ON public.global_services;
DROP POLICY IF EXISTS "Public can view global_services" ON public.global_services;
DROP POLICY IF EXISTS "Platform admins manage global_services" ON public.global_services;
DROP POLICY IF EXISTS "Anyone can modify global_services" ON public.global_services;

CREATE POLICY "Public can view global_services"
ON public.global_services FOR SELECT
USING (true);

CREATE POLICY "Platform admins manage global_services"
ON public.global_services FOR ALL
USING (public.is_platform_admin())
WITH CHECK (public.is_platform_admin());

COMMIT;

SELECT 'Global services admin RLS policies applied.' AS status;
