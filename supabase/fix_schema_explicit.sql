-- EXPLICIT SCHEMA REPAIR
-- This script ensures all required columns exist in the 'continents' table.

-- 1. Check and Add 'display_name' if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='continents' AND column_name='display_name') THEN
        ALTER TABLE public.continents ADD COLUMN display_name TEXT;
        UPDATE public.continents SET display_name = name WHERE display_name IS NULL;
    END IF;
END $$;

-- 2. Check and Add 'theme_color' if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='continents' AND column_name='theme_color') THEN
        ALTER TABLE public.continents ADD COLUMN theme_color TEXT DEFAULT '#D4AF37';
    END IF;
END $$;

-- 3. Check and Add 'image_url' if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='continents' AND column_name='image_url') THEN
        ALTER TABLE public.continents ADD COLUMN image_url TEXT;
    END IF;
END $$;

-- 4. Check and Add 'created_at' if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='continents' AND column_name='created_at') THEN
        ALTER TABLE public.continents ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- 5. Re-apply RLS for safety
ALTER TABLE public.continents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Continents" ON public.continents;
CREATE POLICY "Public Read Continents" ON public.continents FOR SELECT USING (true);
