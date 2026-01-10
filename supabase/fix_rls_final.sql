-- Enable RLS
ALTER TABLE public.continents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quest_sets ENABLE ROW LEVEL SECURITY;

-- Continents: Public Read, Admin Write
CREATE POLICY "Public Read Continents" ON public.continents FOR SELECT USING (true);
CREATE POLICY "Admin All Continents" ON public.continents FOR ALL USING (auth.role() = 'authenticated');

-- Passages: Public Read, Admin Write
CREATE POLICY "Public Read Passages" ON public.passages FOR SELECT USING (true);
CREATE POLICY "Admin All Passages" ON public.passages FOR ALL USING (auth.role() = 'authenticated');

-- Missions
CREATE POLICY "Public Read Missions" ON public.missions FOR SELECT USING (true);
CREATE POLICY "Admin All Missions" ON public.missions FOR ALL USING (auth.role() = 'authenticated');

-- Quest Sets
CREATE POLICY "Public Read QuestSets" ON public.quest_sets FOR SELECT USING (true);
CREATE POLICY "Admin All QuestSets" ON public.quest_sets FOR ALL USING (auth.role() = 'authenticated');

-- Users
CREATE POLICY "Read Users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Update Self" ON public.users FOR UPDATE USING (auth.uid() = id);
