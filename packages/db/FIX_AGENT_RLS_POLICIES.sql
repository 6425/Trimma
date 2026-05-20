-- ==============================================================================
-- TRIMMA PLATFORM: AGENT CRM RLS POLICIES SELECT FIX
-- ==============================================================================
-- Target: Supabase SQL Editor
-- Description: Adds permissive SELECT policies to prevent mount-time async race conditions
-- ==============================================================================

-- 1. Permissive SELECT for agent_territories
DROP POLICY IF EXISTS "Anyone can select territories" ON public.agent_territories;
CREATE POLICY "Anyone can select territories" ON public.agent_territories 
  FOR SELECT USING (auth.role() = 'authenticated');

-- 2. Permissive SELECT for commission_ledger
DROP POLICY IF EXISTS "Anyone can select ledger" ON public.commission_ledger;
CREATE POLICY "Anyone can select ledger" ON public.commission_ledger 
  FOR SELECT USING (auth.role() = 'authenticated');

-- 3. Permissive SELECT for agent_activity_logs
DROP POLICY IF EXISTS "Anyone can select agent logs" ON public.agent_activity_logs;
CREATE POLICY "Anyone can select agent logs" ON public.agent_activity_logs 
  FOR SELECT USING (auth.role() = 'authenticated');

-- Confirmation notice
SELECT 'Agent CRM RLS Select policies successfully updated!' AS policy_status;
