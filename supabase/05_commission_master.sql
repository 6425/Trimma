-- 05_commission_master.sql
-- Creates the missing tables required for the Admin Commission Management UI

-- 1. Commission Master (Stores the global split percentages)
CREATE TABLE IF NOT EXISTS public.commission_master (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    commission_type VARCHAR(50) NOT NULL CHECK (commission_type IN ('booking', 'subscription')),
    platform_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.0,
    salon_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.0,
    agent_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.0,
    payhere_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.0,
    active BOOLEAN DEFAULT true,
    effective_from TIMESTAMPTZ DEFAULT NOW(),
    effective_to TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Agent Tiers (Stores the varying commission tiers for agents)
CREATE TABLE IF NOT EXISTS public.agent_tiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tier_name VARCHAR(50) NOT NULL,
    minimum_sales_volume DECIMAL(10,2) DEFAULT 0.0,
    subscription_percentage DECIMAL(5,2) NOT NULL DEFAULT 10.0,
    booking_percentage DECIMAL(5,2) NOT NULL DEFAULT 10.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Insert Default Initial Values
INSERT INTO public.commission_master (commission_type, platform_percentage, salon_percentage, agent_percentage, payhere_percentage)
VALUES 
    ('booking', 10.0, 10.0, 0.0, 3.0),
    ('subscription', 80.0, 0.0, 20.0, 0.0);

INSERT INTO public.agent_tiers (tier_name, minimum_sales_volume, subscription_percentage, booking_percentage)
VALUES 
    ('Bronze', 0.0, 10.0, 5.0),
    ('Silver', 50000.0, 12.0, 10.0),
    ('Gold', 100000.0, 15.0, 15.0),
    ('Platinum', 250000.0, 20.0, 20.0);
