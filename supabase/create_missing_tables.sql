-- Create 'missions' table if it doesn't exist
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

-- Create 'quest_sets' table if it doesn't exist
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

-- Enable RLS
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quest_sets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public Read Missions" ON public.missions;
DROP POLICY IF EXISTS "Admin All Missions" ON public.missions;
DROP POLICY IF EXISTS "Public Read QuestSets" ON public.quest_sets;
DROP POLICY IF EXISTS "Admin All QuestSets" ON public.quest_sets;
DROP POLICY IF EXISTS "Read Own Tasks" ON public.quest_sets;

-- Missions Policies
CREATE POLICY "Public Read Missions" ON public.missions FOR SELECT USING (true);
CREATE POLICY "Admin All Missions" ON public.missions FOR ALL USING (auth.role() = 'authenticated');

-- Quest Sets Policies
CREATE POLICY "Public Read QuestSets" ON public.quest_sets FOR SELECT USING (true);
CREATE POLICY "Admin All QuestSets" ON public.quest_sets FOR ALL USING (auth.role() = 'authenticated');
-- Add policy for students to update their own tasks (e.g., status, score) if needed
CREATE POLICY "Read Own Tasks" ON public.quest_sets FOR SELECT USING (auth.uid() = user_id);

-- Verify Users RLS as well (Critical for Auth)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read Users" ON public.users FOR SELECT USING (true);
CREATE POLICY "User Update Self" ON public.users FOR UPDATE USING (auth.uid() = id);
