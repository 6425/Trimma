-- ==============================================================================
-- 1. ADD DISCOUNT PERCENTAGE TO SUBSCRIPTION PLANS
-- ==============================================================================
ALTER TABLE public.subscription_plans 
ADD COLUMN IF NOT EXISTS discount_percentage numeric(5,2) DEFAULT 0;

-- ==============================================================================
-- 2. ENSURE ALL SALONS ARE REGISTERED IN THE SUBSCRIPTIONS TABLE
-- ==============================================================================
DO $$
DECLARE
    free_plan_uuid uuid;
BEGIN
    -- Try to find the free or basic plan
    SELECT id INTO free_plan_uuid 
    FROM public.subscription_plans 
    WHERE name ILIKE '%free%' OR name ILIKE '%basic%' 
    LIMIT 1;
    
    -- Fallback to the first available plan if no free plan exists
    IF free_plan_uuid IS NULL THEN
        SELECT id INTO free_plan_uuid 
        FROM public.subscription_plans 
        LIMIT 1;
    END IF;

    -- If a plan exists, insert missing salons into the subscriptions table
    IF free_plan_uuid IS NOT NULL THEN
        -- Insert missing salons into subscriptions table
        INSERT INTO public.subscriptions (salon_id, plan_id, status, start_date, end_date)
        SELECT id, free_plan_uuid, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '10 years'
        FROM public.salons
        WHERE id NOT IN (SELECT salon_id FROM public.subscriptions);
        
        -- Also ensure salon_id is set in subscription_plan_id on salons table if needed
        UPDATE public.salons
        SET subscription_plan_id = free_plan_uuid
        WHERE subscription_plan_id IS NULL;
    END IF;
END $$;
