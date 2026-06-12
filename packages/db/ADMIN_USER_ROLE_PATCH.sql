-- ==============================================================================
-- TRIMMA: Admin user role editing (beta / production)
-- ==============================================================================
-- Run once in Supabase SQL Editor when /admin/users/all role saves fail with
-- "Database table is missing" or agent hierarchy errors.
--
-- Ensures:
--   1. agents.agent_tier / reports_to_agent_id / sub_agent_split_percent
--   2. public.user_roles table (auth.users.id keyed) with regional_head support
--   3. Platform-admin RLS on user_roles (optional, idempotent)
-- ==============================================================================

BEGIN;

-- ── 1. Agent hierarchy columns (same as AGENT_HIERARCHY_PATCH.sql) ───────────
ALTER TABLE public.agents
  ADD COLUMN IF NOT EXISTS agent_tier TEXT;

ALTER TABLE public.agents
  ADD COLUMN IF NOT EXISTS reports_to_agent_id UUID;

ALTER TABLE public.agents
  ADD COLUMN IF NOT EXISTS sub_agent_split_percent NUMERIC;

UPDATE public.agents
SET agent_tier = 'regional_head'
WHERE agent_tier IS NULL OR btrim(agent_tier) = '';

ALTER TABLE public.agents
  ALTER COLUMN agent_tier SET DEFAULT 'regional_head';

ALTER TABLE public.agents
  ALTER COLUMN agent_tier SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'agents_agent_tier_check'
      AND conrelid = 'public.agents'::regclass
  ) THEN
    ALTER TABLE public.agents
      ADD CONSTRAINT agents_agent_tier_check
      CHECK (agent_tier IN ('regional_head', 'field_agent'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'agents_reports_to_agent_id_fkey'
      AND conrelid = 'public.agents'::regclass
  ) THEN
    ALTER TABLE public.agents
      ADD CONSTRAINT agents_reports_to_agent_id_fkey
      FOREIGN KEY (reports_to_agent_id) REFERENCES public.agents(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'agents_sub_agent_split_percent_check'
      AND conrelid = 'public.agents'::regclass
  ) THEN
    ALTER TABLE public.agents
      ADD CONSTRAINT agents_sub_agent_split_percent_check
      CHECK (
        sub_agent_split_percent IS NULL
        OR (sub_agent_split_percent >= 0 AND sub_agent_split_percent <= 100)
      );
  END IF;
END $$;

UPDATE public.agents
SET reports_to_agent_id = NULL,
    sub_agent_split_percent = NULL
WHERE agent_tier = 'regional_head';

UPDATE public.agents
SET sub_agent_split_percent = COALESCE(sub_agent_split_percent, 50)
WHERE agent_tier = 'field_agent';

CREATE INDEX IF NOT EXISTS idx_agents_reports_to_agent_id
  ON public.agents (reports_to_agent_id);

CREATE INDEX IF NOT EXISTS idx_agents_agent_tier
  ON public.agents (agent_tier);

-- ── 2. user_roles (auth user id → role) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, role)
);

-- Drop legacy check constraints that block regional_head
DO $$
DECLARE
  constraint_row RECORD;
BEGIN
  FOR constraint_row IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE nsp.nspname = 'public'
      AND rel.relname = 'user_roles'
      AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) ILIKE '%role%'
  LOOP
    EXECUTE format('ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS %I', constraint_row.conname);
  END LOOP;
END $$;

ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;
ALTER TABLE public.user_roles
  ADD CONSTRAINT user_roles_role_check
  CHECK (role IN ('customer', 'salon_owner', 'admin', 'agent', 'regional_head', 'superadmin'));

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles (user_id);

-- ── 3. Platform-admin helper + RLS (idempotent) ──────────────────────────────
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users
    WHERE email = (auth.jwt() ->> 'email')
      AND global_role IN ('admin', 'superadmin')
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_platform_admin() TO authenticated;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Platform admins manage user roles" ON public.user_roles;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Platform admins manage user roles"
  ON public.user_roles
  FOR ALL
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

COMMIT;

SELECT 'ADMIN_USER_ROLE_PATCH applied successfully.' AS status;
