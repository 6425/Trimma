-- Add JSONB columns for Business Info and Bank Info
ALTER TABLE public.salons 
ADD COLUMN IF NOT EXISTS business_info_extended JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.salons 
ADD COLUMN IF NOT EXISTS bank_info JSONB DEFAULT '{}'::jsonb;
