-- MASTER FIX SCRIPT
-- Run this to fix EVERYTHING: Missing Tables, RLS Permissions, and Data Visibility

-- 1. Ensure Tables Exist
CREATE TABLE IF NOT EXISTS public.missions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('vocabulary', 'reading')),
    total_sets INTEGER NOT NULL DEFAULT 1,
    data_payload JSONB DEFAULT '{}'::jsonb,
    config JSONB DEFAULT '{}'::jsonb,
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.quest_sets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    mission_id UUID REFERENCES public.missions(id) ON DELETE CASCADE,
    set_index INTEGER NOT NULL,
    week_number INTEGER NOT NULL,
    status TEXT DEFAULT 'locked',
    score INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. RESET RLS (Enable Security)
ALTER TABLE public.continents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quest_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 3. APPLY POLICIES (Allow Reading)

-- Continents: Everyone can read
DROP POLICY IF EXISTS "Public Read Continents" ON public.continents;
CREATE POLICY "Public Read Continents" ON public.continents FOR SELECT USING (true);

-- Passages: Everyone can read
DROP POLICY IF EXISTS "Public Read Passages" ON public.passages;
CREATE POLICY "Public Read Passages" ON public.passages FOR SELECT USING (true);

-- Missions: Everyone can read
DROP POLICY IF EXISTS "Public Read Missions" ON public.missions;
CREATE POLICY "Public Read Missions" ON public.missions FOR SELECT USING (true);

-- Quest Sets: Everyone can read
DROP POLICY IF EXISTS "Public Read QuestSets" ON public.quest_sets;
CREATE POLICY "Public Read QuestSets" ON public.quest_sets FOR SELECT USING (true);

-- Users: Everyone can read (Critical for Login)
DROP POLICY IF EXISTS "Public Read Users" ON public.users;
CREATE POLICY "Public Read Users" ON public.users FOR SELECT USING (true);
DROP POLICY IF EXISTS "User Update Self" ON public.users;
CREATE POLICY "User Update Self" ON public.users FOR UPDATE USING (auth.uid() = id);

-- 4. Allow Admin/Master Insert/Update (Optional, but good for admin panel)
-- (Simplifying to allow authenticated users to do everything for now to prevent blocking)
DROP POLICY IF EXISTS "Auth Full Access Continents" ON public.continents;
CREATE POLICY "Auth Full Access Continents" ON public.continents FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Auth Full Access Passages" ON public.passages;
CREATE POLICY "Auth Full Access Passages" ON public.passages FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Auth Full Access Missions" ON public.missions;
CREATE POLICY "Auth Full Access Missions" ON public.missions FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Auth Full Access QuestSets" ON public.quest_sets;
CREATE POLICY "Auth Full Access QuestSets" ON public.quest_sets FOR ALL USING (auth.role() = 'authenticated');
