-- ==============================================================================
-- TRIMMA PLATFORM: ADMIN USER PROVISIONING PATCH
-- ==============================================================================
-- Target: Supabase Dashboard → SQL Editor → Run entire script
--
-- Purpose:
--   1. Let platform admins (admin + superadmin) manage identity records via RLS
--   2. Sync auth.users → public.users + user_roles with correct role metadata
--   3. Support admin-driven provisioning (use Admin API from app, NOT public signUp)
--
-- Note on "wait 44 seconds" errors:
--   That message is Supabase Auth rate-limiting public signUp(). SQL cannot remove it.
--   After running this script, use the app route POST /api/admin/provision-user
--   (service role) instead of supabase.auth.signUp() in the browser.
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. Platform admin helper (admin + superadmin)
-- ------------------------------------------------------------------------------
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

-- Keep legacy name used across existing RLS policies
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_platform_admin();
$$;

GRANT EXECUTE ON FUNCTION public.is_platform_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- ------------------------------------------------------------------------------
-- 2. Auth sync trigger — reads role from admin metadata keys
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  assigned_role TEXT;
  has_users_id BOOLEAN;
  has_user_roles BOOLEAN;
BEGIN
  assigned_role := COALESCE(
    NULLIF(NEW.raw_user_meta_data ->> 'role', ''),
    NULLIF(NEW.raw_user_meta_data ->> 'global_role', ''),
    'customer'
  );

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'id'
  ) INTO has_users_id;

  IF has_users_id THEN
    INSERT INTO public.users (id, email, full_name, avatar_url, global_role)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
      NEW.raw_user_meta_data ->> 'avatar_url',
      assigned_role
    )
    ON CONFLICT (email) DO UPDATE
    SET
      id = COALESCE(public.users.id, EXCLUDED.id),
      full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
      avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url),
      global_role = COALESCE(EXCLUDED.global_role, public.users.global_role);
  ELSE
    INSERT INTO public.users (email, full_name, avatar_url, global_role)
    VALUES (
      NEW.email,
      COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
      NEW.raw_user_meta_data ->> 'avatar_url',
      assigned_role
    )
    ON CONFLICT (email) DO UPDATE
    SET
      full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
      avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url),
      global_role = COALESCE(EXCLUDED.global_role, public.users.global_role);
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'user_roles'
  ) INTO has_user_roles;

  IF has_user_roles THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, assigned_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 3. RLS — platform admins manage identity tables
-- ------------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can manage all users" ON public.users;
DROP POLICY IF EXISTS "Platform admins manage users" ON public.users;

CREATE POLICY "Platform admins manage users"
  ON public.users
  FOR ALL
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

-- Allow users to read/update their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile"
  ON public.users
  FOR SELECT
  USING (email = (auth.jwt() ->> 'email'));

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
  ON public.users
  FOR UPDATE
  USING (email = (auth.jwt() ->> 'email'))
  WITH CHECK (email = (auth.jwt() ->> 'email'));

-- Agents table (if present)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'agents'
  ) THEN
    EXECUTE 'ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY';

    EXECUTE 'DROP POLICY IF EXISTS "Admins can manage all agents" ON public.agents';
    EXECUTE 'DROP POLICY IF EXISTS "Platform admins manage agents" ON public.agents';

    EXECUTE $policy$
      CREATE POLICY "Platform admins manage agents"
        ON public.agents
        FOR ALL
        USING (public.is_platform_admin())
        WITH CHECK (public.is_platform_admin())
    $policy$;
  END IF;
END $$;

-- user_roles table (if present)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'user_roles'
  ) THEN
    EXECUTE 'ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY';

    EXECUTE 'DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles';
    EXECUTE 'DROP POLICY IF EXISTS "Users can insert their own roles" ON public.user_roles';
    EXECUTE 'DROP POLICY IF EXISTS "Users can update their own roles" ON public.user_roles';
    EXECUTE 'DROP POLICY IF EXISTS "Platform admins manage user roles" ON public.user_roles';

    EXECUTE $policy$
      CREATE POLICY "Users can view their own roles"
        ON public.user_roles
        FOR SELECT
        USING (auth.uid() = user_id)
    $policy$;

    EXECUTE $policy$
      CREATE POLICY "Platform admins manage user roles"
        ON public.user_roles
        FOR ALL
        USING (public.is_platform_admin())
        WITH CHECK (public.is_platform_admin())
    $policy$;
  END IF;
END $$;

COMMIT;

-- ------------------------------------------------------------------------------
-- 4. Verification
-- ------------------------------------------------------------------------------
SELECT
  'ADMIN_USER_PROVISIONING_PATCH applied successfully.' AS status,
  public.is_platform_admin() AS caller_is_platform_admin;
