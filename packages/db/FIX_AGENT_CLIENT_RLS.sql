-- ==============================================================================
-- FIX AGENT CLIENT RLS — resolves "column id does not exist" on agents queries
-- ==============================================================================
-- Run in Supabase SQL Editor.
-- Root cause: is_admin() referenced users.id, but users is keyed by email.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.jwt() ->> 'email' IS NULL THEN
    RETURN FALSE;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.users
    WHERE lower(email) = lower(auth.jwt() ->> 'email')
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

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN public.is_platform_admin();
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_platform_admin() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;

ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Agents can view own agent profile" ON public.agents;
CREATE POLICY "Agents can view own agent profile"
  ON public.agents
  FOR SELECT
  USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR (
      auth.jwt() ->> 'email' IS NOT NULL
      AND lower(user_email) = lower(auth.jwt() ->> 'email')
    )
  );

SELECT 'FIX_AGENT_CLIENT_RLS applied — agent client queries should work.' AS status;
