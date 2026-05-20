-- ==============================================================================
-- AGENT MULTI-TERRITORY MIGRATION PATCH
-- ==============================================================================
-- Run this script in your Supabase SQL Editor.
-- It creates the many-to-many junction table to allow agents to have multiple territories.
-- ==============================================================================

-- 1. Create the junction table
CREATE TABLE IF NOT EXISTS public.agent_territories (
  agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE,
  territory_id UUID REFERENCES public.territories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (agent_id, territory_id)
);

-- 2. Enable RLS
ALTER TABLE public.agent_territories ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policy for Admins
DROP POLICY IF EXISTS "Admins can manage agent territories" ON public.agent_territories;
CREATE POLICY "Admins can manage agent territories" 
ON public.agent_territories 
FOR ALL 
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 4. Create RLS Policy for Agents (Read Only)
DROP POLICY IF EXISTS "Agents can view their own territories" ON public.agent_territories;
CREATE POLICY "Agents can view their own territories" 
ON public.agent_territories 
FOR SELECT 
USING (
  agent_id IN (
    SELECT id FROM public.agents WHERE user_email = (SELECT email FROM public.users WHERE id = auth.uid())
  )
);
