-- ==============================================================================
-- TRIMMA PLATFORM: FIX IS_ADMIN RLS FUNCTION PATCH
-- ==============================================================================
-- Target: Supabase SQL Editor
-- Description: Corrects the public.is_admin() function to lookup by email in JWT,
--              resolving the "column id does not exist" error across all admin RLS policies.
-- ==============================================================================

-- Redefine public.is_admin() to query by email instead of non-existent id column
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.users 
    WHERE email = auth.jwt() ->> 'email'
    AND global_role = 'admin'
  );
END;
$$;

-- Confirm RLS changes applied successfully
SELECT 'is_admin RLS function successfully updated to look up by email!' AS status;
