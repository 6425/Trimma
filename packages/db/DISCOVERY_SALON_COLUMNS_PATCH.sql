-- Required for Google Business discovery upserts (safe to re-run).
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS business_info_extended JSONB DEFAULT '{}'::jsonb;
