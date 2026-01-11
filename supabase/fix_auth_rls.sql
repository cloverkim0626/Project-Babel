-- ================================================
-- EMERGENCY AUTH FIX - RLS Policy Reset
-- Run this in Supabase Dashboard -> SQL Editor
-- ================================================

-- 1. Remove ALL existing policies on users table
DROP POLICY IF EXISTS "Users can view their own data." ON public.users;
DROP POLICY IF EXISTS "Users can update their own data." ON public.users;
DROP POLICY IF EXISTS "Public Read Users" ON public.users;
DROP POLICY IF EXISTS "User Update Self" ON public.users;
DROP POLICY IF EXISTS "Read Users" ON public.users;
DROP POLICY IF EXISTS "Update Self" ON public.users;
DROP POLICY IF EXISTS "Anyone can read users" ON public.users;
DROP POLICY IF EXISTS "Users can update themselves" ON public.users;
DROP POLICY IF EXISTS "Authenticated can insert" ON public.users;

-- 2. Enable RLS (ensure it's on)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 3. Create clean, simple policies
-- ANYONE can SELECT (needed for profile lookup)
CREATE POLICY "public_read_users" 
ON public.users FOR SELECT 
USING (true);

-- User can UPDATE only their own record
CREATE POLICY "self_update_users" 
ON public.users FOR UPDATE 
USING (auth.uid() = id);

-- Authenticated users can INSERT their own record
CREATE POLICY "self_insert_users" 
ON public.users FOR INSERT 
WITH CHECK (auth.uid() = id);

-- 4. Refresh schema cache
NOTIFY pgrst, 'reload config';

-- 5. Verify policies are created
-- Run: SELECT * FROM pg_policies WHERE tablename = 'users';
