-- USER_ROLES_RLS_PATCH.sql
-- Enable Row Level Security (if not already enabled)
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- 1. SELECT: Allow authenticated users to view their own roles
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;
CREATE POLICY "Users can view their own roles" 
ON user_roles FOR SELECT 
USING (auth.uid() = user_id);

-- 2. INSERT: Allow authenticated users to insert/create their own role record
DROP POLICY IF EXISTS "Users can insert their own roles" ON user_roles;
CREATE POLICY "Users can insert their own roles" 
ON user_roles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 3. UPDATE: Allow authenticated users to update their own role record
DROP POLICY IF EXISTS "Users can update their own roles" ON user_roles;
CREATE POLICY "Users can update their own roles" 
ON user_roles FOR UPDATE 
USING (auth.uid() = user_id);
