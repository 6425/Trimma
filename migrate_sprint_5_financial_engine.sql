-- TRIMMA AI: Sprint 5 Financial Engine Migration
-- Run this in your Supabase SQL Editor.

-- 1. Clean up simple commission columns (if they exist from previous tests)
ALTER TABLE public.salons 
DROP COLUMN IF EXISTS reservation_commission_percent,
DROP COLUMN IF EXISTS pending_payout;

ALTER TABLE public.bookings 
DROP COLUMN IF EXISTS platform_commission_percent,
DROP COLUMN IF EXISTS salon_payout_amount;

-- 2. Create commission_master table
CREATE TABLE IF NOT EXISTS public.commission_master (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    commission_type TEXT NOT NULL CHECK (commission_type IN ('booking', 'subscription', 'referral')),
    platform_percentage NUMERIC NOT NULL,
    salon_percentage NUMERIC NOT NULL,
    agent_percentage NUMERIC NOT NULL,
    effective_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    effective_to TIMESTAMP WITH TIME ZONE,
    active BOOLEAN DEFAULT true,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create salon_commission_override table
CREATE TABLE IF NOT EXISTS public.salon_commission_override (
    salon_id UUID NOT NULL, -- Should ideally reference salons(id)
    commission_id UUID REFERENCES public.commission_master(id),
    override_rate NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (salon_id, commission_id)
);

-- 4. Create agent_tiers table
CREATE TABLE IF NOT EXISTS public.agent_tiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE, -- e.g. Bronze, Silver, Gold
    subscription_percentage NUMERIC NOT NULL,
    booking_percentage NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create agent_profiles table
CREATE TABLE IF NOT EXISTS public.agent_profiles (
    agent_id UUID PRIMARY KEY, -- Should ideally reference auth.users(id)
    tier_id UUID REFERENCES public.agent_tiers(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create commission_ledger table (Immutable)
CREATE TABLE IF NOT EXISTS public.commission_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID, 
    subscription_id UUID, 
    entity_type TEXT NOT NULL CHECK (entity_type IN ('platform', 'salon', 'agent')),
    entity_id UUID NOT NULL,
    amount NUMERIC NOT NULL,
    direction TEXT NOT NULL CHECK (direction IN ('credit', 'debit')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Create wallet_accounts table
CREATE TABLE IF NOT EXISTS public.wallet_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type TEXT NOT NULL CHECK (entity_type IN ('platform', 'salon', 'agent')),
    entity_id UUID NOT NULL,
    balance NUMERIC DEFAULT 0.0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (entity_type, entity_id)
);

-- 8. Seed Agent Tiers
INSERT INTO public.agent_tiers (name, subscription_percentage, booking_percentage)
VALUES 
    ('Bronze', 10.0, 0.5),
    ('Silver', 15.0, 1.0),
    ('Gold', 20.0, 2.0)
ON CONFLICT (name) DO UPDATE SET 
    subscription_percentage = EXCLUDED.subscription_percentage,
    booking_percentage = EXCLUDED.booking_percentage;

-- 9. Seed Default Booking Commission Master
INSERT INTO public.commission_master (commission_type, platform_percentage, salon_percentage, agent_percentage)
VALUES ('booking', 10.0, 90.0, 0.0);
