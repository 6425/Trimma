-- ==============================================================================
-- SALON UPDATE RLS PATCH FOR ADMINS & AGENTS
-- ==============================================================================
-- Target: Supabase SQL Editor
-- Description: The salons table previously only allowed the owner_email to update
--              the record. This blocked Admins and Agents from updating salon
--              profiles during the onboarding/pipeline stages.
--              This patch explicitly grants Admins and assigned Agents UPDATE access.
-- ==============================================================================

-- 1. Create policy for Admins to fully update any salon
DROP POLICY IF EXISTS "Admins can update all salons" ON public.salons;
CREATE POLICY "Admins can update all salons" 
ON public.salons 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND global_role = 'admin'
  ) OR 
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- 2. Create policy for Assigned Agents to update salons assigned to them
DROP POLICY IF EXISTS "Agents can update assigned salons" ON public.salons;
CREATE POLICY "Agents can update assigned salons" 
ON public.salons 
FOR UPDATE 
USING (
  assign_to = auth.jwt() ->> 'email'
);

-- 3. Also allow Admins to INSERT salons manually from discovery
DROP POLICY IF EXISTS "Admins can insert salons" ON public.salons;
CREATE POLICY "Admins can insert salons" 
ON public.salons 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND global_role = 'admin'
  ) OR 
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

SELECT 'Admin and Agent RLS policies for salons successfully applied!' AS status;
