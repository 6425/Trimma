-- ==============================================================================
-- TRIMMA PLATFORM: CRM AGENT INTELLIGENCE DATABASE SCHEMA PATCH
-- ==============================================================================
-- Target: Supabase SQL Editor
-- Description: Establishes agent territories, commission ledger databases, 
--              attribution rules, and automation triggers on lead conversion.
-- ==============================================================================

-- 1. Create the Agent Territories Table
CREATE TABLE IF NOT EXISTS public.agent_territories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_email TEXT NOT NULL REFERENCES public.users(email) ON DELETE CASCADE,
  province TEXT NOT NULL,
  district TEXT NOT NULL,
  city TEXT,
  is_exclusive BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create the Commission Rules Table
CREATE TABLE IF NOT EXISTS public.commission_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('FIXED', 'PERCENTAGE', 'TIERED')),
  rate NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
  tier_min INTEGER DEFAULT 0,
  tier_max INTEGER,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create the Commission Ledger Table
CREATE TABLE IF NOT EXISTS public.commission_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.salon_leads(id) ON DELETE CASCADE,
  agent_email TEXT NOT NULL REFERENCES public.users(email) ON DELETE CASCADE,
  rule_id UUID REFERENCES public.commission_rules(id) ON DELETE SET NULL,
  amount NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'PAID', 'DISPUTED')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ
);

-- 4. Create the Agent Action/Activity Logs
CREATE TABLE IF NOT EXISTS public.agent_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_email TEXT NOT NULL,
  agent_email TEXT NOT NULL,
  action TEXT NOT NULL, -- e.g., 'TERRITORY_ASSIGNED', 'COMMISSION_SET', 'STATUS_CHANGE', 'PAYOUT_APPROVED'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Safe backfill for schema attribution properties in salon_leads
ALTER TABLE public.salon_leads ADD COLUMN IF NOT EXISTS lead_source TEXT DEFAULT 'system';
ALTER TABLE public.salon_leads ADD COLUMN IF NOT EXISTS captured_by_agent TEXT REFERENCES public.users(email) ON DELETE SET NULL;

-- 6. Trigger to automatically calculate and insert commission when onboarding_stage becomes CONVERTED
CREATE OR REPLACE FUNCTION public.calculate_agent_conversion_commission()
RETURNS TRIGGER AS $$
DECLARE
  v_agent_commission_rate NUMERIC(10, 2);
  v_calculated_amount NUMERIC(10, 2);
  v_default_signup_reward NUMERIC(10, 2) := 1000.00; -- LKR 1,000 flat signup reward
BEGIN
  -- Look up if this lead was assigned to or captured by an agent
  IF NEW.onboarding_stage = 'CONVERTED' AND (OLD.onboarding_stage IS NULL OR OLD.onboarding_stage != 'CONVERTED') THEN
    IF NEW.assign_to IS NOT NULL THEN
      
      -- Retrieve commission rate from agents profile (defaults to 10% if not found)
      SELECT COALESCE(commission_rate, 10.00) 
      INTO v_agent_commission_rate 
      FROM public.agents 
      WHERE user_email = NEW.assign_to;
      
      IF v_agent_commission_rate IS NULL THEN
        v_agent_commission_rate := 10.00;
      END IF;

      -- Calculate flat commission plus dynamic bonus (default fixed signup commission of LKR 1000)
      v_calculated_amount := v_default_signup_reward;

      -- Double check if ledger entry already exists to prevent duplicate payouts
      IF NOT EXISTS (
        SELECT 1 FROM public.commission_ledger 
        WHERE lead_id = NEW.id AND agent_email = NEW.assign_to
      ) THEN
        INSERT INTO public.commission_ledger (
          lead_id,
          agent_email,
          amount,
          status,
          notes
        ) VALUES (
          NEW.id,
          NEW.assign_to,
          v_calculated_amount,
          'PENDING',
          'Automated reward for converting lead "' || NEW.name || '" (Agent Commission Tier: ' || v_agent_commission_rate || '%).'
        );
        
        -- Insert Agent Audit Log entry
        INSERT INTO public.agent_activity_logs (
          actor_email,
          agent_email,
          action,
          notes
        ) VALUES (
          'system',
          NEW.assign_to,
          'COMMISSION_EARNED',
          'Earned pending conversion reward of LKR ' || v_calculated_amount || ' for "' || NEW.name || '".'
        );
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Bind the trigger safely to public.salon_leads
DROP TRIGGER IF EXISTS trigger_calculate_agent_conversion_commission ON public.salon_leads;
CREATE TRIGGER trigger_calculate_agent_conversion_commission
  AFTER UPDATE ON public.salon_leads
  FOR EACH ROW
  EXECUTE PROCEDURE public.calculate_agent_conversion_commission();

-- 7. Enable RLS
ALTER TABLE public.agent_territories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_activity_logs ENABLE ROW LEVEL SECURITY;

-- 8. Create unified admin policies
DROP POLICY IF EXISTS "Admins can manage territories" ON public.agent_territories;
CREATE POLICY "Admins can manage territories" ON public.agent_territories FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE email = auth.jwt() ->> 'email' AND global_role = 'admin')
);

DROP POLICY IF EXISTS "Admins can manage rules" ON public.commission_rules;
CREATE POLICY "Admins can manage rules" ON public.commission_rules FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE email = auth.jwt() ->> 'email' AND global_role = 'admin')
);

DROP POLICY IF EXISTS "Admins can manage ledger" ON public.commission_ledger;
CREATE POLICY "Admins can manage ledger" ON public.commission_ledger FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE email = auth.jwt() ->> 'email' AND global_role = 'admin')
);

DROP POLICY IF EXISTS "Admins can view agent logs" ON public.agent_activity_logs;
CREATE POLICY "Admins can view agent logs" ON public.agent_activity_logs FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE email = auth.jwt() ->> 'email' AND global_role = 'admin')
);

-- Select status verification
SELECT 'Agent CRM intelligence patch initialized successfully!' AS patch_status;
