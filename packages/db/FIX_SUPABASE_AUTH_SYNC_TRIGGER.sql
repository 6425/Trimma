-- ==============================================================================
-- TRIMMA PLATFORM: FIX SUPABASE AUTH SYNCHRONIZATION TRIGGER PATCH
-- ==============================================================================
-- Target: Supabase SQL Editor
-- Description: Redefines the new user trigger function to handle conflict gracefully.
--              This enables creating login accounts for pre-seeded database profiles.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (email, full_name, avatar_url, global_role)
  VALUES (
    new.email, 
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)), 
    new.raw_user_meta_data->>'avatar_url', 
    COALESCE(new.raw_user_meta_data->>'global_role', 'customer')
  )
  ON CONFLICT (email) DO UPDATE 
  SET 
    full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Confirm script execution
SELECT 'Supabase Auth trigger successfully updated to use conflict resolution!' AS status;
