-- ==============================================================================
-- PAYHERE APP SECRET CREDENTIALS PATCH
-- ==============================================================================
-- Run this script in your Supabase SQL Editor to update the global settings table.
-- It adds explicit App ID and App Secret fields for PayHere OAuth and advanced API.
-- ==============================================================================

-- 1. Add the new App ID and App Secret columns
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS payhere_app_id TEXT;
ALTER TABLE public.global_payment_settings ADD COLUMN IF NOT EXISTS payhere_app_secret TEXT;

-- 2. (Optional) We leave the old payhere_app_id_sandbox and payhere_app_id_live columns intact 
-- to prevent any old code crashing, but they will no longer be used by the Admin UI.
