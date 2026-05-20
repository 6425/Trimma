-- ==============================================================================
-- ADMIN ROW LEVEL SECURITY (RLS) PATCH
-- ==============================================================================
-- Run this script in your Supabase SQL Editor.
-- It safely allows Admin accounts to view all users in the Identity Directory.
-- ==============================================================================

-- 1. Create a secure function that bypasses RLS to check if the current user is an Admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.users 
    WHERE id = auth.uid() 
    AND (role = 'admin' OR global_role = 'admin')
  );
END;
$$;

-- 2. Drop the policy if it already exists to prevent duplication errors
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;

-- 3. Create the new policy allowing Admins to manage all records in the users table
CREATE POLICY "Admins can manage all users" 
ON public.users 
FOR ALL 
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 4. Enable RLS on the users table (just in case it was toggled off and relying on defaults)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 5. Drop the policy if it already exists to prevent duplication errors
DROP POLICY IF EXISTS "Admins can manage all agents" ON public.agents;

-- 6. Create the new policy allowing Admins to manage all records in the agents table
CREATE POLICY "Admins can manage all agents" 
ON public.agents 
FOR ALL 
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 7. Enable RLS on the agents table
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
